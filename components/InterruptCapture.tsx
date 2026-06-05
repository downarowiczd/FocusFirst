"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./InterruptCapture.module.css";

export interface InterruptCaptureProps {
  onSubmit?: (text: string) => Promise<void> | void;
}

async function defaultSubmit(text: string) {
  const res = await fetch("/api/interrupts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Failed to log interrupt (${res.status})`);
}

export function InterruptCapture({ onSubmit }: InterruptCaptureProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const trimmed = text.trim();
  const disabled = !trimmed || busy;

  const close = () => {
    setOpen(false);
    setText("");
  };

  const save = async () => {
    if (disabled) return;
    setBusy(true);
    try {
      await (onSubmit ?? defaultSubmit)(trimmed);
      close();
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(true)}
      >
        + Interrupt
      </button>
    );
  }

  return (
    <div className={styles.panel}>
      <textarea
        ref={inputRef}
        className={styles.input}
        placeholder="Park it for later…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            close();
          } else if (
            e.key === "Enter" &&
            (e.metaKey || e.ctrlKey) &&
            !disabled
          ) {
            e.preventDefault();
            void save();
          }
        }}
        rows={2}
      />
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancel}
          onClick={close}
          disabled={busy}
        >
          Cancel
        </button>
        <button
          type="button"
          className={styles.save}
          onClick={() => void save()}
          disabled={disabled}
        >
          Park
        </button>
      </div>
    </div>
  );
}
