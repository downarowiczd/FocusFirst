"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import styles from "./QuickCapture.module.css";

export interface QuickCaptureProps {
  /** Persist the captured text. Called only with non-empty, trimmed strings. */
  onCapture: (text: string) => Promise<void> | void;
  /** Label shown when collapsed. */
  label?: string;
  /** Placeholder shown inside the expanded textarea. */
  placeholder?: string;
}

export function QuickCapture({
  onCapture,
  label = "+ Capture thought",
  placeholder = "Capture a thought…",
}: QuickCaptureProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (open) textareaRef.current?.focus();
  }, [open]);

  const collapse = () => {
    setText("");
    setOpen(false);
  };

  const save = () => {
    const value = text.trim();
    if (!value || pending) {
      if (!value) collapse();
      return;
    }
    startTransition(async () => {
      await onCapture(value);
      collapse();
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        className={styles.collapsed}
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
    );
  }

  return (
    <div className={styles.expanded}>
      <textarea
        ref={textareaRef}
        className={styles.input}
        value={text}
        rows={3}
        placeholder={placeholder}
        disabled={pending}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            save();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            collapse();
          }
        }}
      />
      <div className={styles.actions}>
        <button type="button" onClick={collapse} disabled={pending}>
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={pending || text.trim().length === 0}
          className={styles.save}
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
