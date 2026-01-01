"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  ClipboardCheck,
  Scale,
  Snowflake,
  GitBranch,
  Heart,
  FileText,
  X,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import {
  EVENT_TYPES,
  EventType,
  STRENGTH_LEVELS,
  TEMPERAMENT_LEVELS,
  HEALTH_ACTION_TYPES,
} from "@/types";

interface Apiary {
  id: string;
  namn: string;
}

interface AddEventButtonProps {
  colonyId: string;
  apiaries?: Apiary[];
}

const eventTypeConfig: Record<
  EventType,
  { icon: React.ElementType; color: string; description: string }
> = {
  Inspektion: {
    icon: ClipboardCheck,
    color: "bg-blue-500",
    description: "Detaljerad kontroll av samhället",
  },
  Skörd: {
    icon: Scale,
    color: "bg-yellow-500",
    description: "Honungsskörd med mängd",
  },
  Invintring: {
    icon: Snowflake,
    color: "bg-cyan-500",
    description: "Förberedelse för vinter",
  },
  Avläggare: {
    icon: GitBranch,
    color: "bg-purple-500",
    description: "Skapad avläggare",
  },
  Hälsoåtgärd: {
    icon: Heart,
    color: "bg-rose-500",
    description: "Varroa, behandlingar, etc.",
  },
  Anteckning: {
    icon: FileText,
    color: "bg-stone-500",
    description: "Fri textanteckning",
  },
};

