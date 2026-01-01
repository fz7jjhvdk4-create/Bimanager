import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year") || new Date().getFullYear().toString();

    const startOfYear = new Date(`${year}-01-01`);
    const endOfYear = new Date(`${parseInt(year) + 1}-01-01`);

    // Hämta all data parallellt
    const [
      apiaries,
      colonies,
      events,
      transactions,
      allEvents,
    ] = await Promise.all([
      // Bigårdar
      prisma.apiary.findMany({
        include: {
          colonies: true,
        },
      }),
      // Samhällen
      prisma.colony.findMany({
        include: {
          bigard: true,
          events: {
            where: {
              datum: {
                gte: startOfYear,
                lt: endOfYear,
              },
            },
          },
        },
      }),
      // Händelser för året
      prisma.event.findMany({
        where: {
          datum: {
            gte: startOfYear,
            lt: endOfYear,
          },
        },
        include: {
          samhalle: {
            include: {
              bigard: true,
            },
          },
        },
        orderBy: { datum: "asc" },
      }),
      // Transaktioner för året
      prisma.accounting.findMany({
        where: {
          datum: {
            gte: startOfYear,
            lt: endOfYear,
          },
        },
        orderBy: { datum: "asc" },
      }),
      // Alla händelser (för historik)
      prisma.event.findMany({
        orderBy: { datum: "asc" },
      }),
    ]);

    // === SAMHÄLLESSTATISTIK ===
    const colonyStats = {
      total: colonies.length,
      active: colonies.filter((c) => c.status === "Aktiv").length,
      lost: colonies.filter((c) => c.status === "Förlorat").length,
      sold: colonies.filter((c) => c.status === "Avyttrat").length,
      merged: colonies.filter((c) => c.status === "Sammanslagen").length,
    };

    // === SKÖRDESTATISTIK ===
    const harvestEvents = events.filter((e) => e.handelseTyp === "Skörd");
    let totalHarvest = 0;
    const harvestByMonth: Record<string, number> = {};
    const harvestByApiary: Record<string, { name: string; amount: number }> = {};

    harvestEvents.forEach((event) => {
      if (event.data) {
        try {
          const data = JSON.parse(event.data);
          const amount = data.mangdKg || 0;
          totalHarvest += amount;

          // Per månad
          const month = new Date(event.datum).toLocaleDateString("sv-SE", {
            month: "short",
          });
          harvestByMonth[month] = (harvestByMonth[month] || 0) + amount;

          // Per bigård
          const apiaryId = event.samhalle.bigard.id;
          const apiaryName = event.samhalle.bigard.namn;
          if (!harvestByApiary[apiaryId]) {
            harvestByApiary[apiaryId] = { name: apiaryName, amount: 0 };
          }
          harvestByApiary[apiaryId].amount += amount;
        } catch {
          // ignore parse errors
        }
      }
    });

    // === HÄNDELSESTATISTIK ===
    const eventStats = {
      total: events.length,
      byType: {} as Record<string, number>,
      byMonth: {} as Record<string, number>,
    };

    events.forEach((event) => {
      // Per typ
      eventStats.byType[event.handelseTyp] =
        (eventStats.byType[event.handelseTyp] || 0) + 1;

      // Per månad
      const month = new Date(event.datum).toLocaleDateString("sv-SE", {
        month: "short",
      });
      eventStats.byMonth[month] = (eventStats.byMonth[month] || 0) + 1;
    });

    // === EKONOMISK STATISTIK ===
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalIncomeMoms = 0;
    let totalExpensesMoms = 0;
    let totalJarsSold = 0;
    const incomeByMonth: Record<string, number> = {};
    const expensesByMonth: Record<string, number> = {};
    const jarsSoldByMonth: Record<string, number> = {};

    transactions.forEach((t) => {
      const month = new Date(t.datum).toLocaleDateString("sv-SE", {
        month: "short",
      });

      if (t.handelseTyp === "Försäljning") {
        totalIncome += t.beloppInklMoms;
        totalIncomeMoms += t.momsBelopp;
        incomeByMonth[month] = (incomeByMonth[month] || 0) + t.beloppInklMoms;
        if (t.antalBurkar) {
          totalJarsSold += t.antalBurkar;
          jarsSoldByMonth[month] = (jarsSoldByMonth[month] || 0) + t.antalBurkar;
        }
      } else {
        totalExpenses += t.beloppInklMoms;
        totalExpensesMoms += t.momsBelopp;
        expensesByMonth[month] = (expensesByMonth[month] || 0) + t.beloppInklMoms;
      }
    });

    const economyStats = {
      income: totalIncome,
      expenses: totalExpenses,
      profit: totalIncome - totalExpenses,
      incomeMoms: totalIncomeMoms,
      expensesMoms: totalExpensesMoms,
      netMoms: totalIncomeMoms - totalExpensesMoms,
      incomeByMonth,
      expensesByMonth,
      totalJarsSold,
      jarsSoldByMonth,
    };

    // === BIGÅRDSSTATISTIK ===
    const apiaryStats = apiaries.map((apiary) => ({
      id: apiary.id,
      name: apiary.namn,
      totalColonies: apiary.colonies.length,
      activeColonies: apiary.colonies.filter((c) => c.status === "Aktiv").length,
      harvest: harvestByApiary[apiary.id]?.amount || 0,
    }));

    // === HISTORISK DATA (senaste 5 åren) ===
    const currentYear = new Date().getFullYear();
    const yearlyStats: Record<string, { harvest: number; colonies: number }> = {};

    for (let y = currentYear - 4; y <= currentYear; y++) {
      yearlyStats[y.toString()] = { harvest: 0, colonies: 0 };
    }

    allEvents.forEach((event) => {
      const eventYear = new Date(event.datum).getFullYear().toString();
      if (yearlyStats[eventYear] && event.handelseTyp === "Skörd" && event.data) {
        try {
          const data = JSON.parse(event.data);
          yearlyStats[eventYear].harvest += data.mangdKg || 0;
        } catch {
          // ignore
        }
      }
    });

    // === DROTTNINGSTATISTIK ===
    const queenStats = {
      total: colonies.filter((c) => c.status === "Aktiv").length,
      byRace: {} as Record<string, number>,
      byYear: {} as Record<string, number>,
      wingClipped: colonies.filter(
        (c) => c.status === "Aktiv" && c.drottningVingklippt
      ).length,
    };

    colonies
      .filter((c) => c.status === "Aktiv")
      .forEach((colony) => {
        if (colony.drottningRas) {
          queenStats.byRace[colony.drottningRas] =
            (queenStats.byRace[colony.drottningRas] || 0) + 1;
        }
        if (colony.drottningAr) {
          const yearStr = colony.drottningAr.toString();
          queenStats.byYear[yearStr] = (queenStats.byYear[yearStr] || 0) + 1;
        }
      });

    return NextResponse.json({
      year,
      colonyStats,
      harvest: {
        total: totalHarvest,
        byMonth: harvestByMonth,
        byApiary: Object.values(harvestByApiary),
      },
      eventStats,
      economyStats,
      apiaryStats,
      yearlyStats,
      queenStats,
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return NextResponse.json(
      { error: "Kunde inte hämta statistik" },
      { status: 500 }
    );
  }
}
