"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ClipboardCheck,
  Crown,
  History,
  SkipForward,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";
import {
  STRENGTH_LEVELS,
  TEMPERAMENT_LEVELS,
  type StrengthLevel,
  type TemperamentLevel,
} from "@/types";
import { arNatverksfel, laggIKo } from "@/lib/offlineQueue";

interface Colony {
  id: string;
  namn: string;
  platsNummer: number | null;
  drottningRas: string | null;
  drottningAr: number | null;
  status: string;
}

interface Apiary {
  id: string;
  namn: string;
  colonies: Colony[];
}

interface Inspektion {
  styrka: StrengthLevel | "";
  temperament: TemperamentLevel | "";
  drottningSynlig: boolean;
  drottningceller: boolean;
  anteckningar: string;
}

interface ForraInspektionen {
  datum: string;
  data: Partial<Inspektion>;
}

const TOM_INSPEKTION: Inspektion = {
  styrka: "",
  temperament: "",
  drottningSynlig: false,
  drottningceller: false,
  anteckningar: "",
};

/** Stora segmenterade knappar — gjorda för handskar och solljus. */
function SegmentVal<T extends string>({
  label,
  alternativ,
  valt,
  onVal,
}: {
  label: string;
  alternativ: readonly T[];
  valt: T | "";
  onVal: (v: T) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-[var(--foreground)] mb-2">
        {label}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {alternativ.map((alt) => (
          <button
            key={alt}
            type="button"
            onClick={() => onVal(alt)}
            className={`min-h-12 rounded-xl px-2 text-sm font-medium transition-colors ${
              valt === alt
                ? "bg-amber-500 text-white"
                : "bg-[var(--card-bg)] text-[var(--foreground)] ring-1 ring-[var(--card-border)] hover:bg-[var(--accent)]/10"
            }`}
          >
            {alt}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleKnapp({
  label,
  pa,
  onToggle,
}: {
  label: string;
  pa: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={pa}
      className={`flex min-h-12 items-center justify-between rounded-xl px-4 text-sm font-medium transition-colors ${
        pa
          ? "bg-amber-500 text-white"
          : "bg-[var(--card-bg)] text-[var(--foreground)] ring-1 ring-[var(--card-border)] hover:bg-[var(--accent)]/10"
      }`}
    >
      {label}
      <span className="text-xs">{pa ? "Ja" : "Nej"}</span>
    </button>
  );
}

export default function BesokPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [apiary, setApiary] = useState<Apiary | null>(null);
  const [laddar, setLaddar] = useState(true);
  const [fel, setFel] = useState<string | null>(null);

  const [index, setIndex] = useState(0);
  const [datum] = useState(new Date().toISOString().split("T")[0]);
  const [inspektion, setInspektion] = useState<Inspektion>(TOM_INSPEKTION);
  const [forra, setForra] = useState<ForraInspektionen | null>(null);
  const [sparar, setSparar] = useState(false);
  const [antalSparade, setAntalSparade] = useState(0);
  const [antalKoade, setAntalKoade] = useState(0);
  const [klar, setKlar] = useState(false);

  useEffect(() => {
    let avbruten = false;
    fetch(`/api/apiaries/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Kunde inte hämta bigården");
        return res.json();
      })
      .then((data: Apiary) => {
        if (!avbruten) setApiary(data);
      })
      .catch((e) => {
        if (!avbruten) setFel(e instanceof Error ? e.message : "Något gick fel");
      })
      .finally(() => {
        if (!avbruten) setLaddar(false);
      });
    return () => {
      avbruten = true;
    };
  }, [id]);

  const aktivaSamhallen =
    apiary?.colonies.filter((c) => c.status === "Aktiv") ?? [];
  const aktuellt = aktivaSamhallen[index];

  // Hämta senaste inspektionen för det aktuella samhället (visas som facit
  // och kan kopieras in i formuläret).
  useEffect(() => {
    if (!aktuellt) return;
    let avbruten = false;
    setForra(null);
    fetch(
      `/api/events?samhalleId=${aktuellt.id}&handelseTyp=Inspektion&limit=1`
    )
      .then((res) => (res.ok ? res.json() : []))
      .then((events: { datum: string; data: string | null }[]) => {
        if (avbruten || !events[0]?.data) return;
        try {
          setForra({
            datum: events[0].datum,
            data: JSON.parse(events[0].data),
          });
        } catch {
          // ogiltig JSON i äldre händelse — ignorera
        }
      })
      .catch(() => {
        // förra inspektionen är bara en bekvämlighet — tyst vid fel
      });
    return () => {
      avbruten = true;
    };
  }, [aktuellt]);

  const gaTill = useCallback(
    (nyttIndex: number) => {
      setInspektion(TOM_INSPEKTION);
      setFel(null);
      if (nyttIndex >= aktivaSamhallen.length) {
        setKlar(true);
        router.refresh();
      } else {
        setIndex(nyttIndex);
      }
    },
    [aktivaSamhallen.length, router]
  );

  const sparaOchNasta = async () => {
    if (!aktuellt) return;
    setSparar(true);
    setFel(null);

    const data: Record<string, unknown> = {
      drottningSynlig: inspektion.drottningSynlig,
      drottningceller: inspektion.drottningceller,
    };
    if (inspektion.styrka) data.styrka = inspektion.styrka;
    if (inspektion.temperament) data.temperament = inspektion.temperament;
    if (inspektion.anteckningar.trim())
      data.anteckningar = inspektion.anteckningar.trim();

    const payload = {
      samhalleId: aktuellt.id,
      handelseTyp: "Inspektion",
      datum,
      data,
    };

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const svar = await res.json().catch(() => null);
        throw new Error(svar?.error || "Kunde inte spara inspektionen");
      }
      setAntalSparade((n) => n + 1);
      gaTill(index + 1);
    } catch (e) {
      if (arNatverksfel(e)) {
        // Ingen täckning vid bigården — köa lokalt och fortsätt besöket
        laggIKo(payload, aktuellt.namn);
        setAntalKoade((n) => n + 1);
        setAntalSparade((n) => n + 1);
        gaTill(index + 1);
      } else {
        setFel(e instanceof Error ? e.message : "Något gick fel");
      }
    } finally {
      setSparar(false);
    }
  };

  const kopieraForra = () => {
    if (!forra) return;
    setInspektion({
      styrka: (forra.data.styrka as StrengthLevel) || "",
      temperament: (forra.data.temperament as TemperamentLevel) || "",
      drottningSynlig: Boolean(forra.data.drottningSynlig),
      drottningceller: Boolean(forra.data.drottningceller),
      anteckningar: "",
    });
  };

  if (laddar) {
    return (
      <div className="text-center py-16 text-[var(--muted)]">Laddar besök...</div>
    );
  }

  if (!apiary) {
    return (
      <div className="text-center py-16">
        <p className="text-[var(--muted)] mb-4">{fel || "Bigården hittades inte"}</p>
        <Link href="/bigardar" className="text-[var(--accent-hover)] underline">
          Tillbaka till bigårdar
        </Link>
      </div>
    );
  }

  if (aktivaSamhallen.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-[var(--muted)] mb-4">
          Inga aktiva samhällen i {apiary.namn}.
        </p>
        <Link
          href={`/bigardar/${apiary.id}`}
          className="text-[var(--accent-hover)] underline"
        >
          Tillbaka till bigården
        </Link>
      </div>
    );
  }

  if (klar) {
    return (
      <div className="mx-auto max-w-lg text-center py-16 space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Besök klart!
        </h1>
        <p className="text-[var(--muted)]">
          {antalSparade} av {aktivaSamhallen.length} samhällen inspekterade i{" "}
          {apiary.namn}.
          {antalKoade > 0 &&
            ` ${antalKoade} sparades offline och synkas när du har täckning igen.`}
        </p>
        <Link
          href={`/bigardar/${apiary.id}`}
          className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-amber-500 px-6 text-white font-medium hover:bg-amber-600 transition-colors"
        >
          Tillbaka till bigården
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      {/* Toppen: tillbaka + progress */}
      <div className="flex items-center gap-3">
        <Link
          href={`/bigardar/${apiary.id}`}
          aria-label="Avsluta besöket"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--card-bg)] ring-1 ring-[var(--card-border)] text-[var(--accent-hover)] hover:bg-[var(--accent)]/10 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <p className="text-sm text-[var(--muted)]">
            Besök i {apiary.namn} ·{" "}
            {new Date(datum).toLocaleDateString("sv-SE")}
          </p>
          <div className="mt-1 h-2 rounded-full bg-[var(--accent)]/15">
            <div
              className="h-2 rounded-full bg-amber-500 transition-all"
              style={{
                width: `${((index + 1) / aktivaSamhallen.length) * 100}%`,
              }}
            />
          </div>
        </div>
        <span className="text-sm font-medium text-[var(--foreground)]">
          {index + 1}/{aktivaSamhallen.length}
        </span>
      </div>

      {/* Samhälleskort */}
      <div className="rounded-2xl bg-[var(--card-bg)] p-5 shadow-sm ring-1 ring-[var(--card-border)] space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white text-lg font-bold">
            {aktuellt.platsNummer || "?"}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-[var(--foreground)] truncate">
              {aktuellt.namn}
            </h1>
            {aktuellt.drottningRas && (
              <p className="flex items-center gap-1 text-sm text-[var(--muted)]">
                <Crown className="h-3.5 w-3.5" />
                {aktuellt.drottningRas}
                {aktuellt.drottningAr && ` (${aktuellt.drottningAr})`}
              </p>
            )}
          </div>
        </div>

        {forra && (
          <button
            type="button"
            onClick={kopieraForra}
            className="flex w-full min-h-12 items-center gap-2 rounded-xl bg-[var(--accent)]/10 px-4 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--accent)]/20 transition-colors"
          >
            <History className="h-4 w-4 shrink-0 text-[var(--accent-hover)]" />
            <span className="min-w-0 truncate">
              Förra ({new Date(forra.datum).toLocaleDateString("sv-SE")}):{" "}
              {[forra.data.styrka, forra.data.temperament]
                .filter(Boolean)
                .join(", ") || "utan detaljer"}
              {" — tryck för att kopiera"}
            </span>
          </button>
        )}

        <SegmentVal
          label="Styrka"
          alternativ={STRENGTH_LEVELS}
          valt={inspektion.styrka}
          onVal={(v) => setInspektion((i) => ({ ...i, styrka: v }))}
        />

        <SegmentVal
          label="Temperament"
          alternativ={TEMPERAMENT_LEVELS}
          valt={inspektion.temperament}
          onVal={(v) => setInspektion((i) => ({ ...i, temperament: v }))}
        />

        <div className="grid grid-cols-2 gap-2">
          <ToggleKnapp
            label="Drottning sedd"
            pa={inspektion.drottningSynlig}
            onToggle={() =>
              setInspektion((i) => ({
                ...i,
                drottningSynlig: !i.drottningSynlig,
              }))
            }
          />
          <ToggleKnapp
            label="Drottningceller"
            pa={inspektion.drottningceller}
            onToggle={() =>
              setInspektion((i) => ({
                ...i,
                drottningceller: !i.drottningceller,
              }))
            }
          />
        </div>

        <Textarea
          label="Anteckningar"
          rows={2}
          value={inspektion.anteckningar}
          onChange={(e) =>
            setInspektion((i) => ({ ...i, anteckningar: e.target.value }))
          }
          placeholder="Valfritt..."
        />

        {fel && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm dark:bg-red-950 dark:text-red-300">
            {fel}
          </div>
        )}
      </div>

      {/* Navigering */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => index > 0 && gaTill(index - 1)}
          disabled={index === 0 || sparar}
          aria-label="Föregående samhälle"
          className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--card-bg)] ring-1 ring-[var(--card-border)] text-[var(--foreground)] disabled:opacity-40 hover:bg-[var(--accent)]/10 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Button
          onClick={sparaOchNasta}
          loading={sparar}
          className="flex-1 !min-h-14 !rounded-xl !text-base"
        >
          <ClipboardCheck className="h-5 w-5 mr-2" />
          Spara & nästa
        </Button>
        <button
          type="button"
          onClick={() => gaTill(index + 1)}
          disabled={sparar}
          aria-label="Hoppa över detta samhälle"
          title="Hoppa över"
          className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--card-bg)] ring-1 ring-[var(--card-border)] text-[var(--muted)] hover:bg-[var(--accent)]/10 transition-colors"
        >
          <SkipForward className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
