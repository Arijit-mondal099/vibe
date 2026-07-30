/**
 * Paths matching any pattern are rejected before writing.
 * Patterns cover: directory escape, absolute refs, secrets, VCS internals,
 * dependency dirs, and lockfiles.
 */
export const BLOCKED_PATH_PATTERNS: { pattern: RegExp; reason: string }[] = [
  // Directory escape
  { pattern: /\.\./, reason: "path traversal outside the project directory" },
  // Absolute / home refs
  { pattern: /^\//, reason: "absolute path outside the project directory" },
  { pattern: /^~/, reason: "home directory reference" },
  // Secrets
  { pattern: /(^|\/)\.env(\.\w+)?$/, reason: "environment/secrets file" },
  // Git internals
  { pattern: /(^|\/)\.git(\/|$)/, reason: "git internals" },
  // Dependency dirs
  { pattern: /(^|\/)node_modules(\/|$)/, reason: "dependency directory" },
  // Lockfiles
  { pattern: /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb)$/, reason: "lockfile" },
];

/** Check a file path against all blocked patterns. Returns `{ valid: false, reason }` on first match. */
export function validatePath(path: string): { valid: boolean; reason?: string } {
  const hit = BLOCKED_PATH_PATTERNS.find(r => r.pattern.test(path));
  return hit ? { valid: false, reason: hit.reason } : { valid: true };
}
