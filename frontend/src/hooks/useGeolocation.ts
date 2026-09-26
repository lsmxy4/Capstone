import { useCallback, useEffect, useRef, useState } from 'react'
import type { Coordinates } from '../types/location'
import { isUsableLocation, inaccurateLocationMessage } from '../utils/locationAccuracy'

export function useGeolocation() {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)
  useEffect(() => () => { requestId.current++ }, [])
  const locate = useCallback(() => {
    const id = ++requestId.current
    if (!navigator.geolocation) { setError('현재 브라우저는 위치 조회를 지원하지 않습니다.'); return }
    setLoading(true)
    setError(null)
    setCoordinates(null)
    navigator.geolocation.getCurrentPosition(position => {
      if (id !== requestId.current) return
      if (!isUsableLocation(position.coords)) {
        setError(inaccurateLocationMessage(position.coords.accuracy))
        setLoading(false)
        return
      }
      setCoordinates({ latitude: position.coords.latitude, longitude: position.coords.longitude })
      setLoading(false)
    }, failure => {
      if (id !== requestId.current) return
      setError(failure.code === 1 ? '위치 권한이 거부되었습니다. 브라우저 설정에서 허용 후 다시 시도해 주세요.' : failure.code === 3 ? '위치 확인 시간이 초과되었습니다. 다시 시도해 주세요.' : '위치를 확인할 수 없습니다. 위치 서비스를 확인해 주세요.')
      setLoading(false)
    }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 })
  }, [])
  useEffect(() => { locate() }, [locate])
  return { coordinates, loading, error, locate }
}
