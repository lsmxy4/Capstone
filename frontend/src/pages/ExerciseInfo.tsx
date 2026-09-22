import { useMemo, useState, type CSSProperties } from 'react'
import Sidebar from '../components/layout/Sidebar'
import Icon, { type IconName } from '../components/Icon'
import dashboardStyles from './Dashboard.scss?inline'
import './ExerciseInfo.scss'
import AnimatedNumber from '../components/AnimatedNumber'
import { useMovementDistance } from '../hooks/useMovementDistance'
import { useDailyRoute } from '../hooks/useDailyRoute'
import { MovementRouteMap } from '../components/map/KakaoMap'
import { useGeolocation } from '../hooks/useGeolocation'
import { useLocationData } from '../hooks/useLocationData'
import { dailyExerciseRecommendation } from '../utils/exerciseRecommendation'

const items: { name: string; icon: IconName; color: string; description: string; tips: string[] }[] = [
  { name: '러닝', icon: 'run', color: '#675cf3', description: '심폐 지구력과 체력을 키우는 대표적인 유산소 운동입니다.', tips: ['운동 전 5분 이상 가볍게 걷기', '자신의 페이스를 유지하며 호흡하기', '운동 후 충분히 스트레칭하기'] },
  { name: '걷기', icon: 'walk', color: '#31b779', description: '부담 없이 시작할 수 있는 전신 유산소 운동입니다.', tips: ['시선을 정면으로 유지하기', '팔을 자연스럽게 흔들기', '편한 운동화를 착용하기'] },
  { name: '자전거', icon: 'bike', color: '#e4a72d', description: '하체 근력과 심폐 기능 향상에 도움을 줍니다.', tips: ['안전모와 보호 장비 착용하기', '출발 전 자전거 상태 확인하기', '안전한 코스를 선택하기'] },
  { name: '등산', icon: 'mountain', color: '#ef7b45', description: '자연 속에서 하체 근력과 균형 감각을 높입니다.', tips: ['물과 간식을 준비하기', '무리하지 않고 천천히 오르기', '기상 상황을 확인하기'] },
  { name: '수영', icon: 'swim', color: '#3c9ae8', description: '관절 부담이 적고 전신을 사용하는 운동입니다.', tips: ['준비운동으로 몸을 풀기', '수분을 충분히 섭취하기', '안전요원의 안내 따르기'] },
]

