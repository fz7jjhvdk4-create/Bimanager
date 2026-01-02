import { NextResponse } from "next/server";
import prisma from "@/lib/db";

interface InvoiceLine {
  beskrivning: string;
  antal: number;
  enhet: string;
  prisPerEnhet: number;
  momsSats: number;
}

interface InvoiceWithCustomer {
  id: string;
  fakturaNummer: string;
  fakturaDatum: Date;
  totaltExMoms: number;
  totaltMoms: number;
  totaltInklMoms: number;
  kund: {
    namn: string;
    epost: string | null;
  };
}

// Funktion för att skicka kvitto via e-post med Mail.app
async function sendReceiptEmail(invoice: InvoiceWithCustomer, rader: InvoiceLine[]) {
  const settings = await prisma.settings.findFirst();
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);

  // Bygg e-postinnehåll
  const raaderText = rader.map(r =>
    `${r.beskrivning}: ${r.antal} ${r.enhet} x ${r.prisPerEnhet} kr = ${(r.antal * r.prisPerEnhet).toFixed(2)} kr`
  ).join("\n");

  const emailBody = `Hej ${invoice.kund.namn}!

Tack för ditt köp! Här är ditt kvitto:

Kvittonummer: ${invoice.fakturaNummer}
Datum: ${new Date(invoice.fakturaDatum).toLocaleDateString("sv-SE")}

${raaderText}

Summa ex moms: ${invoice.totaltExMoms.toFixed(2)} kr
Moms: ${invoice.totaltMoms.toFixed(2)} kr
Totalt: ${invoice.totaltInklMoms.toFixed(2)} kr

Med vänliga hälsningar,
${settings?.foretagsnamn || "BiManager"}
${settings?.epost || ""}
${settings?.telefon ? `Tel: ${settings.telefon}` : ""}`;

  const subject = `Kvitto ${invoice.fakturaNummer} - ${settings?.foretagsnamn || "BiManager"}`;
  const recipient = invoice.kund.epost;

  // Använd AppleScript för att skicka via Mail.app
  const appleScript = `
    tell application "Mail"
      set newMessage to make new outgoing message with properties {subject:"${subject.replace(/"/g, '\\"')}", content:"${emailBody.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"}
      tell newMessage
        make new to recipient at end of to recipients with properties {address:"${recipient}"}
        send
      end tell
    end tell
  `;

  try {
    await execAsync(`osascript -e '${appleScript.replace(/'/g, "'\\''")}'`);
    console.log(`Kvitto ${invoice.fakturaNummer} skickat till ${recipient}`);
    return true;
  } catch (error) {
    console.error("Kunde inte skicka e-post via Mail.app:", error);
    throw error;
  }
}

// GET - Hämta alla fakturor
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");

    const where: Record<string, unknown> = {};

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
    const body = await request.json();

    const {
      kundId,
      fakturaDatum,
      forfallDatum,
      rader,
      typ = "faktura",
      skickaKvittoMail = false,
      status = "Utkast",
    } = body;

    // Beräkna totaler
    let totaltExMoms = 0;
    let totaltMoms = 0;

    const parsedRader = typeof rader === "string" ? JSON.parse(rader) : rader;
    for (const rad of parsedRader) {
      const radBelopp = rad.antal * rad.prisPerEnhet;
      const radMoms = radBelopp * (rad.momsSats || 0.12);
      totaltExMoms += radBelopp;
      totaltMoms += radMoms;
    }

    const totaltInklMoms = totaltExMoms + totaltMoms;

    // Hämta nästa fakturanummer
    const settings = await prisma.settings.findFirst();
    const nastaFakturaNummer = settings?.nastaFakturaNummer || 1;

    // Använd prefix K för kvitto, F för faktura
    const prefix = typ === "kvitto" ? "K" : "F";
    const fakturaNummer = `${prefix}${nastaFakturaNummer.toString().padStart(4, "0")}`;

    // Kvitton sätts direkt som "Betald" (kontantköp)
    const invoiceStatus = typ === "kvitto" ? "Betald" : status;

    // Skapa fakturan/kvittot
    const invoice = await prisma.invoice.create({
      data: {
        fakturaNummer,
        kundId,
        fakturaDatum: new Date(fakturaDatum),
        forfallDatum: new Date(forfallDatum),
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

    // Uppdatera nästa fakturanummer
    if (settings) {
      await prisma.settings.update({
        where: { id: settings.id },
        data: { nastaFakturaNummer: nastaFakturaNummer + 1 },
      });
    } else {
      await prisma.settings.create({
        data: {
          id: "default",
          nastaFakturaNummer: 2,
        },
      });
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
          datum: new Date(fakturaDatum),
          handelseTyp: "Försäljning",
          beskrivning: `Kvitto ${fakturaNummer} - ${invoice.kund.namn}`,
          beloppExMoms: totaltExMoms,
          momsSats: 0.12,
          momsBelopp: totaltMoms,
          beloppInklMoms: totaltInklMoms,
          mottagare: invoice.kund.namn,
          antalBurkar: totalAntalBurkar > 0 ? totalAntalBurkar : null,
          fakturaNummer,
          fakturaId: invoice.id,
        },
      });
    }

    // Om kvitto ska skickas via e-post
    if (typ === "kvitto" && skickaKvittoMail && invoice.kund.epost) {
      // Skicka e-post med kvitto
      try {
        await sendReceiptEmail(invoice, parsedRader);
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
