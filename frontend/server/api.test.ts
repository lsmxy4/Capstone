import test from 'node:test'
import assert from 'node:assert/strict'
import { baseTime, parseWeather, toGrid } from './weather.ts'
import { createApiHandler } from './api.ts'
import type { IncomingMessage, ServerResponse } from 'node:http'

test('Seoul coordinates convert to the expected KMA grid', () => {
  assert.deepEqual(toGrid(37.5665, 126.978), { nx: 60, ny: 127 })
})

test('KST base dates cross midnight and forecast publication boundaries', () => {
  assert.deepEqual(baseTime('observation', new Date('2026-09-14T15:20:00Z')), { date: '20260914', time: '2300' })
  assert.deepEqual(baseTime('forecast', new Date('2026-09-14T17:30:00Z')), { date: '20260914', time: '2300' })
  assert.deepEqual(baseTime('forecast', new Date('2026-09-14T18:10:00Z')), { date: '20260915', time: '0200' })
})

test('preserves zero, negative temperatures, decimals, and missing fields', () => {
  const weather = parseWeather([{ category: 'T1H', obsrValue: '-3.2' }, { category: 'REH', obsrValue: '0' }, { category: 'WSD', obsrValue: '-999' }], [
    { category: 'POP', fcstValue: '0', fcstDate: '20260915', fcstTime: '1000' },
    { category: 'SKY', fcstValue: '1', fcstDate: '20260915', fcstTime: '1000' },
  ], new Date('2026-09-15T01:15:00Z'))
  assert.equal(weather.temperature, -3.2)
  assert.equal(weather.humidity, 0)
  assert.equal(weather.wind, null)
  assert.equal(weather.precipitation, 0)
  assert.equal(weather.condition, '맑음')
  assert.equal(parseWeather([], []).temperature, null)
})

async function call(url: string, config = {}) {
  let text = ''
  const response = { statusCode: 200, setHeader() {}, end(value: string) { text = value } }
  await createApiHandler(config)({ url, method: 'GET' } as IncomingMessage, response as unknown as ServerResponse, () => {})
  return { status: response.statusCode, data: JSON.parse(text) }
}

test('invalid coordinates and missing keys fail clearly without upstream calls', async () => {
  assert.equal((await call('/api/fitmap/weather?lat=bad&lon=127')).status, 400)
  assert.equal((await call('/api/fitmap/weather?lat=37.5&lon=127')).status, 503)
  assert.equal((await call('/api/fitmap/places?lat=37.5&lon=127')).status, 503)
  assert.equal((await call('/api/fitmap/air-quality?lat=37.5&lon=127')).status, 503)
  assert.equal((await call('/api/fitmap/unknown?lat=37.5&lon=127')).status, 404)
})

test('AirKorea flow finds a nearby station and normalizes measurements', async () => {
  const original = globalThis.fetch
  globalThis.fetch = (async input => {
    const url = new URL(String(input))
    if (url.hostname === 'dapi.kakao.com') return new Response(JSON.stringify({ documents: [{ x: 200000, y: 450000 }] }))
    assert.equal(url.searchParams.get('serviceKey'), 'air/+test')
    if (url.pathname.includes('getNearbyMsrstnList')) return new Response(JSON.stringify({ response: { header: { resultCode: '00' }, body: { items: [{ stationName: '이촌동' }, { stationName: '용산구' }] } } }))
    const missingDust = url.searchParams.get('stationName') === '이촌동'
    return new Response(JSON.stringify({ response: { header: { resultCode: '00' }, body: { items: [{ dataTime: '2026-09-18 10:00', khaiGrade: '2', pm10Value: missingDust ? '-' : '31', pm10Grade1h: '2', pm25Value: missingDust ? '-' : '12', pm25Grade1h: '1', o3Value: '0.021', o3Grade: '1' }] } } }))
  }) as typeof fetch
  try {
    const result = await call('/api/fitmap/air-quality?lat=37.5&lon=127', { KAKAO_REST_API_KEY: 'kakao-test', AIRKOREA_SERVICE_KEY: 'air%2F%2Btest' })
    assert.equal(result.status, 200)
    assert.equal(result.data.stationName, '용산구')
    assert.deepEqual(result.data.pm25, { value: 12, grade: '좋음' })
    assert.deepEqual(result.data.ozone, { value: 0.021, grade: '좋음' })
    assert.equal(JSON.stringify(result.data).includes('air-test'), false)
  } finally { globalThis.fetch = original }
})

test('temporary AirKorea failure uses clearly labelled model dust values', async () => {
  const original = globalThis.fetch
  globalThis.fetch = (async input => {
    const url = new URL(String(input))
    if (url.hostname === 'dapi.kakao.com') return new Response(JSON.stringify({ documents: [{ x: 200000, y: 450000 }] }))
    if (url.hostname === 'apis.data.go.kr') return new Response('', { status: 504 })
    assert.equal(url.hostname, 'air-quality-api.open-meteo.com')
    return new Response(JSON.stringify({ current: { time: '2026-09-22T10:00', pm10: 31, pm2_5: 36 } }))
  }) as typeof fetch
  try {
    const result = await call('/api/fitmap/air-quality?lat=37.5&lon=127', { KAKAO_REST_API_KEY: 'test-only', AIRKOREA_SERVICE_KEY: 'test-only' })
    assert.equal(result.status, 200)
    assert.equal(result.data.source, 'Open-Meteo')
    assert.equal(result.data.pm10.grade, '보통')
    assert.equal(result.data.pm25.grade, '나쁨')
    assert.equal(result.data.ozone.value, null)
    assert.match(result.data.warning, /모델 추정치/)
  } finally { globalThis.fetch = original }
})

test('UV flow uses current model data without the rejected KMA request', async () => {
  const original = globalThis.fetch
  globalThis.fetch = (async input => {
    const url = new URL(String(input))
    assert.equal(url.hostname, 'air-quality-api.open-meteo.com')
    assert.equal(url.searchParams.get('current'), 'uv_index')
    return new Response(JSON.stringify({ current: { time: '2026-09-22T11:00', uv_index: 7 } }))
  }) as typeof fetch
  try {
    const result = await call('/api/fitmap/uv?lat=37.65&lon=127.12')
    assert.equal(result.status, 200)
    assert.equal(result.data.value, 7)
    assert.equal(result.data.grade, '높음')
    assert.equal(result.data.source, 'Open-Meteo')
  } finally { globalThis.fetch = original }
})

test('Kakao requests attach server key, encode query and normalize results', async () => {
  const original = globalThis.fetch
  globalThis.fetch = (async (input, options) => {
    const url = new URL(String(input))
    assert.equal(url.origin, 'https://dapi.kakao.com')
    assert.equal(url.searchParams.get('query'), '수영장')
    assert.equal(url.searchParams.get('size'), '3')
    assert.equal((options?.headers as Record<string, string>).Authorization, 'KakaoAK test-only')
    return new Response(JSON.stringify({ documents: [{ id: '1', place_name: '테스트 수영장', category_name: '운동 > 수영장', address_name: '테스트 주소', distance: '1200', x: '127.1', y: '37.5', place_url: 'https://place.map.kakao.com/1' }] }))
  }) as typeof fetch
  try {
    const result = await call('/api/fitmap/places?lat=37.5&lon=127&exercise=수영', { KAKAO_REST_API_KEY: 'test-only' })
    assert.equal(result.status, 200)
    assert.equal(result.data[0].distance, 1200)
    assert.equal(result.data[0].latitude, 37.5)
    assert.equal(JSON.stringify(result.data).includes('test-only'), false)
  } finally { globalThis.fetch = original }
})
