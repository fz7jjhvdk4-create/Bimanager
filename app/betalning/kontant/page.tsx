"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Banknote, FileDown, Check } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import ReceiptPDF from "@/components/pdf/ReceiptPDF";

interface Settings {
  foretagsnamn?: string | null;
  organisationsnummer?: string | null;
  adress?: string | null;
  postnummer?: string | null;
  ort?: string | null;
  telefon?: string | null;
  epost?: string | null;
}

interface CreatedReceipt {
  kvittoNummer: string;
  datum: string;
  beskrivning: string;
  koparensNamn?: string;
  antalBurkar?: number;
  belopp: number;
  momsSats: number;
  exMoms: number;
  moms: number;
}

export default function KontantBetalningPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdReceipt, setCreatedReceipt] = useState<CreatedReceipt | null>(null);

  const [formData, setFormData] = useState({
    belopp: "",
    beskrivning: "",
    koparensNamn: "",
    antalBurkar: "",
    datum: new Date().toISOString().split("T")[0],
    inkluderarMoms: true,
    momsSats: "0.12",
    kvittoOnskas: false,
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch(console.error);
  }, []);

  const beraknaBelopp = () => {
    const belopp = parseFloat(formData.belopp) || 0;
    const momsSats = parseFloat(formData.momsSats);

    if (formData.inkluderarMoms) {
      // Beloppet inkluderar moms - beräkna baklänges
      const exMoms = belopp / (1 + momsSats);
      const moms = belopp - exMoms;
      return { exMoms, moms, totalt: belopp };
    } else {
      // Beloppet exkluderar moms
      const moms = belopp * momsSats;
      const totalt = belopp + moms;
      return { exMoms: belopp, moms, totalt };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { exMoms, moms, totalt } = beraknaBelopp();

    try {
      const res = await fetch("/api/cash-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datum: formData.datum,
          beskrivning: formData.beskrivning,
          koparensNamn: formData.koparensNamn,
          antalBurkar: formData.antalBurkar ? parseInt(formData.antalBurkar) : null,
          beloppExMoms: exMoms,
          momsBelopp: moms,
          beloppInklMoms: totalt,
          momsSats: parseFloat(formData.momsSats),
          kvittoOnskas: formData.kvittoOnskas,
        }),
      });

      if (!res.ok) throw new Error("Kunde inte registrera betalning");

      const data = await res.json();
      setSuccess(true);

      if (formData.kvittoOnskas) {
        setCreatedReceipt({
          kvittoNummer: data.kvittoNummer,
          datum: formData.datum,
          beskrivning: formData.beskrivning,
          koparensNamn: formData.koparensNamn || undefined,
          antalBurkar: formData.antalBurkar ? parseInt(formData.antalBurkar) : undefined,
          belopp: totalt,
          momsSats: parseFloat(formData.momsSats),
          exMoms,
          moms,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Kunde inte registrera betalning");
    } finally {
      setLoading(false);
    }
  };

  const { exMoms, moms, totalt } = beraknaBelopp();

  if (success) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/betalning"
            className="p-2 rounded-lg hover:bg-[var(--card-bg)] transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-[var(--foreground)]" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              Betalning registrerad
            </h1>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
              Betalning genomförd!
            </h2>
            <p className="text-green-700 dark:text-green-300 mb-4">
              Transaktionen har registrerats i kassaboken.
            </p>

            {createdReceipt && (
              <div className="mt-6 pt-4 border-t border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                  Kvittonummer: {createdReceipt.kvittoNummer}
                </p>
                <PDFDownloadLink
                  document={<ReceiptPDF receipt={createdReceipt} settings={settings} />}
                  fileName={`Kvitto-${createdReceipt.kvittoNummer}.pdf`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {({ loading: pdfLoading }) =>
                    pdfLoading ? (
                      "Genererar PDF..."
                    ) : (
                      <>
                        <FileDown className="h-4 w-4" />
                        Ladda ner kvitto (PDF)
                      </>
                    )
                  }
                </PDFDownloadLink>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setSuccess(false);
                setCreatedReceipt(null);
                setFormData({
                  belopp: "",
                  beskrivning: "",
                  koparensNamn: "",
                  antalBurkar: "",
                  datum: new Date().toISOString().split("T")[0],
                  inkluderarMoms: true,
                  momsSats: "0.12",
                  kvittoOnskas: false,
                });
              }}
              className="flex-1 px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--accent)]/10 transition-colors"
            >
              Ny betalning
            </button>
            <Link
              href="/kassabok"
              className="flex-1 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent)]/90 transition-colors text-center"
            >
              Visa kassabok
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/betalning"
          className="p-2 rounded-lg hover:bg-[var(--card-bg)] transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-[var(--foreground)]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Kontant betalning
          </h1>
          <p className="text-[var(--muted)] mt-1">
            Registrera en kontantförsäljning
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-[var(--card-border)]">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Banknote className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Betalningsuppgifter
            </h2>
          </div>

          {/* Datum */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Datum
            </label>
            <input
              type="date"
              value={formData.datum}
              onChange={(e) => setFormData({ ...formData, datum: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              required
            />
          </div>

          {/* Köparens namn */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Köparens namn
            </label>
            <input
              type="text"
              value={formData.koparensNamn}
              onChange={(e) => setFormData({ ...formData, koparensNamn: e.target.value })}
              placeholder="T.ex. Anna Andersson"
              className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
            />
          </div>

          {/* Beskrivning */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Beskrivning
            </label>
            <input
              type="text"
              value={formData.beskrivning}
              onChange={(e) => setFormData({ ...formData, beskrivning: e.target.value })}
              placeholder="T.ex. Honung 500g"
              className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              required
            />
          </div>

          {/* Antal burkar */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Antal burkar
            </label>
            <input
              type="number"
              min="0"
              value={formData.antalBurkar}
              onChange={(e) => setFormData({ ...formData, antalBurkar: e.target.value })}
              placeholder="0"
              className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
            />
          </div>

          {/* Belopp */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Belopp (kr)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.belopp}
              onChange={(e) => setFormData({ ...formData, belopp: e.target.value })}
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent text-lg"
              required
            />
          </div>

          {/* Moms-alternativ */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="momsTyp"
                checked={formData.inkluderarMoms}
                onChange={() => setFormData({ ...formData, inkluderarMoms: true })}
                className="text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              <span className="text-sm text-[var(--foreground)]">Inkl. moms</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="momsTyp"
                checked={!formData.inkluderarMoms}
                onChange={() => setFormData({ ...formData, inkluderarMoms: false })}
                className="text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              <span className="text-sm text-[var(--foreground)]">Exkl. moms</span>
            </label>
          </div>

          {/* Momssats */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Momssats
            </label>
            <select
              value={formData.momsSats}
              onChange={(e) => setFormData({ ...formData, momsSats: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
            >
              <option value="0.12">12% (livsmedel)</option>
              <option value="0.25">25% (övrig)</option>
              <option value="0.06">6% (kultur/böcker)</option>
              <option value="0">0% (momsfri)</option>
            </select>
          </div>

          {/* Kvitto-toggle */}
          <div className="pt-4 border-t border-[var(--card-border)]">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.kvittoOnskas}
                onChange={(e) => setFormData({ ...formData, kvittoOnskas: e.target.checked })}
                className="w-5 h-5 rounded text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              <div>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  Generera kvitto (PDF)
                </span>
                <p className="text-xs text-[var(--muted)]">
                  Skapar ett nedladdningsbart kvitto efter registrering
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Sammanfattning */}
        {parseFloat(formData.belopp) > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-3">
              Sammanfattning
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-amber-700 dark:text-amber-300">
                <span>Belopp ex moms:</span>
                <span>{exMoms.toFixed(2)} kr</span>
              </div>
              <div className="flex justify-between text-amber-700 dark:text-amber-300">
                <span>Moms ({(parseFloat(formData.momsSats) * 100).toFixed(0)}%):</span>
                <span>{moms.toFixed(2)} kr</span>
              </div>
              <div className="flex justify-between font-semibold text-amber-900 dark:text-amber-100 pt-2 border-t border-amber-200 dark:border-amber-700">
                <span>Totalt:</span>
                <span>{totalt.toFixed(2)} kr</span>
              </div>
            </div>
          </div>
        )}

        {/* Knappar */}
        <div className="flex gap-3">
          <Link
            href="/betalning"
            className="flex-1 px-4 py-3 text-center bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--accent)]/10 transition-colors"
          >
            Avbryt
          </Link>
          <button
            type="submit"
            disabled={loading || !formData.belopp || !formData.beskrivning}
            className="flex-1 px-4 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Registrerar..." : "Registrera betalning"}
          </button>
        </div>
      </form>
    </div>
  );
}
