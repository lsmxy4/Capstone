import { loginUrl } from '../utils/authNavigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import './Favorites.scss'
import dashboardStyles from './Dashboard.scss?inline'
import Icon from '../components/Icon'
import Sidebar from '../components/layout/Sidebar'
import { getFavorites, removeFavorite, type FavoritePlace } from '../api/favorites'
import { useAuth } from '../contexts/AuthContext'

const broadCategories = ['공원·자연', '산책·등산', '스포츠·체육', '편의시설', '기타'] as const

// 카테고리별 대표 이미지
const categoryImages: Record<string, string> = {
  '공원·자연': '/images/places/park.svg',
  '산책·등산': '/images/places/hiking.svg',
  '스포츠·체육': '/images/places/sports.svg',
  '편의시설': '/images/places/facility.svg',
  '기타': '/images/places/default.svg',
}

const placeImageRules: [RegExp, string][] = [
  [/주차/, 'parking'],
  [/화장실/, 'restroom'],
  [/편의점|매점|휴게소/, 'store'],
  [/수영/, 'swimming'],
  [/골프/, 'golf'],
  [/축구|풋살/, 'football'],
  [/테니스|배드민턴/, 'tennis'],
  [/농구/, 'basketball'],
  [/야구/, 'baseball'],
  [/볼링/, 'bowling'],
  [/자전거|대여소/, 'cycling'],
  [/러닝|트랙|운동장|육상/, 'track'],
  [/헬스|피트니스|체육관|체육센터|스포츠센터|요가|필라테스/, 'gym'],
]

function imageOf(place: FavoritePlace) {
  for (const text of [...place.category.split('>').reverse(), place.name]) {
    const match = placeImageRules.find(([pattern]) => pattern.test(text))
    if (match) return `/images/places/${match[1]}.svg`
  }

  return categoryImages[categoryOf(place)] ?? categoryImages['기타']
}

