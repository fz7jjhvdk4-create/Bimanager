import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withAuth } from "@/lib/auth";
import { apiarySchema } from "@/lib/schemas";

// GET all apiaries for current user
export const GET = withAuth(
  "Kunde inte hämta bigårdar",
  async (_request, { userId }) => {
    const apiaries = await prisma.apiary.findMany({
      where: { userId },
      include: {
        _count: {
          select: { colonies: true },
        },
        colonies: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { namn: "asc" },
    });

    // Add active colony count to each apiary
    const apiariesWithStats = apiaries.map((apiary) => ({
      ...apiary,
      activeColonies: apiary.colonies.filter((c) => c.status === "Aktiv")
        .length,
    }));

    return NextResponse.json(apiariesWithStats);
  }
);

// POST new apiary
export const POST = withAuth(
  "Kunde inte skapa bigård",
  async (request, { userId }) => {
    const body = apiarySchema.parse(await request.json());

    const apiary = await prisma.apiary.create({
      data: {
        userId,
        namn: body.namn,
        adress: body.adress,
        latitude: body.latitude,
        longitude: body.longitude,
        beskrivning: body.beskrivning,
      },
    });

    return NextResponse.json(apiary, { status: 201 });
  }
);
