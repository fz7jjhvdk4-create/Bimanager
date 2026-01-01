"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  Trash2,
  Edit,
  FileText,
} from "lucide-react";
import Button from "@/components/ui/Button";

interface Customer {
  id: string;
  namn: string;
  adress: string | null;
  postnummer: string | null;
  ort: string | null;
  epost: string | null;
  telefon: string | null;
  organisationsnummer: string | null;
  invoices: {
    id: string;
    fakturaNummer: string;
    totaltInklMoms: number;
    status: string;
  }[];
}

export default function KunderPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  async function fetchCustomers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const res = await fetch(`/api/customers?${params}`);
      const data = await res.json();
      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Är du säker på att du vill ta bort denna kund?")) return;

    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Kunde inte ta bort kund");
        return;
      }
      fetchCustomers();
    } catch (error) {
      console.error("Error deleting customer:", error);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-amber-600" />
          <div>
            <h1 className="text-2xl font-bold text-amber-900">Kunder</h1>
            <p className="text-amber-600">Hantera ditt kundregister</p>
          </div>
        </div>
        <Link href="/kunder/ny">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ny kund
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sök efter kund..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Customers Grid */}
      {loading ? (
        <div className="text-center py-8 text-amber-600">Laddar...</div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-xl p-8 shadow-sm ring-1 ring-amber-100 text-center">
          <Users className="h-12 w-12 text-amber-300 mx-auto mb-4" />
          <p className="text-amber-600">Inga kunder registrerade.</p>
          <Link
            href="/kunder/ny"
            className="text-amber-700 underline mt-2 inline-block"
          >
            Lägg till din första kund
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white rounded-xl p-5 shadow-sm ring-1 ring-amber-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-amber-900">
                    {customer.namn}
                  </h3>
                  {customer.organisationsnummer && (
                    <p className="text-xs text-amber-500">
                      Org.nr: {customer.organisationsnummer}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Link href={`/kunder/${customer.id}/redigera`}>
                    <button className="p-1.5 text-amber-600 hover:bg-amber-100 rounded">
                      <Edit className="h-4 w-4" />
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDelete(customer.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {(customer.adress || customer.ort) && (
                  <div className="flex items-start gap-2 text-amber-700">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      {customer.adress && <>{customer.adress}<br /></>}
                      {customer.postnummer} {customer.ort}
                    </span>
                  </div>
                )}
                {customer.epost && (
                  <div className="flex items-center gap-2 text-amber-700">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <a
                      href={`mailto:${customer.epost}`}
                      className="hover:text-amber-900"
                    >
                      {customer.epost}
                    </a>
                  </div>
                )}
                {customer.telefon && (
                  <div className="flex items-center gap-2 text-amber-700">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <a
                      href={`tel:${customer.telefon}`}
                      className="hover:text-amber-900"
                    >
                      {customer.telefon}
                    </a>
                  </div>
                )}
              </div>

              {customer.invoices.length > 0 && (
                <div className="mt-4 pt-3 border-t border-amber-100">
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <FileText className="h-4 w-4" />
                    <span>{customer.invoices.length} fakturor</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
