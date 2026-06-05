import Link from "next/link";
import type {
  ContextSummary,
  ResumeSuggestion,
} from "@/lib/services/home";
import { InterruptCapture } from "./InterruptCapture";
import styles from "./EntryScreen.module.css";

const ACTIVE_SOFT_LIMIT = 7;

export interface EntryScreenProps {
  contexts: ContextSummary[];
  resume: ResumeSuggestion | null;
  totalActive: number;
  interruptCount: number;
}

export function EntryScreen({
  contexts,
  resume,
  totalActive,
  interruptCount,
}: EntryScreenProps) {
  const visible = contexts.slice(0, 5);
  const overLimit = totalActive > ACTIVE_SOFT_LIMIT;

  return (
    <section className={styles.entry} aria-label="Entry">
      <header className={styles.header}>
        <h1 className={styles.title}>Pick one</h1>
        <p className={styles.subtitle}>One context. One thing.</p>
      </header>

      {resume && (
        <Link
          href={`/focus?context=${resume.context.id}&item=${resume.workItem.id}`}
          className={styles.resume}
        >
          <span className={styles.resumeLabel}>Resume last work</span>
          <span className={styles.resumeContext}>{resume.context.name}</span>
          <span className={styles.resumeTitle}>{resume.workItem.title}</span>
          {resume.workItem.resumeAnchor && (
            <span className={styles.resumeAnchor}>
              ↳ {resume.workItem.resumeAnchor}
            </span>
          )}
        </Link>
      )}

      <ul className={styles.contexts}>
        {visible.map(({ context, activeCount }) => (
          <li key={context.id}>
            <Link
              href={`/focus?context=${context.id}`}
              className={styles.context}
            >
              <span className={styles.contextName}>{context.name}</span>
              <span className={styles.contextMeta}>
                {activeCount} active
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {overLimit && (
        <p className={styles.warning} role="status">
          {totalActive} active items — consider parking a few.
        </p>
      )}

      <div className={styles.interrupts}>
        <InterruptCapture />
        <Link href="/inbox" className={styles.inboxLink}>
          <span>Inbox</span>
          <span className={styles.inboxCount}>
            {interruptCount > 0 ? `${interruptCount} waiting` : "empty"}
          </span>
        </Link>
      </div>
    </section>
  );
}
