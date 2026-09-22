import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { baseTime, parseWeather, toGrid, type WeatherItem } from './weather.ts'

type Config = { KAKAO_REST_API_KEY?: string; KMA_SERVICE_KEY?: string; AIRKOREA_SERVICE_KEY?: string }
type Next = () => void
class ApiError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

async function upstream<T>(url: URL, headers?: Record<string, string>): Promise<T> {
  let response = await fetch(url, { headers, signal: AbortSignal.timeout(12000) })
  if (response.status >= 500 && response.status < 600) {
    await new Promise(resolve => setTimeout(resolve, 300))
    response = await fetch(url, { headers, signal: AbortSignal.timeout(12000) })
  }
  if (!response.ok) {
    console.warn(`외부 API 오류: ${url.hostname}${url.pathname} HTTP ${response.status}`)
    const message = response.status === 401 || response.status === 403
      ? '외부 API 인증이 거절되었습니다. 서버의 인증키와 활용 승인을 확인하세요.'
      : response.status === 429
        ? '외부 API 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.'
        : '외부 API 서버가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해 주세요.'
    throw new ApiError(502, message)
  }
  try { return await response.json() as T } catch { throw new ApiError(502, 'API 응답을 읽을 수 없습니다. 인증키와 서비스 활용 승인을 확인하세요.') }
}

async function kma(config: Config, lat: number, lon: number, kind: 'observation' | 'forecast') {
  if (!config.KMA_SERVICE_KEY) throw new ApiError(503, '기상청 API 인증키가 아직 설정되지 않았습니다.')
  const { nx, ny } = toGrid(lat, lon)
  if (nx < 1 || nx > 149 || ny < 1 || ny > 253) throw new ApiError(400, '기상청 예보 지원 지역 밖입니다.')
  const endpoint = kind === 'observation' ? 'getUltraSrtNcst' : 'getVilageFcst'
  const base = baseTime(kind)
  const url = new URL(`https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/${endpoint}`)
  url.search = new URLSearchParams({ serviceKey: config.KMA_SERVICE_KEY, dataType: 'JSON', pageNo: '1', numOfRows: '1000', base_date: base.date, base_time: base.time, nx: String(nx), ny: String(ny) }).toString()
  const data = await upstream<{ response?: { header?: { resultCode: string }; body?: { items?: { item?: WeatherItem[] } } } }>(url)
  if (data.response?.header?.resultCode !== '00') throw new ApiError(502, '기상청 자료를 조회하지 못했습니다. 잠시 후 다시 시도하거나 인증키 활용 승인을 확인하세요.')
  const items = data.response?.body?.items?.item
  if (!Array.isArray(items) || !items.length) throw new ApiError(502, '기상청에서 아직 해당 시각의 자료를 제공하지 않습니다.')
  return { items: items as WeatherItem[], base }
}

type AirKoreaItem = Record<string, string | null | undefined>

