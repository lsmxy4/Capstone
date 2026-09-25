import { useCallback, useEffect, useRef, useState } from 'react'
import { getRoute, getRouteDates, saveRoutePoint } from '../api/routes'
import type { RecordedPoint } from './useMovementDistance'
import { useAuth } from '../contexts/AuthContext'

const koreanToday = () => new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
type AuthState = 'checking' | 'ready' | 'guest' | 'error'
const emptyPoints: RecordedPoint[] = []

export function useDailyRoute(latestPoint: RecordedPoint | null) {
  const { user, loading } = useAuth()
  const account = !loading ? user?.email : undefined
  const [today, setToday] = useState(koreanToday)
  const [selectedDate, setSelectedDate] = useState(today)
  const [dates, setDates] = useState<string[]>([])
  const [routes, setRoutes] = useState<Record<string, RecordedPoint[]>>({})
  const [routeAuth, setAuth] = useState<AuthState>('checking')
  const auth: AuthState = loading ? 'checking' : !account ? 'guest' : routeAuth
  const [error, setError] = useState<string | null>(null)
  const selectedDateRef = useRef(selectedDate)
  const pending = useRef<RecordedPoint[]>([])
  const lastQueuedId = useRef<string | null>(null)
  const session = useRef<AbortController | null>(null)
  const saving = useRef<AbortController | null>(null)
  selectedDateRef.current = selectedDate

  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = koreanToday()
      setToday(previous => {
        if (previous !== next) setSelectedDate(current => current === previous ? next : current)
        return next
      })
    }, 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    pending.current = []
    setRoutes({})
    setDates([])
    setError(null)
    setAuth('checking')
    if (!account) return
    const controller = new AbortController()
    session.current = controller
    let active = true
    let retry: number | undefined
    const check = () => getRouteDates(controller.signal).then(result => {
      if (!active) return
      setDates(result.dates)
      setError(null)
      setAuth('ready')
    }).catch(reason => {
      if (!active) return
      if (reason instanceof Error && reason.message.includes('로그인')) {
        pending.current = []
        setAuth('guest')
      } else {
        setAuth('error')
        setError(reason instanceof Error ? reason.message : '이동 경로를 조회하지 못했습니다.')
        retry = window.setTimeout(check, 3000)
      }
    })
    void check()
    return () => {
      active = false
      controller.abort()
      pending.current = []
      window.clearTimeout(retry)
    }
  }, [account])

  useEffect(() => {
    if (auth !== 'ready') return
    const controller = new AbortController()
    let active = true
    let retry: number | undefined
    const load = () => getRoute(selectedDate, controller.signal).then(result => {
      if (!active) return
      setRoutes(previous => {
        const merged = new Map([...result.points, ...(previous[selectedDate] ?? [])].map(point => [point.id, point]))
        return { ...previous, [selectedDate]: [...merged.values()].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt)) }
      })
      setError(null)
    }).catch(reason => {
      if (!active) return
      setError(reason instanceof Error ? reason.message : '이동 경로를 조회하지 못했습니다.')
      if (!(reason instanceof Error && reason.message.includes('로그인'))) retry = window.setTimeout(load, 3000)
    })
    void load()
    return () => { active = false; controller.abort(); window.clearTimeout(retry) }
  }, [auth, selectedDate, account])

  const flush = useCallback(async () => {
    const controller = session.current
    if (!account || auth !== 'ready' || !controller || controller.signal.aborted || saving.current === controller) return
    saving.current = controller
    try {
      while (pending.current.length && !controller.signal.aborted) {
        const point = pending.current[0]
        try {
          const saved = await saveRoutePoint(point, controller.signal)
          if (controller.signal.aborted) return
          pending.current.shift()
          setRoutes(previous => {
            const existing = previous[saved.date] ?? []
            if (existing.some(item => item.id === point.id)) return previous
            return { ...previous, [saved.date]: [...existing, point].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt)) }
          })
          setDates(previous => previous.includes(saved.date) ? previous : [...previous, saved.date].sort().reverse())
          setError(null)
        } catch (reason) {
          if (controller.signal.aborted) return
          setError(reason instanceof Error ? reason.message : '이동 경로를 저장하지 못했습니다.')
          if (reason instanceof Error && reason.message.includes('로그인')) {
            pending.current = []
            setAuth('guest')
          }
          break
        }
      }
    } finally { if (saving.current === controller) saving.current = null }
  }, [auth, account])

  useEffect(() => {
    if (!account || auth !== 'ready') {
      pending.current = []
      lastQueuedId.current = latestPoint?.id ?? null
      return
    }
    if (latestPoint && latestPoint.id !== lastQueuedId.current) {
      lastQueuedId.current = latestPoint.id
      pending.current.push(latestPoint)
    }
    void flush()
  }, [latestPoint, auth, flush, account])

  useEffect(() => {
    if (auth !== 'ready') return
    const timer = window.setInterval(() => { if (pending.current.length) void flush() }, 5000)
    return () => window.clearInterval(timer)
  }, [auth, flush])

  return { today, selectedDate, setSelectedDate, dates, points: routes[selectedDate] ?? emptyPoints, auth, error }
}
