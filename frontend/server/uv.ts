import { readFileSync } from 'node:fs'

type Area = { code: string; name: string; lat: number; lon: number }
// KMA dfs-zone-tree_excel_20260701.xlsx, current administrative areas.
const areas: Area[] = JSON.parse(readFileSync(new URL('./data/kma-uv-areas.json', import.meta.url), 'utf8'))

export function uvArea(lat: number, lon: number) {
  let best: Area | undefined
  let distance = Infinity
  for (const area of areas) {
    const dy = (area.lat - lat) * Math.PI / 180
    const dx = (area.lon - lon) * Math.PI / 180
    const a = Math.sin(dy / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(area.lat * Math.PI / 180) * Math.sin(dx / 2) ** 2
    const km = 12742 * Math.asin(Math.sqrt(a))
    if (km < distance) { distance = km; best = area }
  }
  if (!best || distance > 50) throw new Error('기상청 자외선 예보 지원 지역 밖입니다.')
  return best
}

export function uvTime(now = new Date()) {
  const kst = new Date(now.getTime() + 9 * 3600_000)
  kst.setUTCHours(Math.floor(kst.getUTCHours() / 3) * 3, 0, 0, 0)
  return kst.toISOString().slice(0, 13).replace(/[-T]/g, '')
}

export function parseUv(item: Record<string, string>, now = new Date()) {
  if (!/^\d{10}$/.test(item.date ?? '')) throw new Error('기상청 자외선 예보 시각이 올바르지 않습니다.')
  const stamp = item.date
  const issued = Date.parse(`${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}T${stamp.slice(8)}:00:00+09:00`)
  const offset = Math.floor((now.getTime() - issued) / (3 * 3600_000)) * 3
  const raw = item[`h${offset}`]
  const value = raw == null || raw.trim() === '' ? NaN : Number(raw)
  if (offset < 0 || offset > 75 || !Number.isFinite(value) || value < 0) throw new Error('기상청에서 현재 시각의 자외선 예보를 제공하지 않습니다.')
  const forecastAt = new Date(issued + offset * 3600_000 + 9 * 3600_000).toISOString().slice(0, 16)
  return { value, forecastAt }
}
