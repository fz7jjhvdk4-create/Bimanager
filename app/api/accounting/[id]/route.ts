import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET - Hämta en transaktion
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transaction = await prisma.accounting.findUnique({
      where: { id },
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
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      { error: "Kunde inte hämta transaktion" },
      { status: 500 }
    );
  }
}

// PUT - Uppdatera transaktion
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const transaction = await prisma.accounting.update({
      where: { id },
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

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Kunde inte uppdatera transaktion" },
      { status: 500 }
    );
  }
}

// DELETE - Ta bort transaktion
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.accounting.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Transaktion borttagen" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json(
      { error: "Kunde inte ta bort transaktion" },
      { status: 500 }
    );
  }
}
