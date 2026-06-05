"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Interrupt } from "@/lib/domain";
import styles from "./InboxList.module.css";

export interface InboxListProps {
  interrupts: Interrupt[];
}

function relativeTime(iso: string) {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  if (Number.isNaN(diff)) return "";
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function InboxList({ interrupts }: InboxListProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (interrupts.length === 0) {
    return null;
  }

  const markProcessed = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/interrupts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ processed: true }),
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      startTransition(() => router.refresh());
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ul className={styles.list}>
      {interrupts.map((i) => {
        const disabled = busyId === i.id || pending;
        return (
          <li key={i.id} className={styles.item}>
            <div className={styles.body}>
              <span className={styles.text}>{i.text}</span>
              <span className={styles.time}>{relativeTime(i.createdAt)}</span>
            </div>
            <button
              type="button"
              className={styles.done}
              onClick={() => void markProcessed(i.id)}
              disabled={disabled}
              aria-label="Mark processed"
            >
              Done
            </button>
          </li>
        );
      })}
    </ul>
  );
}
