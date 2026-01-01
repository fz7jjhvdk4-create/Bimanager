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
  status: string;
}

export default function FaktureringPage() {
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
      setInvoices(data);
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
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            <Clock className="h-3 w-3 mr-1" />
            Utkast
          </span>
        );
      case "Skickad":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <Send className="h-3 w-3 mr-1" />
            Skickad
          </span>
        );
      case "Betald":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Betald
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  // Summary
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
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-amber-600" />
          <div>
            <h1 className="text-2xl font-bold text-amber-900">Fakturering</h1>
            <p className="text-amber-600">Skapa och hantera fakturor</p>
          </div>
        </div>
        <Link href="/fakturering/ny">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ny faktura
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm ring-1 ring-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm text-amber-600">Betalda</span>
          </div>
          <p className="text-2xl font-bold text-green-700">
            {summary.paid.toLocaleString("sv-SE")} kr
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm ring-1 ring-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <Send className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-amber-600">Väntande</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">
            {summary.pending.toLocaleString("sv-SE")} kr
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm ring-1 ring-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-gray-600" />
            <span className="text-sm text-amber-600">Utkast</span>
          </div>
          <p className="text-2xl font-bold text-gray-700">
            {summary.draft.toLocaleString("sv-SE")} kr
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterStatus("")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === ""
              ? "bg-amber-500 text-white"
              : "bg-white text-amber-700 hover:bg-amber-50"
          }`}
        >
          Alla
        </button>
        <button
          onClick={() => setFilterStatus("Utkast")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === "Utkast"
              ? "bg-amber-500 text-white"
              : "bg-white text-amber-700 hover:bg-amber-50"
          }`}
        >
          Utkast
        </button>
        <button
          onClick={() => setFilterStatus("Skickad")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === "Skickad"
              ? "bg-amber-500 text-white"
              : "bg-white text-amber-700 hover:bg-amber-50"
          }`}
        >
          Skickade
        </button>
        <button
          onClick={() => setFilterStatus("Betald")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === "Betald"
              ? "bg-amber-500 text-white"
              : "bg-white text-amber-700 hover:bg-amber-50"
          }`}
        >
          Betalda
        </button>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl shadow-sm ring-1 ring-amber-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-amber-600">Laddar...</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-amber-600">
            <FileText className="h-12 w-12 text-amber-300 mx-auto mb-4" />
            <p>Inga fakturor registrerade.</p>
            <Link
              href="/fakturering/ny"
              className="text-amber-700 underline mt-2 inline-block"
            >
              Skapa din första faktura
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-amber-50 border-b border-amber-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-amber-700">
                    Fakturanr
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-amber-700">
                    Kund
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-amber-700">
                    Datum
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-amber-700">
                    Förfaller
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-amber-700">
                    Belopp
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-amber-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-amber-700">
                    Åtgärder
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {invoices.map((invoice) => {
                  const isOverdue =
                    invoice.status === "Skickad" &&
                    new Date(invoice.forfallDatum) < new Date();

                  return (
                    <tr key={invoice.id} className="hover:bg-amber-50/50">
                      <td className="px-4 py-3 text-sm font-medium text-amber-900">
                        {invoice.fakturaNummer}
                      </td>
                      <td className="px-4 py-3 text-sm text-amber-900">
                        {invoice.kund.namn}
                      </td>
                      <td className="px-4 py-3 text-sm text-amber-700">
                        {new Date(invoice.fakturaDatum).toLocaleDateString(
                          "sv-SE"
                        )}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm ${isOverdue ? "text-red-600 font-medium" : "text-amber-700"}`}
                      >
                        {new Date(invoice.forfallDatum).toLocaleDateString(
                          "sv-SE"
                        )}
                        {isOverdue && " (förfallen)"}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-amber-900 text-right">
                        {invoice.totaltInklMoms.toLocaleString("sv-SE")} kr
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/fakturering/${invoice.id}`}>
                            <button className="p-1.5 text-amber-600 hover:bg-amber-100 rounded">
                              <Eye className="h-4 w-4" />
                            </button>
                          </Link>
                          {invoice.status === "Utkast" && (
                            <button
                              onClick={() =>
                                handleStatusChange(invoice.id, "Skickad")
                              }
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              title="Markera som skickad"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          )}
                          {invoice.status === "Skickad" && (
                            <button
                              onClick={() =>
                                handleStatusChange(invoice.id, "Betald")
                              }
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                              title="Markera som betald"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(invoice.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
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
