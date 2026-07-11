import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getCurrentUserId, unauthorizedResponse } from "@/lib/auth";
import {
  nextSequenceNumber,
  formatSequenceNumber,
  yearPrefix,
} from "@/lib/invoice";

const cashPaymentSchema = z
  .object({
    datum: z.coerce.date(),
    beskrivning: z.string().min(1, "Beskrivning krävs"),
    koparensNamn: z.string().optional(),
    antalBurkar: z.number().int().nonnegative().optional().nullable(),
    beloppExMoms: z.number().nonnegative(),
    momsBelopp: z.number().nonnegative(),
    beloppInklMoms: z.number().nonnegative(),
    momsSats: z.number().min(0).max(1),
    kvittoOnskas: z.boolean().default(false),
  })
  .refine(
    (data) =>
      Math.abs(data.beloppExMoms + data.momsBelopp - data.beloppInklMoms) <= 1,
    { message: "Beloppen stämmer inte: ex moms + moms måste bli totalbeloppet" }
  );

// POST - Registrera kontant betalning
export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return unauthorizedResponse();

    const body = await request.json();
    const parsed = cashPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ogiltiga betalningsuppgifter", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      datum,
      beskrivning,
      koparensNamn,
      antalBurkar,
      beloppExMoms,
      momsBelopp,
      beloppInklMoms,
      momsSats,
      kvittoOnskas,
    } = parsed.data;

    let kvittoNummer: string | null = null;

    if (kvittoOnskas) {
      // Generera kvittonummer med årtal: KV26001, KV26002 etc.
      const prefix = yearPrefix("KV");

      // Hitta högsta befintliga kvittonumret för detta år och användare
      const existing = await prisma.accounting.findMany({
        where: {
          userId,
          kvittoNummer: { startsWith: prefix },
        },
        select: { kvittoNummer: true },
      });

      kvittoNummer = formatSequenceNumber(
        prefix,
        nextSequenceNumber(
          existing.flatMap((r) => (r.kvittoNummer ? [r.kvittoNummer] : [])),
          prefix
        )
      );
    }

    // Skapa kassabokspost
    const accounting = await prisma.accounting.create({
      data: {
        userId,
        datum,
        handelseTyp: "Försäljning",
        beskrivning: kvittoNummer
          ? `${kvittoNummer} - ${beskrivning}`
          : beskrivning,
        beloppExMoms,
        momsSats,
        momsBelopp,
        beloppInklMoms,
        mottagare: koparensNamn || null,
        antalBurkar: antalBurkar || null,
        kvittoNummer,
      },
    });

    return NextResponse.json(
      {
        success: true,
        kvittoNummer,
        accountingId: accounting.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating cash payment:", error);
    return NextResponse.json(
      { error: "Kunde inte registrera betalning" },
      { status: 500 }
    );
  }
}
