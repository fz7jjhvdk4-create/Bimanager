import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUserId, unauthorizedResponse } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET single colony with events
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return unauthorizedResponse();

    const { id } = await params;
    const colony = await prisma.colony.findFirst({
      where: { id, userId },
      include: {
        bigard: true,
        events: {
          orderBy: { datum: "desc" },
        },
        skapadFran: {
          select: {
            id: true,
            namn: true,
          },
        },
        avlaggare: {
          select: {
            id: true,
            namn: true,
          },
        },
      },
    });

    if (!colony) {
      return NextResponse.json({ error: "Colony not found" }, { status: 404 });
    }

    return NextResponse.json(colony);
  } catch (error) {
    console.error("Error fetching colony:", error);
    return NextResponse.json(
      { error: "Failed to fetch colony" },
      { status: 500 }
    );
  }
}

// PUT update colony
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return unauthorizedResponse();

    const { id } = await params;
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

    if (!namn) {
      return NextResponse.json(
        { error: "Namn är obligatoriskt" },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await prisma.colony.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Colony not found" }, { status: 404 });
    }

    const colony = await prisma.colony.update({
      where: { id },
      data: {
        bigardId: bigardId || undefined,
        namn,
        platsNummer: platsNummer ?? null,
        drottningRas: drottningRas || null,
        drottningAr: drottningAr || null,
        drottningVingklippt: drottningVingklippt ?? false,
        kupaTyp: kupaTyp || null,
        ramTypYngelrum: ramTypYngelrum || null,
        ramTypSkattlador: ramTypSkattlador || null,
        status: status || "Aktiv",
        anteckningar: anteckningar || null,
      },
    });

    return NextResponse.json(colony);
  } catch (error) {
    console.error("Error updating colony:", error);
    return NextResponse.json(
      { error: "Failed to update colony" },
      { status: 500 }
    );
  }
}

// DELETE colony
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return unauthorizedResponse();

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.colony.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Colony not found" }, { status: 404 });
    }

    await prisma.colony.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting colony:", error);
    return NextResponse.json(
      { error: "Failed to delete colony" },
      { status: 500 }
    );
  }
}
