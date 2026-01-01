"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function RedigeraKundPage({
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
    namn: "",
    adress: "",
    postnummer: "",
    ort: "",
    epost: "",
    telefon: "",
    organisationsnummer: "",
  });

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  async function fetchCustomer() {
    try {
      const res = await fetch(`/api/customers/${id}`);
      if (!res.ok) throw new Error("Kunde inte hämta kund");
      const data = await res.json();

      setFormData({
        namn: data.namn,
        adress: data.adress || "",
        postnummer: data.postnummer || "",
        ort: data.ort || "",
        epost: data.epost || "",
        telefon: data.telefon || "",
        organisationsnummer: data.organisationsnummer || "",
      });
    } catch {
      setError("Kunde inte hämta kund");
    } finally {
      setFetching(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error("Kunde inte uppdatera kund");
      }

      router.push("/kunder");
    } catch {
      setError("Ett fel uppstod. Försök igen.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-amber-600">Laddar...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/kunder"
          className="p-2 rounded-lg hover:bg-amber-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-amber-600" />
        </Link>
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-amber-600" />
          <div>
            <h1 className="text-2xl font-bold text-amber-900">Redigera kund</h1>
            <p className="text-amber-600">Uppdatera kundinformation</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-amber-100 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          <Input
            label="Namn"
            name="namn"
            value={formData.namn}
            onChange={handleChange}
            placeholder="Kundens namn eller företagsnamn"
            required
          />

          <Input
            label="Organisationsnummer"
            name="organisationsnummer"
            value={formData.organisationsnummer}
            onChange={handleChange}
            placeholder="XXXXXX-XXXX"
          />

          <Input
            label="Adress"
            name="adress"
            value={formData.adress}
            onChange={handleChange}
            placeholder="Gatuadress"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Postnummer"
              name="postnummer"
              value={formData.postnummer}
              onChange={handleChange}
              placeholder="XXX XX"
            />
            <Input
              label="Ort"
              name="ort"
              value={formData.ort}
              onChange={handleChange}
              placeholder="Stad"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="E-post"
              type="email"
              name="epost"
              value={formData.epost}
              onChange={handleChange}
              placeholder="kund@example.com"
            />
            <Input
              label="Telefon"
              type="tel"
              name="telefon"
              value={formData.telefon}
              onChange={handleChange}
              placeholder="070-XXX XX XX"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Sparar..." : "Spara ändringar"}
          </Button>
          <Link href="/kunder">
            <Button variant="secondary" type="button">
              Avbryt
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
