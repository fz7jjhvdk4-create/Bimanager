import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUserId, unauthorizedResponse } from "@/lib/auth";

// GET - Hämta en faktura
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return unauthorizedResponse();

    const { id } = await params;
    const invoice = await prisma.invoice.findFirst({
      where: { id, userId },
      include: {
        kund: true,
        transactions: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Faktura hittades inte" },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Kunde inte hämta faktura" },
      { status: 500 }
    );
  }
}

// PUT - Uppdatera faktura
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return unauthorizedResponse();

    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const existing = await prisma.invoice.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Faktura hittades inte" },
        { status: 404 }
      );
    }

    const { fakturaDatum, forfallDatum, rader, status } = body;

    // Beräkna totaler om rader har ändrats
    let updateData: Record<string, unknown> = { status };

    if (fakturaDatum) {
      updateData.fakturaDatum = new Date(fakturaDatum);
    }

    if (forfallDatum) {
      updateData.forfallDatum = new Date(forfallDatum);
    }

    if (rader) {
      let totaltExMoms = 0;
      let totaltMoms = 0;

      const parsedRader = typeof rader === "string" ? JSON.parse(rader) : rader;
      for (const rad of parsedRader) {
        const radBelopp = rad.antal * rad.prisPerEnhet;
        const radMoms = radBelopp * (rad.momsSats || 0.12);
        totaltExMoms += radBelopp;
        totaltMoms += radMoms;
      }

      updateData = {
        ...updateData,
        rader: JSON.stringify(parsedRader),
        totaltExMoms,
        totaltMoms,
        totaltInklMoms: totaltExMoms + totaltMoms,
      };
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        kund: true,
      },
    });

    // Om fakturan markeras som betald, skapa en transaktion i kassaboken
    if (status === "Betald") {
      const existingTransaction = await prisma.accounting.findFirst({
        where: { fakturaId: id, userId },
      });

      if (!existingTransaction) {
        await prisma.accounting.create({
          data: {
            userId,
            datum: new Date(),
            handelseTyp: "Försäljning",
            beskrivning: `Faktura ${invoice.fakturaNummer}`,
            beloppExMoms: invoice.totaltExMoms,
            momsSats: 0.12,
            momsBelopp: invoice.totaltMoms,
            beloppInklMoms: invoice.totaltInklMoms,
            mottagare: invoice.kund.namn,
            fakturaNummer: invoice.fakturaNummer,
            fakturaId: invoice.id,
          },
        });
      }
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: "Kunde inte uppdatera faktura" },
      { status: 500 }
    );
  }
}

// DELETE - Ta bort faktura
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return unauthorizedResponse();

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.invoice.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Faktura hittades inte" },
        { status: 404 }
      );
    }

    // Ta bort eventuella transaktioner kopplade till fakturan
    await prisma.accounting.deleteMany({
      where: { fakturaId: id, userId },
    });

    await prisma.invoice.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Faktura borttagen" });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      { error: "Kunde inte ta bort faktura" },
      { status: 500 }
    );
  }
}
