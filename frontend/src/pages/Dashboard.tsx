import { useState } from 'react'
import Icon, { type IconName } from '../components/Icon'
import Sidebar from '../components/layout/Sidebar'
import AnimatedNumber from '../components/AnimatedNumber'
import { useGeolocation } from '../hooks/useGeolocation'
import { useLocationData } from '../hooks/useLocationData'
import dashboardStyles from './Dashboard.scss?inline'
import { dailyExerciseRecommendation } from '../utils/exerciseRecommendation'

const exercises: { name: string; icon: IconName }[] = [{ name: '러닝', icon: 'run' }, { name: '걷기', icon: 'walk' }, { name: '자전거', icon: 'bike' }, { name: '등산', icon: 'mountain' }, { name: '수영', icon: 'swim' }]
export default function Dashboard() {
  const [exercise, setExercise] = useState('러닝')
  const location = useGeolocation()
  const { weather, region, places, airQuality, uv } = useLocationData(location.coordinates, exercise)
  const address = region.data?.address ?? (location.coordinates ? '주소 확인 중' : '위치 확인 전')
  const recommendation = dailyExerciseRecommendation(exercise, weather.data, airQuality.data, uv.data)
  const metric = (value: number | null | undefined, unit = '') => value == null ? '—' : `${value}${unit}`
  return <><style>{dashboardStyles}</style><div className="dashboard">
    <Sidebar />

    <main id="top" className="content">
      <header className="welcome">
        <div><h1>오늘도 건강한 하루 보내세요 👋</h1><p><Icon name="pin" size={12} />{region.error ? '주소 조회 실패' : address}<span>{location.loading ? '위치 확인 중' : location.coordinates ? '• 위치 확인됨' : ''}</span></p></div>
        <div className="header-actions"><button onClick={location.locate} disabled={location.loading}><Icon name="refresh" size={14} />{location.loading ? '확인 중…' : location.coordinates ? '새로고침' : '내 위치 사용'}</button></div>
      </header>
      <p className="location-notice">내 위치 사용 시 날씨·대기질·주변 장소 조회를 위해 좌표를 카카오, 기상청과 AirKorea에 전달합니다.</p>
      {location.error && <p className="api-message" role="alert">{location.error}</p>}
      {region.error && <p className="api-message" role="status">{region.error}</p>}
      <div className="dashboard-grid">
        <section id="weather" className="weather panel violet">
          <div className="weather-head"><div><p><Icon name="pin" size={12} />{region.error ? '현재 위치' : address}</p><h2>현재 날씨</h2></div><span className="sun-icon"><Icon name="sun" size={26} /></span></div>
          <div className="temp"><AnimatedNumber text={metric(weather.data?.temperature)} /><sup>°C</sup></div><p className="feels">{weather.data?.condition ?? (weather.loading ? '날씨 불러오는 중…' : '날씨 정보 대기 중')}</p>{weather.error && <p role="alert">{weather.error}</p>}{weather.data && <p className="weather-source">기상청 · {weather.data.observedAt.slice(0, 4)}-{weather.data.observedAt.slice(4, 6)}-{weather.data.observedAt.slice(6, 8)} {weather.data.observedAt.slice(9, 11)}:00 관측 (KST)</p>}{weather.data?.warning && <p role="status">{weather.data.warning}</p>}
          <div className="weather-stats"><div><Icon name="drop" /><b><AnimatedNumber text={metric(weather.data?.humidity, '%')} /></b><small>습도</small></div><div><Icon name="drop" /><b><AnimatedNumber text={metric(weather.data?.precipitation, '%')} /></b><small>강수확률 (예보)</small></div><div><Icon name="wind" /><b><AnimatedNumber text={metric(weather.data?.wind, 'm/s')} /></b><small>풍속</small></div><div><Icon name="sun" /><b><AnimatedNumber text={uv.data ? `${uv.data.value}` : '—'} /></b><small>{uv.loading ? '자외선 조회 중' : uv.error ? '자외선 조회 실패' : `자외선 ${uv.data?.grade ?? '대기 중'}`}</small></div></div>
        </section>

        <section id="exercise" className="exercise-select panel"><h2>운동 선택</h2><div className="chips">{exercises.map(({ name, icon }) => <button className={exercise === name ? 'selected' : ''} onClick={() => setExercise(name)} key={name}><Icon name={icon} size={15} />{name}</button>)}</div></section>

        <section className="air panel"><div className="title-row"><h2><span className="title-icon"><Icon name="wind" size={14} /></span> 대기질 정보</h2><span className="good">{airQuality.data?.overallGrade ?? (airQuality.loading ? '조회 중' : 'AirKorea')}</span></div><p className="updated">{airQuality.data ? `${airQuality.data.source} · ${airQuality.data.stationName}${airQuality.data.source === 'AirKorea' ? ' 측정소' : ' 모델'} · ${airQuality.data.measuredAt ?? '시각 미제공'}` : airQuality.loading ? '현재 위치의 대기질을 불러오는 중…' : '내 위치를 확인하면 대기질이 표시됩니다.'}</p>{airQuality.data?.warning && <p className="api-message" role="status">{airQuality.data.warning}</p>}{airQuality.error && <p className="api-message" role="alert">{airQuality.error}</p>}<div className="air-values">{[{ label: '미세먼지 PM10', metric: airQuality.data?.pm10, unit: '㎍/㎥' }, { label: '초미세먼지 PM2.5', metric: airQuality.data?.pm25, unit: '㎍/㎥' }, { label: '오존 (O₃)', metric: airQuality.data?.ozone, unit: 'ppm' }].map(({ label, metric: airMetric, unit }) => <div key={label}><Icon name="activity" /><small>{label}</small><strong><AnimatedNumber text={airMetric?.value == null ? '—' : `${airMetric.value} ${unit}`} /></strong><span>{airMetric?.grade ?? '정보 없음'}</span></div>)}</div></section>

        <section className="recommend panel"><div className="title-row"><h2>{exercise} 운동 정보</h2><span className="level">● 강도: {recommendation.intensity}</span></div><p className="updated">현재 날씨·자외선·대기질을 반영한 오늘의 추천</p><div className="recommend-stats"><div><Icon name="history" /><small>권장 시간대</small><b><AnimatedNumber text={recommendation.time} /></b></div><div><Icon name="activity" /><small>추천 운동 시간</small><b><AnimatedNumber text={recommendation.minutes == null ? '—' : `${recommendation.minutes}분`} /></b></div><div><Icon name="drop" /><small>예상 칼로리</small><b><AnimatedNumber text={recommendation.calories == null ? '—' : `${recommendation.calories} kcal`} /></b></div></div><div className="caution"><b>오늘의 운동 안내</b><p>{recommendation.message}</p><p>기온 {weather.data?.temperature ?? '—'}°C · 강수 {weather.data?.precipitation ?? '—'}% · 자외선 {uv.data?.grade ?? '—'}</p><p>미세먼지 PM10 {metric(airQuality.data?.pm10.value, '㎍/㎥')} ({airQuality.data?.pm10.grade ?? '—'}) · 초미세먼지 PM2.5 {metric(airQuality.data?.pm25.value, '㎍/㎥')} ({airQuality.data?.pm25.grade ?? '—'})</p></div></section>

        <section id="places" className="places panel">
          <div className="title-row"><h2><span className="title-icon"><Icon name="pin" size={14} /></span> 주변 운동 장소</h2><a className="more" href="/places">주변 장소 ↗</a></div>
          <p className="updated">카카오 로컬 · 반경 10km · 직선거리 순</p>
          {!location.coordinates && <p className="api-message">내 위치를 확인하면 주변 장소가 표시됩니다.</p>}
          {places.loading && <p role="status">주변 장소를 불러오는 중…</p>}
          {places.error && <p className="api-message" role="alert">{places.error}</p>}
          {places.data?.length === 0 && <p>주변에서 해당 운동 장소를 찾지 못했습니다.</p>}
          <div className="place-list">{places.data?.slice(0, 3).map(place => <article key={place.id}><span className="place-icon"><Icon name="pin" /></span><div><h3>{place.name}</h3><p>{place.category.split(' > ').at(-1)}</p><small>{place.address}</small><small><Icon name="pin" size={11} /><AnimatedNumber text={place.distance == null ? '거리 미제공' : place.distance >= 1000 ? `${(place.distance / 1000).toFixed(1)}km` : `${place.distance}m`} /></small></div>{place.url && <a className="place-link" href={place.url} target="_blank" rel="noreferrer" aria-label={`${place.name} 카카오맵에서 보기`}>↗</a>}</article>)}</div>
        </section>
      </div>
    </main>
  </div></>
}
