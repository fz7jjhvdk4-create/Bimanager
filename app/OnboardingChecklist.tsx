import Link from "next/link";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import DemoDataButton from "./DemoDataButton";

interface OnboardingChecklistProps {
  apiaryCount: number;
  colonyCount: number;
  eventCount: number;
}

interface Steg {
  titel: string;
  beskrivning: string;
  href: string;
  klar: boolean;
}

/** Kom igång-guide som visas tills alla tre grundstegen är avklarade. */
export default function OnboardingChecklist({
  apiaryCount,
  colonyCount,
  eventCount,
}: OnboardingChecklistProps) {
  const steg: Steg[] = [
    {
      titel: "Skapa din första bigård",
      beskrivning: "Platsen där dina kupor står — med karta och väder",
      href: "/bigardar/ny",
      klar: apiaryCount > 0,
    },
    {
      titel: "Lägg till ett samhälle",
      beskrivning: "Ett bisamhälle med drottning och kupinfo",
      href: "/samhallen/ny",
      klar: colonyCount > 0,
    },
    {
      titel: "Logga din första händelse",
      beskrivning: "Inspektion, varroamätning, skörd eller utfodring",
      href: "/samhallen",
      klar: eventCount > 0,
    },
  ];

  if (steg.every((s) => s.klar)) return null;

  const nastaSteg = steg.findIndex((s) => !s.klar);

  return (
    <div className="rounded-xl bg-[var(--card-bg)] p-6 shadow-sm ring-1 ring-[var(--accent)]/40">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-5 w-5 text-[var(--accent)]" />
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Kom igång med BiManager
        </h2>
      </div>
      <p className="text-sm text-[var(--muted)] mb-4">
        Tre steg så är du igång — det tar bara någon minut.
      </p>

      <ol className="space-y-2">
        {steg.map((s, i) => (
          <li key={s.titel}>
            <Link
              href={s.href}
              className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${
                s.klar
                  ? "opacity-60"
                  : i === nastaSteg
                    ? "bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 ring-1 ring-[var(--accent)]/40"
                    : "hover:bg-[var(--accent)]/10"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  s.klar
                    ? "bg-emerald-500 text-white"
                    : "bg-[var(--accent)]/20 text-[var(--foreground)]"
                }`}
              >
                {s.klar ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block font-medium text-[var(--foreground)] ${s.klar ? "line-through" : ""}`}
                >
                  {s.titel}
                </span>
                <span className="block text-sm text-[var(--muted)]">
                  {s.beskrivning}
                </span>
              </span>
              {!s.klar && i === nastaSteg && (
                <ArrowRight className="h-5 w-5 shrink-0 text-[var(--accent)]" />
              )}
            </Link>
          </li>
        ))}
      </ol>

      {apiaryCount === 0 && (
        <div className="mt-4 border-t border-[var(--card-border)] pt-4">
          <DemoDataButton />
        </div>
      )}
    </div>
  );
}
