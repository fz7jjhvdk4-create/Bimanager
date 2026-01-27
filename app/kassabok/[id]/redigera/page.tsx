"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";

export default function RedigeraTransaktionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    datum: "",
    handelseTyp: "Försäljning",
    beskrivning: "",
    beloppExMoms: "",
    momsSats: "0.12",
    mottagare: "",
    antalBurkar: "",
    prisPerEnhet: "",
    fakturaNummer: "",
    notering: "",
  });

  useEffect(() => {
    fetchTransaction();
  }, [id]);

  async function fetchTransaction() {
    try {
      const res = await fetch(`/api/accounting/${id}`);
      if (!res.ok) throw new Error("Kunde inte hämta transaktion");
      const data = await res.json();

      setFormData({
        datum: new Date(data.datum).toISOString().split("T")[0],
        handelseTyp: data.handelseTyp,
        beskrivning: data.beskrivning,
        beloppExMoms: data.beloppExMoms.toString(),
        momsSats: data.momsSats.toString(),
        mottagare: data.mottagare || "",
        antalBurkar: data.antalBurkar?.toString() || "",
        prisPerEnhet: data.prisPerEnhet?.toString() || "",
        fakturaNummer: data.fakturaNummer || "",
        notering: data.notering || "",
      });
    } catch {
      setError("Kunde inte hämta transaktion");
    } finally {
      setFetching(false);
    }
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/accounting/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          beloppExMoms: parseFloat(formData.beloppExMoms),
          momsSats: parseFloat(formData.momsSats),
          antalBurkar: formData.antalBurkar
            ? parseInt(formData.antalBurkar)
            : null,
          prisPerEnhet: formData.prisPerEnhet
            ? parseFloat(formData.prisPerEnhet)
            : null,
        }),
      });

      if (!res.ok) {
        throw new Error("Kunde inte uppdatera transaktion");
      }

      router.push("/kassabok");
    } catch {
      setError("Ett fel uppstod. Försök igen.");
    } finally {
      setLoading(false);
    }
  };

  const beloppExMoms = parseFloat(formData.beloppExMoms) || 0;
  const momsSats = parseFloat(formData.momsSats) || 0;
  const momsBelopp = beloppExMoms * momsSats;
  const beloppInklMoms = beloppExMoms + momsBelopp;

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-[var(--accent)]">Laddar...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/kassabok"
          className="p-2 rounded-lg hover:bg-[var(--input-bg)] transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-[var(--accent)]" />
        </Link>
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-[var(--accent)]" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              Redigera transaktion
            </h1>
            <p className="text-[var(--muted)]">Uppdatera transaktionsinformation</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[var(--card-bg)] rounded-xl p-6 shadow-sm ring-1 ring-[var(--card-border)] space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Datum"
              type="date"
              name="datum"
              value={formData.datum}
              onChange={handleChange}
              required
            />
            <Select
              label="Typ"
              name="handelseTyp"
              value={formData.handelseTyp}
              onChange={handleChange}
              options={[
                { value: "Försäljning", label: "Försäljning (intäkt)" },
                { value: "Inköp", label: "Inköp (utgift)" },
              ]}
            />
          </div>

          <Input
            label="Beskrivning"
            name="beskrivning"
            value={formData.beskrivning}
            onChange={handleChange}
            placeholder="T.ex. Honungsförsäljning, Biodlingsutrustning..."
            required
          />

          <Input
            label="Mottagare/Leverantör"
            name="mottagare"
            value={formData.mottagare}
            onChange={handleChange}
            placeholder="Kundens eller leverantörens namn"
          />

          {formData.handelseTyp === "Försäljning" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Antal burkar"
                type="number"
                name="antalBurkar"
                value={formData.antalBurkar}
                onChange={handleChange}
                placeholder="0"
              />
              <Input
                label="Pris per enhet (ex moms)"
                type="number"
                step="0.01"
                name="prisPerEnhet"
                value={formData.prisPerEnhet}
                onChange={handleChange}
                placeholder="0.00"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Belopp (ex moms)"
              type="number"
              step="0.01"
              name="beloppExMoms"
              value={formData.beloppExMoms}
              onChange={handleChange}
              placeholder="0.00"
              required
            />
            <Select
              label="Momssats"
              name="momsSats"
              value={formData.momsSats}
              onChange={handleChange}
              options={[
                { value: "0.12", label: "12% (livsmedel)" },
                { value: "0.25", label: "25% (standard)" },
                { value: "0.06", label: "6% (reducerad)" },
                { value: "0", label: "0% (momsfritt)" },
              ]}
            />
          </div>

          {/* Summary */}
          <div className="bg-[var(--input-bg)] rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">Belopp ex moms:</span>
              <span className="text-[var(--foreground)] font-medium">
                {beloppExMoms.toLocaleString("sv-SE")} kr
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">
                Moms ({(momsSats * 100).toFixed(0)}%):
              </span>
              <span className="text-[var(--foreground)] font-medium">
                {momsBelopp.toLocaleString("sv-SE")} kr
              </span>
            </div>
            <div className="flex justify-between border-t border-[var(--card-border)] pt-2">
              <span className="text-[var(--muted)] font-medium">Totalt inkl moms:</span>
              <span className="text-[var(--foreground)] font-bold">
                {beloppInklMoms.toLocaleString("sv-SE")} kr
              </span>
            </div>
          </div>

          <Input
            label="Fakturanummer"
            name="fakturaNummer"
            value={formData.fakturaNummer}
            onChange={handleChange}
            placeholder="Valfritt"
          />

          <Textarea
            label="Notering"
            name="notering"
            value={formData.notering}
            onChange={handleChange}
            placeholder="Eventuella anteckningar..."
            rows={3}
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Sparar..." : "Spara ändringar"}
          </Button>
          <Link href="/kassabok">
            <Button variant="secondary" type="button">
              Avbryt
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
