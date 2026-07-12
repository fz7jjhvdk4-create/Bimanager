import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withAuth } from "@/lib/auth";
import { customerSchema } from "@/lib/schemas";

// GET - Hämta en kund
export const GET = withAuth(
  "Kunde inte hämta kund",
  async (_request, { userId, params }) => {
    const customer = await prisma.customer.findFirst({
      where: { id: params.id, userId },
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
  }
);

// PUT - Uppdatera kund
export const PUT = withAuth(
  "Kunde inte uppdatera kund",
  async (request, { userId, params }) => {
    const existing = await prisma.customer.findFirst({
      where: { id: params.id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Kund hittades inte" },
        { status: 404 }
      );
    }

    const body = customerSchema.parse(await request.json());

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        namn: body.namn,
        adress: body.adress,
        postnummer: body.postnummer,
        ort: body.ort,
        epost: body.epost,
        telefon: body.telefon,
        organisationsnummer: body.organisationsnummer,
      },
    });

    return NextResponse.json(customer);
  }
);

// DELETE - Ta bort kund
export const DELETE = withAuth(
  "Kunde inte ta bort kund",
  async (_request, { userId, params }) => {
    const customer = await prisma.customer.findFirst({
      where: { id: params.id, userId },
      include: { invoices: true },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Kund hittades inte" },
        { status: 404 }
      );
    }

    if (customer.invoices.length) {
      return NextResponse.json(
        { error: "Kan inte ta bort kund med fakturor" },
        { status: 400 }
      );
    }

    await prisma.customer.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Kund borttagen" });
  }
);
