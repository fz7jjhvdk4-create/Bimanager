import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withAuth } from "@/lib/auth";
import { reminderSchema } from "@/lib/schemas";

// GET all reminders for current user (with optional filters)
export const GET = withAuth(
  "Kunde inte hämta påminnelser",
  async (request, { userId }) => {
    const searchParams = request.nextUrl.searchParams;
    const upcoming = searchParams.get("upcoming");
    const samhalleId = searchParams.get("samhalleId");
    const bigardId = searchParams.get("bigardId");
    const utford = searchParams.get("utford");

    const where: Record<string, unknown> = { userId };

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
  }
);

// POST new reminder
export const POST = withAuth(
  "Kunde inte skapa påminnelse",
  async (request, { userId }) => {
    const body = reminderSchema.parse(await request.json());

    const reminder = await prisma.reminder.create({
      data: {
        userId,
        titel: body.titel,
        beskrivning: body.beskrivning,
        datum: body.datum,
        paminnaFor: body.paminnaFor,
        kategori: body.kategori,
        samhalleId: body.samhalleId,
        bigardId: body.bigardId,
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

    return NextResponse.json(reminder, { status: 201 });
  }
);
