import { randomUUID } from "node:crypto";
import { db } from "@/lib/db/sqlite";
import type {
  Capture,
  CaptureId,
  Context,
  ContextId,
  FocusSession,
  FocusSessionId,
  Interrupt,
  InterruptId,
  ISODateTime,
  WorkItem,
  WorkItemId,
  WorkItemState,
} from "@/lib/domain";
import type {
  CaptureRepository,
  ContextRepository,
  FocusSessionRepository,
  InterruptRepository,
  WorkItemRepository,
} from "./interfaces";

const now = () => new Date().toISOString() as ISODateTime;

interface ContextRow {
  id: string;
  name: string;
  resumeHint: string | null;
  createdAt: string;
}
interface WorkItemRow {
  id: string;
  contextId: string;
  title: string;
  state: WorkItemState;
  resumeAnchor: string | null;
  lastTouchedAt: string;
}
interface CaptureRow {
  id: string;
  contextId: string | null;
  text: string;
  createdAt: string;
}
interface FocusSessionRow {
  id: string;
  contextId: string;
  workItemId: string | null;
  startedAt: string;
  endedAt: string | null;
  exitAnchor: string | null;
}

const toContext = (r: ContextRow): Context => ({
  id: r.id as ContextId,
  name: r.name,
  resumeHint: r.resumeHint,
  createdAt: r.createdAt as ISODateTime,
});
const toWorkItem = (r: WorkItemRow): WorkItem => ({
  id: r.id as WorkItemId,
  contextId: r.contextId as ContextId,
  title: r.title,
  state: r.state,
  resumeAnchor: r.resumeAnchor,
  lastTouchedAt: r.lastTouchedAt as ISODateTime,
});
const toCapture = (r: CaptureRow): Capture => ({
  id: r.id as CaptureId,
  contextId: (r.contextId as ContextId | null) ?? null,
  text: r.text,
  createdAt: r.createdAt as ISODateTime,
});
const toFocusSession = (r: FocusSessionRow): FocusSession => ({
  id: r.id as FocusSessionId,
  contextId: r.contextId as ContextId,
  workItemId: (r.workItemId as WorkItemId | null) ?? null,
  startedAt: r.startedAt as ISODateTime,
  endedAt: (r.endedAt as ISODateTime | null) ?? null,
  exitAnchor: r.exitAnchor,
});

export const contextRepo: ContextRepository = {
  async list() {
    const rows = db
      .prepare(`SELECT * FROM contexts ORDER BY createdAt ASC`)
      .all() as ContextRow[];
    return rows.map(toContext);
  },
  async get(id) {
    const row = db
      .prepare(`SELECT * FROM contexts WHERE id = ?`)
      .get(id) as ContextRow | undefined;
    return row ? toContext(row) : null;
  },
  async create({ name }) {
    const ctx: Context = {
      id: randomUUID() as ContextId,
      name,
      resumeHint: null,
      createdAt: now(),
    };
    db.prepare(
      `INSERT INTO contexts (id, name, resumeHint, createdAt) VALUES (?, ?, ?, ?)`,
    ).run(ctx.id, ctx.name, ctx.resumeHint, ctx.createdAt);
    return ctx;
  },
  async setResumeHint(id, hint) {
    const result = db
      .prepare(`UPDATE contexts SET resumeHint = ? WHERE id = ?`)
      .run(hint, id);
    if (result.changes === 0) throw new Error(`Context ${id} not found`);
    const row = db
      .prepare(`SELECT * FROM contexts WHERE id = ?`)
      .get(id) as ContextRow;
    return toContext(row);
  },
};

