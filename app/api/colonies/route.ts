import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withAuth } from "@/lib/auth";
import { colonySchema } from "@/lib/schemas";

// GET all colonies for current user
export const GET = withAuth(
  "Kunde inte hämta samhällen",
  async (request, { userId }) => {
    const searchParams = request.nextUrl.searchParams;
    const bigardId = searchParams.get("bigardId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { userId };
    if (bigardId) where.bigardId = bigardId;
    if (status) where.status = status;

    const colonies = await prisma.colony.findMany({
      where,
      include: {
        bigard: {
          select: {
            id: true,
            namn: true,
          },
        },
        _count: {
          select: { events: true },
        },
      },
      orderBy: [{ bigard: { namn: "asc" } }, { platsNummer: "asc" }],
    });

    return NextResponse.json(colonies);
  }
);

// POST new colony
export const POST = withAuth(
  "Kunde inte skapa samhälle",
  async (request, { userId }) => {
    const body = colonySchema.parse(await request.json());

    // Verify apiary exists and belongs to user
    const apiary = await prisma.apiary.findFirst({
      where: { id: body.bigardId, userId },
    });

    if (!apiary) {
      return NextResponse.json(
        { error: "Bigården finns inte" },
        { status: 404 }
      );
    }

    const colony = await prisma.colony.create({
      data: {
        userId,
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

    // Starta drottninghistoriken om drottninguppgifter angavs
    if (body.drottningRas || body.drottningAr) {
      await prisma.queen.create({
        data: {
          userId,
          samhalleId: colony.id,
          ras: body.drottningRas,
          ar: body.drottningAr,
          vingklippt: body.drottningVingklippt,
        },
      });
    }

    return NextResponse.json(colony, { status: 201 });
  }
);
