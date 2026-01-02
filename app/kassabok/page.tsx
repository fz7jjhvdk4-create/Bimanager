"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  Trash2,
  Edit,
  Download,
} from "lucide-react";
import Button from "@/components/ui/Button";

interface Transaction {
  id: string;
  datum: string;
  handelseTyp: string;
  beskrivning: string;
  beloppExMoms: number;
  momsSats: number;
  momsBelopp: number;
  beloppInklMoms: number;
  mottagare: string | null;
  antalBurkar: number | null;
  prisPerEnhet: number | null;
  fakturaNummer: string | null;
  notering: string | null;
}

export default function KassabokPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [filterType, setFilterType] = useState<string>("");

  useEffect(() => {
    fetchTransactions();
  }, [selectedYear, filterType]);

  async function fetchTransactions() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedYear) params.set("year", selectedYear);
      if (filterType) params.set("type", filterType);

      const res = await fetch(`/api/accounting?${params}`);
      const data = await res.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Är du säker på att du vill ta bort denna transaktion?"))
      return;

    try {
      await fetch(`/api/accounting/${id}`, { method: "DELETE" });
      fetchTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  }

  // Beräkna sammanfattning
  const summary = transactions.reduce(
    (acc, t) => {
      if (t.handelseTyp === "Försäljning") {
        acc.income += t.beloppInklMoms;
        acc.incomeMoms += t.momsBelopp;
      } else {
        acc.expenses += t.beloppInklMoms;
        acc.expensesMoms += t.momsBelopp;
      }
      return acc;
    },
    { income: 0, expenses: 0, incomeMoms: 0, expensesMoms: 0 }
  );

  const years = Array.from({ length: 5 }, (_, i) =>
    (new Date().getFullYear() - i).toString()
  );

  function exportToCSV() {
    if (transactions.length === 0) {
      alert("Inga transaktioner att exportera");
      return;
    }

    // CSV-headers
    const headers = [
      "Datum",
      "Typ",
      "Beskrivning",
      "Mottagare",
      "Antal",
      "Pris/st",
      "Belopp ex moms",
      "Momssats",
      "Momsbelopp",
      "Belopp inkl moms",
      "Fakturanummer",
      "Notering",
    ];

    // Formatera data
    const rows = transactions.map((t) => [
      new Date(t.datum).toLocaleDateString("sv-SE"),
      t.handelseTyp,
      t.beskrivning,
      t.mottagare || "",
      t.antalBurkar?.toString() || "",
      t.prisPerEnhet?.toFixed(2) || "",
      t.beloppExMoms.toFixed(2),
      (t.momsSats * 100).toFixed(0) + "%",
      t.momsBelopp.toFixed(2),
      t.beloppInklMoms.toFixed(2),
      t.fakturaNummer || "",
      t.notering || "",
    ]);

    // Skapa CSV-innehåll med BOM för korrekt encoding i Excel
    const BOM = "\uFEFF";
    const csvContent =
      BOM +
      [headers, ...rows]
        .map((row) =>
          row
            .map((cell) => {
              // Escapa celler som innehåller komma, citattecken eller radbrytningar
              const cellStr = String(cell);
              if (
                cellStr.includes(",") ||
                cellStr.includes('"') ||
                cellStr.includes("\n")
              ) {
                return `"${cellStr.replace(/"/g, '""')}"`;
              }
              return cellStr;
            })
            .join(";") // Använd semikolon som separator för bättre Excel-kompatibilitet
        )
        .join("\n");

    // Skapa och ladda ner fil
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kassabok_${selectedYear}${filterType ? "_" + filterType : ""}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-amber-500" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Kassabok</h1>
            <p className="text-[var(--muted)]">Hantera inkomster och utgifter</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={exportToCSV}
            disabled={transactions.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportera CSV
          </Button>
          <Link href="/kassabok/ny">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ny transaktion
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[var(--card-bg)] rounded-xl p-4 shadow-sm ring-1 ring-[var(--card-border)]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <span className="text-sm text-[var(--muted)]">Intäkter</span>
          </div>
          <p className="text-2xl font-bold text-green-500">
            {summary.income.toLocaleString("sv-SE")} kr
          </p>
          <p className="text-xs text-[var(--muted)]">
            varav moms: {summary.incomeMoms.toLocaleString("sv-SE")} kr
          </p>
        </div>
        <div className="bg-[var(--card-bg)] rounded-xl p-4 shadow-sm ring-1 ring-[var(--card-border)]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            <span className="text-sm text-[var(--muted)]">Utgifter</span>
          </div>
          <p className="text-2xl font-bold text-red-500">
            {summary.expenses.toLocaleString("sv-SE")} kr
          </p>
          <p className="text-xs text-[var(--muted)]">
            varav moms: {summary.expensesMoms.toLocaleString("sv-SE")} kr
          </p>
        </div>
        <div className="bg-[var(--card-bg)] rounded-xl p-4 shadow-sm ring-1 ring-[var(--card-border)]">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-amber-500" />
            <span className="text-sm text-[var(--muted)]">Resultat</span>
          </div>
          <p
            className={`text-2xl font-bold ${summary.income - summary.expenses >= 0 ? "text-green-500" : "text-red-500"}`}
          >
            {(summary.income - summary.expenses).toLocaleString("sv-SE")} kr
          </p>
          <p className="text-xs text-[var(--muted)]">
            Moms att redovisa:{" "}
            {(summary.incomeMoms - summary.expensesMoms).toLocaleString("sv-SE")}{" "}
            kr
          </p>
        </div>
        <div className="bg-[var(--card-bg)] rounded-xl p-4 shadow-sm ring-1 ring-[var(--card-border)]">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-5 w-5 text-amber-500" />
            <span className="text-sm text-[var(--muted)]">Transaktioner</span>
          </div>
          <p className="text-2xl font-bold text-[var(--foreground)]">
            {transactions.length}
          </p>
          <p className="text-xs text-[var(--muted)]">totalt {selectedYear}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="rounded-lg border border-[var(--input-border)] bg-[var(--card-bg)] px-3 py-2 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-[var(--input-border)] bg-[var(--card-bg)] px-3 py-2 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">Alla typer</option>
          <option value="Försäljning">Försäljning</option>
          <option value="Inköp">Inköp</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className="bg-[var(--card-bg)] rounded-xl shadow-sm ring-1 ring-[var(--card-border)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[var(--muted)]">Laddar...</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-[var(--muted)]">
            <p>Inga transaktioner registrerade.</p>
            <Link
              href="/kassabok/ny"
              className="text-amber-500 underline mt-2 inline-block"
            >
              Lägg till din första transaktion
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--input-bg)] border-b border-[var(--card-border)]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
                    Datum
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
                    Typ
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
                    Beskrivning
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
                    Mottagare
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-[var(--foreground)]">
                    Ex moms
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-[var(--foreground)]">
                    Moms
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-[var(--foreground)]">
                    Inkl moms
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-[var(--foreground)]">
                    Åtgärder
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-[var(--input-bg)]">
                    <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                      {new Date(t.datum).toLocaleDateString("sv-SE")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          t.handelseTyp === "Försäljning"
                            ? "bg-green-500/20 text-green-500"
                            : "bg-red-500/20 text-red-500"
                        }`}
                      >
                        {t.handelseTyp === "Försäljning" ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {t.handelseTyp}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                      {t.beskrivning}
                      {t.antalBurkar && (
                        <span className="text-[var(--muted)] ml-1">
                          ({t.antalBurkar} st)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--muted)]">
                      {t.mottagare || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--foreground)] text-right">
                      {t.beloppExMoms.toLocaleString("sv-SE")} kr
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--muted)] text-right">
                      {t.momsBelopp.toLocaleString("sv-SE")} kr
                    </td>
                    <td
                      className={`px-4 py-3 text-sm font-medium text-right ${
                        t.handelseTyp === "Försäljning"
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {t.beloppInklMoms.toLocaleString("sv-SE")} kr
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/kassabok/${t.id}/redigera`}>
                          <button className="p-1 text-amber-500 hover:text-amber-400">
                            <Edit className="h-4 w-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1 text-red-500 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
