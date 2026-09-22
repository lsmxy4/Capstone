export type AirMetric = {
  value: number | null
  grade: string
}

export type AirQuality = {
  source: 'AirKorea' | 'Open-Meteo'
  warning: string | null
  stationName: string
  measuredAt: string | null
  overallGrade: string
  pm10: AirMetric
  pm25: AirMetric
  ozone: AirMetric
}
