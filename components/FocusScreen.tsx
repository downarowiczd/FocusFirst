"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Context, WorkItem, WorkItemState } from "@/lib/domain";
import type { MicroContext } from "@/lib/services/micro-context";
import { ExitOverlay } from "./ExitOverlay";
import { QuickCapture } from "./QuickCapture";
import styles from "./FocusScreen.module.css";

export interface FocusScreenProps {
  context: Context;
  workItem: WorkItem;
  microContext?: MicroContext;
  /** Active focus session — required to end the session on exit. */
  sessionId?: string;
  /** Override the default API-backed handlers (used in tests). */
  onResumeAnchorChange?: (value: string) => Promise<void> | void;
  onStateChange?: (state: WorkItemState) => Promise<void> | void;
  onCapture?: (text: string) => Promise<void> | void;
  onExit?: (anchor: string) => Promise<void> | void;
}

const STATE_LABELS: Record<WorkItemState, string> = {
  active: "active",
  blocked: "blocked",
  parked: "parked",
  done: "done",
};

const EMPTY_MICRO: MicroContext = {
  relatedWorkItems: [],
  recentCaptures: [],
  timeline: [],
};

function relativeTime(iso: string, nowMs = Date.now()): string {
  const diffSec = Math.max(0, Math.round((nowMs - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return "just now";
  const min = Math.round(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  return `${day}d ago`;
}

const TIMELINE_GLYPH = {
  workItemTouched: "•",
  captureAdded: "✎",
  sessionStarted: "▶",
  sessionEnded: "■",
} as const;

export function FocusScreen({
  context,
  workItem,
  microContext = EMPTY_MICRO,
  sessionId,
  onResumeAnchorChange,
  onStateChange,
  onCapture,
  onExit,
}: FocusScreenProps) {
  const [anchor, setAnchor] = useState(workItem.resumeAnchor ?? "");
  const [editingAnchor, setEditingAnchor] = useState(false);
  const [microOpen, setMicroOpen] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const patchWorkItem = async (
    patch: Partial<Pick<WorkItem, "resumeAnchor" | "state" | "title">>,
  ) => {
    await fetch(`/api/work-items/${workItem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  };

  const commitAnchor = () => {
    setEditingAnchor(false);
    const trimmed = anchor.trim();
    if (trimmed === (workItem.resumeAnchor ?? "")) return;
    startTransition(async () => {
      if (onResumeAnchorChange) {
        await onResumeAnchorChange(trimmed);
      } else {
        await patchWorkItem({ resumeAnchor: trimmed.length ? trimmed : null });
      }
      router.refresh();
    });
  };

  const handleAction = (state: WorkItemState) => {
    startTransition(async () => {
      if (onStateChange) {
        await onStateChange(state);
      } else {
        await patchWorkItem({ state });
      }
      if (state === "done" || state === "parked") {
        router.push("/");
      }
      router.refresh();
    });
  };

  return (
    <section className={styles.focus} aria-label="Focus">
      <button
        type="button"
        className={styles.exit}
        onClick={() => setExiting(true)}
        aria-label="Exit focus"
      >
        ← Exit
      </button>

      <header className={styles.header}>
        <p className={styles.context}>{context.name}</p>
        <h2 className={styles.title}>{workItem.title}</h2>
        <span
          className={styles.state}
          data-state={workItem.state}
          aria-label={`State: ${STATE_LABELS[workItem.state]}`}
        >
          {STATE_LABELS[workItem.state]}
        </span>
      </header>

      <div className={styles.anchor}>
        <span className={styles.anchorLabel}>Resume anchor</span>
        {editingAnchor ? (
          <textarea
            className={styles.anchorInput}
            value={anchor}
            autoFocus
            rows={2}
            onChange={(e) => setAnchor(e.target.value)}
            onBlur={commitAnchor}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                commitAnchor();
              }
              if (e.key === "Escape") {
                setAnchor(workItem.resumeAnchor ?? "");
                setEditingAnchor(false);
              }
            }}
            placeholder="Where to continue…"
          />
        ) : (
          <button
            type="button"
            className={styles.anchorText}
            onClick={() => setEditingAnchor(true)}
          >
            {anchor || (
              <span className={styles.anchorPlaceholder}>
                Tap to set where to continue
              </span>
            )}
          </button>
        )}
      </div>

      <div className={styles.actions} role="group" aria-label="Quick actions">
        <button
          type="button"
          className={styles.actionDone}
          onClick={() => handleAction("done")}
        >
          Done
        </button>
        <button
          type="button"
          className={styles.actionBlocked}
          onClick={() => handleAction("blocked")}
        >
          Blocked
        </button>
        <button
          type="button"
          className={styles.actionPark}
          onClick={() => handleAction("parked")}
        >
          Park
        </button>
      </div>

      <div className={styles.capture}>
        <QuickCapture
          onCapture={async (text) => {
            if (onCapture) {
              await onCapture(text);
            } else {
              await fetch("/api/captures", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, contextId: context.id }),
              });
            }
            router.refresh();
          }}
        />
      </div>

      {(microContext.relatedWorkItems.length > 0 ||
        microContext.recentCaptures.length > 0 ||
        microContext.timeline.length > 0) && (
        <div className={styles.micro}>
          <button
            type="button"
            className={styles.microToggle}
            aria-expanded={microOpen}
            onClick={() => setMicroOpen((v) => !v)}
          >
            <span>
              Context (
              {microContext.relatedWorkItems.length +
                microContext.recentCaptures.length}
              )
            </span>
            <span aria-hidden>{microOpen ? "▾" : "▸"}</span>
          </button>

          {microOpen && (
            <div className={styles.microBody}>
              {microContext.relatedWorkItems.length > 0 && (
                <section className={styles.microSection}>
                  <h3 className={styles.microHeading}>Related</h3>
                  <ul className={styles.microList}>
                    {microContext.relatedWorkItems.map((item) => (
                      <li key={item.id} className={styles.microItem}>
                        <span
                          className={styles.microState}
                          data-state={item.state}
                          aria-hidden
                        />
                        <span className={styles.microTitle}>{item.title}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {microContext.recentCaptures.length > 0 && (
                <section className={styles.microSection}>
                  <h3 className={styles.microHeading}>Recent captures</h3>
                  <ul className={styles.microList}>
                    {microContext.recentCaptures.map((c) => (
                      <li key={c.id} className={styles.microCapture}>
                        <span className={styles.microCaptureText}>{c.text}</span>
                        <span className={styles.microTime}>
                          {relativeTime(c.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {microContext.timeline.length > 0 && (
                <section className={styles.microSection}>
                  <h3 className={styles.microHeading}>Activity</h3>
                  <ol className={styles.microTimeline}>
                    {microContext.timeline.map((ev, i) => (
                      <li
                        key={`${ev.refId}-${ev.kind}-${i}`}
                        className={styles.microTimelineItem}
                      >
                        <span
                          className={styles.microTimelineGlyph}
                          data-kind={ev.kind}
                          aria-hidden
                        >
                          {TIMELINE_GLYPH[ev.kind]}
                        </span>
                        <span className={styles.microTimelineLabel}>
                          {ev.label}
                        </span>
                        <span className={styles.microTime}>
                          {relativeTime(ev.at)}
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </div>
          )}
        </div>
      )}

      <ExitOverlay
        open={exiting}
        defaultValue={anchor}
        onDismiss={() => setExiting(false)}
        onSave={async (next) => {
          setAnchor(next);
          if (onExit) {
            await onExit(next);
          } else if (sessionId) {
            await fetch("/api/focus/end", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sessionId, exitAnchor: next }),
            });
          }
          await onResumeAnchorChange?.(next);
          setExiting(false);
          router.push("/");
          router.refresh();
        }}
      />
    </section>
  );
}
