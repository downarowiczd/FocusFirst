import type {
  Capture,
  Context,
  ContextId,
  FocusSession,
  FocusSessionId,
  Interrupt,
  InterruptId,
  NewCapture,
  NewContext,
  NewInterrupt,
  NewWorkItem,
  StartFocusSession,
  WorkItem,
  WorkItemId,
} from "../domain";

export interface ContextRepository {
  list(): Promise<Context[]>;
  get(id: ContextId): Promise<Context | null>;
  create(input: NewContext): Promise<Context>;
  setResumeHint(id: ContextId, hint: string | null): Promise<Context>;
}

export interface WorkItemRepository {
  listByContext(contextId: ContextId): Promise<WorkItem[]>;
  get(id: WorkItemId): Promise<WorkItem | null>;
  create(input: NewWorkItem): Promise<WorkItem>;
  update(
    id: WorkItemId,
    patch: Partial<Pick<WorkItem, "title" | "state" | "resumeAnchor">>,
  ): Promise<WorkItem>;
}

export interface CaptureRepository {
  add(input: NewCapture): Promise<Capture>;
  list(contextId?: ContextId): Promise<Capture[]>;
}

export interface InterruptRepository {
  add(input: NewInterrupt): Promise<Interrupt>;
  listUnprocessed(): Promise<Interrupt[]>;
  markProcessed(id: InterruptId): Promise<Interrupt>;
}

export interface FocusSessionRepository {
  start(input: StartFocusSession): Promise<FocusSession>;
  end(id: FocusSessionId, exitAnchor: string): Promise<FocusSession>;
  current(): Promise<FocusSession | null>;
  listByContext(
    contextId: ContextId,
    opts?: { limit?: number },
  ): Promise<FocusSession[]>;
}