export const workItemRepo: WorkItemRepository = {
  async listByContext(contextId) {
    const rows = db
      .prepare(
        `SELECT * FROM work_items WHERE contextId = ? ORDER BY lastTouchedAt DESC`,
      )
      .all(contextId) as WorkItemRow[];
    return rows.map(toWorkItem);
  },
  async get(id) {
    const row = db
      .prepare(`SELECT * FROM work_items WHERE id = ?`)
      .get(id) as WorkItemRow | undefined;
    return row ? toWorkItem(row) : null;
  },
  async create({ contextId, title }) {
    const wi: WorkItem = {
      id: randomUUID() as WorkItemId,
      contextId,
      title,
      state: "active",
      resumeAnchor: null,
      lastTouchedAt: now(),
    };
    db.prepare(
      `INSERT INTO work_items (id, contextId, title, state, resumeAnchor, lastTouchedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(wi.id, wi.contextId, wi.title, wi.state, wi.resumeAnchor, wi.lastTouchedAt);
    return wi;
  },
  async update(id, patch) {
    const existing = db
      .prepare(`SELECT * FROM work_items WHERE id = ?`)
      .get(id) as WorkItemRow | undefined;
    if (!existing) throw new Error(`WorkItem ${id} not found`);
    const updated: WorkItemRow = {
      ...existing,
      ...patch,
      lastTouchedAt: now(),
    };
    db.prepare(
      `UPDATE work_items
       SET title = ?, state = ?, resumeAnchor = ?, lastTouchedAt = ?
       WHERE id = ?`,
    ).run(
      updated.title,
      updated.state,
      updated.resumeAnchor,
      updated.lastTouchedAt,
      id,
    );
    return toWorkItem(updated);
  },
};

export const captureRepo: CaptureRepository = {
  async add({ text, contextId }) {
    const c: Capture = {
      id: randomUUID() as CaptureId,
      contextId: contextId ?? null,
      text,
      createdAt: now(),
    };
    db.prepare(
      `INSERT INTO captures (id, contextId, text, createdAt) VALUES (?, ?, ?, ?)`,
    ).run(c.id, c.contextId, c.text, c.createdAt);
    return c;
  },
  async list(contextId) {
    const rows = (
      contextId
        ? db
            .prepare(
              `SELECT * FROM captures WHERE contextId = ? ORDER BY createdAt DESC`,
            )
            .all(contextId)
        : db
            .prepare(`SELECT * FROM captures ORDER BY createdAt DESC`)
            .all()
    ) as CaptureRow[];
    return rows.map(toCapture);
  },
};

interface InterruptRow {
  id: string;
  text: string;
  createdAt: string;
  processedAt: string | null;
}

const toInterrupt = (r: InterruptRow): Interrupt => ({
  id: r.id as InterruptId,
  text: r.text,
  createdAt: r.createdAt as ISODateTime,
  processedAt: (r.processedAt as ISODateTime | null) ?? null,
});

export const interruptRepo: InterruptRepository = {
  async add({ text }) {
    const i: Interrupt = {
      id: randomUUID() as InterruptId,
      text,
      createdAt: now(),
      processedAt: null,
    };
    db.prepare(
      `INSERT INTO interrupts (id, text, createdAt, processedAt) VALUES (?, ?, ?, NULL)`,
    ).run(i.id, i.text, i.createdAt);
    return i;
  },
  async listUnprocessed() {
    const rows = db
      .prepare(
        `SELECT * FROM interrupts WHERE processedAt IS NULL ORDER BY createdAt ASC`,
      )
      .all() as InterruptRow[];
    return rows.map(toInterrupt);
  },
  async markProcessed(id) {
    const result = db
      .prepare(
        `UPDATE interrupts SET processedAt = ? WHERE id = ? AND processedAt IS NULL`,
      )
      .run(now(), id);
    if (result.changes === 0)
      throw new Error(`Interrupt ${id} not found or already processed`);
    const row = db
      .prepare(`SELECT * FROM interrupts WHERE id = ?`)
      .get(id) as InterruptRow;
    return toInterrupt(row);
  },
};

export const focusSessionRepo: FocusSessionRepository = {
  async start({ contextId, workItemId }) {
    const s: FocusSession = {
      id: randomUUID() as FocusSessionId,
      contextId,
      workItemId: workItemId ?? null,
      startedAt: now(),
      endedAt: null,
      exitAnchor: null,
    };
    db.prepare(
      `INSERT INTO focus_sessions (id, contextId, workItemId, startedAt, endedAt, exitAnchor)
       VALUES (?, ?, ?, ?, NULL, NULL)`,
    ).run(s.id, s.contextId, s.workItemId, s.startedAt);
    return s;
  },
  async end(id, exitAnchor) {
    const trimmed = exitAnchor.trim();
    if (!trimmed)
      throw new Error("exitAnchor is required to end a focus session");
    const result = db
      .prepare(
        `UPDATE focus_sessions SET endedAt = ?, exitAnchor = ? WHERE id = ? AND endedAt IS NULL`,
      )
      .run(now(), trimmed, id);
    if (result.changes === 0)
      throw new Error(`FocusSession ${id} not found or already ended`);
    const row = db
      .prepare(`SELECT * FROM focus_sessions WHERE id = ?`)
      .get(id) as FocusSessionRow;
    return toFocusSession(row);
  },
  async current() {
    const row = db
      .prepare(
        `SELECT * FROM focus_sessions WHERE endedAt IS NULL ORDER BY startedAt DESC LIMIT 1`,
      )
      .get() as FocusSessionRow | undefined;
    return row ? toFocusSession(row) : null;
  },
  async listByContext(contextId, opts) {
    const limit = opts?.limit ?? 50;
    const rows = db
      .prepare(
        `SELECT * FROM focus_sessions
         WHERE contextId = ?
         ORDER BY startedAt DESC
         LIMIT ?`,
      )
      .all(contextId, limit) as FocusSessionRow[];
    return rows.map(toFocusSession);
  },
};

export const asContextId = (v: string) => v as ContextId;
export const asWorkItemId = (v: string) => v as WorkItemId;
export const asFocusSessionId = (v: string) => v as FocusSessionId;
export const asInterruptId = (v: string) => v as InterruptId;
