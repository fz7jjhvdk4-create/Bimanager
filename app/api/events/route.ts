import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withAuth } from "@/lib/auth";
import { eventSchema } from "@/lib/schemas";
import { hamtaPrognos, symbolText } from "@/lib/smhi";

// Typspecifik payload när en avläggare ska skapa ett nytt samhälle
interface AvlaggareData {
  skapaNyttSamhalle?: boolean;
  nyttSamhalleBigardId?: string;
  nyttSamhalleNamn?: string;
  nyttSamhalleDrottningRas?: string;
  nyttSamhalleDrottningAr?: number;
  nyttSamhalleId?: string;
}

// GET all events for current user (with optional filters)
export const GET = withAuth(
  "Kunde inte hämta händelser",
  async (request, { userId }) => {
    const searchParams = request.nextUrl.searchParams;
    const samhalleId = searchParams.get("samhalleId");
    const bigardId = searchParams.get("bigardId");
    const handelseTyp = searchParams.get("handelseTyp");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = searchParams.get("limit");

    const where: Record<string, unknown> = { userId };
    if (samhalleId) where.samhalleId = samhalleId;
    if (bigardId) where.samhalle = { bigardId };
    if (handelseTyp) where.handelseTyp = handelseTyp;
    if (from || to) {
      where.datum = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
      };
    }

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
  }
);

// POST new event
export const POST = withAuth(
  "Kunde inte skapa händelse",
  async (request, { userId }) => {
    const body = eventSchema.parse(await request.json());
    let data = (body.data ?? null) as (AvlaggareData & Record<string, unknown>) | null;

    // Verify colony exists and belongs to user
    const colony = await prisma.colony.findFirst({
      where: { id: body.samhalleId, userId },
      include: { bigard: true },
    });

    if (!colony) {
      return NextResponse.json(
        { error: "Samhället finns inte" },
        { status: 404 }
      );
    }

    // Väderstämpla inspektioner som loggas samma dag, om bigården har koordinater
    if (
      body.handelseTyp === "Inspektion" &&
      colony.bigard.latitude &&
      colony.bigard.longitude &&
      body.datum.toDateString() === new Date().toDateString()
    ) {
      const prognos = await hamtaPrognos(
        colony.bigard.latitude,
        colony.bigard.longitude
      );
      if (prognos) {
        data = data ?? {};
        data.vader = {
          temperatur: prognos.nu.temperatur,
          vind: prognos.nu.vind,
          text: symbolText(prognos.nu.symbol),
        };
      }
    }

    // Om det är en avläggare och användaren vill skapa nytt samhälle
    let newColonyId: string | null = null;
    if (body.handelseTyp === "Avläggare" && data?.skapaNyttSamhalle) {
      const targetBigardId = data.nyttSamhalleBigardId || colony.bigardId;

      // Skapa det nya samhället
      const newColony = await prisma.colony.create({
        data: {
          userId,
          bigardId: targetBigardId,
          namn: data.nyttSamhalleNamn || `Avläggare från ${colony.namn}`,
          drottningRas: data.nyttSamhalleDrottningRas || colony.drottningRas,
          drottningAr: data.nyttSamhalleDrottningAr || new Date().getFullYear(),
          kupaTyp: colony.kupaTyp,
          ramTypYngelrum: colony.ramTypYngelrum,
          ramTypSkattlador: colony.ramTypSkattlador,
          status: "Aktiv",
          skapadFranId: body.samhalleId, // Koppla till ursprungssamhället
          anteckningar: `Avläggare skapad ${body.datum.toLocaleDateString("sv-SE")} från ${colony.namn}`,
        },
      });

      newColonyId = newColony.id;

      // Starta drottninghistoriken för det nya samhället
      if (newColony.drottningRas || newColony.drottningAr) {
        await prisma.queen.create({
          data: {
            userId,
            samhalleId: newColony.id,
            ras: newColony.drottningRas,
            ar: newColony.drottningAr,
            ursprung: "Egen avel",
          },
        });
      }

      // Lägg till avläggare-ID i event data
      data.nyttSamhalleId = newColonyId;
    }

    const event = await prisma.event.create({
      data: {
        userId,
        samhalleId: body.samhalleId,
        handelseTyp: body.handelseTyp,
        datum: body.datum,
        beskrivning: body.beskrivning,
        data: data ? JSON.stringify(data) : null,
      },
    });

    return NextResponse.json(
      {
        ...event,
        newColonyId,
        message: newColonyId
          ? "Händelse skapad och nytt samhälle skapat"
          : "Händelse skapad",
      },
      { status: 201 }
    );
  }
);
