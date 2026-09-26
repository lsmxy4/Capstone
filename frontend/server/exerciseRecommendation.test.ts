import test from 'node:test'
import assert from 'node:assert/strict'
import { dailyExerciseRecommendation, recommendationStatus } from '../src/utils/exerciseRecommendation.ts'
import type { Weather } from '../src/types/weather.ts'
import type { AirQuality } from '../src/types/airQuality.ts'

const clear: Weather = { temperature: 22, humidity: 50, wind: 2, precipitation: 0, condition: '맑음', observedAt: '', forecastAt: null, warning: null }
const highUv = { value: 8, grade: '매우 높음', area: null, forecastAt: '', source: '' }
const badAir: AirQuality = { source: 'AirKorea', warning: null, stationName: '', measuredAt: null, overallGrade: '나쁨', pm10: { value: 100, grade: '나쁨' }, pm25: { value: 10, grade: '좋음' }, ozone: { value: 0, grade: '좋음' } }

test('rain and high UV preserve indoor recommendation without conflicting evening advice', () => {
  const result = dailyExerciseRecommendation('러닝', { ...clear, precipitation: 80 }, null, highUv)
  assert.equal(result.time, '실내 운동 권장')
  assert.equal(result.minutes, 20)
  assert.doesNotMatch(result.message, /해가 약한 시간을 권장/)
})
test('poor air and high UV preserve indoor recommendation', () => {
  assert.equal(dailyExerciseRecommendation('러닝', clear, badAir, highUv).time, '실내 운동 권장')
})
test('high UV alone still recommends evening and ordinary weather retains normal time', () => {
  assert.equal(dailyExerciseRecommendation('러닝', clear, null, highUv).time, '18:00 ~ 20:00')
  assert.equal(dailyExerciseRecommendation('러닝', clear, null, null).time, '17:00 ~ 19:00')
})
test('missing weather distinguishes loading, denied location, idle and failed requests', () => {
  const weather = { loading: false, error: null }
  const statuses = [
    recommendationStatus({ loading: true, error: null, coordinates: null }, weather),
    recommendationStatus({ loading: false, error: '권한 거부', coordinates: null }, weather),
    recommendationStatus({ loading: false, error: null, coordinates: null }, weather),
    recommendationStatus({ loading: false, error: null, coordinates: {} }, { loading: true, error: null }),
    recommendationStatus({ loading: false, error: null, coordinates: {} }, { loading: false, error: '서버 오류' }),
    recommendationStatus({ loading: false, error: null, coordinates: {} }, weather),
  ]
  assert.deepEqual(statuses.map(status => dailyExerciseRecommendation('러닝', null, null, null, status).time), ['위치 확인 중', '위치 확인 실패', '위치 연결 필요', '날씨 확인 중', '날씨 조회 실패', '날씨 정보 없음'])
  for (const status of statuses) {
    const result = dailyExerciseRecommendation('러닝', null, null, null, status)
    assert.equal(result.minutes, null)
    assert.equal(result.calories, null)
    if (!status.endsWith('loading')) assert.equal(result.intensity, '정보 없음')
  }
})
test('successful retry resumes normal recommendations', () => {
  assert.equal(dailyExerciseRecommendation('러닝', clear, null, null, 'weather-idle').minutes, 40)
})
