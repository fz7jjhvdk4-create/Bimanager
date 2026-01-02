"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, ArrowLeft, Plus, Trash2, Mail } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

interface Customer {
  id: string;
  namn: string;
  epost: string | null;
}

interface InvoiceLine {
  beskrivning: string;
  antal: number;
  enhet: string;
  prisPerEnhet: number;
  momsSats: number;
}

export default function NyFakturaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [formData, setFormData] = useState({
    kundId: "",
    fakturaDatum: new Date().toISOString().split("T")[0],
    forfallDatum: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
  });

  const [rader, setRader] = useState<InvoiceLine[]>([
    {
      beskrivning: "Honung 500g",
      antal: 1,
      enhet: "st",
      prisPerEnhet: 89,
      momsSats: 0.12,
    },
  ]);

  const [betalningsTyp, setBetalningsTyp] = useState<"faktura" | "kvitto">("faktura");
  const [skickaKvittoMail, setSkickaKvittoMail] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLineChange = (
    index: number,
    field: keyof InvoiceLine,
    value: string | number
  ) => {
    setRader((prev) =>
      prev.map((rad, i) =>
        i === index
          ? {
              ...rad,
              [field]:
                field === "beskrivning" || field === "enhet"
                  ? value
                  : Number(value),
            }
          : rad
      )
    );
  };

  const addLine = () => {
    setRader((prev) => [
      ...prev,
      {
        beskrivning: "",
        antal: 1,
        enhet: "st",
        prisPerEnhet: 0,
        momsSats: 0.12,
      },
    ]);
  };

  const removeLine = (index: number) => {
    if (rader.length > 1) {
      setRader((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.kundId) {
      setError("Välj en kund");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          rader,
          typ: betalningsTyp,
          skickaKvittoMail: betalningsTyp === "kvitto" && skickaKvittoMail,
        }),
      });

      if (!res.ok) {
        throw new Error("Kunde inte skapa faktura");
      }

      router.push("/betalning/faktura");
    } catch {
      setError("Ett fel uppstod. Försök igen.");
    } finally {
      setLoading(false);
    }
  };

  // Beräkna totaler
  const totaltExMoms = rader.reduce(
    (sum, rad) => sum + rad.antal * rad.prisPerEnhet,
    0
  );
  const totaltMoms = rader.reduce(
    (sum, rad) => sum + rad.antal * rad.prisPerEnhet * rad.momsSats,
    0
  );
  const totaltInklMoms = totaltExMoms + totaltMoms;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/betalning/faktura"
          className="p-2 rounded-lg hover:bg-[var(--card-bg)] transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-[var(--foreground)]" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Ny faktura</h1>
            <p className="text-[var(--muted)]">Skapa en ny faktura</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Customer & Dates */}
        <div className="bg-[var(--card-bg)] rounded-xl p-6 shadow-sm border border-[var(--card-border)] space-y-4">
          <h2 className="font-semibold text-[var(--foreground)]">Kundinformation</h2>

          <Select
            label="Kund"
            name="kundId"
            value={formData.kundId}
            onChange={handleChange}
            options={[
              { value: "", label: "Välj kund..." },
              ...customers.map((c) => ({ value: c.id, label: c.namn })),
            ]}
          />

          {customers.length === 0 && (
            <p className="text-sm text-[var(--muted)]">
              Inga kunder registrerade.{" "}
              <Link href="/kunder/ny" className="text-[var(--accent)] underline">
                Lägg till en kund först
              </Link>
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fakturadatum"
              type="date"
              name="fakturaDatum"
              value={formData.fakturaDatum}
              onChange={handleChange}
              required
            />
            <Input
              label="Förfallodatum"
              type="date"
              name="forfallDatum"
              value={formData.forfallDatum}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Invoice Lines */}
        <div className="bg-[var(--card-bg)] rounded-xl p-6 shadow-sm border border-[var(--card-border)] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[var(--foreground)]">Fakturarader</h2>
            <Button type="button" variant="secondary" onClick={addLine}>
              <Plus className="h-4 w-4 mr-1" />
              Lägg till rad
            </Button>
          </div>

          <div className="space-y-3">
            {rader.map((rad, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-2 items-end bg-[var(--input-bg)] p-3 rounded-lg"
              >
                <div className="col-span-12 md:col-span-4">
                  <label className="block text-xs font-medium text-[var(--foreground)] opacity-70 mb-1">
                    Beskrivning
                  </label>
                  <input
                    type="text"
                    value={rad.beskrivning}
                    onChange={(e) =>
                      handleLineChange(index, "beskrivning", e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[var(--input-border)] bg-[var(--card-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm"
                    placeholder="Produkt/tjänst"
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="block text-xs font-medium text-[var(--foreground)] opacity-70 mb-1">
                    Antal
                  </label>
                  <input
                    type="number"
                    value={rad.antal}
                    onChange={(e) =>
                      handleLineChange(index, "antal", e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[var(--input-border)] bg-[var(--card-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm"
                    min="1"
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="block text-xs font-medium text-[var(--foreground)] opacity-70 mb-1">
                    Pris (ex moms)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={rad.prisPerEnhet}
                    onChange={(e) =>
                      handleLineChange(index, "prisPerEnhet", e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[var(--input-border)] bg-[var(--card-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm"
                    min="0"
                  />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <label className="block text-xs font-medium text-[var(--foreground)] opacity-70 mb-1">
                    Moms
                  </label>
                  <select
                    value={rad.momsSats}
                    onChange={(e) =>
                      handleLineChange(index, "momsSats", e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[var(--input-border)] bg-[var(--card-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm"
                  >
                    <option value="0.12">12%</option>
                    <option value="0.25">25%</option>
                    <option value="0.06">6%</option>
                    <option value="0">0%</option>
                  </select>
                </div>
                <div className="col-span-1 md:col-span-1 text-right">
                  <label className="block text-xs font-medium text-[var(--foreground)] opacity-70 mb-1">
                    Summa
                  </label>
                  <p className="py-2 text-sm font-medium text-[var(--foreground)]">
                    {(rad.antal * rad.prisPerEnhet).toLocaleString("sv-SE")} kr
                  </p>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeLine(index)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                    disabled={rader.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-[var(--card-border)] pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">Summa ex moms:</span>
              <span className="text-[var(--foreground)] font-medium">
                {totaltExMoms.toLocaleString("sv-SE")} kr
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">Moms:</span>
              <span className="text-[var(--foreground)] font-medium">
                {totaltMoms.toLocaleString("sv-SE")} kr
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-[var(--card-border)] pt-2">
              <span className="text-[var(--foreground)]">Att betala:</span>
              <span className="text-[var(--foreground)]">
                {totaltInklMoms.toLocaleString("sv-SE")} kr
              </span>
            </div>
          </div>
        </div>

        {/* Betalning */}
        <div className="bg-[var(--card-bg)] rounded-xl p-6 shadow-sm border border-[var(--card-border)] space-y-4">
          <h2 className="font-semibold text-[var(--foreground)]">Betalningstyp</h2>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="betalningsTyp"
                value="faktura"
                checked={betalningsTyp === "faktura"}
                onChange={() => {
                  setBetalningsTyp("faktura");
                  setSkickaKvittoMail(false);
                }}
                className="w-4 h-4 text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              <span className="text-[var(--foreground)]">Faktura</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="betalningsTyp"
                value="kvitto"
                checked={betalningsTyp === "kvitto"}
                onChange={() => setBetalningsTyp("kvitto")}
                className="w-4 h-4 text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              <span className="text-[var(--foreground)]">Kvitto (kontantköp)</span>
            </label>
          </div>

          {betalningsTyp === "kvitto" && (
            <div className="pt-2 border-t border-[var(--card-border)]">
              {(() => {
                const selectedCustomer = customers.find(c => c.id === formData.kundId);
                const hasEmail = selectedCustomer?.epost;

                return (
                  <label className={`flex items-center gap-2 ${!hasEmail ? 'opacity-50' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      checked={skickaKvittoMail}
                      onChange={(e) => setSkickaKvittoMail(e.target.checked)}
                      disabled={!hasEmail}
                      className="w-4 h-4 text-[var(--accent)] focus:ring-[var(--accent)] rounded"
                    />
                    <Mail className="h-4 w-4 text-[var(--muted)]" />
                    <span className="text-[var(--foreground)]">Skicka kvitto via e-post</span>
                    {!formData.kundId && (
                      <span className="text-xs text-[var(--muted)]">(välj kund först)</span>
                    )}
                    {formData.kundId && !hasEmail && (
                      <span className="text-xs text-[var(--muted)]">(kunden saknar e-post)</span>
                    )}
                    {hasEmail && (
                      <span className="text-xs text-[var(--muted)]">({selectedCustomer?.epost})</span>
                    )}
                  </label>
                );
              })()}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Sparar..." : betalningsTyp === "faktura" ? "Skapa faktura" : "Skapa kvitto"}
          </Button>
          <Link href="/betalning/faktura">
            <Button variant="secondary" type="button">
              Avbryt
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
