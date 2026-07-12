/**
 * SIE 4-export av kassaboken för import i bokföringsprogram
 * (Fortnox, Visma, Bokio m.fl.). Formatet enligt SIE-gruppens
 * specifikation: PC8-teckenkodning (CP437), CRLF-radslut.
 *
 * Kontoplan (BAS):
 *  1930 Företagskonto · 4010 Inköp varor
 *  3001/3002/3003/3004 Försäljning 25/12/6/0 %
 *  2611/2621/2631 Utgående moms 25/12/6 % · 2641 Ingående moms
 */

export interface SieTransaktion {
  datum: Date | string;
  handelseTyp: string; // Försäljning | Inköp
  beskrivning: string;
  beloppExMoms: number;
  momsSats: number;
  momsBelopp: number;
  beloppInklMoms: number;
}

export interface SieForetag {
  namn?: string | null;
  orgnr?: string | null;
}

const KONTON: Record<string, string> = {
  "1930": "Företagskonto",
  "2611": "Utgående moms 25 %",
  "2621": "Utgående moms 12 %",
  "2631": "Utgående moms 6 %",
  "2641": "Ingående moms",
  "3001": "Försäljning 25 % moms",
  "3002": "Försäljning 12 % moms",
  "3003": "Försäljning 6 % moms",
  "3004": "Försäljning momsfri",
  "4010": "Inköp varor och material",
};

function forsaljningskonto(momsSats: number): string {
  if (momsSats === 0.25) return "3001";
  if (momsSats === 0.12) return "3002";
  if (momsSats === 0.06) return "3003";
  if (momsSats === 0) return "3004";
  return "3001"; // okänd sats — justeras i bokföringsprogrammet
}

function utgaendeMomskonto(momsSats: number): string | null {
  if (momsSats === 0) return null;
  if (momsSats === 0.12) return "2621";
  if (momsSats === 0.06) return "2631";
  return "2611";
}

function sieDatum(datum: Date | string): string {
  const d = new Date(datum);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function sieBelopp(belopp: number): string {
  return belopp.toFixed(2);
}

/** SIE-strängar citeras och får inte innehålla citattecken. */
function sieText(text: string): string {
  return `"${text.replace(/"/g, "'")}"`;
}

/** Genererar SIE 4-innehåll (som sträng — koda med tillPc8Bytes före nedladdning). */
export function genereraSie4({
  ar,
  foretag,
  transaktioner,
}: {
  ar: number;
  foretag: SieForetag;
  transaktioner: SieTransaktion[];
}): string {
  const rader: string[] = [
    "#FLAGGA 0",
    '#PROGRAM "BiManager" 1.0',
    "#FORMAT PC8",
    `#GEN ${sieDatum(new Date())}`,
    "#SIETYP 4",
    `#FNAMN ${sieText(foretag.namn || "BiManager")}`,
  ];
  if (foretag.orgnr) rader.push(`#ORGNR ${foretag.orgnr}`);
  rader.push(`#RAR 0 ${ar}0101 ${ar}1231`);

  // Ta med alla konton som används
  const anvandaKonton = new Set<string>(["1930"]);
  for (const t of transaktioner) {
    if (t.handelseTyp === "Försäljning") {
      anvandaKonton.add(forsaljningskonto(t.momsSats));
      const moms = utgaendeMomskonto(t.momsSats);
      if (moms && t.momsBelopp !== 0) anvandaKonton.add(moms);
    } else {
      anvandaKonton.add("4010");
      if (t.momsBelopp !== 0) anvandaKonton.add("2641");
    }
  }
  for (const konto of [...anvandaKonton].sort()) {
    rader.push(`#KONTO ${konto} ${sieText(KONTON[konto])}`);
  }

  // Verifikationer i datumordning
  const sorterade = [...transaktioner].sort(
    (a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime()
  );

  sorterade.forEach((t, i) => {
    rader.push(
      `#VER "A" "${i + 1}" ${sieDatum(t.datum)} ${sieText(t.beskrivning)}`
    );
    rader.push("{");
    if (t.handelseTyp === "Försäljning") {
      rader.push(`#TRANS 1930 {} ${sieBelopp(t.beloppInklMoms)}`);
      rader.push(
        `#TRANS ${forsaljningskonto(t.momsSats)} {} ${sieBelopp(-t.beloppExMoms)}`
      );
      const moms = utgaendeMomskonto(t.momsSats);
      if (moms && t.momsBelopp !== 0) {
        rader.push(`#TRANS ${moms} {} ${sieBelopp(-t.momsBelopp)}`);
      }
    } else {
      rader.push(`#TRANS 1930 {} ${sieBelopp(-t.beloppInklMoms)}`);
      rader.push(`#TRANS 4010 {} ${sieBelopp(t.beloppExMoms)}`);
      if (t.momsBelopp !== 0) {
        rader.push(`#TRANS 2641 {} ${sieBelopp(t.momsBelopp)}`);
      }
    }
    rader.push("}");
  });

  return rader.join("\r\n") + "\r\n";
}

// CP437-koder för de svenska tecken SIE-filer behöver
const PC8_TECKEN: Record<string, number> = {
  å: 0x86,
  ä: 0x84,
  ö: 0x94,
  Å: 0x8f,
  Ä: 0x8e,
  Ö: 0x99,
  é: 0x82,
  É: 0x90,
  ü: 0x81,
  Ü: 0x9a,
};

/** Kodar SIE-innehåll till PC8/CP437-bytes för nedladdning. */
export function tillPc8Bytes(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    const tecken = text[i];
    const kod = text.charCodeAt(i);
    if (PC8_TECKEN[tecken] !== undefined) {
      bytes[i] = PC8_TECKEN[tecken];
    } else if (kod < 128) {
      bytes[i] = kod;
    } else {
      bytes[i] = 0x3f; // "?" för tecken utanför PC8-mappningen
    }
  }
  return bytes;
}
