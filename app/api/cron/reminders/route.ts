import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { skickaMejl } from "@/lib/email";
import {
  byggMejltext,
  skaPaminnas,
  type UtskicksPaminnelse,
} from "@/lib/paminnelser";

/**
 * Daglig cron (se vercel.json) som mejlar varje användare en sammanställning
 * av aktuella påminnelser. Skyddas av CRON_SECRET — Vercel Cron skickar den
 * automatiskt som Bearer-token när miljövariabeln finns.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET är inte konfigurerad" },
      { status: 503 }
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Ogiltig cron-token" }, { status: 401 });
  }

  try {
    const idag = new Date();
    const paminnelser = await prisma.reminder.findMany({
      where: { utford: false },
      include: {
        user: { select: { email: true, name: true } },
        samhalle: { select: { namn: true } },
        bigard: { select: { namn: true } },
      },
      orderBy: { datum: "asc" },
    });

    const aktuella = paminnelser.filter((p) => skaPaminnas(p, idag));

    // Ett mejl per användare med alla dennes aktuella påminnelser
    const perAnvandare = new Map<string, typeof aktuella>();
    for (const p of aktuella) {
      if (!p.user.email) continue;
      const lista = perAnvandare.get(p.user.email) ?? [];
      lista.push(p);
      perAnvandare.set(p.user.email, lista);
    }

    let skickade = 0;
    for (const [epost, lista] of perAnvandare) {
      const utskick: UtskicksPaminnelse[] = lista.map((p) => ({
        titel: p.titel,
        datum: p.datum,
        paminnaFor: p.paminnaFor,
        utford: p.utford,
        kategori: p.kategori,
        samhalleNamn: p.samhalle?.namn,
        bigardNamn: p.bigard?.namn,
      }));

      try {
        const skickat = await skickaMejl({
          till: epost,
          amne: `BiManager: ${lista.length} påminnelse${lista.length === 1 ? "" : "r"} att hålla koll på`,
          text: byggMejltext(lista[0].user.name, utskick, idag),
        });
        if (skickat) skickade++;
      } catch (error) {
        // Ett misslyckat mejl ska inte stoppa övriga användares utskick
        console.error(`Kunde inte mejla ${epost}:`, error);
      }
    }

    return NextResponse.json({
      aktuellaPaminnelser: aktuella.length,
      anvandareMedPaminnelser: perAnvandare.size,
      skickadeMejl: skickade,
    });
  } catch (error) {
    console.error("Cron-utskick av påminnelser misslyckades:", error);
    return NextResponse.json(
      { error: "Kunde inte skicka påminnelser" },
      { status: 500 }
    );
  }
}
