"use client";

import Link from "next/link";
import { Banknote, FileText, ArrowRight } from "lucide-react";

export default function BetalningPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Betalning</h1>
        <p className="text-[var(--muted)] mt-1">
          Välj betalningssätt för din försäljning
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Kontant betalning */}
        <Link
          href="/betalning/kontant"
          className="group flex flex-col p-6 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm hover:shadow-lg hover:border-[var(--accent)] transition-all"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <Banknote className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)]">
                Kontant betalning
              </h2>
            </div>
            <ArrowRight className="h-5 w-5 text-[var(--muted)] group-hover:text-[var(--accent)] group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-sm text-[var(--muted)]">
            Snabb registrering av kontantförsäljning. Välj om kunden önskar kvitto.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-[var(--foreground)]">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Enkel registrering av belopp och beskrivning
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Valfritt kvitto som PDF
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Automatisk kassaboksregistrering
            </li>
          </ul>
        </Link>

        {/* Faktura */}
        <Link
          href="/betalning/faktura"
          className="group flex flex-col p-6 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm hover:shadow-lg hover:border-[var(--accent)] transition-all"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)]">
                Faktura
              </h2>
            </div>
            <ArrowRight className="h-5 w-5 text-[var(--muted)] group-hover:text-[var(--accent)] group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-sm text-[var(--muted)]">
            Skapa professionella fakturor enligt svensk standard.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-[var(--foreground)]">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Välj kund och lägg till rader
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Automatisk momsberäkning
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              PDF enligt svensk faktureringsstandard
            </li>
          </ul>
        </Link>
      </div>

      {/* Senaste transaktioner */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          Snabblänkar
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/betalning/faktura"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--foreground)] hover:bg-[var(--accent)]/10 transition-colors"
          >
            Visa alla fakturor
          </Link>
          <Link
            href="/kassabok"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--foreground)] hover:bg-[var(--accent)]/10 transition-colors"
          >
            Öppna kassaboken
          </Link>
        </div>
      </div>
    </div>
  );
}
