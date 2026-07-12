import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withAuth } from "@/lib/auth";
import { colonySchema } from "@/lib/schemas";

// GET single colony with events
export const GET = withAuth(
  "Kunde inte hämta samhälle",
  async (_request, { userId, params }) => {
    const colony = await prisma.colony.findFirst({
      where: { id: params.id, userId },
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
      return NextResponse.json(
        { error: "Samhället hittades inte" },
        { status: 404 }
      );
    }

    return NextResponse.json(colony);
  }
);

// PUT update colony
export const PUT = withAuth(
  "Kunde inte uppdatera samhälle",
  async (request, { userId, params }) => {
    const existing = await prisma.colony.findFirst({
      where: { id: params.id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Samhället hittades inte" },
        { status: 404 }
      );
    }

    const body = colonySchema.parse(await request.json());

    // Verify target apiary belongs to user (bigarden kan ha bytts i formuläret)
    const apiary = await prisma.apiary.findFirst({
      where: { id: body.bigardId, userId },
    });

    if (!apiary) {
      return NextResponse.json(
        { error: "Bigården finns inte" },
        { status: 404 }
      );
    }

    const colony = await prisma.colony.update({
      where: { id: params.id },
      data: {
        bigardId: body.bigardId,
        namn: body.namn,
        platsNummer: body.platsNummer,
        drottningRas: body.drottningRas,
        drottningAr: body.drottningAr,
        drottningVingklippt: body.drottningVingklippt,
        kupaTyp: body.kupaTyp,
        ramTypYngelrum: body.ramTypYngelrum,
        ramTypSkattlador: body.ramTypSkattlador,
        status: body.status,
        anteckningar: body.anteckningar,
      },
    });

    return NextResponse.json(colony);
  }
);

// DELETE colony
export const DELETE = withAuth(
  "Kunde inte ta bort samhälle",
  async (_request, { userId, params }) => {
    const existing = await prisma.colony.findFirst({
      where: { id: params.id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Samhället hittades inte" },
        { status: 404 }
      );
    }

    await prisma.colony.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  }
);
