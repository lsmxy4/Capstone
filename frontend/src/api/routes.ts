import type { RecordedPoint } from '../hooks/useMovementDistance'

type RouteDay = { date: string; points: RecordedPoint[] }
class RouteError extends Error {
  readonly retryable: boolean
  constructor(message: string, retryable: boolean) { super(message); this.retryable = retryable }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    init?.signal?.throwIfAborted()
    try {
      const response = await fetch(`/api/auth/routes${path}`, { credentials: 'same-origin', ...init })
      const body = await response.text()
      let data: (T & { error?: string }) | null = null
      try { data = body ? JSON.parse(body) : null } catch { /* Proxy errors may not be JSON. */ }
      if (response.status === 401) throw new RouteError('이동 경로를 저장하려면 로그인해 주세요.', false)
      if (!response.ok && response.status < 500) throw new RouteError(data?.error || '요청을 처리하지 못했습니다.', false)
      if (!response.ok || !data) throw new RouteError('서버 연결이 잠시 끊겼습니다. 자동으로 다시 시도합니다.', true)
      return data as T
    } catch (error) {
      init?.signal?.throwIfAborted()
      if (error instanceof RouteError && !error.retryable) throw error
      if (attempt === 2) throw new Error('서버 연결이 잠시 끊겼습니다. 자동으로 다시 시도합니다.')
      await new Promise(resolve => setTimeout(resolve, 400 * (attempt + 1)))
    }
  }
  throw new Error('서버 연결이 잠시 끊겼습니다. 자동으로 다시 시도합니다.')
}

export const getRoute = (date: string, signal?: AbortSignal): Promise<RouteDay> => request(`?date=${encodeURIComponent(date)}`, { signal })
export const getRouteDates = (signal?: AbortSignal): Promise<{ dates: string[] }> => request('/dates', { signal })
export const saveRoutePoint = (point: RecordedPoint, signal?: AbortSignal): Promise<{ date: string; point: RecordedPoint }> => request('', {
  signal,
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(point),
})
