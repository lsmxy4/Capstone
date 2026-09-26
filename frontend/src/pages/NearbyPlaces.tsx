import { loginUrl } from '../utils/authNavigation'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import nearbyPlacesStyles from './NearbyPlaces.scss?inline'
import dashboardStyles from './Dashboard.scss?inline'
import Sidebar from '../components/layout/Sidebar'
import { useGeolocation } from '../hooks/useGeolocation'
import { getPlaces, getRegion } from '../api/kakao'
import { getWeather } from '../api/weather'
import { addFavorite, getFavorites, removeFavorite } from '../api/favorites'
import type { Place } from '../types/place'
import KakaoMap from '../components/map/KakaoMap'
import { useAuth } from '../contexts/AuthContext'



type IconName = 'home' | 'pin' | 'activity' | 'map' | 'star' | 'refresh' | 'bell' | 'heart' | 'building' | 'mountain' | 'tree' | 'track' | 'settings' | 'layers'

const paths: Record<IconName, ReactNode> = {
  home: <><path d="M3 11 12 3l9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
  pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  activity: <path d="M3 12h4l2.2-7 4.1 14 2.2-7H21" />,
  map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" /><path d="M9 3v15m6-12v15" /></>,
  star: <path d="m12 3 2.7 5.6 6.3.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.5l6.3-.9Z" />,
  refresh: <><path d="M20 7v5h-5" /><path d="M19 12a7 7 0 1 0-2 5" /></>,
  bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  heart: <path d="M20.8 5.7a5.5 5.5 0 0 0-7.8 0L12 6.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z" />,
  building: <><path d="M4 21V5l8-3v19M12 8h8v13M8 7v2m0 3v2m0 3v2m8-7v2m0 3v2M2 21h20" /></>,
  mountain: <path d="m2 20 7-12 3 5 3-4 7 11Z" />,
  tree: <><circle cx="12" cy="9" r="6" /><path d="M12 15v6" /></>,
  track: <><ellipse cx="12" cy="12" rx="9" ry="6.5" /><ellipse cx="12" cy="12" rx="3.6" ry="2.4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5Z" /><path d="m3 13 9 5 9-5" /></>,
}

