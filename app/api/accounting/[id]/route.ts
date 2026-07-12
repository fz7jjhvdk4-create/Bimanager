import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withAuth } from "@/lib/auth";
import { accountingSchema } from "@/lib/schemas";
import { beraknaMoms } from "@/lib/accounting";

// GET - Hämta en transaktion
export const GET = withAuth(
  "Kunde inte hämta transaktion",
  async (request, { userId, params }) => {
    const transaction = await prisma.accounting.findFirst({
      where: { id: params.id, userId },
      include: {
        faktura: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaktion hittades inte" },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction);
  }
);

// PUT - Uppdatera transaktion
export const PUT = withAuth(
  "Kunde inte uppdatera transaktion",
  async (request, { userId, params }) => {
    const existing = await prisma.accounting.findFirst({
      where: { id: params.id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Transaktion hittades inte" },
        { status: 404 }
      );
    }

    const body = accountingSchema.parse(await request.json());
    const { momsBelopp, beloppInklMoms } = beraknaMoms(
      body.beloppExMoms,
      body.momsSats
    );

    const transaction = await prisma.accounting.update({
      where: { id: params.id },
      data: {
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

    return NextResponse.json(transaction);
  }
);

// DELETE - Ta bort transaktion
export const DELETE = withAuth(
  "Kunde inte ta bort transaktion",
  async (request, { userId, params }) => {
    const existing = await prisma.accounting.findFirst({
      where: { id: params.id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Transaktion hittades inte" },
        { status: 404 }
      );
    }

    await prisma.accounting.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Transaktion borttagen" });
  }
);
