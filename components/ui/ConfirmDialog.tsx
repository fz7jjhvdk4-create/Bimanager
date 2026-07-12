"use client";

import { useState } from "react";
import Button from "./Button";
import Modal from "./Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Körs vid bekräftelse; kasta ett Error för att visa felet i dialogen. */
  onConfirm: () => void | Promise<void>;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Ta bort",
  cancelLabel = "Avbryt",
  variant = "danger",
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="text-[var(--muted)]">{message}</div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant={variant} onClick={handleConfirm} loading={loading}>
            {confirmLabel}
          </Button>
          <Button variant="outline" onClick={handleClose}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
