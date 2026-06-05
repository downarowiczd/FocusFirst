import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const DB_PATH = resolve(process.env.FOCUSFIRST_DB_PATH ?? "./focusfirst.db");

declare global {
   
  var __focusfirstDb: Database.Database | undefined;
}

function migrate(db: Database.Database) {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  db.exec(`
    CREATE TABLE IF NOT EXISTS contexts (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      resumeHint  TEXT,
      createdAt   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS work_items (
      id            TEXT PRIMARY KEY,
      contextId     TEXT NOT NULL REFERENCES contexts(id) ON DELETE CASCADE,
      title         TEXT NOT NULL,
      state         TEXT NOT NULL CHECK (state IN ('active','blocked','parked','done')),
      resumeAnchor  TEXT,
      lastTouchedAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_work_items_context ON work_items(contextId);
    CREATE INDEX IF NOT EXISTS idx_work_items_state ON work_items(state);

    CREATE TABLE IF NOT EXISTS captures (
      id         TEXT PRIMARY KEY,
      contextId  TEXT REFERENCES contexts(id) ON DELETE SET NULL,
      text       TEXT NOT NULL,
      createdAt  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS interrupts (
      id           TEXT PRIMARY KEY,
      text         TEXT NOT NULL,
      createdAt    TEXT NOT NULL,
      processedAt  TEXT
    );

    CREATE TABLE IF NOT EXISTS focus_sessions (
      id          TEXT PRIMARY KEY,
      contextId   TEXT NOT NULL REFERENCES contexts(id) ON DELETE CASCADE,
      workItemId  TEXT REFERENCES work_items(id) ON DELETE SET NULL,
      startedAt   TEXT NOT NULL,
      endedAt     TEXT,
      exitAnchor  TEXT
    );
  `);
}

function seedIfEmpty(db: Database.Database) {
  const insertCtx = db.prepare(
    `INSERT OR IGNORE INTO contexts (id, name, resumeHint, createdAt) VALUES (?, ?, ?, ?)`,
  );
  const insertWi = db.prepare(
    `INSERT OR IGNORE INTO work_items (id, contextId, title, state, resumeAnchor, lastTouchedAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  db.transaction(() => {
    const count = db.prepare(`SELECT COUNT(*) AS n FROM contexts`).get() as {
      n: number;
    };
    if (count.n > 0) return;
    const now = new Date().toISOString();
    insertCtx.run("ctx-swisslog", "Integration – Swisslog", "Finish webhook retry logic", now);
    insertCtx.run("ctx-presales-acme", "Presales – Acme Corp", "Draft architecture diagram", now);
    insertCtx.run("ctx-internal-tooling", "Internal tooling", null, now);
    insertCtx.run("ctx-research", "Research – Local LLMs", "Compare quantization options", now);

    insertWi.run("wi-webhook-retry", "ctx-swisslog", "Wire exponential backoff into the dispatcher", "active", "Stuck on idempotency key collision in test 3", now);
    insertWi.run("wi-signature-check", "ctx-swisslog", "Validate HMAC signatures on inbound events", "parked", null, now);
    insertWi.run("wi-acme-arch", "ctx-presales-acme", "Draft architecture diagram", "active", null, now);
    insertWi.run("wi-tooling-1", "ctx-internal-tooling", "Replace bash deploy script", "active", null, now);
  })();
}

function open(): Database.Database {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  migrate(db);
  seedIfEmpty(db);
  return db;
}

export const db: Database.Database = globalThis.__focusfirstDb ?? open();
if (!globalThis.__focusfirstDb) globalThis.__focusfirstDb = db;
