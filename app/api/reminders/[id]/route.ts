import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUserId, unauthorizedResponse } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET single reminder
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return unauthorizedResponse();

    const { id } = await params;

    const reminder = await prisma.reminder.findFirst({
      where: { id, userId },
      include: {
        samhalle: {
          select: {
            id: true,
            namn: true,
            bigard: {
              select: { id: true, namn: true },
            },
          },
        },
        bigard: {
          select: { id: true, namn: true },
        },
      },
    });

    if (!reminder) {
      return NextResponse.json(
        { error: "Påminnelsen hittades inte" },
        { status: 404 }
      );
    }

    return NextResponse.json(reminder);
  } catch (error) {
    console.error("Error fetching reminder:", error);
    return NextResponse.json(
      { error: "Failed to fetch reminder" },
      { status: 500 }
    );
  }
}

// PUT update reminder
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return unauthorizedResponse();

    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const existing = await prisma.reminder.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Påminnelsen hittades inte" },
        { status: 404 }
      );
    }

    const reminder = await prisma.reminder.update({
      where: { id },
      data: {
        titel: body.titel,
        beskrivning: body.beskrivning,
        datum: body.datum ? new Date(body.datum) : undefined,
        paminnaFor: body.paminnaFor,
        kategori: body.kategori,
        samhalleId: body.samhalleId,
        bigardId: body.bigardId,
        utford: body.utford,
        utfordDatum: body.utford ? new Date() : null,
        upprepning: body.upprepning,
      },
      include: {
        samhalle: {
          select: { id: true, namn: true },
        },
        bigard: {
          select: { id: true, namn: true },
        },
      },
    });

    // If marked as completed and has repetition, create next reminder
    if (body.utford && reminder.upprepning && reminder.upprepning !== "Ingen") {
      const nextDate = new Date(reminder.datum);
      switch (reminder.upprepning) {
        case "Varje vecka":
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case "Varje månad":
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case "Varje år":
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
      }

      await prisma.reminder.create({
        data: {
          userId,
          titel: reminder.titel,
          beskrivning: reminder.beskrivning,
          datum: nextDate,
          paminnaFor: reminder.paminnaFor,
          kategori: reminder.kategori,
          samhalleId: reminder.samhalleId,
          bigardId: reminder.bigardId,
          upprepning: reminder.upprepning,
        },
      });
    }

    return NextResponse.json(reminder);
  } catch (error) {
    console.error("Error updating reminder:", error);
    return NextResponse.json(
      { error: "Failed to update reminder" },
      { status: 500 }
    );
  }
}

// DELETE reminder
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return unauthorizedResponse();

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.reminder.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Påminnelsen hittades inte" },
        { status: 404 }
      );
    }

    await prisma.reminder.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Påminnelse borttagen" });
  } catch (error) {
    console.error("Error deleting reminder:", error);
    return NextResponse.json(
      { error: "Failed to delete reminder" },
      { status: 500 }
    );
  }
}
