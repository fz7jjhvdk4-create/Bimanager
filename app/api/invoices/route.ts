import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@/app/generated/prisma/client";
import prisma from "@/lib/db";
import { getCurrentUserId, unauthorizedResponse } from "@/lib/auth";
import {
  invoiceLinesSchema,
  calculateInvoiceTotals,
  nextSequenceNumber,
  formatSequenceNumber,
  yearPrefix,
  type InvoiceLine,
} from "@/lib/invoice";

// Totalerna kan vara Prisma.Decimal direkt från databasen eller number
// (konverteras i lib/db.ts) — toFixed finns på båda.
interface InvoiceWithCustomer {
  id: string;
  fakturaNummer: string;
  fakturaDatum: Date;
  totaltExMoms: number | Prisma.Decimal;
  totaltMoms: number | Prisma.Decimal;
  totaltInklMoms: number | Prisma.Decimal;
  kund: {
    namn: string;
    epost: string | null;
  };
}

const createInvoiceSchema = z.object({
  kundId: z.string().min(1),
  fakturaDatum: z.coerce.date(),
  forfallDatum: z.coerce.date(),
  rader: z.union([z.string(), z.array(z.unknown())]),
  typ: z.enum(["faktura", "kvitto"]).default("faktura"),
  skickaKvittoMail: z.boolean().default(false),
  status: z.enum(["Utkast", "Skickad", "Betald"]).default("Utkast"),
});

