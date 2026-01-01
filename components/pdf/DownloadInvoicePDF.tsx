"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Download, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import InvoicePDF from "./InvoicePDF";

interface Customer {
  namn: string;
  adress?: string | null;
  postnummer?: string | null;
  ort?: string | null;
  epost?: string | null;
  telefon?: string | null;
  organisationsnummer?: string | null;
}

interface Settings {
  foretagsnamn?: string | null;
  organisationsnummer?: string | null;
  adress?: string | null;
  postnummer?: string | null;
  ort?: string | null;
  telefon?: string | null;
  epost?: string | null;
  bankgiro?: string | null;
  swish?: string | null;
}

interface Invoice {
  fakturaNummer: string;
  fakturaDatum: string;
  forfallDatum: string;
  rader: string;
  totaltExMoms: number;
  totaltMoms: number;
  totaltInklMoms: number;
  status: string;
  kund: Customer;
}

interface DownloadInvoicePDFProps {
  invoice: Invoice;
  settings?: Settings | null;
  variant?: "primary" | "secondary";
}

export default function DownloadInvoicePDF({
  invoice,
  settings,
  variant = "primary",
}: DownloadInvoicePDFProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const blob = await pdf(
        <InvoicePDF invoice={invoice} settings={settings} />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoice.fakturaNummer}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Kunde inte generera PDF. Försök igen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleDownload} disabled={loading} variant={variant}>
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Genererar...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Ladda ner PDF
        </>
      )}
    </Button>
  );
}
