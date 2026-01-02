"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Clock,
  CheckCircle,
  Send,
  Eye,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import Button from "@/components/ui/Button";

interface Customer {
  id: string;
  namn: string;
}

interface Invoice {
  id: string;
  fakturaNummer: string;
  kundId: string;
  kund: Customer;
  fakturaDatum: string;
  forfallDatum: string;
  totaltExMoms: number;
  totaltMoms: number;
  totaltInklMoms: number;
  typ: string;
  status: string;
}

export default function FakturaPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("");

  useEffect(() => {
    fetchInvoices();
  }, [filterStatus]);

  async function fetchInvoices() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);

      const res = await fetch(`/api/invoices?${params}`);
      const data = await res.json();
      // Filtrera endast fakturor (inte kvitton)
      setInvoices(data.filter((inv: Invoice) => inv.typ === "faktura" || !inv.typ));
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Är du säker på att du vill ta bort denna faktura?")) return;

    try {
      await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      fetchInvoices();
    } catch (error) {
      console.error("Error deleting invoice:", error);
    }
  }

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchInvoices();
    } catch (error) {
      console.error("Error updating invoice:", error);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Utkast":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            <Clock className="h-3 w-3 mr-1" />
            Utkast
          </span>
        );
      case "Skickad":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
            <Send className="h-3 w-3 mr-1" />
            Skickad
          </span>
        );
      case "Betald":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Betald
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            {status}
          </span>
        );
    }
  };

  const summary = invoices.reduce(
    (acc, inv) => {
      if (inv.status === "Betald") {
        acc.paid += inv.totaltInklMoms;
      } else if (inv.status === "Skickad") {
        acc.pending += inv.totaltInklMoms;
      } else {
        acc.draft += inv.totaltInklMoms;
      }
      return acc;
    },
    { paid: 0, pending: 0, draft: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/betalning"
            className="p-2 rounded-lg hover:bg-[var(--card-bg)] transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-[var(--foreground)]" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">Fakturor</h1>
              <p className="text-[var(--muted)]">Skapa och hantera fakturor</p>
            </div>
          </div>
        </div>
        <Link href="/betalning/faktura/ny">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ny faktura
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--card-bg)] rounded-xl p-4 shadow-sm border border-[var(--card-border)]">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-sm text-[var(--muted)]">Betalda</span>
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
            {summary.paid.toLocaleString("sv-SE")} kr
          </p>
        </div>
        <div className="bg-[var(--card-bg)] rounded-xl p-4 shadow-sm border border-[var(--card-border)]">
          <div className="flex items-center gap-2 mb-2">
            <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-[var(--muted)]">Väntande</span>
          </div>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {summary.pending.toLocaleString("sv-SE")} kr
          </p>
        </div>
        <div className="bg-[var(--card-bg)] rounded-xl p-4 shadow-sm border border-[var(--card-border)]">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-[var(--muted)]">Utkast</span>
          </div>
          <p className="text-2xl font-bold text-gray-700 dark:text-gray-400">
            {summary.draft.toLocaleString("sv-SE")} kr
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterStatus("")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === ""
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--card-bg)] text-[var(--foreground)] hover:bg-[var(--accent)]/10"
          }`}
        >
          Alla
        </button>
        <button
          onClick={() => setFilterStatus("Utkast")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === "Utkast"
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--card-bg)] text-[var(--foreground)] hover:bg-[var(--accent)]/10"
          }`}
        >
          Utkast
        </button>
        <button
          onClick={() => setFilterStatus("Skickad")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === "Skickad"
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--card-bg)] text-[var(--foreground)] hover:bg-[var(--accent)]/10"
          }`}
        >
          Skickade
        </button>
        <button
          onClick={() => setFilterStatus("Betald")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === "Betald"
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--card-bg)] text-[var(--foreground)] hover:bg-[var(--accent)]/10"
          }`}
        >
          Betalda
        </button>
      </div>

      {/* Invoices Table */}
      <div className="bg-[var(--card-bg)] rounded-xl shadow-sm border border-[var(--card-border)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[var(--muted)]">Laddar...</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-[var(--muted)]">
            <FileText className="h-12 w-12 text-[var(--muted)] mx-auto mb-4 opacity-50" />
            <p>Inga fakturor registrerade.</p>
            <Link
              href="/betalning/faktura/ny"
              className="text-[var(--accent)] underline mt-2 inline-block"
            >
              Skapa din första faktura
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--accent)]/5 border-b border-[var(--card-border)]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
                    Fakturanr
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
                    Kund
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
                    Datum
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">
                    Förfaller
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-[var(--foreground)]">
                    Belopp
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-[var(--foreground)]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-[var(--foreground)]">
                    Åtgärder
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {invoices.map((invoice) => {
                  const isOverdue =
                    invoice.status === "Skickad" &&
                    new Date(invoice.forfallDatum) < new Date();

                  return (
                    <tr key={invoice.id} className="hover:bg-[var(--accent)]/5">
                      <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">
                        {invoice.fakturaNummer}
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                        {invoice.kund.namn}
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--muted)]">
                        {new Date(invoice.fakturaDatum).toLocaleDateString("sv-SE")}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm ${
                          isOverdue
                            ? "text-red-600 dark:text-red-400 font-medium"
                            : "text-[var(--muted)]"
                        }`}
                      >
                        {new Date(invoice.forfallDatum).toLocaleDateString("sv-SE")}
                        {isOverdue && " (förfallen)"}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)] text-right">
                        {invoice.totaltInklMoms.toLocaleString("sv-SE")} kr
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/betalning/faktura/${invoice.id}`}>
                            <button className="p-1.5 text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded">
                              <Eye className="h-4 w-4" />
                            </button>
                          </Link>
                          {invoice.status === "Utkast" && (
                            <button
                              onClick={() => handleStatusChange(invoice.id, "Skickad")}
                              className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                              title="Markera som skickad"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          )}
                          {invoice.status === "Skickad" && (
                            <button
                              onClick={() => handleStatusChange(invoice.id, "Betald")}
                              className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                              title="Markera som betald"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(invoice.id)}
                            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