function categoryOf(place: FavoritePlace) {
  const classify = (text: string) => {
    if (/주차|화장실|편의점|매점|휴게소|대여소/.test(text)) return '편의시설'
    if (/수영|체육|스포츠|운동장|경기장|헬스|피트니스|요가|필라테스|골프|축구|야구|테니스|농구|배드민턴|탁구|볼링|클라이밍|무술|태권도|자전거/.test(text)) return '스포츠·체육'
    if (/산책|등산|둘레길|탐방로|트레킹/.test(text)) return '산책·등산'
    if (/공원|숲|수목원|식물원|자연|유원지|산$|계곡|해수욕장/.test(text)) return '공원·자연'
    return null
  }

  // Prefer the specific facility category over words in the place name.
  for (const category of place.category.split('>').reverse()) {
    const group = classify(category.trim())
    if (group) return group
  }

  return classify(place.name) ?? '기타'
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
  const activeTransition = useRef<ViewTransition | null>(null)

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

    getFavorites()
      .then(result => {
        if (active) setPlaces(result.favorites)
      })
      .catch(reason => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : '즐겨찾기를 불러오지 못했습니다.',
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [user, authLoading])

  const categories = useMemo(() => {
    const available = new Set(places.map(categoryOf))

    return [
      '전체',
      ...broadCategories.filter(category => available.has(category)),
    ]
  }, [places])

  const activeCategory = categories.includes(selectedCategory)
    ? selectedCategory
    : '전체'

  const filteredPlaces = useMemo(() => {
    const search = query.trim().toLocaleLowerCase()

    const result = places.filter(
      place =>
        (activeCategory === '전체' ||
          categoryOf(place) === activeCategory) &&
        (!search ||
          `${place.name} ${place.address} ${place.category}`
            .toLocaleLowerCase()
            .includes(search)),
    )

    if (sort === 'distance') {
      result.sort(
        (a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity),
      )
    } else if (sort === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    } else {
      result.sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    }

    return result
  }, [places, activeCategory, query, sort])

  function changeCategory(category: string) {
    if (category === activeCategory) return

    activeTransition.current?.skipTransition()

    if (
      !document.startViewTransition ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setSelectedCategory(category)
      return
    }

    activeTransition.current = document.startViewTransition(() => {
      flushSync(() => setSelectedCategory(category))
    })
  }

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

      setPlaces(current =>
        current.filter(item => item.id !== place.id),
      )
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : '즐겨찾기를 해제하지 못했습니다.',
      )
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
            <span className="eyebrow">
              YOUR PERSONAL COLLECTION
            </span>

            <h1>즐겨찾기</h1>

            <p>
              내가 저장한 운동 장소를 한눈에 확인하세요.
            </p>
          </div>
        </header>

        <section className="collection-banner">
          <div>
            <span>PLACES TO COME BACK TO</span>

            <h2>
              다시 가고 싶은 곳을 모아두세요.
            </h2>

            <p>
              좋아하는 운동 장소가 모이면, 나만의 일상이 됩니다.
            </p>

            <a href="/places">
              새로운 장소 찾아보기 ↗
            </a>
          </div>

          <Icon name="star" size={64} />
        </section>

        <section className="favorites-content">

          <div className="favorites-top">
            <div>
              <h2>내 즐겨찾기</h2>

              <span>
                {places.length}개의 장소가 저장되어 있습니다.
              </span>
            </div>

            <div className="favorites-actions">

              <label className="search-box">
                <span aria-hidden="true">⌕</span>

                <input
                  type="search"
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="시설명을 검색하세요"
                  aria-label="즐겨찾기 검색"
                />
              </label>

              <select
                value={sort}
                onChange={event => setSort(event.target.value)}
                aria-label="즐겨찾기 정렬"
              >
                <option value="latest">최신순</option>
                <option value="distance">거리순</option>
                <option value="name">이름순</option>
              </select>

            </div>
          </div>

          <div
            className="category-tabs"
            role="group"
            aria-label="장소 분류"
          >
            {categories.map(category => (
              <button
                key={category}
                type="button"
                className={`category ${
                  activeCategory === category ? 'active' : ''
                }`}
                aria-pressed={activeCategory === category}
                onClick={() => changeCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {loading && (
            <p className="favorites-message" role="status">
              즐겨찾기를 불러오는 중…
            </p>
          )}

          {error && (
            <p className="favorites-message" role="alert">
              {error}{' '}

              {error.includes('로그인') && (
                <a
                  href={loginUrl(
                    window.location.pathname +
                      window.location.search +
                      window.location.hash,
                  )}
                >
                  로그인하기
                </a>
              )}
            </p>
          )}

          {!loading &&
            !error &&
            places.length === 0 && (
              <div className="favorites-empty">
                <Icon name="heart" size={36} />

                <h3>
                  나만의 장소를 하나씩
                </h3>

                <p>
                  주변 운동 장소에서 하트를 누르면 여기에 모아드려요.
                </p>

                <a href="/places">
                  주변 장소 둘러보기 ↗
                </a>
              </div>
            )}

          {!loading &&
            !error &&
            places.length > 0 &&
            filteredPlaces.length === 0 && (
              <p className="favorites-message">
                검색 결과가 없습니다.
              </p>
            )}

          <div className="favorite-grid">

            {filteredPlaces.map(place => {

              // 현재 장소의 카테고리를 확인
              const placeCategory = categoryOf(place)

              // 카테고리에 맞는 사진 선택
              const placeImage = imageOf(place)

              return (
                <article
                  className="favorite-card"
                  key={place.id}
                  style={{
                    viewTransitionName: `favorite-${Array.from(
                      place.id,
                    )
                      .map(char =>
                        char.codePointAt(0)!.toString(16),
                      )
                      .join('-')}`,
                  }}
                >

                  {/* 사진 영역 */}
                  <div className="place-image">

                    <img
                      src={placeImage}
                      alt={`${place.name} 시설 유형 대표 이미지`}
                      className="place-photo"
                      onError={event => {
                        // 사진을 찾지 못했을 경우 기본 이미지 대신
                        // 기존 아이콘을 보여주기 위한 처리
                        event.currentTarget.style.display = 'none'
                        const fallback = event.currentTarget.parentElement?.querySelector<HTMLElement>('.place-icon')
                        if (fallback) fallback.style.opacity = '1'
                      }}
                    />

                    {/* 사진 위 어두운 그라데이션 */}
                    <div className="place-image-overlay" />

                    {/* 사진이 없을 경우 기존 아이콘 표시 */}
                    <span
                      className="place-icon"
                      aria-hidden="true"
                    >
                      {iconOf(place)}
                    </span>

                    {/* 즐겨찾기 삭제 버튼 */}
                    <button
                      className="favorite-star"
                      type="button"
                      aria-label={`${place.name} 즐겨찾기 삭제`}
                      disabled={removingId === place.id}
                      onClick={() => handleRemove(place)}
                    >
                      ★
                    </button>

                  </div>

                  {/* 장소 정보 */}
                  <div className="place-info">

                    <div className="place-title">

                      <div>

                        <span className="place-type">
                          {placeCategory}
                        </span>

                        <h3>
                          {place.name}
                        </h3>

                      </div>

                    </div>

                    <p className="place-address">
                      📍 {place.address}
                    </p>

                    <div className="place-details">
                      <span>
                        📏 {distanceOf(place)}
                      </span>
                    </div>

                    <div className="card-buttons">

                      {place.url && (
                        <a
                          href={place.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          상세보기
                        </a>
                      )}

                      {place.latitude != null &&
                        place.longitude != null && (
                          <a
                            href={`https://map.kakao.com/link/to/${encodeURIComponent(
                              place.name,
                            )},${place.latitude},${place.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            길찾기
                          </a>
                        )}
                        

                    </div>

                  </div>

                </article>
              )
            })}

          </div>

        </section>
      </main>
    </div>
  )
}
