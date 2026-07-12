import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withAuth } from "@/lib/auth";
import { eventUpdateSchema } from "@/lib/schemas";

// GET single event
export const GET = withAuth(
  "Kunde inte hämta händelse",
  async (_request, { userId, params }) => {
    const event = await prisma.event.findFirst({
      where: { id: params.id, userId },
      include: {
        samhalle: {
          include: {
            bigard: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Händelsen hittades inte" },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  }
);

// PUT update event
export const PUT = withAuth(
  "Kunde inte uppdatera händelse",
  async (request, { userId, params }) => {
    const existing = await prisma.event.findFirst({
      where: { id: params.id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Händelsen hittades inte" },
        { status: 404 }
      );
    }

    const body = eventUpdateSchema.parse(await request.json());

    const event = await prisma.event.update({
      where: { id: params.id },
      data: {
        handelseTyp: body.handelseTyp ?? undefined,
        datum: body.datum ?? undefined,
        beskrivning: body.beskrivning,
        data: body.data ? JSON.stringify(body.data) : undefined,
      },
    });

    return NextResponse.json(event);
  }
);

// DELETE event
export const DELETE = withAuth(
  "Kunde inte ta bort händelse",
  async (_request, { userId, params }) => {
    const existing = await prisma.event.findFirst({
      where: { id: params.id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Händelsen hittades inte" },
        { status: 404 }
      );
    }

    await prisma.event.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  }
);
