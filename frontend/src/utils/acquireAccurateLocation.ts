import { isUsableLocation, inaccurateLocationMessage } from './locationAccuracy.ts'

type Callbacks = {
  onAccuracy: (meters: number) => void
  onSuccess: (position: GeolocationPosition) => void
  onError: (message: string) => void
}

// Keep listening after a coarse first fix; stop when a usable fix arrives.
export function acquireAccurateLocation(geo: Pick<Geolocation, 'watchPosition' | 'clearWatch'>, callbacks: Callbacks, timeoutMs = 45000) {
  let stopped = false
  let watchId: number | undefined
  let lastAccuracy: number | null = null
  const stop = () => {
    stopped = true
    clearTimeout(timer)
    if (watchId !== undefined) geo.clearWatch(watchId)
  }
  const fail = (message: string) => {
    if (stopped) return
    stop()
    callbacks.onError(message)
  }
  const timer = setTimeout(() => fail(lastAccuracy == null
    ? '정확한 위치를 확인하지 못했습니다. 기기의 위치 서비스를 켜고, 하늘이 잘 보이는 곳에서 다시 시도해 주세요.'
    : inaccurateLocationMessage(lastAccuracy)), timeoutMs)
  try {
    watchId = geo.watchPosition(position => {
      if (stopped) return
      lastAccuracy = position.coords.accuracy
      callbacks.onAccuracy(lastAccuracy)
      if (!isUsableLocation(position.coords)) return
      stop()
      callbacks.onSuccess(position)
    }, error => {
      if (stopped) return
      if (error.code === 1) fail('위치 권한이 거부되었습니다. 브라우저와 기기 설정에서 정확한 위치를 허용한 뒤 다시 시도해 주세요.')
      // Transient unavailable/timeout errors can recover before the overall deadline.
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 })
    if (stopped) geo.clearWatch(watchId)
  } catch {
    fail('위치 서비스를 시작하지 못했습니다. HTTPS 접속과 기기의 위치 설정을 확인해 주세요.')
  }
  return stop
}