export default function AddEventButton({ colonyId, apiaries = [] }: AddEventButtonProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState<EventType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [datum, setDatum] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const resetForm = () => {
    setSelectedType(null);
    setDatum(new Date().toISOString().split("T")[0]);
    setFormData({});
    setError(null);
  };

  const handleClose = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (!selectedType) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          samhalleId: colonyId,
          handelseTyp: selectedType,
          datum,
          data: formData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Något gick fel");
      }

      handleClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
    } finally {
      setLoading(false);
    }
  };

  const renderEventForm = () => {
    switch (selectedType) {
      case "Inspektion":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Samhällets styrka"
                value={(formData.styrka as string) || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, styrka: e.target.value }))
                }
                options={STRENGTH_LEVELS.map((s) => ({ value: s, label: s }))}
                placeholder="Välj..."
              />
              <Select
                label="Temperament"
                value={(formData.temperament as string) || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    temperament: e.target.value,
                  }))
                }
                options={TEMPERAMENT_LEVELS.map((t) => ({ value: t, label: t }))}
                placeholder="Välj..."
              />
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(formData.drottningSynlig as boolean) || false}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      drottningSynlig: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-amber-300 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-amber-800">Drottning synlig</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(formData.drottningceller as boolean) || false}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      drottningceller: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-amber-300 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-amber-800">Drottningceller</span>
              </label>
            </div>
            <Textarea
              label="Anteckningar"
              value={(formData.anteckningar as string) || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  anteckningar: e.target.value,
                }))
              }
              placeholder="Övriga observationer (ägg, yngel, foder, etc.)..."
            />
          </div>
        );

      case "Skörd":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Mängd (kg)"
                type="number"
                step="0.1"
                value={(formData.mangdKg as string) || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    mangdKg: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="T.ex. 12.5"
              />
              <Input
                label="Antal ramar"
                type="number"
                value={(formData.antalRamar as string) || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    antalRamar: parseInt(e.target.value) || 0,
                  }))
                }
                placeholder="T.ex. 8"
              />
            </div>
            <Textarea
              label="Anteckningar"
              value={(formData.anteckningar as string) || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  anteckningar: e.target.value,
                }))
              }
              placeholder="Övriga kommentarer..."
            />
          </div>
        );

      case "Invintring":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Antal ramar"
                type="number"
                value={(formData.antalRamar as string) || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    antalRamar: parseInt(e.target.value) || 0,
                  }))
                }
                placeholder="T.ex. 10"
              />
              <Input
                label="Fodermängd (kg)"
                type="number"
                step="0.1"
                value={(formData.fodermangdKg as string) || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    fodermangdKg: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="T.ex. 20"
              />
            </div>
            <Select
              label="Allmänt skick"
              value={(formData.allmanntSkick as string) || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  allmanntSkick: e.target.value,
                }))
              }
              options={STRENGTH_LEVELS.map((s) => ({ value: s, label: s }))}
              placeholder="Välj..."
            />
            <Textarea
              label="Anteckningar"
              value={(formData.anteckningar as string) || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  anteckningar: e.target.value,
                }))
              }
              placeholder="Övriga kommentarer..."
            />
          </div>
        );

      case "Avläggare":
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <label className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={(formData.skapaNyttSamhalle as boolean) || false}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      skapaNyttSamhalle: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-purple-300 text-purple-500 focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-purple-800">
                  Skapa nytt samhälle automatiskt
                </span>
              </label>

              {(formData.skapaNyttSamhalle as boolean) && (
                <div className="space-y-3 pl-6 border-l-2 border-purple-200">
                  <Input
                    label="Namn på det nya samhället"
                    value={(formData.nyttSamhalleNamn as string) || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        nyttSamhalleNamn: e.target.value,
                      }))
                    }
                    placeholder="T.ex. Avläggare 2024-1"
                  />
                  <Select
                    label="Placera i bigård"
                    value={(formData.nyttSamhalleBigardId as string) || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        nyttSamhalleBigardId: e.target.value,
                      }))
                    }
                    options={[
                      { value: "", label: "Samma bigård som modersamhället" },
                      ...apiaries.map((a) => ({ value: a.id, label: a.namn })),
                    ]}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Drottningens ras"
                      value={(formData.nyttSamhalleDrottningRas as string) || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          nyttSamhalleDrottningRas: e.target.value,
                        }))
                      }
                      placeholder="T.ex. Buckfast"
                    />
                    <Input
                      label="Drottningens år"
                      type="number"
                      value={(formData.nyttSamhalleDrottningAr as string) || new Date().getFullYear().toString()}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          nyttSamhalleDrottningAr: parseInt(e.target.value),
                        }))
                      }
                      placeholder={new Date().getFullYear().toString()}
                    />
                  </div>
                  <p className="text-xs text-purple-600">
                    Det nya samhället kommer automatiskt kopplas till detta modersamhälle.
                  </p>
                </div>
              )}
            </div>

            <Input
              label="Antal ramar som flyttades"
              type="number"
              value={(formData.antalRamar as string) || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  antalRamar: parseInt(e.target.value) || 0,
                }))
              }
              placeholder="T.ex. 3"
            />

            <Textarea
              label="Anteckningar"
              value={(formData.anteckningar as string) || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  anteckningar: e.target.value,
                }))
              }
              placeholder="Beskriv avläggaren (t.ex. vilka ramar som användes)..."
            />
          </div>
        );

      case "Hälsoåtgärd":
        return (
          <div className="space-y-4">
            <Select
              label="Åtgärdstyp"
              value={(formData.atgardstyp as string) || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, atgardstyp: e.target.value }))
              }
              options={HEALTH_ACTION_TYPES.map((t) => ({ value: t, label: t }))}
              placeholder="Välj åtgärd..."
            />
            <Input
              label="Metod/preparat"
              value={(formData.metodPreparat as string) || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  metodPreparat: e.target.value,
                }))
              }
              placeholder="T.ex. Oxalsyra, ApiVar"
            />
            <Textarea
              label="Anteckningar"
              value={(formData.anteckningar as string) || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  anteckningar: e.target.value,
                }))
              }
              placeholder="Övriga kommentarer..."
            />
          </div>
        );

      case "Anteckning":
        return (
          <Textarea
            label="Anteckning"
            value={(formData.anteckningar as string) || ""}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, anteckningar: e.target.value }))
            }
            placeholder="Skriv din anteckning här..."
            rows={6}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-white font-medium hover:bg-amber-600 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Ny händelse
      </button>

      <Modal
        isOpen={showModal}
        onClose={handleClose}
        title={selectedType ? `Ny ${selectedType.toLowerCase()}` : "Välj händelsetyp"}
        size={selectedType ? "lg" : "xl"}
      >
        {!selectedType ? (
          // Event type selection
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {EVENT_TYPES.map((type) => {
              const config = eventTypeConfig[type];
              const Icon = config.icon;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-amber-100 hover:border-amber-300 hover:bg-amber-50 transition-colors text-center"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${config.color}`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-900">{type}</p>
                    <p className="text-xs text-amber-600">{config.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          // Event form
          <div className="space-y-6">
            <button
              onClick={() => setSelectedType(null)}
              className="flex items-center gap-2 text-amber-600 hover:text-amber-700 text-sm"
            >
              <X className="h-4 w-4" />
              Välj annan typ
            </button>

            <Input
              label="Datum"
              type="date"
              value={datum}
              onChange={(e) => setDatum(e.target.value)}
              required
            />

            {renderEventForm()}

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSubmit} loading={loading}>
                Spara
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Avbryt
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
