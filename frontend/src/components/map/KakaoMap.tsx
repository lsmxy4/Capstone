import { useEffect, useRef, useState } from 'react'
import type { Coordinates } from '../../types/location'
import type { Place } from '../../types/place'

type LatLng = object
type KakaoMaps = {
  load: (callback: () => void) => void
  LatLng: new (latitude: number, longitude: number) => LatLng
  Map: new (container: HTMLElement, options: { center: LatLng; level: number }) => { setBounds: (bounds: object) => void }
  Marker: new (options: { map: object; position: LatLng; title?: string }) => object
  Polyline: new (options: { map: object; path: LatLng[]; strokeWeight: number; strokeColor: string; strokeOpacity: number; strokeStyle: string }) => object
  LatLngBounds: new () => { extend: (point: LatLng) => void }
}

declare global {
  interface Window { kakao?: { maps: KakaoMaps } }
}

let sdkPromise: Promise<KakaoMaps> | null = null

function loadKakaoMap(key: string) {
  if (window.kakao?.maps) return Promise.resolve(window.kakao.maps)
  if (sdkPromise) return sdkPromise
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`
    script.async = true
    script.onload = () => window.kakao?.maps.load(() => window.kakao?.maps ? resolve(window.kakao.maps) : reject(new Error('카카오 지도 SDK를 초기화하지 못했습니다.')))
    script.onerror = () => reject(new Error('카카오 지도 SDK를 불러오지 못했습니다.'))
    document.head.appendChild(script)
  })
  return sdkPromise
}

export default function KakaoMap({ coordinates, places }: { coordinates: Coordinates; places: Place[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const key = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY as string | undefined

  useEffect(() => {
    if (!key || !containerRef.current) return
    let cancelled = false
    loadKakaoMap(key).then(maps => {
      if (cancelled || !containerRef.current) return
      const current = new maps.LatLng(coordinates.latitude, coordinates.longitude)
      const map = new maps.Map(containerRef.current, { center: current, level: 5 })
      const bounds = new maps.LatLngBounds()
      bounds.extend(current)
      new maps.Marker({ map, position: current, title: '현재 위치' })
      places.forEach(place => {
        if (place.latitude == null || place.longitude == null) return
        const position = new maps.LatLng(place.latitude, place.longitude)
        bounds.extend(position)
        new maps.Marker({ map, position, title: place.name })
      })
      if (places.some(place => place.latitude != null && place.longitude != null)) map.setBounds(bounds)
      setError(null)
    }).catch(reason => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : '지도를 불러오지 못했습니다.')
    })
    return () => { cancelled = true }
  }, [coordinates, key, places])

  if (!key) return <div className="map-message"><b>카카오 지도 키가 필요합니다.</b><span><code>VITE_KAKAO_JAVASCRIPT_KEY</code>를 설정해 주세요.</span></div>
  return <div className="kakao-map" ref={containerRef}>{error && <div className="map-message">{error}</div>}</div>
}

export function MovementRouteMap({ points, emptyMessage = '현재 위치를 확인하는 중입니다.' }: { points: Coordinates[]; emptyMessage?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const key = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY as string | undefined

  useEffect(() => {
    if (!key || !containerRef.current || !points.length) return
    let cancelled = false
    loadKakaoMap(key).then(maps => {
      if (cancelled || !containerRef.current) return
      const path = points.map(point => new maps.LatLng(point.latitude, point.longitude))
      const map = new maps.Map(containerRef.current, { center: path.at(-1)!, level: 4 })
      const bounds = new maps.LatLngBounds()
      path.forEach(point => bounds.extend(point))
      new maps.Polyline({ map, path, strokeWeight: 5, strokeColor: '#675cf3', strokeOpacity: .85, strokeStyle: 'solid' })
      new maps.Marker({ map, position: path[0], title: '출발 위치' })
      if (path.length > 1) new maps.Marker({ map, position: path.at(-1)!, title: '현재 위치' })
      if (path.length > 1) map.setBounds(bounds)
      setError(null)
    }).catch(reason => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : '이동 경로 지도를 불러오지 못했습니다.')
    })
    return () => { cancelled = true }
  }, [key, points])

  if (!key) return <div className="route-map-message">카카오 JavaScript 지도 키를 설정하면 이동 경로가 표시됩니다.</div>
  if (!points.length) return <div className="route-map-message">{emptyMessage}</div>
  return <div className="movement-route-map" ref={containerRef}>{error && <div className="route-map-message">{error}</div>}</div>
}
