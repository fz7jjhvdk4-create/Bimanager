import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET - Hämta alla fakturor
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.kundId = customerId;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { fakturaDatum: "desc" },
      include: {
        kund: true,
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Kunde inte hämta fakturor" },
      { status: 500 }
    );
  }
}

// POST - Skapa ny faktura
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      kundId,
      fakturaDatum,
      forfallDatum,
      rader,
      status = "Utkast",
    } = body;

    // Beräkna totaler
    let totaltExMoms = 0;
    let totaltMoms = 0;

    const parsedRader = typeof rader === "string" ? JSON.parse(rader) : rader;
    for (const rad of parsedRader) {
      const radBelopp = rad.antal * rad.prisPerEnhet;
      const radMoms = radBelopp * (rad.momsSats || 0.12);
      totaltExMoms += radBelopp;
      totaltMoms += radMoms;
    }

    const totaltInklMoms = totaltExMoms + totaltMoms;

    // Hämta nästa fakturanummer
    const settings = await prisma.settings.findFirst();
    const nastaFakturaNummer = settings?.nastaFakturaNummer || 1;
    const fakturaNummer = `F${nastaFakturaNummer.toString().padStart(4, "0")}`;

    // Skapa fakturan
    const invoice = await prisma.invoice.create({
      data: {
        fakturaNummer,
        kundId,
        fakturaDatum: new Date(fakturaDatum),
        forfallDatum: new Date(forfallDatum),
        rader: JSON.stringify(parsedRader),
        totaltExMoms,
        totaltMoms,
        totaltInklMoms,
        status,
      },
      include: {
        kund: true,
      },
    });

    // Uppdatera nästa fakturanummer
    if (settings) {
      await prisma.settings.update({
        where: { id: settings.id },
        data: { nastaFakturaNummer: nastaFakturaNummer + 1 },
      });
    } else {
      await prisma.settings.create({
        data: {
          id: "default",
          nastaFakturaNummer: 2,
        },
      });
    }

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Kunde inte skapa faktura" },
      { status: 500 }
    );
  }
}
