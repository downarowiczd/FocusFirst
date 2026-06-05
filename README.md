# FocusFirst

FocusFirst is a productivity and deep-work management application built to help users manage contexts, focus sessions, work items, and interruptions seamlessly.

## Documentation

### 1. High-Level Architecture
- **Tech Stack**: Next.js 16 (App Router), React 19, TypeScript, and SQLite (using `better-sqlite3`).
- **Architecture Pattern**: Domain-Driven Design (DDD) with clear boundaries between:
  - **Frontend**: UI components and pages (`app/`, `components/`).
  - **API Layer**: Next.js App Router route handlers (`app/api/`).
  - **Application Services**: Business logic and aggregation (`lib/services/`).
  - **Data Persistence**: Database schema and data access operations (`lib/repositories/`, `lib/db/`).

### 2. Domain Model Guide
The core entities are defined in `lib/domain`:
- **Context**: Broad areas of work or projects (e.g., "Internal tooling", "Research").
- **WorkItem**: Specific tasks tied to a Context. Includes states (`active`, `parked`, `blocked`, `done`) and "resume anchors" to quickly help you remember where you left off.
- **FocusSession**: Time-boxed periods of deep work associated with a context and optionally a specific work item. Records start/end times and exit anchors.
- **Interrupt**: Unplanned distractions or urgent requests that occur during a Focus Session. Handled quickly to maintain flow.
- **Capture**: Quick, unprocessed thoughts or tasks added to an Inbox for later review.

### 3. API Reference
The application provides REST-like API endpoints located in `app/api`:
- **`GET /api/contexts`**: List all contexts.
- **`POST /api/contexts`**: Create a new context.
- **`PATCH /api/work-items/[id]`**: Update work items (e.g., state, resume anchors, title).
- **`POST /api/focus/start`**: Start a new focus session for a given context and work item.
- **`POST /api/focus/end`**: End an active focus session, capturing the exit anchor.
- **`POST /api/captures`**: Add a new inbox capture.
- **`GET /api/captures`**: Retrieve all inbox captures.
- **`POST /api/interrupts`**: Log a runtime interruption.
- **`GET /api/interrupts`**: Retrieve unprocessed interruptions.
- **`PATCH /api/interrupts/[id]`**: Mark an interruption as processed.
- **`GET /api/home`**: Aggregates data for the home dashboard (contexts, recent work item to resume, active count, interrupt count).
- **`GET /api/work-items/[id]/micro-context`**: Retrieve the micro-context (recent captures, related work items, and timeline events) for a specific work item.

### 4. UI Components & Screens
Key React components used throughout the application:
- **Screens**:
  - `EntryScreen` (home/dashboard): View contexts and resume recent work.
  - `FocusScreen` (active timer/session): The primary view during a deep work session.
  - `InboxList` (processing captures): View and process unprocessed captures.
- **Overlays**:
  - `ExitOverlay`: Wrap-up modal after ending a focus session to record an exit anchor.
  - `InterruptCapture`: Overlay to handle distractions quickly mid-session.
  - `QuickCapture`: Global mechanism to quickly add thoughts to the inbox.

---

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
