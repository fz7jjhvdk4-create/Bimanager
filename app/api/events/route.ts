import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET all events (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const samhalleId = searchParams.get("samhalleId");
    const handelseTyp = searchParams.get("handelseTyp");
    const limit = searchParams.get("limit");

    const where: Record<string, unknown> = {};
    if (samhalleId) where.samhalleId = samhalleId;
    if (handelseTyp) where.handelseTyp = handelseTyp;

    const events = await prisma.event.findMany({
      where,
      include: {
        samhalle: {
          include: {
            bigard: {
              select: {
                id: true,
                namn: true,
              },
            },
          },
        },
      },
      orderBy: { datum: "desc" },
      take: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// POST new event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { samhalleId, handelseTyp, datum, beskrivning, data } = body;

    if (!samhalleId || !handelseTyp || !datum) {
      return NextResponse.json(
        { error: "Samhälle, händelsetyp och datum är obligatoriska" },
        { status: 400 }
      );
    }

    // Verify colony exists
    const colony = await prisma.colony.findUnique({
      where: { id: samhalleId },
      include: { bigard: true },
    });

    if (!colony) {
      return NextResponse.json(
        { error: "Samhället finns inte" },
        { status: 404 }
      );
    }

    // Om det är en avläggare och användaren vill skapa nytt samhälle
    let newColonyId: string | null = null;
    if (handelseTyp === "Avläggare" && data?.skapaNyttSamhalle) {
      const targetBigardId = data.nyttSamhalleBigardId || colony.bigardId;

      // Skapa det nya samhället
      const newColony = await prisma.colony.create({
        data: {
          bigardId: targetBigardId,
          namn: data.nyttSamhalleNamn || `Avläggare från ${colony.namn}`,
          drottningRas: data.nyttSamhalleDrottningRas || colony.drottningRas,
          drottningAr: data.nyttSamhalleDrottningAr || new Date().getFullYear(),
          kupaTyp: colony.kupaTyp,
          ramTypYngelrum: colony.ramTypYngelrum,
          ramTypSkattlador: colony.ramTypSkattlador,
          status: "Aktiv",
          skapadFranId: samhalleId, // Koppla till ursprungssamhället
          anteckningar: `Avläggare skapad ${new Date(datum).toLocaleDateString("sv-SE")} från ${colony.namn}`,
        },
      });

      newColonyId = newColony.id;

      // Lägg till avläggare-ID i event data
      data.nyttSamhalleId = newColonyId;
    }

    const event = await prisma.event.create({
      data: {
        samhalleId,
        handelseTyp,
        datum: new Date(datum),
        beskrivning: beskrivning || null,
        data: data ? JSON.stringify(data) : null,
      },
    });

    return NextResponse.json(
      {
        ...event,
        newColonyId,
        message: newColonyId ? "Händelse skapad och nytt samhälle skapat" : "Händelse skapad"
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
