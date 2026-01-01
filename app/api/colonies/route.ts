import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET all colonies
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bigardId = searchParams.get("bigardId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (bigardId) where.bigardId = bigardId;
    if (status) where.status = status;

    const colonies = await prisma.colony.findMany({
      where,
      include: {
        bigard: {
          select: {
            id: true,
            namn: true,
          },
        },
        _count: {
          select: { events: true },
        },
      },
      orderBy: [{ bigard: { namn: "asc" } }, { platsNummer: "asc" }],
    });

    return NextResponse.json(colonies);
  } catch (error) {
    console.error("Error fetching colonies:", error);
    return NextResponse.json(
      { error: "Failed to fetch colonies" },
      { status: 500 }
    );
  }
}

// POST new colony
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      bigardId,
      namn,
      platsNummer,
      drottningRas,
      drottningAr,
      drottningVingklippt,
      kupaTyp,
      ramTypYngelrum,
      ramTypSkattlador,
      status,
      anteckningar,
    } = body;

    if (!bigardId || !namn) {
      return NextResponse.json(
        { error: "Bigård och namn är obligatoriska" },
        { status: 400 }
      );
    }

    // Verify apiary exists
    const apiary = await prisma.apiary.findUnique({
      where: { id: bigardId },
    });

    if (!apiary) {
      return NextResponse.json(
        { error: "Bigården finns inte" },
        { status: 404 }
      );
    }

    const colony = await prisma.colony.create({
      data: {
        bigardId,
        namn,
        platsNummer: platsNummer || null,
        drottningRas: drottningRas || null,
        drottningAr: drottningAr || null,
        drottningVingklippt: drottningVingklippt || false,
        kupaTyp: kupaTyp || null,
        ramTypYngelrum: ramTypYngelrum || null,
        ramTypSkattlador: ramTypSkattlador || null,
        status: status || "Aktiv",
        anteckningar: anteckningar || null,
      },
    });

    return NextResponse.json(colony, { status: 201 });
  } catch (error) {
    console.error("Error creating colony:", error);
    return NextResponse.json(
      { error: "Failed to create colony" },
      { status: 500 }
    );
  }
}
