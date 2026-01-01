import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET all reminders (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const upcoming = searchParams.get("upcoming");
    const samhalleId = searchParams.get("samhalleId");
    const bigardId = searchParams.get("bigardId");
    const utford = searchParams.get("utford");

    const where: Record<string, unknown> = {};

    if (samhalleId) where.samhalleId = samhalleId;
    if (bigardId) where.bigardId = bigardId;
    if (utford !== null) where.utford = utford === "true";

    // For upcoming reminders, get those that are not completed and due soon
    if (upcoming === "true") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // Next 30 days

      where.utford = false;
      where.datum = {
        gte: today,
        lte: futureDate,
      };
    }

    const reminders = await prisma.reminder.findMany({
      where,
      include: {
        samhalle: {
          select: {
            id: true,
            namn: true,
            bigard: {
              select: {
                id: true,
                namn: true,
              },
            },
          },
        },
        bigard: {
          select: {
            id: true,
            namn: true,
          },
        },
      },
      orderBy: { datum: "asc" },
    });

    return NextResponse.json(reminders);
  } catch (error) {
    console.error("Error fetching reminders:", error);
    return NextResponse.json(
      { error: "Failed to fetch reminders" },
      { status: 500 }
    );
  }
}

// POST new reminder
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      titel,
      beskrivning,
      datum,
      paminnaFor,
      kategori,
      samhalleId,
      bigardId,
      upprepning,
    } = body;

    if (!titel || !datum || !kategori) {
      return NextResponse.json(
        { error: "Titel, datum och kategori är obligatoriska" },
        { status: 400 }
      );
    }

    const reminder = await prisma.reminder.create({
      data: {
        titel,
        beskrivning: beskrivning || null,
        datum: new Date(datum),
        paminnaFor: paminnaFor || 1,
        kategori,
        samhalleId: samhalleId || null,
        bigardId: bigardId || null,
        upprepning: upprepning || null,
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

    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    console.error("Error creating reminder:", error);
    return NextResponse.json(
      { error: "Failed to create reminder" },
      { status: 500 }
    );
  }
}
