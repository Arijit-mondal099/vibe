/**
 * Commands matching any pattern are rejected before execution.
 * Covers: destructive filesystem ops, privilege escalation, resource
 * exhaustion, remote code execution, dev-server reuse (already running),
 * secrets exposure, and package-manager escalation.
 */
export const BLOCKED_PATTERNS: { pattern: RegExp; reason: string }[] = [
  // Destructive filesystem ops
  { pattern: /\brm\s+-rf\s+(\/|~|\.|\.\.|\*)(?!\S)/, reason: "recursive delete of a broad/root path" },
  { pattern: /\b(mkfs|fdisk|parted|shred|wipefs)\b/, reason: "disk/filesystem destructive operation" },
  { pattern: /\bdd\s+.*of=\/dev\//, reason: "raw disk write" },

  // Privilege escalation
  { pattern: /\bsudo\b/, reason: "privilege escalation" },
  { pattern: /\bchmod\s+(-R\s+)?(777|000)\b/, reason: "dangerous permission change" },
  { pattern: /\bchown\s+-R\b/, reason: "recursive ownership change" },

  // Resource exhaustion
  { pattern: /:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/, reason: "fork bomb" },

  // Remote code execution
  { pattern: /\b(curl|wget)\b.*\|\s*(bash|sh)\b/, reason: "piping remote script into a shell" },

  // Dev server (already running via sandbox start command)
  { pattern: /\b(npm|pnpm|yarn|bun)\s+run\s+dev\b/, reason: "dev server is already running in this sandbox" },
  { pattern: /\bnext\s+(dev|start)\b/, reason: "dev server is already running in this sandbox" },

  // Secrets exposure
  { pattern: /\bcat\s+.*\.env(\.\w+)?\b/, reason: "reading secrets file" },
  { pattern: /(^|[;&|]\s*)(printenv|env)(\s|$)(?!\s*-)/, reason: "dumping environment variables" },

  // Package manager escalation
  { pattern: /\b(npm|pnpm|yarn|bun)\s+install\s+.*-g\b/, reason: "global package install" },
  { pattern: /\bnpm\s+publish\b/, reason: "publishing to a real registry" },
];

/** Maximum chars returned to the agent. Tail is kept — CLI errors/build results are bottom-heavy. */
export const MAX_OUTPUT_CHARS = 10_000;

/** Per-command timeout. Prevents a hung process from blocking the agent indefinitely. */
export const TIMEOUT_MS = 180_000;

/** Keep the last MAX_OUTPUT_CHARS chars — the actionable part (errors, summaries) is at the end. */
export function truncate(text: string): string {
  return text.length > MAX_OUTPUT_CHARS
    ? `...[truncated]...\n${text.slice(-MAX_OUTPUT_CHARS)}`
    : text;
}
