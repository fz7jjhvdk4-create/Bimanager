import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withAuth } from "@/lib/auth";

// POST - Skapa exempeldata för nya användare (bara när kontot är tomt)
export const POST = withAuth(
  "Kunde inte skapa exempeldata",
  async (_request, { userId }) => {
    const antalBigardar = await prisma.apiary.count({ where: { userId } });
    if (antalBigardar > 0) {
      return NextResponse.json(
        { error: "Exempeldata kan bara skapas på ett tomt konto" },
        { status: 400 }
      );
    }

    const iAr = new Date().getFullYear();
    const dagar = (n: number) =>
      new Date(Date.now() - n * 24 * 60 * 60 * 1000);

    const bigard = await prisma.apiary.create({
      data: {
        userId,
        namn: "Exempelbigården",
        adress: "Exempelvägen 1",
        latitude: 59.334591,
        longitude: 18.06324,
        beskrivning:
          "Skapad som exempel — utforska och ta bort när du är klar.",
      },
    });

    const [samhalle1, samhalle2] = await Promise.all([
      prisma.colony.create({
        data: {
          userId,
          bigardId: bigard.id,
          namn: "Exempel 1",
          platsNummer: 1,
          drottningRas: "Buckfast",
          drottningAr: iAr,
          kupaTyp: "Stapling",
          status: "Aktiv",
        },
      }),
      prisma.colony.create({
        data: {
          userId,
          bigardId: bigard.id,
          namn: "Exempel 2",
          platsNummer: 2,
          drottningRas: "Carnica",
          drottningAr: iAr - 1,
          kupaTyp: "Stapling",
          status: "Aktiv",
        },
      }),
    ]);

    await Promise.all([
      prisma.queen.create({
        data: {
          userId,
          samhalleId: samhalle1.id,
          ras: "Buckfast",
          ar: iAr,
        },
      }),
      prisma.queen.create({
        data: {
          userId,
          samhalleId: samhalle2.id,
          ras: "Carnica",
          ar: iAr - 1,
        },
      }),
      prisma.event.create({
        data: {
          userId,
          samhalleId: samhalle1.id,
          handelseTyp: "Inspektion",
          datum: dagar(7),
          data: JSON.stringify({
            styrka: "Starkt",
            temperament: "Lugnt",
            drottningSynlig: true,
            drottningceller: false,
            anteckningar: "Exempelinspektion — fint yngel i alla ramar.",
          }),
        },
      }),
      prisma.event.create({
        data: {
          userId,
          samhalleId: samhalle1.id,
          handelseTyp: "Varroamätning",
          datum: dagar(3),
          data: JSON.stringify({
            metod: "Nedfall",
            antalKvalster: 14,
            antalDygn: 7,
            nedfallPerDygn: 2,
          }),
        },
      }),
      prisma.event.create({
        data: {
          userId,
          samhalleId: samhalle2.id,
          handelseTyp: "Skörd",
          datum: dagar(14),
          data: JSON.stringify({
            mangdKg: 18.5,
            antalRamar: 9,
          }),
        },
      }),
      prisma.reminder.create({
        data: {
          userId,
          titel: "Exempel: kontrollera foderläget",
          kategori: "Utfodring",
          datum: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          bigardId: bigard.id,
        },
      }),
    ]);

    return NextResponse.json({ message: "Exempeldata skapad" }, { status: 201 });
  }
);
