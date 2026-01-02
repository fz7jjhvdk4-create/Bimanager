"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  FileText,
  ArrowLeft,
  Send,
  CheckCircle,
  Printer,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import Button from "@/components/ui/Button";

const DownloadInvoicePDF = dynamic(
  () => import("@/components/pdf/DownloadInvoicePDF"),
  { ssr: false }
);

interface Customer {
  id: string;
  namn: string;
  adress: string | null;
  postnummer: string | null;
  ort: string | null;
  epost: string | null;
  telefon: string | null;
  organisationsnummer: string | null;
}

interface InvoiceLine {
  beskrivning: string;
  antal: number;
  enhet: string;
  prisPerEnhet: number;
  momsSats: number;
}

interface Invoice {
  id: string;
  fakturaNummer: string;
  kundId: string;
  kund: Customer;
  fakturaDatum: string;
  forfallDatum: string;
  rader: string;
  totaltExMoms: number;
  totaltMoms: number;
  totaltInklMoms: number;
  status: string;
}

interface Settings {
  foretagsnamn: string | null;
  organisationsnummer: string | null;
  adress: string | null;
  postnummer: string | null;
  ort: string | null;
  telefon: string | null;
  epost: string | null;
  bankgiro: string | null;
  swish: string | null;
}

export default function FakturaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      const [invoiceRes, settingsRes] = await Promise.all([
        fetch(`/api/invoices/${id}`),
        fetch("/api/settings"),
      ]);

      if (!invoiceRes.ok) throw new Error("Kunde inte hämta faktura");

      const invoiceData = await invoiceRes.json();
      setInvoice(invoiceData);

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchInvoice() {
    try {
      const res = await fetch(`/api/invoices/${id}`);
      if (!res.ok) throw new Error("Kunde inte hämta faktura");
      const data = await res.json();
      setInvoice(data);
    } catch (error) {
      console.error("Error fetching invoice:", error);
    }
  }

  async function handleStatusChange(newStatus: string) {
    try {
      await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchInvoice();
    } catch (error) {
      console.error("Error updating invoice:", error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-[var(--muted)]">Laddar...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-8">
        <p className="text-[var(--muted)]">Faktura hittades inte</p>
        <Link href="/betalning/faktura" className="text-[var(--accent)] underline mt-2">
          Tillbaka till fakturor
        </Link>
      </div>
    );
  }

  const rader: InvoiceLine[] = JSON.parse(invoice.rader);
  const isOverdue =
    invoice.status === "Skickad" &&
    new Date(invoice.forfallDatum) < new Date();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
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
              <h1 className="text-2xl font-bold text-[var(--foreground)]">
                {invoice.fakturaNummer}
              </h1>
              <p className="text-[var(--muted)]">{invoice.kund.namn}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {invoice.status === "Utkast" && (
            <Button onClick={() => handleStatusChange("Skickad")}>
              <Send className="h-4 w-4 mr-2" />
              Markera skickad
            </Button>
          )}
          {invoice.status === "Skickad" && (
            <Button onClick={() => handleStatusChange("Betald")}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Markera betald
            </Button>
          )}
          <DownloadInvoicePDF invoice={invoice} settings={settings} />
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Skriv ut
          </Button>
        </div>
      </div>

      {/* Invoice Preview */}
      <div className="bg-[var(--card-bg)] rounded-xl shadow-sm border border-[var(--card-border)] overflow-hidden print:shadow-none print:border-0">
        {/* Invoice Header */}
        <div className="p-8 border-b border-[var(--card-border)]">
          <div className="flex justify-between">
            <div>
              <h2 className="text-3xl font-bold text-[var(--foreground)] mb-1">FAKTURA</h2>
              <p className="text-[var(--muted)]">{invoice.fakturaNummer}</p>
            </div>
            <div className="text-right">
              <p className="text-[var(--foreground)] font-bold text-xl">
                {settings?.foretagsnamn || "BiManager"}
              </p>
              {settings?.organisationsnummer && (
                <p className="text-[var(--muted)] text-sm">
                  Org.nr: {settings.organisationsnummer}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Customer & Dates */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-[var(--card-border)]">
          <div>
            <h3 className="text-sm font-medium text-[var(--muted)] mb-2">
              FAKTURERAS TILL
            </h3>
            <div className="space-y-1">
              <p className="font-semibold text-[var(--foreground)]">{invoice.kund.namn}</p>
              {invoice.kund.organisationsnummer && (
                <p className="text-sm text-[var(--muted)]">
                  Org.nr: {invoice.kund.organisationsnummer}
                </p>
              )}
              {invoice.kund.adress && (
                <div className="flex items-start gap-2 text-sm text-[var(--muted)]">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  <span>
                    {invoice.kund.adress}
                    <br />
                    {invoice.kund.postnummer} {invoice.kund.ort}
                  </span>
                </div>
              )}
              {invoice.kund.epost && (
                <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                  <Mail className="h-4 w-4" />
                  <span>{invoice.kund.epost}</span>
                </div>
              )}
              {invoice.kund.telefon && (
                <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                  <Phone className="h-4 w-4" />
                  <span>{invoice.kund.telefon}</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="space-y-2">
              <div>
                <p className="text-sm text-[var(--muted)]">Fakturadatum</p>
                <p className="font-medium text-[var(--foreground)]">
                  {new Date(invoice.fakturaDatum).toLocaleDateString("sv-SE")}
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--muted)]">Förfallodatum</p>
                <p
                  className={`font-medium ${isOverdue ? "text-red-600 dark:text-red-400" : "text-[var(--foreground)]"}`}
                >
                  {new Date(invoice.forfallDatum).toLocaleDateString("sv-SE")}
                  {isOverdue && " (förfallen)"}
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--muted)]">Status</p>
                <p
                  className={`font-medium ${
                    invoice.status === "Betald"
                      ? "text-green-600 dark:text-green-400"
                      : invoice.status === "Skickad"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {invoice.status}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Lines */}
        <div className="p-8">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--card-border)]">
                <th className="text-left py-3 text-sm font-medium text-[var(--foreground)]">
                  Beskrivning
                </th>
                <th className="text-right py-3 text-sm font-medium text-[var(--foreground)]">
                  Antal
                </th>
                <th className="text-right py-3 text-sm font-medium text-[var(--foreground)]">
                  à-pris
                </th>
                <th className="text-right py-3 text-sm font-medium text-[var(--foreground)]">
                  Moms
                </th>
                <th className="text-right py-3 text-sm font-medium text-[var(--foreground)]">
                  Summa
                </th>
              </tr>
            </thead>
            <tbody>
              {rader.map((rad, index) => (
                <tr key={index} className="border-b border-[var(--card-border)]">
                  <td className="py-3 text-[var(--foreground)]">{rad.beskrivning}</td>
                  <td className="py-3 text-right text-[var(--muted)]">
                    {rad.antal} {rad.enhet}
                  </td>
                  <td className="py-3 text-right text-[var(--muted)]">
                    {rad.prisPerEnhet.toLocaleString("sv-SE")} kr
                  </td>
                  <td className="py-3 text-right text-[var(--muted)]">
                    {(rad.momsSats * 100).toFixed(0)}%
                  </td>
                  <td className="py-3 text-right font-medium text-[var(--foreground)]">
                    {(rad.antal * rad.prisPerEnhet).toLocaleString("sv-SE")} kr
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-6 border-t border-[var(--card-border)] pt-4">
            <div className="w-64 ml-auto space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted)]">Summa ex moms:</span>
                <span className="text-[var(--foreground)]">
                  {invoice.totaltExMoms.toLocaleString("sv-SE")} kr
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted)]">Moms:</span>
                <span className="text-[var(--foreground)]">
                  {invoice.totaltMoms.toLocaleString("sv-SE")} kr
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-[var(--card-border)] pt-2">
                <span className="text-[var(--foreground)]">Att betala:</span>
                <span className="text-[var(--foreground)]">
                  {invoice.totaltInklMoms.toLocaleString("sv-SE")} kr
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-[var(--accent)]/5 border-t border-[var(--card-border)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="font-medium text-[var(--foreground)] mb-1">Avsändare</p>
              <p className="text-[var(--muted)]">{settings?.foretagsnamn || "BiManager"}</p>
              {settings?.adress && <p className="text-[var(--muted)]">{settings.adress}</p>}
              {(settings?.postnummer || settings?.ort) && (
                <p className="text-[var(--muted)]">{settings.postnummer} {settings.ort}</p>
              )}
            </div>
            <div>
              <p className="font-medium text-[var(--foreground)] mb-1">Kontakt</p>
              {settings?.telefon && <p className="text-[var(--muted)]">Tel: {settings.telefon}</p>}
              {settings?.epost && <p className="text-[var(--muted)]">{settings.epost}</p>}
            </div>
            <div>
              <p className="font-medium text-[var(--foreground)] mb-1">Betalning</p>
              {settings?.bankgiro && <p className="text-[var(--muted)]">Bankgiro: {settings.bankgiro}</p>}
              {settings?.swish && <p className="text-[var(--muted)]">Swish: {settings.swish}</p>}
              <p className="text-[var(--muted)]">Ange {invoice.fakturaNummer} vid betalning</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
