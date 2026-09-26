import type { Weather } from '../types/weather'
import type { AirQuality } from '../types/airQuality'
import type { UvIndex } from '../types/uv'

const defaults: Record<string, { minutes: number; kcalPerMinute: number }> = {
  '러닝': { minutes: 40, kcalPerMinute: 9 },
  '걷기': { minutes: 50, kcalPerMinute: 4 },
  '자전거': { minutes: 60, kcalPerMinute: 7 },
  '등산': { minutes: 90, kcalPerMinute: 7 },
  '수영': { minutes: 45, kcalPerMinute: 8 },
}

export type RecommendationStatus = 'location-loading' | 'location-error' | 'location-required' | 'weather-loading' | 'weather-error' | 'weather-idle'

export function recommendationStatus(location: { loading: boolean; error: string | null; coordinates: unknown }, weather: { loading: boolean; error: string | null }): RecommendationStatus {
  if (location.loading) return 'location-loading'
  if (location.error) return 'location-error'
  if (!location.coordinates) return 'location-required'
  if (weather.loading) return 'weather-loading'
  if (weather.error) return 'weather-error'
  return 'weather-idle'
}

export function dailyExerciseRecommendation(exercise: string, weather: Weather | null, air: AirQuality | null, uv: UvIndex | null, status: RecommendationStatus = 'weather-idle') {
  const base = defaults[exercise] ?? defaults['러닝']
  if (!weather) {
    const messages: Record<RecommendationStatus, [string, string]> = {
      'location-loading': ['위치 확인 중', '현재 위치를 확인하고 있습니다.'],
      'location-error': ['위치 확인 실패', '위치를 확인하지 못해 추천을 표시할 수 없습니다. 위치 권한을 확인한 뒤 다시 시도해 주세요.'],
      'location-required': ['위치 연결 필요', '내 위치를 연결하면 날씨에 맞는 운동을 추천해 드립니다.'],
      'weather-loading': ['날씨 확인 중', '현재 위치의 날씨를 불러오고 있습니다.'],
      'weather-error': ['날씨 조회 실패', '날씨를 불러오지 못해 추천을 표시할 수 없습니다. 다시 시도해 주세요.'],
      'weather-idle': ['날씨 정보 없음', '날씨 정보가 없어 추천을 표시할 수 없습니다. 다시 시도해 주세요.'],
    }
    const [time, message] = messages[status]
    return { minutes: null, intensity: status.endsWith('loading') ? '계산 중' : '정보 없음', calories: null, time, message }
  }
  let minutes = base.minutes
  let intensity = '보통'
  let time = '17:00 ~ 19:00'
  const reasons: string[] = []
  const outdoor = exercise !== '수영'
  const badAir = [air?.pm10.grade, air?.pm25.grade].some(grade => grade?.includes('나쁨'))
  const rainy = (weather.precipitation ?? 0) >= 60 || /비|눈|소나기/.test(weather.condition)
  const preferIndoor = outdoor && (rainy || badAir)

  if (weather.temperature != null && (weather.temperature <= 0 || weather.temperature >= 33)) {
    minutes = Math.min(minutes, 20); intensity = '낮음'; reasons.push('기온이 운동하기에 부담스러운 수준입니다.')
  } else if (weather.temperature != null && (weather.temperature < 5 || weather.temperature >= 30)) {
    minutes = Math.min(minutes, 30); intensity = '낮음'; reasons.push('기온을 고려해 운동 강도를 낮췄습니다.')
  }
  if (weather.temperature != null && weather.temperature >= 27) time = '06:00 ~ 08:00'
  if (outdoor && rainy) { minutes = Math.min(minutes, 20); intensity = '낮음'; time = '실내 운동 권장'; reasons.push('강수 가능성이 있어 야외 운동 시간을 줄였습니다.') }
  if (outdoor && (weather.wind ?? 0) >= 8) { minutes = Math.min(minutes, 30); intensity = '낮음'; reasons.push('바람이 강해 안전에 주의해야 합니다.') }
  if (outdoor && (uv?.value ?? 0) >= 6) {
    minutes = Math.min(minutes, 35)
    if (!preferIndoor) time = '18:00 ~ 20:00'
    reasons.push(preferIndoor ? `자외선도 ${uv?.grade} 단계이므로 야외 노출에 주의해 주세요.` : `자외선이 ${uv?.grade} 단계여서 해가 약한 시간을 권장합니다.`)
  }
  if (outdoor && badAir) { minutes = Math.min(minutes, 20); intensity = '낮음'; time = '실내 운동 권장'; reasons.push('미세먼지가 나빠 야외 운동을 권장하지 않습니다.') }

  if (preferIndoor) time = '실내 운동 권장'
  return { minutes, intensity, calories: Math.round(minutes * base.kcalPerMinute), time, message: reasons.length ? reasons.join(' ') : '오늘은 야외 운동하기 무난한 날씨입니다.' }
}
