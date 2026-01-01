import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET single apiary
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const apiary = await prisma.apiary.findUnique({
      where: { id },
      include: {
        colonies: {
          orderBy: { platsNummer: "asc" },
        },
      },
    });

    if (!apiary) {
      return NextResponse.json({ error: "Apiary not found" }, { status: 404 });
    }

    return NextResponse.json(apiary);
  } catch (error) {
    console.error("Error fetching apiary:", error);
    return NextResponse.json(
      { error: "Failed to fetch apiary" },
      { status: 500 }
    );
  }
}

// PUT update apiary
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { namn, adress, latitude, longitude, beskrivning } = body;

    if (!namn) {
      return NextResponse.json({ error: "Namn is required" }, { status: 400 });
    }

    const apiary = await prisma.apiary.update({
      where: { id },
      data: {
        namn,
        adress: adress || null,
        latitude: latitude || null,
        longitude: longitude || null,
        beskrivning: beskrivning || null,
      },
    });

    return NextResponse.json(apiary);
  } catch (error) {
    console.error("Error updating apiary:", error);
    return NextResponse.json(
      { error: "Failed to update apiary" },
      { status: 500 }
    );
  }
}

// DELETE apiary
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if apiary has colonies
    const coloniesCount = await prisma.colony.count({
      where: { bigardId: id },
    });

    if (coloniesCount > 0) {
      return NextResponse.json(
        {
          error:
            "Kan inte ta bort bigård med samhällen. Ta bort samhällena först.",
        },
        { status: 400 }
      );
    }

    await prisma.apiary.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting apiary:", error);
    return NextResponse.json(
      { error: "Failed to delete apiary" },
      { status: 500 }
    );
  }
}
