import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET - Hämta inställningar
export async function GET() {
  try {
    let settings = await prisma.settings.findFirst();

    // Skapa standardinställningar om de inte finns
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: "default",
          nastaFakturaNummer: 1,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Kunde inte hämta inställningar" },
      { status: 500 }
    );
  }
}

// PUT - Uppdatera inställningar
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const {
      foretagsnamn,
      organisationsnummer,
      adress,
      postnummer,
      ort,
      telefon,
      epost,
      bankgiro,
      swish,
      momsRegistrerad,
      nastaFakturaNummer,
    } = body;

    // Försök uppdatera eller skapa
    let settings = await prisma.settings.findFirst();

    if (settings) {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          foretagsnamn,
          organisationsnummer,
          adress,
          postnummer,
          ort,
          telefon,
          epost,
          bankgiro,
          swish,
          momsRegistrerad,
          nastaFakturaNummer,
        },
      });
    } else {
      settings = await prisma.settings.create({
        data: {
          id: "default",
          foretagsnamn,
          organisationsnummer,
          adress,
          postnummer,
          ort,
          telefon,
          epost,
          bankgiro,
          swish,
          momsRegistrerad,
          nastaFakturaNummer: nastaFakturaNummer || 1,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Kunde inte uppdatera inställningar" },
      { status: 500 }
    );
  }
}
