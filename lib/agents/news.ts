import "server-only"

const DEFAULT_NEWS_URL = "https://newsapi.org/v2/"
const MAX_ARTICLES = 5

export type NewsQuery = {
  country?: string
  category?: string
  query?: string
  pageSize?: number
}

export type NewsArticle = {
  title: string
  url: string
  source: string
  description?: string
  publishedAt?: string
}

export type NewsSummary = {
  totalResults: number
  articles: NewsArticle[]
  narrative: string
}

type NewsApiResponse = {
  status: "ok" | "error"
  totalResults?: number
  articles?: Array<{
    title?: string
    url?: string
    description?: string
    source?: { name?: string }
    publishedAt?: string
  }>
  code?: string
  message?: string
}

export async function fetchTopHeadlines({
  country = "us",
  category,
  query,
  pageSize = MAX_ARTICLES,
}: NewsQuery = {}): Promise<NewsSummary> {
  const apiKey = process.env.NEWS_API_KEY
  const baseUrl = process.env.NEWS_API_URL ?? DEFAULT_NEWS_URL

  if (!apiKey) {
    throw new Error("News API is not configured. Set NEWS_API_KEY.")
  }

  const normalizedPageSize = clamp(pageSize, 1, MAX_ARTICLES)

  const url = new URL("top-headlines", ensureTrailingSlash(baseUrl))
  url.searchParams.set("apiKey", apiKey)
  url.searchParams.set("pageSize", String(normalizedPageSize))
  url.searchParams.set("country", country.toLowerCase())

  if (category) {
    url.searchParams.set("category", category.toLowerCase())
  }

  if (query) {
    url.searchParams.set("q", query)
  }

  const response = await fetch(url.toString(), { cache: "no-store" })
  const payload = (await response.json().catch(() => ({}))) as NewsApiResponse

  if (!response.ok || payload.status === "error") {
    const reason = payload.message ?? `status ${response.status}`
    throw new Error(`News lookup failed: ${reason}`)
  }

  const articles: NewsArticle[] =
    payload.articles?.slice(0, normalizedPageSize).map((article) => ({
      title: article.title ?? "Untitled",
      url: article.url ?? "",
      description: article.description ?? undefined,
      source: article.source?.name ?? "Unknown",
      publishedAt: article.publishedAt,
    })) ?? []

  return {
    totalResults: payload.totalResults ?? articles.length,
    articles,
    narrative: buildNewsNarrative(articles),
  }
}

function ensureTrailingSlash(value: string) {
  return value.endsWith("/") ? value : `${value}/`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function buildNewsNarrative(articles: NewsArticle[]) {
  if (!articles.length) {
    return "No fresh headlines were available for the requested filters."
  }

  const highlights = articles
    .map((article, index) => `${index + 1}. ${article.title} (${article.source})`)
    .join(" ")

  return `Top headlines: ${highlights}`
}

