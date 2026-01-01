"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

interface DeleteColonyButtonProps {
  colonyId: string;
  colonyName: string;
}

export default function DeleteColonyButton({
  colonyId,
  colonyName,
}: DeleteColonyButtonProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/colonies/${colonyId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Något gick fel");
      }

      router.push("/samhallen");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-red-600 font-medium ring-1 ring-red-200 hover:bg-red-50 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
        Ta bort
      </button>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Ta bort samhälle"
      >
        <div className="space-y-4">
          <p className="text-amber-700">
            Är du säker på att du vill ta bort samhället{" "}
            <strong>{colonyName}</strong>? Alla händelser för detta samhälle
            kommer också att tas bort. Detta går inte att ångra.
          </p>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="danger" onClick={handleDelete} loading={loading}>
              Ta bort
            </Button>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Avbryt
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
