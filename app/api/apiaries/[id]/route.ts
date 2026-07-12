import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withAuth } from "@/lib/auth";
import { apiarySchema } from "@/lib/schemas";

// GET single apiary
export const GET = withAuth(
  "Kunde inte hämta bigård",
  async (_request, { userId, params }) => {
    const apiary = await prisma.apiary.findFirst({
      where: { id: params.id, userId },
      include: {
        colonies: {
          orderBy: { platsNummer: "asc" },
        },
      },
    });

    if (!apiary) {
      return NextResponse.json(
        { error: "Bigården hittades inte" },
        { status: 404 }
      );
    }

    return NextResponse.json(apiary);
  }
);

// PUT update apiary
export const PUT = withAuth(
  "Kunde inte uppdatera bigård",
  async (request, { userId, params }) => {
    const existing = await prisma.apiary.findFirst({
      where: { id: params.id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Bigården hittades inte" },
        { status: 404 }
      );
    }

    const body = apiarySchema.parse(await request.json());

    const apiary = await prisma.apiary.update({
      where: { id: params.id },
      data: {
        namn: body.namn,
        adress: body.adress,
        latitude: body.latitude,
        longitude: body.longitude,
        beskrivning: body.beskrivning,
      },
    });

    return NextResponse.json(apiary);
  }
);

// DELETE apiary
export const DELETE = withAuth(
  "Kunde inte ta bort bigård",
  async (_request, { userId, params }) => {
    const existing = await prisma.apiary.findFirst({
      where: { id: params.id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Bigården hittades inte" },
        { status: 404 }
      );
    }

    // Check if apiary has colonies
    const coloniesCount = await prisma.colony.count({
      where: { bigardId: params.id },
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
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  }
);
