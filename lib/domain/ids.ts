declare const brand: unique symbol;
type Brand<T, B> = T & { readonly [brand]: B };

export type ContextId = Brand<string, "ContextId">;
export type WorkItemId = Brand<string, "WorkItemId">;
export type CaptureId = Brand<string, "CaptureId">;
export type InterruptId = Brand<string, "InterruptId">;
export type FocusSessionId = Brand<string, "FocusSessionId">;

export type ISODateTime = Brand<string, "ISODateTime">;
