export type Weather = {
  source?: string
  stationId?: string
  stationDistanceKm?: number
  temperature: number | null
  humidity: number | null
  wind: number | null
  precipitation: number | null
  condition: string
  observedAt: string
  forecastAt: string | null
  warning: string | null
}
