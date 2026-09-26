import { loginUrl } from '../utils/authNavigation'
import { useEffect, useMemo, useState } from 'react'
import './Favorites.scss'
import dashboardStyles from './Dashboard.scss?inline'
import Icon from '../components/Icon'
import Sidebar from '../components/layout/Sidebar'
import { getFavorites, removeFavorite, type FavoritePlace } from '../api/favorites'
import { useAuth } from '../contexts/AuthContext'

function categoryOf(place: FavoritePlace) {
  const category = place.category.split(' > ').at(-1)?.trim() || '기타'
  return /도시\s*근린\s*공원/.test(category) ? '공원' : category
}

function iconOf(place: FavoritePlace) {
  const name = place.name
  const category = place.category
  if (/주차장/.test(name) || /주차장/.test(category)) return '🅿️'
  if (/수영장|수영/.test(name) || /수영장|수영/.test(category)) return '🏊'
  if (/골프/.test(name) || /골프/.test(category)) return '⛳'
  if (/축구/.test(name) || /축구/.test(category)) return '⚽'
  if (/야구/.test(name) || /야구/.test(category)) return '⚾'
  if (/테니스/.test(name) || /테니스/.test(category)) return '🎾'
  if (/농구/.test(name) || /농구/.test(category)) return '🏀'
  if (/배드민턴/.test(name) || /배드민턴/.test(category)) return '🏸'
  if (/자전거/.test(name) || /자전거/.test(category)) return '🚴'
  if (/등산|둘레길|산책로|산$/.test(name) || /등산|산책로/.test(category)) return '🥾'
  if (/헬스|피트니스|체육관|체육센터|스포츠센터/.test(name) || /헬스|피트니스|체육관|체육센터|스포츠센터/.test(category)) return '🏋️'
  if (/러닝|트랙|운동장/.test(name) || /러닝|트랙|운동장/.test(category)) return '🏃'
  if (/공원|숲|수목원/.test(name) || /공원|숲|수목원/.test(category)) return '🌳'
  return '📍'
}

function distanceOf(place: FavoritePlace) {
  if (place.distance == null) return '거리 정보 없음'
  return place.distance >= 1000
    ? `${(place.distance / 1000).toFixed(1)} km`
    : `${Math.round(place.distance)} m`
}

export default function Favorites() {
  const { user, loading: authLoading } = useAuth()
  const [places, setPlaces] = useState<FavoritePlace[]>([])
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('latest')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setPlaces([])
      setLoading(false)
      setError('즐겨찾기를 사용하려면 로그인해 주세요.')
      return
    }
    setLoading(true)
    setError(null)
    let active = true
    getFavorites().then(result => {
      if (active) setPlaces(result.favorites)
    }).catch(reason => {
      if (active) setError(reason instanceof Error ? reason.message : '즐겨찾기를 불러오지 못했습니다.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [user, authLoading])

  const categories = useMemo(() => ['전체', ...new Set(places.map(categoryOf))], [places])
  const filteredPlaces = useMemo(() => {
    const search = query.trim().toLocaleLowerCase()
    const result = places.filter(place =>
      (selectedCategory === '전체' || categoryOf(place) === selectedCategory) &&
      (!search || `${place.name} ${place.address} ${place.category}`.toLocaleLowerCase().includes(search)),
    )
    if (sort === 'distance') result.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
    else if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    else result.sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    return result
  }, [places, selectedCategory, query, sort])

  async function handleRemove(place: FavoritePlace) {
    if (authLoading || !user) {
      setError('즐겨찾기를 사용하려면 로그인해 주세요.')
      return
    }
    if (removingId) return
    setRemovingId(place.id)
    setError(null)
    try {
      await removeFavorite(place.id)
      setPlaces(current => current.filter(item => item.id !== place.id))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '즐겨찾기를 해제하지 못했습니다.')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="dashboard favorites-page">
      <style>{dashboardStyles}</style>
      <Sidebar />
      <main className="content favorites-main">
        <header className="favorites-header">
          <div>
            <span className="eyebrow">YOUR PERSONAL COLLECTION</span>
            <h1>즐겨찾기</h1>
            <p>내가 저장한 운동 장소를 한눈에 확인하세요.</p>
          </div>
        </header>

        <section className="collection-banner"><div><span>PLACES TO COME BACK TO</span><h2>다시 가고 싶은 곳을 모아두세요.</h2><p>좋아하는 운동 장소가 모이면, 나만의 일상이 됩니다.</p><a href="/places">새로운 장소 찾아보기 ↗</a></div><Icon name="star" size={64} /></section>

        <section className="favorites-content">
          <div className="favorites-top">
            <div>
              <h2>내 즐겨찾기</h2>
              <span>{places.length}개의 장소가 저장되어 있습니다.</span>
            </div>
            <div className="favorites-actions">
              <label className="search-box">
                <span aria-hidden="true">⌕</span>
                <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="시설명을 검색하세요" aria-label="즐겨찾기 검색" />
              </label>
              <select value={sort} onChange={event => setSort(event.target.value)} aria-label="즐겨찾기 정렬">
                <option value="latest">최신순</option>
                <option value="distance">거리순</option>
                <option value="name">이름순</option>
              </select>
            </div>
          </div>

          <div className="category-tabs" role="group" aria-label="장소 분류">
            {categories.map(category => (
              <button key={category} type="button" className={`category ${selectedCategory === category ? 'active' : ''}`}
                aria-pressed={selectedCategory === category} onClick={() => setSelectedCategory(category)}>
                {category}
              </button>
            ))}
          </div>

          {loading && <p className="favorites-message" role="status">즐겨찾기를 불러오는 중…</p>}
          {error && <p className="favorites-message" role="alert">{error} {error.includes('로그인') && <a href={loginUrl(window.location.pathname + window.location.search + window.location.hash)}>로그인하기</a>}</p>}
          {!loading && !error && places.length === 0 && <div className="favorites-empty"><Icon name="heart" size={36} /><h3>나만의 장소를 하나씩</h3><p>주변 운동 장소에서 하트를 누르면 여기에 모아드려요.</p><a href="/places">주변 장소 둘러보기 ↗</a></div>}
          {!loading && !error && places.length > 0 && filteredPlaces.length === 0 && <p className="favorites-message">검색 결과가 없습니다.</p>}

          <div className="favorite-grid">
            {filteredPlaces.map(place => (
              <article className="favorite-card" key={place.id}>
                <div className="place-image">
                  <span className="place-icon" aria-hidden="true">{iconOf(place)}</span>
                  <button className="favorite-star" type="button" aria-label={`${place.name} 즐겨찾기 삭제`}
                    disabled={removingId === place.id} onClick={() => handleRemove(place)}>★</button>
                </div>
                <div className="place-info">
                  <div className="place-title">
                    <div>
                      <span className="place-type">{categoryOf(place)}</span>
                      <h3>{place.name}</h3>
                    </div>
                  </div>
                  <p className="place-address">📍 {place.address}</p>
                  <div className="place-details"><span>📏 {distanceOf(place)}</span></div>
                  <div className="card-buttons">
                    {place.url && <a href={place.url} target="_blank" rel="noreferrer">상세보기</a>}
                    {place.latitude != null && place.longitude != null &&
                      <a href={`https://map.kakao.com/link/to/${encodeURIComponent(place.name)},${place.latitude},${place.longitude}`}
                        target="_blank" rel="noreferrer">길찾기</a>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
