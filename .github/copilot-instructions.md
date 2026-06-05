# FocusFirst — Copilot Instructions

> The repository is currently empty. These instructions capture the product intent and constraints so the very first code added stays aligned. Update this file as real architecture, scripts, and conventions land.

## Product intent

FocusFirst is a **focus-first task system**, not a traditional task manager. It is designed for a single primary user with ADHD/autism traits. Every change must protect:

- **Low friction** — actions complete in 1–2 taps/keystrokes.
- **Low decision fatigue** — never surface choices the user does not need right now.
- **Fast re-entry** — leaving and resuming deep work is the most important flow.
- **Context isolation** — only one Context and one Work Item are ever in view during Focus Mode.

When in doubt, remove UI rather than add it.

### Do NOT introduce

- Complex dashboards or analytics
- Heavy project-management features (gantt, dependencies, assignees, etc.)
- Notifications, badges, toasts, or any interruption surface
- Extra fields, forms, or wizards beyond what the model below requires

## Core domain concepts

These names are canonical — use them verbatim in code, types, routes, and UI copy.

- **Context** — a deep work area (e.g. "Integration – Swisslog"). Only **one** Context is active at a time.
- **WorkItem** — the current thing being worked on inside a Context. Fields: `title`, `state` (`active | blocked | parked | done`), `resumeAnchor` (1-line text), `lastTouchedAt`.
- **Focus Mode** — the central UX: one Context, one main WorkItem, minimal chrome.
- **Resume Anchor** — a single short line written when leaving focus. This is **critical** for re-entry and must always be prompted on exit.
- **Interrupt** — anything incoming. Goes to an **Interrupt Queue**, never shown during focus, processed manually later.
- **Capture** — fast, unstructured raw-text notes. Speed of capture is more important than structure.
- **FocusSession** — a record of an entry/exit cycle into Focus Mode.

Keep the schema simple. Do not add fields speculatively.

## UX principles (binding)

- Minimal UI, no clutter, no unnecessary navigation.
- Mobile-friendly interactions; prefer inline editing over forms.
- Max **5–7** active items visible at any time; show a soft-limit warning above that.
- Prefer keyboard/single-tap actions for `done`, `blocked`, `park`.

## MVP scope

Build only these screens until told otherwise:

1. **Entry Screen** — 3–5 Contexts, a resume suggestion, soft active-count warning.
2. **Focus Screen** — Context name, active WorkItem, Resume Anchor, quick actions (done / blocked / park), collapsed Quick Capture, automatic micro context panel.
3. **Exit Overlay** — prompts for the 1-line Resume Anchor.

Anything outside this list needs an explicit request before being added.

## Domain conventions

- Entity names (`Context`, `WorkItem`, `Capture`, `Interrupt`, `FocusSession`) are reused as TypeScript type names and table names (plural snake_case in SQL, singular PascalCase in TS).
- `WorkItem.state` is a string union, not a free-text field.
- Mutations that change a `WorkItem` must update `lastTouchedAt`.
- Exiting Focus Mode without a Resume Anchor is impossible by design — both client (`ExitOverlay`) and server (`/api/focus/end` returns 422) enforce this.

## Tech stack

- **Next.js 16** (App Router, Turbopack)
- **TypeScript** everywhere — no plain `.js` source files
- **SQLite** via **`better-sqlite3`** (synchronous driver). The native binary is declared in `serverExternalPackages` in `next.config.ts` so Turbopack does not try to bundle it.

## Project layout

```
app/                          # Next.js App Router
  layout.tsx                  # root shell (mobile-first, max-width container)
  globals.css                 # CSS variables + resets (light/dark via prefers-color-scheme)
  page.tsx                    # Entry Screen (server component, calls getHomePayload)
  focus/page.tsx              # Focus Screen (server component, starts a FocusSession)
  api/
    contexts/route.ts         # GET
    home/route.ts             # GET (entry-screen payload)
    captures/route.ts         # POST (+ GET for inspection)
    focus/start/route.ts      # POST
    focus/end/route.ts        # POST — 422 if exitAnchor is missing/empty
    work-items/[id]/route.ts  # PATCH — title / state / resumeAnchor (any subset)
    work-items/[id]/micro-context/route.ts  # GET
    interrupts/route.ts       # GET (unprocessed) + POST
    interrupts/[id]/route.ts  # PATCH { processed: true }
  inbox/page.tsx              # Inbox queue — list + mark-processed (never shown during focus)
components/                   # UI primitives + screen components (FocusScreen, EntryScreen, ExitOverlay, QuickCapture)
lib/
  domain/                     # Canonical domain types + branded *Id types
  repositories/
    interfaces.ts             # The contracts the rest of the app depends on
    sqlite.ts                 # better-sqlite3 implementation
    index.ts                  # Barrel — re-exports the active implementation
  db/sqlite.ts                # ONLY file that touches the better-sqlite3 driver. Owns schema + seed.
  services/                   # Use-cases (e.g. getHomePayload). Depend only on repositories barrel.
```

**Dependency direction is one-way:** `app/` and `components/` → `lib/services` → `lib/repositories` (interfaces) → `lib/db/sqlite.ts`. Never short-circuit this — in particular, do not import `better-sqlite3` outside `lib/db/sqlite.ts`.

## Server components vs. API routes

- Server components import `lib/services/*` (or repositories) **directly** — do not self-fetch the API routes from a server component.
- Client components and external callers use the `/api/*` routes via `fetch`.
- API routes set `runtime = "nodejs"` and `dynamic = "force-dynamic"` (mutable per-user state, no caching).

## Database conventions

- One SQLite file at `process.env.FOCUSFIRST_DB_PATH ?? "./focusfirst.db"` (gitignored).
- WAL mode + `foreign_keys = ON`.
- Schema lives in `lib/db/sqlite.ts` under `migrate()`. Seed is idempotent (`INSERT OR IGNORE` inside a transaction) so parallel build workers don't race.
- IDs are TEXT (UUIDs from `node:crypto.randomUUID()`), stored as the branded domain types via simple casts at the repository boundary.
- `lastTouchedAt` is rewritten on every `workItemRepo.update()`.

## Styling

- CSS Modules co-located with the component (`page.tsx` + `page.module.css`).
- Global tokens (colors, spacing, radius, tap target) are CSS custom properties in `app/globals.css`. Use them — do not hardcode values.
- Mobile-first: design at the small viewport, add `@media (min-width: 720px)` only when needed.
- Minimum tap target is `var(--tap)` (44px) for all interactive elements.

## Build / test / lint

Verified commands:

- `npm run dev` — local dev server (Turbopack)
- `npm run build` — production build
- `npm start` — serve production build (use `-- -p <port>` to override port)
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`)

No test runner is wired up yet. When one is added, document the single-test invocation here.
