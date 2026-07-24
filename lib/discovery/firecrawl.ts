import "server-only";

export function isFirecrawlConfigured(): boolean {
  return !!process.env.FIRECRAWL_API_KEY;
}

export interface SearchHit {
  url: string;
  title: string;
  description: string;
}

export async function searchWeb(query: string, limit = 8): Promise<SearchHit[]> {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch("https://api.firecrawl.dev/v2/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
      body: JSON.stringify({ query, limit }),
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const data = await res.json();
    const hits = (data?.data?.web ?? []) as { url?: string; title?: string; description?: string }[];
    return hits.map((h) => ({ url: h.url ?? "", title: h.title ?? "", description: h.description ?? "" }));
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
