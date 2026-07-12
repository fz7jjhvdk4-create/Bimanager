import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withAuth } from "@/lib/auth";
import { customerSchema } from "@/lib/schemas";

// GET - Hämta alla kunder för current user
export const GET = withAuth(
  "Kunde inte hämta kunder",
  async (request, { userId }) => {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const where = search
      ? {
          userId,
          OR: [
            { namn: { contains: search } },
            { epost: { contains: search } },
            { telefon: { contains: search } },
            { ort: { contains: search } },
          ],
        }
      : { userId };

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { namn: "asc" },
      include: {
        invoices: {
          select: {
            id: true,
            fakturaNummer: true,
            totaltInklMoms: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(customers);
  }
);

// POST - Skapa ny kund
export const POST = withAuth(
  "Kunde inte skapa kund",
  async (request, { userId }) => {
    const body = customerSchema.parse(await request.json());

    const customer = await prisma.customer.create({
      data: {
        userId,
        namn: body.namn,
        adress: body.adress,
        postnummer: body.postnummer,
        ort: body.ort,
        epost: body.epost,
        telefon: body.telefon,
        organisationsnummer: body.organisationsnummer,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  }
);
