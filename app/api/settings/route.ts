import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withAuth } from "@/lib/auth";
import { settingsSchema } from "@/lib/schemas";

// GET - Hämta inställningar för current user
export const GET = withAuth(
  "Kunde inte hämta inställningar",
  async (_request, { userId }) => {
    let settings = await prisma.settings.findFirst({
      where: { userId },
    });

    // Skapa standardinställningar om de inte finns
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          userId,
          nastaFakturaNummer: 1,
        },
      });
    }

    return NextResponse.json(settings);
  }
);

// PUT - Uppdatera inställningar
export const PUT = withAuth(
  "Kunde inte uppdatera inställningar",
  async (request, { userId }) => {
    const body = settingsSchema.parse(await request.json());

    // Försök uppdatera eller skapa
    const existing = await prisma.settings.findFirst({
      where: { userId },
    });

    const settings = existing
      ? await prisma.settings.update({
          where: { id: existing.id },
          data: body,
        })
      : await prisma.settings.create({
          data: { userId, ...body },
        });

    return NextResponse.json(settings);
  }
);
