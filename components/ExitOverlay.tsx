"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ExitOverlay.module.css";

export interface ExitOverlayProps {
  open: boolean;
  defaultValue?: string | null;
  onSave: (anchor: string) => Promise<void> | void;
  onDismiss: () => void;
}

export function ExitOverlay({
  open,
  defaultValue,
  onSave,
  onDismiss,
}: ExitOverlayProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [value, setValue] = useState(defaultValue ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setValue(defaultValue ?? "");
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, defaultValue]);

  const handleSave = async () => {
    const anchor = value.trim();
    if (!anchor || saving) return;
    setSaving(true);
    try {
      await onSave(anchor);
    } finally {
      setSaving(false);
    }
  };

  const canSave = value.trim().length > 0 && !saving;

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="exit-overlay-title"
      onCancel={(e) => {
        e.preventDefault();
        onDismiss();
      }}
    >
      <form
        method="dialog"
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
      >
        <h2 id="exit-overlay-title" className={styles.title}>
          Where will you resume?
        </h2>
        <p className={styles.hint}>One line. Future-you will read it first.</p>

        <input
          type="text"
          className={styles.input}
          value={value}
          autoFocus
          maxLength={140}
          placeholder="e.g. fix idempotency check in test 3"
          onChange={(e) => setValue(e.target.value)}
        />

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.dismiss}
            onClick={onDismiss}
            disabled={saving}
          >
            Stay in focus
          </button>
          <button
            type="submit"
            className={styles.save}
            disabled={!canSave}
            aria-disabled={!canSave}
          >
            {saving ? "Saving…" : "Save & exit"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
