export const MAX_RESULTS = 5;
export const MAX_CONTENT_CHARS = 10_000;
export const FETCH_TIMEOUT_MS = 15_000;

export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

export interface SearchResponse {
  results: SearchResult[];
  error?: string;
}

/** Truncate from the head — search snippets put the relevant info at the start. */
export function truncate(text: string): string {
  return text.length > MAX_CONTENT_CHARS
    ? `${text.slice(0, MAX_CONTENT_CHARS)}\n...[truncated]...`
    : text;
}
