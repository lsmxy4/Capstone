import { useCallback, useEffect, useRef, useState } from 'react'
import type { Coordinates } from '../types/location'
import { acquireAccurateLocation } from '../utils/acquireAccurateLocation'

export function useGeolocation() {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null)
  const cancel = useRef<(() => void) | null>(null)
  const locate = useCallback(() => {
    cancel.current?.()
    setCoordinates(null)
    setAccuracyMeters(null)
    setError(null)
    setLoading(false)
    if (!window.isSecureContext) {
      setError('위치 기능은 HTTPS 또는 localhost에서 사용할 수 있습니다. 휴대폰에서는 HTTPS 주소로 접속해 주세요.')
      return
    }
    if (!navigator.geolocation) {
      setError('현재 브라우저는 위치 조회를 지원하지 않습니다.')
      return
    }
    setLoading(true)
    cancel.current = acquireAccurateLocation(navigator.geolocation, {
      onAccuracy: setAccuracyMeters,
      onSuccess: position => {
        setCoordinates({ latitude: position.coords.latitude, longitude: position.coords.longitude })
        setError(null)
        setLoading(false)
      },
      onError: message => { setError(message); setLoading(false) },
    })
  }, [])
  useEffect(() => {
    locate()
    return () => { cancel.current?.() }
  }, [locate])
  return { coordinates, loading, error, accuracyMeters, locate }
}
