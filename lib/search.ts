export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

export function hasSearchKey(): boolean {
  return Boolean(
    process.env.TAVILY_API_KEY || process.env.SERPER_API_KEY
  );
}

export function activeSearchProvider(): "serper" | "tavily" | null {
  if (process.env.SERPER_API_KEY) return "serper";
  if (process.env.TAVILY_API_KEY) return "tavily";
  return null;
}

async function searchTavily(query: string, maxResults: number): Promise<SearchResult[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      max_results: maxResults,
      search_depth: "basic",
    }),
  });
  if (!res.ok) {
    throw new Error(`Tavily respondió ${res.status}`);
  }
  const data = await res.json();
  const results: SearchResult[] = (data.results ?? []).map(
    (r: { title?: string; url?: string; content?: string }) => ({
      title: r.title ?? "",
      url: r.url ?? "",
      content: r.content ?? "",
    })
  );
  return results.filter((r) => r.url && r.content);
}

async function searchSerper(query: string, maxResults: number): Promise<SearchResult[]> {
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": process.env.SERPER_API_KEY!,
    },
    body: JSON.stringify({
      q: query,
      hl: "es",
      num: Math.min(maxResults + 3, 10),
    }),
  });
  if (!res.ok) {
    throw new Error(`Serper respondió ${res.status}`);
  }
  const data = await res.json();
  const organic: { title?: string; link?: string; snippet?: string }[] =
    data.organic ?? [];
  return organic
    .filter((r) => r.link && r.snippet)
    .slice(0, maxResults)
    .map((r) => ({
      title: r.title ?? "",
      url: r.link ?? "",
      content: r.snippet ?? "",
    }));
}

export async function searchWeb(
  query: string,
  maxResults = 5
): Promise<SearchResult[]> {
  if (process.env.SERPER_API_KEY) {
    return searchSerper(query, maxResults);
  }
  if (process.env.TAVILY_API_KEY) {
    return searchTavily(query, maxResults);
  }
  throw new Error(
    "Falta configurar el buscador: añade SERPER_API_KEY (serper.dev) o TAVILY_API_KEY en .env para investigar el mercado."
  );
}