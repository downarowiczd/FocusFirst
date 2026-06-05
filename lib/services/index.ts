// Use-case layer. Services orchestrate repositories and enforce domain rules
// like "exiting Focus Mode requires a Resume Anchor" or "only one active context".
//
// Services must depend only on lib/repositories/interfaces.ts — never on the DB driver.

export {};
