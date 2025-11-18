import "server-only"

const DEFAULT_WEATHER_URL = "https://api.weatherapi.com/v1/"

export type WeatherUnit = "celsius" | "fahrenheit"

export type WeatherQuery = {
  location: string
  unit?: WeatherUnit
}

export type WeatherSummary = {
  location: string
  condition: string
  temperatureC: number
  temperatureF: number
  feelsLikeC: number
  feelsLikeF: number
  humidity: number
  windKph: number
  windMph: number
  lastUpdated: string
  narrative: string
}

type WeatherApiResponse = {
  location?: {
    name: string
    region: string
    country: string
    localtime: string
  }
  current?: {
    temp_c: number
    temp_f: number
    feelslike_c: number
    feelslike_f: number
    humidity: number
    wind_kph: number
    wind_mph: number
    condition?: { text: string }
    last_updated: string
  }
  error?: {
    code: number
    message: string
  }
}

export async function fetchWeatherSummary({ location, unit = "celsius" }: WeatherQuery): Promise<WeatherSummary> {
  if (!location.trim()) {
    throw new Error("Please provide a city, region, or coordinates for the weather lookup.")
  }

  const apiKey = process.env.WEATHER_API_KEY
  const baseUrl = process.env.WEATHER_API_URL ?? DEFAULT_WEATHER_URL

  if (!apiKey) {
    throw new Error("Weather API is not configured. Set WEATHER_API_KEY.")
  }

  const url = new URL("current.json", ensureTrailingSlash(baseUrl))
  url.searchParams.set("key", apiKey)
  url.searchParams.set("q", location)
  url.searchParams.set("aqi", "no")

  const response = await fetch(url.toString(), { cache: "no-store" })
  const payload = (await response.json().catch(() => ({}))) as WeatherApiResponse

  if (!response.ok || payload?.error) {
    const reason = payload?.error?.message ?? `status ${response.status}`
    throw new Error(`Weather lookup failed: ${reason}`)
  }

  if (!payload.location || !payload.current) {
    throw new Error("Weather API returned an unexpected response.")
  }

  const locationLabel = [payload.location.name, payload.location.region, payload.location.country]
    .filter(Boolean)
    .join(", ")

  const summary: WeatherSummary = {
    location: locationLabel,
    condition: payload.current.condition?.text ?? "Unknown conditions",
    temperatureC: payload.current.temp_c,
    temperatureF: payload.current.temp_f,
    feelsLikeC: payload.current.feelslike_c,
    feelsLikeF: payload.current.feelslike_f,
    humidity: payload.current.humidity,
    windKph: payload.current.wind_kph,
    windMph: payload.current.wind_mph,
    lastUpdated: payload.current.last_updated,
    narrative: buildWeatherNarrative(payload as Required<Pick<WeatherApiResponse, "current">> & WeatherApiResponse, locationLabel, unit),
  }

  return summary
}

function ensureTrailingSlash(value: string) {
  return value.endsWith("/") ? value : `${value}/`
}

function buildWeatherNarrative(payload: Required<Pick<WeatherApiResponse, "current">> & WeatherApiResponse, label: string, unit: WeatherUnit) {
  const current = payload.current
  const temperature = unit === "fahrenheit" ? current.temp_f : current.temp_c
  const feelsLike = unit === "fahrenheit" ? current.feelslike_f : current.feelslike_c
  const suffix = unit === "fahrenheit" ? "°F" : "°C"

  return `${label}: ${current.condition?.text ?? "Weather update unavailable"}. ` +
    `Temperature ${temperature}${suffix} (feels like ${feelsLike}${suffix}), ` +
    `humidity ${current.humidity}% with winds around ${current.wind_kph} kph.`
}