export default function ExerciseInfo() {
  const [selected, setSelected] = useState('러닝')
  const location = useGeolocation()
  const conditions = useLocationData(location.coordinates, selected)
  const movement = useMovementDistance(true)
  const dailyRoute = useDailyRoute(movement.latestPoint)
  const todaySelected = dailyRoute.selectedDate === dailyRoute.today
  const routePoints = useMemo(() => !todaySelected ? dailyRoute.points
    : dailyRoute.auth === 'ready' && dailyRoute.points.length ? dailyRoute.points
    : movement.points.length ? movement.points
    : location.coordinates ? [location.coordinates] : [],
  [todaySelected, dailyRoute.auth, dailyRoute.points, movement.points, location.coordinates])
  const item = items.find(value => value.name === selected) ?? items[0]
  const recommendation = dailyExerciseRecommendation(selected, conditions.weather.data, conditions.airQuality.data, conditions.uv.data)
  return <><style>{dashboardStyles}</style><div className="dashboard exercise-page dashboard-exercise"><Sidebar /><main className="content" id="top">
    <header className="welcome"><div><h1>운동 정보</h1><p><Icon name="activity" size={12} /> 운동별 추천 정보와 주의사항을 확인하세요</p></div><div className="header-actions"><a href="/dashboard">대시보드로 돌아가기</a></div></header>
    <section className="exercise-select panel"><h2>운동 선택</h2><div className="chips">{items.map(value => <button key={value.name} className={value.name === selected ? 'selected' : ''} onClick={() => setSelected(value.name)}><Icon name={value.icon} size={17} />{value.name}</button>)}</div></section>
    <div className="exercise-info-grid"><section className="panel exercise-hero" style={{ '--exercise-color': item.color } as CSSProperties}><div className="exercise-hero-icon"><Icon name={item.icon} size={44} /></div><span className="good">오늘 날씨 반영</span><h2>{item.name}</h2><p>{item.description}</p><div className="exercise-metrics"><div><b>{recommendation.minutes == null ? '—' : `${recommendation.minutes}분`}</b><small>추천 운동 시간</small></div><div><b>{recommendation.intensity}</b><small>운동 강도</small></div><div><b>{recommendation.calories == null ? '—' : `${recommendation.calories} kcal`}</b><small>예상 소모량</small></div></div></section><section className="panel"><div className="title-row"><h2>운동 가이드</h2><span className="level">안전하게 시작하기</span></div><p className="updated">오늘의 {item.name} 체크리스트</p><div className="exercise-tips">{item.tips.map((tip, index) => <div key={tip}><span>{index + 1}</span><p>{tip}</p></div>)}</div></section></div>
    <section className="panel today-exercise-recommendation"><div className="title-row"><h2><span className="title-icon"><Icon name="sun" size={15} /></span>오늘의 {selected} 추천</h2><span className="level">{recommendation.time}</span></div><p>{recommendation.message}</p><div className="condition-summary"><span>기온 <b>{conditions.weather.data?.temperature ?? '—'}°C</b></span><span>강수확률 <b>{conditions.weather.data?.precipitation ?? '—'}%</b></span><span>자외선 <b>{conditions.uv.data ? `${conditions.uv.data.value} (${conditions.uv.data.grade})` : '—'}</b></span><span>미세먼지 PM10 <b>{conditions.airQuality.data?.pm10.value == null ? '—' : `${conditions.airQuality.data.pm10.value}㎍/㎥`} · {conditions.airQuality.data?.pm10.grade ?? '—'}</b></span><span>초미세먼지 PM2.5 <b>{conditions.airQuality.data?.pm25.value == null ? '—' : `${conditions.airQuality.data.pm25.value}㎍/㎥`} · {conditions.airQuality.data?.pm25.grade ?? '—'}</b></span></div></section>
    {conditions.airQuality.data?.warning && <p className="api-message" role="status">{conditions.airQuality.data.warning}</p>}
    <section className="panel movement-summary"><div className="movement-summary-icon"><Icon name="pin" size={24} /></div><div><p>내가 이동한 거리</p><h2><AnimatedNumber text={movement.meters < 1000 ? `${Math.round(movement.meters)} m` : `${(movement.meters / 1000).toFixed(2)} km`} /></h2><small>운동 정보 페이지를 연 이후 Geolocation으로 측정한 거리입니다.</small></div></section>
    <section className="panel movement-map-panel"><div className="title-row"><h2><span className="title-icon"><Icon name="map" size={15} /></span>내 이동 경로</h2><span className="good">{dailyRoute.selectedDate === dailyRoute.today ? '오늘' : dailyRoute.selectedDate}</span></div>
      <p className="updated">로그인한 사용자의 이동 경로를 한국 시간 날짜별로 저장합니다.</p>
      {dailyRoute.auth === 'ready' && <label className="route-date-label">저장된 날짜
        <select value={dailyRoute.selectedDate} onChange={event => dailyRoute.setSelectedDate(event.target.value)}>
          {[...new Set([dailyRoute.today, ...dailyRoute.dates])].sort().reverse().map(date => <option key={date} value={date}>{date}</option>)}
        </select>
      </label>}
      {dailyRoute.auth === 'checking' && <p className="updated" role="status">저장된 경로를 확인하는 중…</p>}
      {dailyRoute.auth === 'guest' && <p className="movement-error">현재 경로는 화면에서만 볼 수 있습니다. <a href="/login">로그인</a>하면 이동 경로가 날짜별로 저장됩니다.</p>}
      {todaySelected && movement.accuracyMeters != null && movement.accuracyMeters > 100 && <p className="movement-notice" role="status">현재 위치의 정확도가 약 {Math.round(movement.accuracyMeters)}m입니다. 지도에는 대략적인 위치를 표시하며, 정확도가 100m 이내로 개선되면 경로 저장을 시작합니다.</p>}
      {todaySelected && location.error && <p className="movement-error" role="alert">{location.error}</p>}
      {dailyRoute.error && <p className="movement-error" role="alert">{dailyRoute.error}</p>}
      {movement.error && <p className="movement-error" role="alert">{movement.error}</p>}
      <MovementRouteMap points={routePoints} emptyMessage={todaySelected ? '브라우저에서 위치를 확인하지 못했습니다. 위치 권한을 확인하고 페이지를 새로고침해 주세요.' : '이 날짜에 저장된 이동 경로가 없습니다.'} />
    </section>
  </main></div></>
}
