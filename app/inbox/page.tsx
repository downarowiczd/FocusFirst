import Link from "next/link";
import { interruptRepo } from "@/lib/repositories";
import { InboxList } from "@/components/InboxList";
import { InterruptCapture } from "@/components/InterruptCapture";
import styles from "./inbox.module.css";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const interrupts = await interruptRepo.listUnprocessed();

  return (
    <section className={styles.inbox} aria-label="Inbox">
      <header className={styles.header}>
        <Link href="/" className={styles.back}>
          ← Back
        </Link>
        <h1 className={styles.title}>Inbox</h1>
        <p className={styles.subtitle}>
          {interrupts.length === 0
            ? "Nothing waiting. Good."
            : `${interrupts.length} to triage.`}
        </p>
      </header>

      <InterruptCapture />

      <InboxList interrupts={interrupts} />
    </section>
  );
}