// Skickar kvitto via e-post med Resend (https://resend.com).
// Kräver RESEND_API_KEY i miljövariablerna; annars hoppas utskicket över.
async function sendReceiptEmail(
  invoice: InvoiceWithCustomer,
  rader: InvoiceLine[],
  userId: string
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "RESEND_API_KEY saknas – kvittomejl skickas inte. Skapa en nyckel på resend.com."
    );
    return false;
  }

  const settings = await prisma.settings.findFirst({ where: { userId } });

  const raderText = rader
    .map(
      (r) =>
        `${r.beskrivning}: ${r.antal} ${r.enhet} x ${r.prisPerEnhet} kr = ${Math.round(
          r.antal * r.prisPerEnhet
        )} kr`
    )
    .join("\n");

  const emailBody = `Hej ${invoice.kund.namn}!

Tack för ditt köp! Här är ditt kvitto:

Kvittonummer: ${invoice.fakturaNummer}
Datum: ${new Date(invoice.fakturaDatum).toLocaleDateString("sv-SE")}

${raderText}

Summa ex moms: ${invoice.totaltExMoms.toFixed(0)} kr
Moms: ${invoice.totaltMoms.toFixed(0)} kr
Totalt: ${invoice.totaltInklMoms.toFixed(0)} kr

Med vänliga hälsningar,
${settings?.foretagsnamn || "BiManager"}
${settings?.epost || ""}
${settings?.telefon ? `Tel: ${settings.telefon}` : ""}`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from:
        process.env.EMAIL_FROM ||
        `${settings?.foretagsnamn || "BiManager"} <onboarding@resend.dev>`,
      to: [invoice.kund.epost],
      reply_to: settings?.epost || undefined,
      subject: `Kvitto ${invoice.fakturaNummer} - ${settings?.foretagsnamn || "BiManager"}`,
      text: emailBody,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend svarade ${response.status}: ${errorText}`);
  }

  console.log(
    `Kvitto ${invoice.fakturaNummer} skickat till ${invoice.kund.epost}`
  );
  return true;
}

// GET - Hämta alla fakturor för current user
export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");

    const where: Record<string, unknown> = { userId };

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.kundId = customerId;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { fakturaDatum: "desc" },
      include: {
        kund: true,
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Kunde inte hämta fakturor" },
      { status: 500 }
    );
  }
}

// POST - Skapa ny faktura eller kvitto
export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return unauthorizedResponse();

    const body = await request.json();
    const parsedBody = createInvoiceSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Ogiltiga fakturauppgifter", details: parsedBody.error.flatten() },
        { status: 400 }
      );
    }

    const {
      kundId,
      fakturaDatum,
      forfallDatum,
      rader,
      typ,
      skickaKvittoMail,
      status,
    } = parsedBody.data;

    // Verify customer belongs to user
    const customer = await prisma.customer.findFirst({
      where: { id: kundId, userId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Kund hittades inte" },
        { status: 404 }
      );
    }

    // Validera produktraderna
    const raderResult = invoiceLinesSchema.safeParse(
      typeof rader === "string" ? JSON.parse(rader) : rader
    );

    if (!raderResult.success) {
      return NextResponse.json(
        { error: "Ogiltiga produktrader", details: raderResult.error.flatten() },
        { status: 400 }
      );
    }

    const parsedRader = raderResult.data;
    const { totaltExMoms, totaltMoms, totaltInklMoms } =
      calculateInvoiceTotals(parsedRader);

    // Generera fakturanummer med årtal: F26001, K26001 etc.
    const prefix = yearPrefix(typ === "kvitto" ? "K" : "F");

    // Kvitton sätts direkt som "Betald" (kontantköp)
    const invoiceStatus = typ === "kvitto" ? "Betald" : status;

    // Läs högsta befintliga nummer och skapa. Unik-constrainten på
    // (userId, fakturaNummer) fångar samtidiga anrop; då försöker vi igen.
    let invoice = null;
    for (let attempt = 0; attempt < 3 && !invoice; attempt++) {
      const existing = await prisma.invoice.findMany({
        where: { userId, fakturaNummer: { startsWith: prefix } },
        select: { fakturaNummer: true },
      });
      const fakturaNummer = formatSequenceNumber(
        prefix,
        nextSequenceNumber(
          existing.map((i) => i.fakturaNummer),
          prefix
        )
      );

      try {
        invoice = await prisma.invoice.create({
          data: {
            userId,
            fakturaNummer,
            kundId,
            fakturaDatum,
            forfallDatum,
            rader: JSON.stringify(parsedRader),
            totaltExMoms,
            totaltMoms,
            totaltInklMoms,
            typ,
            status: invoiceStatus,
          },
          include: {
            kund: true,
          },
        });
      } catch (error) {
        // P2002 = unikt fakturanummer togs av ett samtidigt anrop
        const isUniqueViolation =
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          (error as { code: string }).code === "P2002";
        if (!isUniqueViolation || attempt === 2) throw error;
      }
    }

    if (!invoice) {
      return NextResponse.json(
        { error: "Kunde inte generera fakturanummer" },
        { status: 500 }
      );
    }

    // Kvitton läggs automatiskt in i kassaboken som försäljning
    if (typ === "kvitto") {
      // Beräkna totalt antal burkar från raderna
      let totalAntalBurkar = 0;
      for (const rad of parsedRader) {
        if (rad.enhet === "st") {
          totalAntalBurkar += rad.antal;
        }
      }

      await prisma.accounting.create({
        data: {
          userId,
          datum: fakturaDatum,
          handelseTyp: "Försäljning",
          beskrivning: `Kvitto ${invoice.fakturaNummer} - ${invoice.kund.namn}`,
          beloppExMoms: totaltExMoms,
          momsSats: 0.12,
          momsBelopp: totaltMoms,
          beloppInklMoms: totaltInklMoms,
          mottagare: invoice.kund.namn,
          antalBurkar: totalAntalBurkar > 0 ? totalAntalBurkar : null,
          fakturaNummer: invoice.fakturaNummer,
          fakturaId: invoice.id,
        },
      });
    }

    // Om kvitto ska skickas via e-post
    if (typ === "kvitto" && skickaKvittoMail && invoice.kund.epost) {
      try {
        await sendReceiptEmail(invoice, parsedRader, userId);
      } catch (emailError) {
        console.error("Kunde inte skicka kvitto via e-post:", emailError);
      }
    }

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Kunde inte skapa faktura" },
      { status: 500 }
    );
  }
}
