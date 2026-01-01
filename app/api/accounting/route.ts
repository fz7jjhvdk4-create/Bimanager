import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET - Hämta alla transaktioner
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};

    if (year) {
      const startOfYear = new Date(`${year}-01-01`);
      const endOfYear = new Date(`${parseInt(year) + 1}-01-01`);
      where.datum = {
        gte: startOfYear,
        lt: endOfYear,
      };
    }

    if (type) {
      where.handelseTyp = type;
    }

    const transactions = await prisma.accounting.findMany({
      where,
      orderBy: { datum: "desc" },
      include: {
        faktura: true,
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Kunde inte hämta transaktioner" },
      { status: 500 }
    );
  }
}

// POST - Skapa ny transaktion
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      datum,
      handelseTyp,
      beskrivning,
      beloppExMoms,
      momsSats = 0.12,
      mottagare,
      antalBurkar,
      prisPerEnhet,
      fakturaNummer,
      notering,
    } = body;

    // Beräkna momsbelopp och totalbelopp
    const momsBelopp = beloppExMoms * momsSats;
    const beloppInklMoms = beloppExMoms + momsBelopp;

    const transaction = await prisma.accounting.create({
      data: {
        datum: new Date(datum),
        handelseTyp,
        beskrivning,
        beloppExMoms,
        momsSats,
        momsBelopp,
        beloppInklMoms,
        mottagare,
        antalBurkar,
        prisPerEnhet,
        fakturaNummer,
        notering,
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Kunde inte skapa transaktion" },
      { status: 500 }
    );
  }
}
