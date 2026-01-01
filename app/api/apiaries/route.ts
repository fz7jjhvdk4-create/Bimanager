import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET all apiaries
export async function GET() {
  try {
    const apiaries = await prisma.apiary.findMany({
      include: {
        _count: {
          select: { colonies: true },
        },
        colonies: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { namn: "asc" },
    });

    // Add active colony count to each apiary
    const apiariesWithStats = apiaries.map((apiary) => ({
      ...apiary,
      activeColonies: apiary.colonies.filter((c) => c.status === "Aktiv")
        .length,
    }));

    return NextResponse.json(apiariesWithStats);
  } catch (error) {
    console.error("Error fetching apiaries:", error);
    return NextResponse.json(
      { error: "Failed to fetch apiaries" },
      { status: 500 }
    );
  }
}

// POST new apiary
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { namn, adress, latitude, longitude, beskrivning } = body;

    if (!namn) {
      return NextResponse.json({ error: "Namn is required" }, { status: 400 });
    }

    const apiary = await prisma.apiary.create({
      data: {
        namn,
        adress: adress || null,
        latitude: latitude || null,
        longitude: longitude || null,
        beskrivning: beskrivning || null,
      },
    });

    return NextResponse.json(apiary, { status: 201 });
  } catch (error) {
    console.error("Error creating apiary:", error);
    return NextResponse.json(
      { error: "Failed to create apiary" },
      { status: 500 }
    );
  }
}
