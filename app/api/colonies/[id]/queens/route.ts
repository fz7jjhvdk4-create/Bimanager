import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withAuth } from "@/lib/auth";
import { queenSchema } from "@/lib/schemas";

// GET - drottninghistorik för ett samhälle (nyast först)
export const GET = withAuth(
  "Kunde inte hämta drottninghistorik",
  async (_request, { userId, params }) => {
    const colony = await prisma.colony.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });

    if (!colony) {
      return NextResponse.json(
        { error: "Samhället hittades inte" },
        { status: 404 }
      );
    }

    const queens = await prisma.queen.findMany({
      where: { samhalleId: params.id },
      orderBy: { installeradDatum: "desc" },
    });

    return NextResponse.json(queens);
  }
);

// POST - byt drottning: avsluta den aktiva och registrera en ny
export const POST = withAuth(
  "Kunde inte byta drottning",
  async (request, { userId, params }) => {
    const colony = await prisma.colony.findFirst({
      where: { id: params.id, userId },
    });

    if (!colony) {
      return NextResponse.json(
        { error: "Samhället hittades inte" },
        { status: 404 }
      );
    }

    const body = queenSchema.parse(await request.json());
    const installerad = body.installeradDatum ?? new Date();

    const queen = await prisma.$transaction(async (tx) => {
      // Avsluta nuvarande aktiva drottning
      await tx.queen.updateMany({
        where: { samhalleId: colony.id, status: "Aktiv" },
        data: {
          status: body.gammalStatus,
          avslutadDatum: installerad,
        },
      });

      const nyDrottning = await tx.queen.create({
        data: {
          userId,
          samhalleId: colony.id,
          ras: body.ras,
          ar: body.ar,
          vingklippt: body.vingklippt,
          ursprung: body.ursprung,
          installeradDatum: installerad,
          anteckningar: body.anteckningar,
        },
      });

      // Samhällets drottningfält speglar alltid den aktiva drottningen
      await tx.colony.update({
        where: { id: colony.id },
        data: {
          drottningRas: body.ras,
          drottningAr: body.ar,
          drottningVingklippt: body.vingklippt,
        },
      });

      return nyDrottning;
    });

    return NextResponse.json(queen, { status: 201 });
  }
);
