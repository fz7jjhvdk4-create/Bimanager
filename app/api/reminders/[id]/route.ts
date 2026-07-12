import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withAuth } from "@/lib/auth";
import { reminderUpdateSchema } from "@/lib/schemas";

// GET single reminder
export const GET = withAuth(
  "Kunde inte hämta påminnelse",
  async (_request, { userId, params }) => {
    const reminder = await prisma.reminder.findFirst({
      where: { id: params.id, userId },
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
  }
);

// PUT update reminder (partiell — t.ex. bara { utford: true })
export const PUT = withAuth(
  "Kunde inte uppdatera påminnelse",
  async (request, { userId, params }) => {
    const existing = await prisma.reminder.findFirst({
      where: { id: params.id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Påminnelsen hittades inte" },
        { status: 404 }
      );
    }

    const body = reminderUpdateSchema.parse(await request.json());

    const reminder = await prisma.reminder.update({
      where: { id: params.id },
      data: {
        titel: body.titel,
        beskrivning: body.beskrivning,
        datum: body.datum,
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
  }
);

// DELETE reminder
export const DELETE = withAuth(
  "Kunde inte ta bort påminnelse",
  async (_request, { userId, params }) => {
    const existing = await prisma.reminder.findFirst({
      where: { id: params.id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Påminnelsen hittades inte" },
        { status: 404 }
      );
    }

    await prisma.reminder.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Påminnelse borttagen" });
  }
);
