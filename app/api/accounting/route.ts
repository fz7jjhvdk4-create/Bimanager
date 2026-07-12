import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withAuth } from "@/lib/auth";
import { accountingSchema } from "@/lib/schemas";
import { beraknaMoms } from "@/lib/accounting";

// GET - Hämta alla transaktioner för current user
export const GET = withAuth(
  "Kunde inte hämta transaktioner",
  async (request, { userId }) => {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = { userId };

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
  }
);

// POST - Skapa ny transaktion
export const POST = withAuth(
  "Kunde inte skapa transaktion",
  async (request, { userId }) => {
    const body = accountingSchema.parse(await request.json());
    const { momsBelopp, beloppInklMoms } = beraknaMoms(
      body.beloppExMoms,
      body.momsSats
    );

    const transaction = await prisma.accounting.create({
      data: {
        userId,
        datum: body.datum,
        handelseTyp: body.handelseTyp,
        beskrivning: body.beskrivning,
        beloppExMoms: body.beloppExMoms,
        momsSats: body.momsSats,
        momsBelopp,
        beloppInklMoms,
        mottagare: body.mottagare,
        antalBurkar: body.antalBurkar,
        prisPerEnhet: body.prisPerEnhet,
        fakturaNummer: body.fakturaNummer,
        notering: body.notering,
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  }
);
