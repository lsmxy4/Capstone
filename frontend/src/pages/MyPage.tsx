import { useEffect, useState } from 'react'
import Sidebar from '../components/layout/Sidebar'
import Icon from '../components/Icon'
import { useAuth } from '../contexts/AuthContext'
import { getFavorites, type FavoritePlace } from '../api/favorites'
import { getRouteDates } from '../api/routes'
import dashboardStyles from './Dashboard.scss?inline'
import './MyPage.scss'

function MyActivity() {
  const [favorites, setFavorites] = useState<FavoritePlace[] | null>(null)
  const [dates, setDates] = useState<string[] | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    Promise.allSettled([getFavorites(), getRouteDates(controller.signal)]).then(([saved, routes]) => {
      if (!active) return
      const messages: string[] = []
      if (saved.status === 'fulfilled') setFavorites(saved.value.favorites)
      else messages.push('저장한 장소를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
      if (routes.status === 'fulfilled') setDates([...new Set(routes.value.dates)].sort().reverse())
      else messages.push('이동 경로 기록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
      setErrors(messages)
      setLoading(false)
    })
    return () => { active = false; controller.abort() }
  }, [])

  const recentPlaces = [...(favorites ?? [])].sort((a, b) => b.savedAt.localeCompare(a.savedAt)).slice(0, 3)
  return <>
    <div className="account-stats" aria-busy={loading}>
      <a className="panel account-stat" href="/favorites"><Icon name="star" size={22} /><span>저장한 운동 장소</span><strong>{favorites == null ? '—' : favorites.length}<small>곳</small></strong><span>즐겨찾기 보기 ↗</span></a>
      <a className="panel account-stat" href="/exercise"><Icon name="map" size={22} /><span>이동 경로를 저장한 날</span><strong>{dates == null ? '—' : dates.length}<small>일</small></strong><span>날짜별 경로 보기 ↗</span></a>
      <div className="panel account-stat"><Icon name="history" size={22} /><span>최근 경로 기록</span><strong className="recent-date">{dates == null ? '—' : dates[0]?.replaceAll('-', '.') ?? '아직 없어요'}</strong><span>운동 정보에서 이동 경로를 확인해 보세요.</span></div>
    </div>
    {loading && <p className="account-notice" role="status">내 활동을 불러오는 중입니다…</p>}
    {errors.map(message => <p className="account-notice" role="alert" key={message}>{message}</p>)}
    <section className="panel saved-preview">
      <div className="title-row"><h2>최근 저장한 장소</h2><a href="/favorites">전체 보기 ↗</a></div>
      {recentPlaces.map(place => <a className="saved-place" key={place.id} href="/favorites"><span className="saved-icon"><Icon name="pin" /></span><div><h3>{place.name}</h3><p>{place.address}</p></div><span aria-hidden="true">↗</span></a>)}
      {!loading && favorites?.length === 0 && <div className="account-empty"><Icon name="star" size={30} /><h3>좋아하는 장소를 모아보세요</h3><p>주변 장소에서 하트를 누르면 나만의 운동 장소가 저장돼요.</p><a href="/places">주변 장소 둘러보기 ↗</a></div>}
      {!loading && favorites == null && <p className="account-notice">장소 목록을 확인할 수 없습니다.</p>}
    </section>
  </>
}

export default function MyPage() {
  const { user, loading, error, onLogout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)
  const displayName = user?.name?.trim() || user?.email || '게스트'

  return <div className="dashboard mypage">
    <style>{dashboardStyles}</style>
    <Sidebar />
    <main className="content">
      <header className="welcome"><div><span className="eyebrow">YOUR OWN HEALTHY ROUTINE</span><h1>마이페이지</h1><p>나의 정보와 소중한 움직임을 한곳에서.</p></div><a className="back-home" href="/dashboard">대시보드로 돌아가기 ↗</a></header>
      <section className="account-profile" aria-busy={loading}>
        <span className="account-avatar">{user ? Array.from(displayName)[0] : <Icon name="user" size={36} />}</span>
        <div className="account-identity"><span className="profile-label">MY FITMAP</span><h2>{loading ? '계정 확인 중…' : error ? '계정을 확인할 수 없어요' : user ? `${displayName}님, 반가워요.` : '나만의 건강한 일상을 시작해요.'}</h2><p>{loading ? '잠시만 기다려 주세요.' : error || (user ? user.email : '로그인하고 저장한 장소와 이동 경로를 한눈에 확인하세요.')}</p></div>
        {!loading && !error && (user ? <span className="account-badge">내 계정</span> : <a className="account-primary" href="/login">로그인하기 ↗</a>)}
        {!loading && error && <button className="account-primary" onClick={() => window.location.reload()}>다시 시도</button>}
        {!loading && !user && <a className="account-return" href="/">← 처음 화면으로</a>}
      </section>
      {!loading && user && <MyActivity key={user.email} />}
      <div className="account-bottom">
        <section className="panel account-details"><div className="title-row"><h2>내 계정 정보</h2><Icon name="user" size={18} /></div><dl><div><dt>이름</dt><dd>{loading ? '확인 중…' : user?.name?.trim() || '—'}</dd></div><div><dt>이메일</dt><dd>{loading ? '확인 중…' : user?.email || '—'}</dd></div><div><dt>계정 상태</dt><dd>{loading ? '확인 중' : error ? '확인할 수 없음' : user ? '로그인됨' : '로그인 전'}</dd></div></dl>{user && <button className="account-logout" disabled={loggingOut} onClick={async () => { setLoggingOut(true); try { await onLogout() } finally { setLoggingOut(false) } }}>{loggingOut ? '로그아웃 중…' : '로그아웃'}</button>}{!loading && !error && !user && <a className="signup-link" href="/signup">처음 오셨나요? 회원가입 ↗</a>}</section>
        <section className="panel account-shortcuts"><h2>오늘도 나답게 움직이기</h2><p>작은 움직임부터, 꾸준한 습관까지.</p><a href="/exercise"><span className="saved-icon"><Icon name="activity" /></span><div><h3>나에게 맞는 운동</h3><p>오늘의 추천과 이동 경로 확인</p></div><span aria-hidden="true">↗</span></a><a href="/places"><span className="saved-icon"><Icon name="map" /></span><div><h3>새로운 장소 발견</h3><p>내 주변 운동 장소 둘러보기</p></div><span aria-hidden="true">↗</span></a><a href="/favorites"><span className="saved-icon"><Icon name="heart" /></span><div><h3>다시 가고 싶은 곳</h3><p>저장한 장소 한눈에 보기</p></div><span aria-hidden="true">↗</span></a></section>
      </div>
      <div className="dashboard-footer"><span>FitMap · 매일 조금 더 건강하게</span><span>MAKE YOUR MOVE.</span></div>
    </main>
  </div>
}
