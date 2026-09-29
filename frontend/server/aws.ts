type Station = { id: string; latitude: number; longitude: number }
const rows = (text: string) => text.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#')).map(line => line.split(/[\s,]+/))

export function parseStations(text: string): Station[] {
  return rows(text).filter(row => /^\d+$/.test(row[0])).map(row => ({
    id: row[0], longitude: Number(row[1]), latitude: Number(row[2]),
  })).filter(station => Number.isFinite(station.latitude) && Math.abs(station.latitude) <= 90
    && Number.isFinite(station.longitude) && Math.abs(station.longitude) <= 180)
}

function distanceKm(lat: number, lon: number, station: Station) {
  const rad = Math.PI / 180
  const a = Math.sin((station.latitude - lat) * rad / 2) ** 2
    + Math.cos(lat * rad) * Math.cos(station.latitude * rad) * Math.sin((station.longitude - lon) * rad / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, a)))
}

const stamp = (now: number) => new Date(now + 9 * 3600_000).toISOString().slice(0, 16).replace(/[-T:]/g, '')

export function selectObservation(text: string, stations: Station[], lat: number, lon: number, now = Date.now()) {
  // Official nph-aws2_min columns: time, STN, WD1, WS1, WDS, WSS, WD10, WS10, TA, RE, ... HM.
  const latest = new Map<string, string[]>()
  const earliest = stamp(now - 20 * 60_000)
  const current = stamp(now)
  for (const row of rows(text)) {
    if (!/^\d{12}$/.test(row[0]) || row.length < 15 || row[0] < earliest || row[0] > current) continue
    const temperature = Number(row[8])
    if (!Number.isFinite(temperature) || temperature < -90 || temperature > 60) continue
    if (!latest.has(row[1]) || latest.get(row[1])![0] < row[0]) latest.set(row[1], row)
  }
  const nearest = stations.map(station => ({ station, distance: distanceKm(lat, lon, station) }))
    .filter(item => item.distance <= 50 && latest.has(item.station.id)).sort((a, b) => a.distance - b.distance)[0]
  if (!nearest) throw new Error('주변 50km 이내 AWS 관측소의 최근 자료가 없습니다. 잠시 후 다시 시도해 주세요.')
  const row = latest.get(nearest.station.id)!
  const value = (index: number, min: number, max: number) => {
    const number = Number(row[index])
    return Number.isFinite(number) && number >= min && number <= max ? number : null
  }
  return {
    temperature: value(8, -90, 60), humidity: value(14, 0, 100), wind: value(3, 0, 150),
    raining: value(9, 0, 1), observedAt: `${row[0].slice(0, 8)} ${row[0].slice(8)}`,
    stationId: nearest.station.id, stationDistanceKm: Math.round(nearest.distance * 10) / 10,
  }
}

export function createAwsLoader(key: string) {
  let stationCache: { data: Station[]; expires: number } | undefined
  let observationCache: { data: string; expires: number } | undefined
  async function fetchText(path: string, params: Record<string, string>) {
    const url = new URL(`https://apihub.kma.go.kr/api/typ01/${path}`)
    url.search = new URLSearchParams({ ...params, authKey: key }).toString()
    const response = await fetch(url, { signal: AbortSignal.timeout(12000) })
    if (!response.ok) {
      const service = path.includes('stn_inf') ? '지상관측 지점정보 조회(AWS)' : 'AWS 매분자료 조회'
      if (response.status === 403) throw new Error(`기상청 API허브에서 '${service}' 활용 신청 및 승인이 필요합니다.`)
      if (response.status === 401) throw new Error('기상청 API허브 인증키가 유효하지 않습니다. KMA_API_HUB_KEY를 확인하세요.')
      throw new Error(`기상청 ${service} 요청에 실패했습니다. (HTTP ${response.status})`)
    }
    return new TextDecoder('euc-kr').decode(await response.arrayBuffer())
  }
  return async (lat: number, lon: number) => {
    const now = Date.now()
    if (!stationCache || stationCache.expires <= now) {
      const data = parseStations(await fetchText('url/stn_inf.php', { inf: 'AWS', stn: '0', help: '0' }))
      if (!data.length) throw new Error('AWS 지점정보를 읽을 수 없습니다. 지상관측 지점정보 API 활용 승인을 확인하세요.')
      stationCache = { data, expires: now + 24 * 3600_000 }
    }
    let data = observationCache && observationCache.expires > now ? observationCache.data : null
    if (data === null) {
      data = await fetchText('cgi-bin/url/nph-aws2_min', {
        tm1: stamp(now - 9 * 60_000), tm2: stamp(now), stn: '0', disp: '0', help: '0',
      })
      // Do not cache authentication errors or malformed responses returned with HTTP 200.
      if (!rows(data).some(row => /^\d{12}$/.test(row[0]) && row.length >= 15)) {
        throw new Error('AWS 매분자료가 없습니다. 인증키와 AWS 매분자료 API 활용 승인을 확인하세요.')
      }
      observationCache = { data, expires: now + 60_000 }
    }
    return selectObservation(data, stationCache.data, lat, lon, now)
  }
}