function airValue(value: string | null | undefined) {
  if (value == null || value === '-' || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
}

function airGrade(value: string | null | undefined) {
  return ({ '1': '좋음', '2': '보통', '3': '나쁨', '4': '매우 나쁨' } as Record<string, string>)[value ?? ''] ?? '정보 없음'
}

function decodedServiceKey(value: string) {
  if (!/%[0-9a-f]{2}/i.test(value)) return value
  try { return decodeURIComponent(value) } catch { return value }
}

function uvGrade(value: number) {
  if (value >= 11) return '위험'
  if (value >= 8) return '매우 높음'
  if (value >= 6) return '높음'
  if (value >= 3) return '보통'
  return '낮음'
}

function kstUvBaseTime(now = new Date()) {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const year = kst.getUTCFullYear()
  const month = String(kst.getUTCMonth() + 1).padStart(2, '0')
  const day = String(kst.getUTCDate()).padStart(2, '0')
  return `${year}${month}${day}00`
}

async function uvIndex(config: Config, lat: number, lon: number) {
  if (!config.KAKAO_REST_API_KEY) throw new ApiError(503, '카카오 REST API 키가 아직 설정되지 않았습니다.')
  if (!config.KMA_SERVICE_KEY) throw new ApiError(503, '기상청 API 인증키가 아직 설정되지 않았습니다.')
  const regionUrl = new URL('https://dapi.kakao.com/v2/local/geo/coord2regioncode.json')
  regionUrl.search = new URLSearchParams({ x: String(lon), y: String(lat) }).toString()
  const regionData = await upstream<{ documents?: { region_type?: string; code?: string; address_name?: string }[] }>(regionUrl, { Authorization: `KakaoAK ${config.KAKAO_REST_API_KEY}` })
  const region = regionData.documents?.find(item => item.region_type === 'H') ?? regionData.documents?.[0]
  if (!region?.code) throw new ApiError(502, '자외선 조회에 필요한 행정구역 코드를 찾지 못했습니다.')

  const time = kstUvBaseTime()
  const areaCandidates = [region.code, `${region.code.slice(0, 5)}00000`, `${region.code.slice(0, 2)}00000000`]
  try {
    const url = new URL('https://apis.data.go.kr/1360000/LivingWthrIdxServiceV4/getUVIdxV4')
    url.search = new URLSearchParams({ serviceKey: decodedServiceKey(config.KMA_SERVICE_KEY), pageNo: '1', numOfRows: '10000', dataType: 'JSON', areaNo: '', time }).toString()
    const data = await upstream<{ response?: { header?: { resultCode?: string }; body?: { items?: { item?: Record<string, string>[] } } } }>(url)
    if (data.response?.header?.resultCode !== '00') throw new ApiError(502, '기상청 자외선지수를 조회하지 못했습니다.')
    const items = data.response.body?.items?.item ?? []
    const item = areaCandidates.map(areaNo => items.find(candidate => candidate.areaNo === areaNo)).find(Boolean)
    const value = Number(item?.h0)
    if (!Number.isFinite(value)) throw new ApiError(502, '기상청에서 현재 자외선지수를 제공하지 않습니다.')
    return { value, grade: uvGrade(value), area: region.address_name ?? null, forecastAt: time, source: '기상청' }
  } catch {
    const fallbackUrl = new URL('https://air-quality-api.open-meteo.com/v1/air-quality')
    fallbackUrl.search = new URLSearchParams({ latitude: String(lat), longitude: String(lon), current: 'uv_index', timezone: 'Asia/Seoul' }).toString()
    const fallback = await upstream<{ current?: { time?: string; uv_index?: number } }>(fallbackUrl)
    const value = Number(fallback.current?.uv_index)
    if (!Number.isFinite(value)) throw new ApiError(502, '현재 자외선지수를 제공하지 않습니다.')
    return { value, grade: uvGrade(value), area: region.address_name ?? null, forecastAt: fallback.current?.time ?? time, source: 'Open-Meteo' }
  }
}

async function airQuality(config: Config, lat: number, lon: number) {
  if (!config.KAKAO_REST_API_KEY) throw new ApiError(503, '카카오 REST API 키가 아직 설정되지 않았습니다.')
  if (!config.AIRKOREA_SERVICE_KEY) throw new ApiError(503, 'AirKorea API 인증키가 아직 설정되지 않았습니다.')

  const transformUrl = new URL('https://dapi.kakao.com/v2/local/geo/transcoord.json')
  transformUrl.search = new URLSearchParams({ x: String(lon), y: String(lat), input_coord: 'WGS84', output_coord: 'TM' }).toString()
  const transformed = await upstream<{ documents?: { x: number; y: number }[] }>(transformUrl, { Authorization: `KakaoAK ${config.KAKAO_REST_API_KEY}` })
  const tm = transformed.documents?.[0]
  if (!tm || !Number.isFinite(tm.x) || !Number.isFinite(tm.y)) throw new ApiError(502, '현재 위치를 대기질 측정소 좌표로 변환하지 못했습니다.')

  const nearbyUrl = new URL('https://apis.data.go.kr/B552584/MsrstnInfoInqireSvc/getNearbyMsrstnList')
  const serviceKey = decodedServiceKey(config.AIRKOREA_SERVICE_KEY)
  nearbyUrl.search = new URLSearchParams({ serviceKey, returnType: 'json', tmX: String(tm.x), tmY: String(tm.y), ver: '1.1' }).toString()
  const nearby = await upstream<{ response?: { header?: { resultCode?: string }; body?: { items?: AirKoreaItem[] } } }>(nearbyUrl)
  if (nearby.response?.header?.resultCode !== '00') throw new ApiError(502, 'AirKorea 측정소를 조회하지 못했습니다. 인증키와 서비스 활용 승인을 확인하세요.')
  const stationNames = (nearby.response.body?.items ?? []).slice(0, 3).map(item => item.stationName).filter((name): name is string => Boolean(name))
  if (!stationNames.length) throw new ApiError(502, '현재 위치에서 가까운 AirKorea 측정소를 찾지 못했습니다.')

  const measurements = await Promise.allSettled(stationNames.map(async stationName => {
    const measureUrl = new URL('https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty')
    measureUrl.search = new URLSearchParams({ serviceKey, returnType: 'json', numOfRows: '1', pageNo: '1', stationName, dataTerm: 'DAILY', ver: '1.3' }).toString()
    const measured = await upstream<{ response?: { header?: { resultCode?: string }; body?: { items?: AirKoreaItem[] } } }>(measureUrl)
    if (measured.response?.header?.resultCode !== '00') throw new ApiError(502, 'AirKorea 대기질 정보를 조회하지 못했습니다. 인증키와 서비스 활용 승인을 확인하세요.')
    const item = measured.response.body?.items?.[0]
    if (!item) throw new ApiError(502, 'AirKorea에서 최신 측정 자료를 제공하지 않습니다.')
    return { stationName, item }
  }))
  const available = measurements.flatMap(result => result.status === 'fulfilled' ? [result.value] : [])
  if (!available.length) throw new ApiError(502, 'AirKorea에서 최신 측정 자료를 제공하지 않습니다.')
  const selected = available.find(({ item }) => airValue(item.pm10Value) != null && airValue(item.pm25Value) != null)
    ?? available.find(({ item }) => airValue(item.pm10Value) != null || airValue(item.pm25Value) != null)
    ?? available[0]
  const { stationName, item } = selected

  return {
    source: 'AirKorea',
    warning: null,
    stationName,
    measuredAt: item.dataTime ?? null,
    overallGrade: airGrade(item.khaiGrade),
    pm10: { value: airValue(item.pm10Value), grade: airGrade(item.pm10Grade1h ?? item.pm10Grade) },
    pm25: { value: airValue(item.pm25Value), grade: airGrade(item.pm25Grade1h ?? item.pm25Grade) },
    ozone: { value: airValue(item.o3Value), grade: airGrade(item.o3Grade) },
  }
}

function dustGrade(value: number | null, good: number, moderate: number, bad: number) {
  if (value == null) return '정보 없음'
  return value <= good ? '좋음' : value <= moderate ? '보통' : value <= bad ? '나쁨' : '매우나쁨'
}

async function modelAirQuality(lat: number, lon: number) {
  const url = new URL('https://air-quality-api.open-meteo.com/v1/air-quality')
  url.search = new URLSearchParams({ latitude: String(lat), longitude: String(lon), current: 'pm10,pm2_5', timezone: 'Asia/Seoul' }).toString()
  const data = await upstream<{ current?: { time?: string; pm10?: number | null; pm2_5?: number | null } }>(url)
  const pm10 = data.current?.pm10 ?? null
  const pm25 = data.current?.pm2_5 ?? null
  if (pm10 == null && pm25 == null) throw new ApiError(502, '대체 대기질 자료를 제공하지 않습니다.')
  const pm10Grade = dustGrade(pm10, 30, 80, 150)
  const pm25Grade = dustGrade(pm25, 15, 35, 75)
  const severity: Record<string, number> = { '좋음': 0, '보통': 1, '나쁨': 2, '매우나쁨': 3 }
  const overallGrade = [pm10Grade, pm25Grade].filter(grade => grade !== '정보 없음')
    .sort((a, b) => severity[b] - severity[a])[0] ?? '정보 없음'
  return {
    source: 'Open-Meteo',
    warning: 'AirKorea 연결이 지연되어 모델 추정치를 표시합니다. 측정소 관측값과 다를 수 있습니다.',
    stationName: '현재 위치 인근',
    measuredAt: data.current?.time ?? null,
    overallGrade,
    pm10: { value: pm10, grade: pm10Grade },
    pm25: { value: pm25, grade: pm25Grade },
    ozone: { value: null, grade: '정보 없음' },
  }
}

async function resilientAirQuality(config: Config, lat: number, lon: number) {
  try { return await airQuality(config, lat, lon) }
  catch (originalError) {
    if (originalError instanceof ApiError && originalError.status === 503) throw originalError
    try { return await modelAirQuality(lat, lon) }
    catch { throw originalError }
  }
}

export function createApiHandler(config: Config) {
  const airCache = new Map<string, { expiresAt: number; value: Awaited<ReturnType<typeof resilientAirQuality>> }>()
  return async (req: IncomingMessage, res: ServerResponse, next: Next) => {
    const request = new URL(req.url ?? '/', 'http://localhost')
    if (!request.pathname.startsWith('/api/fitmap/')) return next()
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    try {
      if (req.method !== 'GET') throw new ApiError(405, 'GET 요청만 지원합니다.')
      const route = request.pathname.slice('/api/fitmap/'.length)
      if (!['weather', 'region', 'places', 'air-quality', 'uv'].includes(route)) throw new ApiError(404, '존재하지 않는 API입니다.')
      const lat = Number(request.searchParams.get('lat'))
      const lon = Number(request.searchParams.get('lon'))
      if (!request.searchParams.get('lat') || !request.searchParams.get('lon') || !Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) throw new ApiError(400, '유효한 위치 좌표가 필요합니다.')
      let result: unknown
      if (route === 'weather') {
        const [observation, forecast] = await Promise.allSettled([kma(config, lat, lon, 'observation'), kma(config, lat, lon, 'forecast')])
        if (observation.status === 'rejected') throw observation.reason
        result = { ...parseWeather(observation.value.items, forecast.status === 'fulfilled' ? forecast.value.items : []), observedAt: `${observation.value.base.date} ${observation.value.base.time}`, warning: forecast.status === 'rejected' ? '강수확률과 하늘상태 예보를 불러오지 못했습니다.' : null }
      } else if (route === 'air-quality') {
        const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`
        const cached = airCache.get(cacheKey)
        if (cached && cached.expiresAt > Date.now()) result = cached.value
        else {
          const value = await resilientAirQuality(config, lat, lon)
          airCache.set(cacheKey, { value, expiresAt: Date.now() + 5 * 60_000 })
          result = value
        }
      } else if (route === 'uv') {
        result = await uvIndex(config, lat, lon)
      } else {
        if (!config.KAKAO_REST_API_KEY) throw new ApiError(503, '카카오 REST API 키가 아직 설정되지 않았습니다.')
        const url = new URL(route === 'region' ? 'https://dapi.kakao.com/v2/local/geo/coord2regioncode.json' : 'https://dapi.kakao.com/v2/local/search/keyword.json')
        url.searchParams.set('x', String(lon))
        url.searchParams.set('y', String(lat))
        if (route === 'places') {
          const queries: Record<string, string> = { '러닝': '공원', '걷기': '산책로', '자전거': '자전거공원', '등산': '등산로', '수영': '수영장' }
          url.searchParams.set('query', queries[request.searchParams.get('exercise') ?? ''] ?? '공원')
          url.searchParams.set('radius', '10000')
          url.searchParams.set('sort', 'distance')
          const limit = request.searchParams.get('limit')
          const requestedLimit = limit == null ? NaN : Number(limit)
          url.searchParams.set('size', String(Number.isInteger(requestedLimit) ? Math.min(15, Math.max(1, requestedLimit)) : 3))
        }
        const data = await upstream<{ documents: Record<string, string>[] }>(url, { Authorization: `KakaoAK ${config.KAKAO_REST_API_KEY}` })
        if (!Array.isArray(data.documents)) throw new ApiError(502, '카카오 장소 응답 형식이 올바르지 않습니다.')
        if (route === 'region') {
          const region = data.documents.find(item => item.region_type === 'H') ?? data.documents[0]
          result = { address: region?.address_name ?? '주소 정보 없음', code: region?.code ?? null }
        } else {
          result = data.documents.map((item: Record<string, string>) => ({ id: item.id, name: item.place_name, category: item.category_name, address: item.road_address_name || item.address_name, distance: item.distance === '' || item.distance == null ? null : Number(item.distance), latitude: Number.isFinite(Number(item.y)) ? Number(item.y) : null, longitude: Number.isFinite(Number(item.x)) ? Number(item.x) : null, url: /^https?:\/\/place\.map\.kakao\.com\//.test(item.place_url) ? item.place_url : null }))
        }
      }
      res.end(JSON.stringify(result))
    } catch (error) {
      res.statusCode = error instanceof ApiError ? error.status : 502
      res.end(JSON.stringify({ error: error instanceof ApiError ? error.message : '외부 API 연결이 지연되거나 실패했습니다. 다시 시도해 주세요.' }))
    }
  }
}

export function fitmapApi(config: Config): Plugin {
  const handler = createApiHandler(config)
  return {
    name: 'fitmap-local-api',
    configureServer(server) { server.middlewares.use(handler) },
    configurePreviewServer(server) { server.middlewares.use(handler) },
  }
}