function Icon({ name, size = 18, filled = false }: { name: IconName; size?: number; filled?: boolean }) {
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

const exercises = ['러닝', '걷기', '자전거', '등산', '수영'] as const
type Filter = '전체' | '실내' | '실외'
const filters: Filter[] = ['전체', '실내', '실외']

function placeType(place: Place): Exclude<Filter, '전체'> {
  const text = `${place.name} ${place.category}`
  return /수영장|체육관|체육센터|헬스|피트니스|요가|필라테스|실내|스포츠센터/.test(text) ? '실내' : '실외'
}

export default function NearbyPlaces() {
  const { user, loading: authLoading } = useAuth()
  const location = useGeolocation(true)
  const [filter, setFilter] = useState<Filter>('전체')
  const [weatherPending, setWeatherPending] = useState(false)
  const filterTouched = useRef(false)
  const [places, setPlaces] = useState<Place[]>([])
  const [address, setAddress] = useState('현재 위치 확인 중')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [favoritePending, setFavoritePending] = useState<Set<string>>(new Set())
  const [favoriteError, setFavoriteError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading || !user) return
    let active = true
    getFavorites().then(result => {
      if (active) setFavorites(new Set(result.favorites.map(place => place.id)))
    }).catch(reason => {
      if (active && !(reason instanceof Error && reason.message.includes('로그인'))) {
        setFavoriteError(reason instanceof Error ? reason.message : '즐겨찾기를 불러오지 못했습니다.')
      }
    })
    return () => { active = false }
  }, [user, authLoading])

  useEffect(() => {
    if (!location.coordinates) return
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    Promise.all([
      Promise.all(exercises.map(item => getPlaces(location.coordinates!, item, controller.signal, 15))),
      getRegion(location.coordinates, controller.signal),
    ]).then(([placeGroups, region]) => {
      const unique = [...new Map(placeGroups.flat().map(place => [place.id, place])).values()]
        .sort((a, b) => (a.distance ?? Number.MAX_SAFE_INTEGER) - (b.distance ?? Number.MAX_SAFE_INTEGER))
      setPlaces(unique)
      setAddress(region.address)
    }).catch(reason => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : '주변 장소를 불러오지 못했습니다.')
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [location.coordinates])

  useEffect(() => {
    if (!location.coordinates) return
    const controller = new AbortController()
    filterTouched.current = false
    setFilter('전체')
    setWeatherPending(true)
    getWeather(location.coordinates, controller.signal).then(weather => {
      if (!controller.signal.aborted && !filterTouched.current) {
        setFilter(/비|소나기|빗방울|강수/.test(weather.condition) ? '실내' : '전체')
      }
    }).catch(() => {
      if (!controller.signal.aborted && !filterTouched.current) setFilter('전체')
    }).finally(() => {
      if (!controller.signal.aborted) setWeatherPending(false)
    })
    return () => controller.abort()
  }, [location.coordinates])

  const filteredPlaces = filter === '전체' ? places : places.filter(place => placeType(place) === filter)
  const displayedPlaces = !location.coordinates || (weatherPending && !filterTouched.current) ? [] : filteredPlaces

  const toggleFavorite = async (place: Place) => {
    if (authLoading || !user) {
      setFavoriteError('즐겨찾기를 저장하려면 로그인해 주세요.')
      return
    }
    if (favoritePending.has(place.id)) return
    const wasFavorite = favorites.has(place.id)
    setFavoritePending(prev => new Set(prev).add(place.id))
    setFavoriteError(null)
    try {
      if (wasFavorite) await removeFavorite(place.id)
      else await addFavorite(place)
      setFavorites(prev => {
        const next = new Set(prev)
        if (wasFavorite) next.delete(place.id)
        else next.add(place.id)
        return next
      })
    } catch (reason) {
      setFavoriteError(reason instanceof Error ? reason.message : '즐겨찾기를 저장하지 못했습니다.')
    } finally {
      setFavoritePending(prev => {
        const next = new Set(prev)
        next.delete(place.id)
        return next
      })
    }
  }

  return (
    <>
      <style>{dashboardStyles}{nearbyPlacesStyles}</style>
      <div className="dashboard nearby-page">
        <Sidebar />

        <main className="content">
          <header className="welcome">
            <div>
              <span className="eyebrow">EXPLORE YOUR NEIGHBORHOOD</span>
              <h1>주변 운동 장소</h1>
              <p><Icon name="pin" size={12} /> {location.coordinates ? address : location.loading ? '현재 위치 확인 중' : '정확한 위치 확인 필요'} <span>{location.coordinates ? '• 현재 위치 기준' : ''}</span></p>
            </div>
            <div className="header-actions">
              <button onClick={location.locate} disabled={location.loading}><Icon name="refresh" size={14} /> {location.loading ? '확인 중…' : '새로고침'}</button>
            </div>
          </header>

          <section className="explore-banner"><div><span>FIND YOUR NEXT MOVE</span><h2>가까운 곳에서 시작하는 좋은 습관.</h2><p>산책로부터 실내 운동 시설까지, 나에게 맞는 장소를 찾아보세요.</p></div><Icon name="map" size={64} /></section>

          <div className="places-layout">
            <section className="map-panel panel">
              <div className="title-row"><h2>내 주변 지도</h2><span className="good">반경 10km</span></div>
              {location.coordinates ? <KakaoMap coordinates={location.coordinates} places={displayedPlaces} /> : <div className="map-placeholder"><span className="map-placeholder-icon"><Icon name="map" size={36} /></span><p>{location.loading ? '현재 위치 확인 중' : '내 주변을 둘러볼 준비가 됐나요?'}</p><small>위치 권한을 허용하면 주변 운동 장소 지도가 표시됩니다.</small></div>}
              <button type="button" className="locate-button" onClick={location.locate} disabled={location.loading}>
                <Icon name="pin" size={14} /> 현재 위치로 이동
              </button>
            </section>

            <section className="list-panel panel">
              <div className="title-row">
                <h2><span className="title-icon"><Icon name="layers" size={14} /></span> 장소 목록</h2>
                <div className="filter-chips" role="group" aria-label="장소 필터">
                  {filters.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={filter === item ? 'selected' : ''}
                      aria-pressed={filter === item}
                      onClick={() => { filterTouched.current = true; setFilter(item) }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <p className="list-note">카카오 로컬 · 반경 10km · 현재 위치에서 가까운 순</p>

              {location.error && <p className="empty-note" role="alert">{location.error}</p>}
              {error && <p className="empty-note" role="alert">{error}</p>}
              {favoriteError && <p className="empty-note" role="alert">{favoriteError} {favoriteError.includes('로그인') && <a href={loginUrl(window.location.pathname + window.location.search + window.location.hash)}>로그인하기</a>}</p>}
              {loading && <p className="empty-note" role="status">주변 장소를 불러오는 중…</p>}
              {weatherPending && !filterTouched.current && <p className="empty-note" role="status">현재 날씨를 확인해 장소 필터를 선택하는 중…</p>}

              <div className="place-grid">
                {!loading && displayedPlaces.map((place) => {
                  const isFavorited = favorites.has(place.id)
                  const category = place.category.split(' > ').at(-1) ?? place.category
                  const type = placeType(place)
                  const distance = place.distance == null ? '거리 미제공' : place.distance >= 1000 ? `${(place.distance / 1000).toFixed(1)}km` : `${place.distance}m`
                  return (
                    <article key={place.id}>
                      <span className="place-icon"><Icon name="pin" /></span>
                      <div>
                        <h3>{place.url ? <a href={place.url} target="_blank" rel="noreferrer">{place.name}</a> : place.name}</h3>
                        <p><span>{category}</span><span className={type === '실내' ? 'indoor' : 'outdoor'}>{type}</span></p>
                        <small><Icon name="pin" size={11} />{distance} · {place.address}</small>
                      </div>
                      <button
                        type="button"
                        className={isFavorited ? 'favorited' : ''}
                        aria-pressed={isFavorited}
                        aria-label={isFavorited ? `${place.name} 즐겨찾기 해제` : `${place.name} 즐겨찾기 추가`}
                        disabled={favoritePending.has(place.id)}
                        onClick={() => toggleFavorite(place)}
                      >
                        <Icon name="heart" size={15} filled={isFavorited} />
                      </button>
                    </article>
                  )
                })}

                {!loading && !weatherPending && !error && displayedPlaces.length === 0 && (
                  <p className="empty-note">{location.coordinates ? '주변에서 해당 운동 장소를 찾지 못했습니다.' : '위치를 연결하면 가까운 장소가 여기에 표시됩니다.'}</p>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  )
}
