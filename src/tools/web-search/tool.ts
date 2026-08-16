import { createTool } from "@inngest/agent-kit";
import { z } from "zod";
import { MAX_RESULTS, FETCH_TIMEOUT_MS, truncate } from "./helpers";
import type { SearchResult, SearchResponse } from "./helpers";
import { env } from "@/lib/env";

/**
 * Agent tool: search the web via the Tavily API.
 *
 * Flow:
 *  1. Check for TAVILY_API_KEY
 *  2. POST to Tavily search endpoint with a 15s timeout
 *  3. Map results into a typed { results: SearchResult[] } response
 *
 * Content is head-truncated at 10k chars — search snippets keep relevant
 * info at the start.
 */
export const webSearch = () => {
  return createTool({
    name: "web-search",

    description:
      "Search the web for current information. Returns a JSON object with " +
      "`results` (array of { title, url, content }). Use for " +
      "questions about current events, library/API documentation, or anything " +
      "that may have changed since training data.",

    parameters: z.object({ query: z.string() }),

    handler: async ({ query }, { step }) => {
      return await step?.run("web-search", async () => {
        const apiKey = env.TAVILY_API_KEY;

        // Abort if Tavily doesn't respond within the timeout
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        try {
          const response = await fetch("https://api.tavily.com/search", {
            signal: controller.signal,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              api_key: apiKey,
              query,
              max_results: MAX_RESULTS,
              search_depth: "basic",
            }),
          });

          if (!response.ok) {
            const errText = await response.text();
            return JSON.stringify({
              results: [],
              error: `Search failed (${response.status}): ${truncate(errText)}`,
            } satisfies SearchResponse);
          }

          const data = await response.json();

          const results: SearchResult[] = (data.results ?? []).map(
            (r: { title?: string; url?: string; content?: string }) => ({
              title: r.title ?? "",
              url: r.url ?? "",
              content: truncate(r.content ?? ""),
            }),
          );

          return JSON.stringify({ results } satisfies SearchResponse);
        } catch (error: unknown) {
          return JSON.stringify({
            results: [],
            error: `Web search error: ${error}`,
          } satisfies SearchResponse);
        } finally {
          clearTimeout(timer);
        }
      });
    },
  });
};
