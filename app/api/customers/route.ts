import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET - Hämta alla kunder
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const where = search
      ? {
          OR: [
            { namn: { contains: search } },
            { epost: { contains: search } },
            { telefon: { contains: search } },
            { ort: { contains: search } },
          ],
        }
      : {};

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
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Kunde inte hämta kunder" },
      { status: 500 }
    );
  }
}

// POST - Skapa ny kund
export async function POST(request: Request) {
  try {
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

    const customer = await prisma.customer.create({
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

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "Kunde inte skapa kund" },
      { status: 500 }
    );
  }
}
