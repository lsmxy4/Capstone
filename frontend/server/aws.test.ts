import test from 'node:test'
import assert from 'node:assert/strict'
import { createAwsLoader, parseStations, selectObservation } from './aws.ts'

const stations = parseStations('# STN LON LAT\n101 127 37\n102 127.1 37\ninvalid response\n103 -999 -999')
const row = (time: string, id: string, ta = '-3.2', hm = '0', wind = '2.5') => `${time} ${id} 90 ${wind} 90 3 90 2 ${ta} 0 0 0 0 0 ${hm} 1000 1000 -5`
const now = Date.parse('2026-09-29T01:10:00Z')

test('AWS station permission failure identifies the service requiring approval', async () => {
  const original = globalThis.fetch
  globalThis.fetch = (async () => new Response('', { status: 403 })) as typeof fetch
  try {
    await assert.rejects(createAwsLoader('test-only')(37, 127), /지상관측 지점정보 조회\(AWS\).*활용 신청/)
  } finally { globalThis.fetch = original }
})

test('AWS selects nearest reporting station, latest minute, and preserves zero and negative values', () => {
  assert.equal(stations.length, 2)
  const data = selectObservation([row('202609291008', '101'), row('202609291009', '101'), row('202609291010', '102')].join('\n'), stations, 37, 127, now)
  assert.equal(data.stationId, '101')
  assert.equal(data.observedAt, '20260929 1009')
  assert.equal(data.temperature, -3.2)
  assert.equal(data.humidity, 0)
  assert.equal(data.wind, 2.5)
})

test('AWS ignores stale, future and missing temperature data; missing humidity/wind stay null', () => {
  const data = selectObservation([row('202609290900', '101'), row('202609291011', '101'), row('202609291010', '101', '-99.9'), row('202609291009', '102', '20', '-99.9', '-99.9')].join('\n'), stations, 37, 127, now)
  assert.equal(data.stationId, '102')
  assert.equal(data.humidity, null)
  assert.equal(data.wind, null)
  assert.throws(() => selectObservation(row('202609291009', '101'), stations, 33, 126, now), /50km/)
  assert.throws(() => selectObservation('<html>Invalid key</html>', stations, 37, 127, now))
})

test('AWS loader uses station metadata and minute endpoint, caches successful requests', async () => {
  const original = globalThis.fetch
  const calls: URL[] = []
  globalThis.fetch = (async input => {
    const url = new URL(String(input))
    calls.push(url)
    assert.equal(url.searchParams.get('authKey'), 'test-only')
    if (url.pathname.endsWith('stn_inf.php')) return new Response('101 127 37')
    assert.ok(url.pathname.endsWith('nph-aws2_min'))
    const stamp = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 16).replace(/[-T:]/g, '')
    return new Response(row(stamp, '101'))
  }) as typeof fetch
  try {
    const load = createAwsLoader('test-only')
    assert.equal((await load(37, 127)).stationId, '101')
    await load(37, 127)
    assert.equal(calls.length, 2)
  } finally { globalThis.fetch = original }
})
