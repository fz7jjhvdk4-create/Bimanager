import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET - Hämta en kund
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        invoices: {
          orderBy: { fakturaDatum: "desc" },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Kund hittades inte" },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: "Kunde inte hämta kund" },
      { status: 500 }
    );
  }
}

// PUT - Uppdatera kund
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      namn,
      adress,
      postnummer,
      ort,
      epost,
      telefon,
      organisationsnummer,
    } = body;

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        namn,
        adress,
        postnummer,
        ort,
        epost,
        telefon,
        organisationsnummer,
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Kunde inte uppdatera kund" },
      { status: 500 }
    );
  }
}

// DELETE - Ta bort kund
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Kontrollera om kunden har fakturor
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { invoices: true },
    });

    if (customer?.invoices.length) {
      return NextResponse.json(
        { error: "Kan inte ta bort kund med fakturor" },
        { status: 400 }
      );
    }

    await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Kund borttagen" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "Kunde inte ta bort kund" },
      { status: 500 }
    );
  }
}
