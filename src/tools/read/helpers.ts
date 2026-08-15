/**
 * Paths matching any pattern are rejected before reading.
 * Mirrors the same safety boundaries as the create-or-update-files tool.
 */
export const BLOCKED_READ_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /\.\./, reason: "path traversal outside the project directory" },
  { pattern: /^\//, reason: "absolute path outside the project directory" },
  { pattern: /^~/, reason: "home directory reference" },
  { pattern: /(^|\/)\.env(\.\w+)?$/, reason: "environment/secrets file" },
  { pattern: /(^|\/)\.git(\/|$)/, reason: "git internals" },
  { pattern: /(^|\/)node_modules(\/|$)/, reason: "dependency directory" },
  { pattern: /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb)$/, reason: "lockfile" },
];

/** Maximum chars returned per file. */
export const MAX_FILE_CHARS = 10_000;

/** Maximum files the agent can request in a single call. Prevents context blowup. */
export const MAX_FILES_PER_CALL = 20;

export interface Content {
  path: string;
  content: string;
}

export interface FileError {
  path: string;
  error: string;
}

export interface ReadResult {
  files: Content[];
  errors: FileError[];
}

/** Check a file path against all blocked patterns. Returns `{ valid: false, reason }` on first match. */
export function validatePath(path: string): { valid: boolean; reason?: string } {
  const hit = BLOCKED_READ_PATTERNS.find(r => r.pattern.test(path));
  return hit ? { valid: false, reason: hit.reason } : { valid: true };
}

/** Truncate to the last MAX_FILE_CHARS — the actionable part (errors, content) is at the end. */
export function truncate(text: string): string {
  return text.length > MAX_FILE_CHARS
    ? `...[truncated]...\n${text.slice(-MAX_FILE_CHARS)}`
    : text;
}
