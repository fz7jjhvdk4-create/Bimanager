import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// POST - Registrera kontant betalning
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      datum,
      beskrivning,
      koparensNamn,
      antalBurkar,
      beloppExMoms,
      momsBelopp,
      beloppInklMoms,
      momsSats,
      kvittoOnskas,
    } = body;

    let kvittoNummer: string | null = null;

    if (kvittoOnskas) {
      // Generera kvittonummer med årtal: KV26001, KV26002 etc.
      const currentYear = new Date().getFullYear().toString().slice(-2); // "26" för 2026

      // Hitta senaste kvittonumret för detta år i kassaboken
      const lastReceipt = await prisma.accounting.findFirst({
        where: {
          kvittoNummer: {
            startsWith: `KV${currentYear}`,
          },
        },
        orderBy: { kvittoNummer: "desc" },
      });

      let nextNumber = 1;
      if (lastReceipt && lastReceipt.kvittoNummer) {
        // Extrahera löpnumret från t.ex. "KV26005" -> 5
        const lastNumber = parseInt(lastReceipt.kvittoNummer.slice(4));
        nextNumber = lastNumber + 1;
      }

      kvittoNummer = `KV${currentYear}${nextNumber.toString().padStart(3, "0")}`;
    }

    // Skapa kassabokspost
    const accounting = await prisma.accounting.create({
      data: {
        datum: new Date(datum),
        handelseTyp: "Försäljning",
        beskrivning: kvittoNummer
          ? `${kvittoNummer} - ${beskrivning}`
          : beskrivning,
        beloppExMoms,
        momsSats,
        momsBelopp,
        beloppInklMoms,
        mottagare: koparensNamn || null,
        antalBurkar: antalBurkar || null,
        kvittoNummer,
      },
    });

    return NextResponse.json(
      {
        success: true,
        kvittoNummer,
        accountingId: accounting.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating cash payment:", error);
    return NextResponse.json(
      { error: "Kunde inte registrera betalning" },
      { status: 500 }
    );
  }
}
