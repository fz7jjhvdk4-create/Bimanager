"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Building,
  CreditCard,
  FileText,
  Save,
  Check,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface SettingsData {
  id: string;
  foretagsnamn: string | null;
  organisationsnummer: string | null;
  adress: string | null;
  postnummer: string | null;
  ort: string | null;
  telefon: string | null;
  epost: string | null;
  bankgiro: string | null;
  swish: string | null;
  momsRegistrerad: boolean;
  nastaFakturaNummer: number;
}

export default function InstallningarPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [formData, setFormData] = useState({
    foretagsnamn: "",
    organisationsnummer: "",
    adress: "",
    postnummer: "",
    ort: "",
    telefon: "",
    epost: "",
    bankgiro: "",
    swish: "",
    momsRegistrerad: false,
    nastaFakturaNummer: 1,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setSettings(data);
      setFormData({
        foretagsnamn: data.foretagsnamn || "",
        organisationsnummer: data.organisationsnummer || "",
        adress: data.adress || "",
        postnummer: data.postnummer || "",
        ort: data.ort || "",
        telefon: data.telefon || "",
        epost: data.epost || "",
        bankgiro: data.bankgiro || "",
        swish: data.swish || "",
        momsRegistrerad: data.momsRegistrerad || false,
        nastaFakturaNummer: data.nastaFakturaNummer || 1,
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          nastaFakturaNummer: parseInt(formData.nastaFakturaNummer.toString()),
        }),
      });

      if (!res.ok) {
        throw new Error("Kunde inte spara inställningar");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-amber-600">Laddar...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-amber-600" />
        <div>
          <h1 className="text-2xl font-bold text-amber-900">Inställningar</h1>
          <p className="text-amber-600">Hantera dina företagsuppgifter</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-amber-100 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Building className="h-5 w-5 text-amber-600" />
            <h2 className="font-semibold text-amber-900">Företagsinformation</h2>
          </div>

          <Input
            label="Företagsnamn"
            name="foretagsnamn"
            value={formData.foretagsnamn}
            onChange={handleChange}
            placeholder="Ditt företagsnamn"
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
              placeholder="foretag@example.com"
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

        {/* Payment Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-amber-100 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-amber-600" />
            <h2 className="font-semibold text-amber-900">Betalningsinformation</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Bankgiro"
              name="bankgiro"
              value={formData.bankgiro}
              onChange={handleChange}
              placeholder="XXX-XXXX"
            />
            <Input
              label="Swish"
              name="swish"
              value={formData.swish}
              onChange={handleChange}
              placeholder="123 XXX XX XX"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="momsRegistrerad"
              name="momsRegistrerad"
              checked={formData.momsRegistrerad}
              onChange={handleChange}
              className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
            />
            <label
              htmlFor="momsRegistrerad"
              className="text-sm font-medium text-amber-900"
            >
              Momsregistrerad
            </label>
          </div>
        </div>

        {/* Invoice Settings */}
        <div className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-amber-100 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-amber-600" />
            <h2 className="font-semibold text-amber-900">Fakturainställningar</h2>
          </div>

          <Input
            label="Nästa fakturanummer"
            type="number"
            name="nastaFakturaNummer"
            value={formData.nastaFakturaNummer.toString()}
            onChange={handleChange}
            min="1"
          />
          <p className="text-sm text-amber-600">
            Nästa faktura kommer att få numret F
            {formData.nastaFakturaNummer.toString().padStart(4, "0")}
          </p>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={saving}>
            {saving ? (
              "Sparar..."
            ) : saved ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Sparat!
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Spara inställningar
              </>
            )}
          </Button>
          {saved && (
            <span className="text-green-600 text-sm">
              Inställningarna har sparats
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
