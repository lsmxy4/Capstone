import { useEffect, useRef, useState } from 'react'

export type Point = { latitude: number; longitude: number }
export type RecordedPoint = Point & { id: string; recordedAt: string }

function distanceMeters(from: Point, to: Point) {
  const radius = 6371000
  const radians = (degrees: number) => degrees * Math.PI / 180
  const latitudeDelta = radians(to.latitude - from.latitude)
  const longitudeDelta = radians(to.longitude - from.longitude)
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(longitudeDelta / 2) ** 2
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function useMovementDistance(enabled: boolean) {
  const [meters, setMeters] = useState(0)
  const [points, setPoints] = useState<Point[]>([])
  const [latestPoint, setLatestPoint] = useState<RecordedPoint | null>(null)
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const previous = useRef<Point | null>(null)

  useEffect(() => {
    if (!enabled) return
    if (!navigator.geolocation) {
      setError('이 브라우저는 위치 추적을 지원하지 않습니다.')
      return
    }
    const watchId = navigator.geolocation.watchPosition(position => {
      const next = { latitude: position.coords.latitude, longitude: position.coords.longitude }
      setAccuracyMeters(position.coords.accuracy)
      setError(null)
      if (position.coords.accuracy > 100) {
        setPoints(value => value.length ? value : [next])
        return
      }
      if (!previous.current) {
        previous.current = next
        setPoints([next])
        setLatestPoint({ ...next, id: crypto.randomUUID(), recordedAt: new Date(position.timestamp).toISOString() })
        return
      }
      if (previous.current) {
        const segment = distanceMeters(previous.current, next)
        const minimumMovement = Math.max(5, position.coords.accuracy * .5)
        if (segment >= minimumMovement && segment < 1000) {
          setMeters(value => value + segment)
          setPoints(value => [...value.slice(-999), next])
          setLatestPoint({ ...next, id: crypto.randomUUID(), recordedAt: new Date(position.timestamp).toISOString() })
        }
      }
      previous.current = next
    }, failure => {
      setError(failure.code === 1 ? '위치 권한이 거부되었습니다. 브라우저 설정에서 위치를 허용해 주세요.' : failure.code === 3 ? '현재 위치 확인 시간이 초과되었습니다. 위치 서비스를 확인해 주세요.' : '현재 위치를 확인하지 못했습니다.')
    }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 })
    return () => navigator.geolocation.clearWatch(watchId)
  }, [enabled])

  return { meters, points, latestPoint, accuracyMeters, error }
}
