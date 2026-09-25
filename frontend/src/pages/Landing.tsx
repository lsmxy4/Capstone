import { useState } from 'react'
import Icon, { type IconName } from '../components/Icon'
import './Landing.scss'

type LandingProps = {
  onNavigateLogin: () => void
  onNavigateSignup: () => void
  onNavigatePage: (page: 'dashboard' | 'exercise' | 'places' | 'favorites') => void
}

const features: { id: string; icon: IconName; title: string; description: string; tag: string }[] = [
  { id: 'location', icon: 'pin', title: '시작은, 지금 내 위치', description: '내가 있는 곳을 기준으로 날씨와 운동 환경을 한눈에 확인하세요.', tag: '위치 기반 안내' },
  { id: 'weather', icon: 'sun', title: '나가기 전, 하늘 한 번', description: '기온부터 미세먼지, 자외선까지. 야외 활동에 필요한 정보를 모았어요.', tag: '날씨 · 대기질' },
  { id: 'exercise', icon: 'activity', title: '오늘의 나에게 맞는 운동', description: '걷기, 러닝, 자전거. 현재 환경을 살펴보고 오늘의 운동을 골라보세요.', tag: '운동 가이드' },
  { id: 'place', icon: 'map', title: '생각보다 가까운 운동 공간', description: '주변 공원과 체육시설을 지도에서 찾아보고 거리와 장소 정보를 확인하세요.', tag: '주변 장소 탐색' },
  { id: 'favorite', icon: 'star', title: '또 가고 싶은 곳은, 저장', description: '마음에 드는 운동 장소를 내 계정에 모아두고 다음 운동 때 다시 꺼내보세요.', tag: '나만의 즐겨찾기' },
]

const activities = [
  { label: '걷기', icon: 'walk', place: '초록 산책공원', distance: '350m', detail: '나무 그늘을 따라 가볍게' },
  { label: '러닝', icon: 'run', place: '강변 러닝 코스', distance: '800m', detail: '강바람과 함께 달리는 길' },
  { label: '자전거', icon: 'bike', place: '강변 자전거길', distance: '1.2km', detail: '두 바퀴로 만나는 새로운 풍경' },
] as const

const steps = [
  { icon: 'pin', title: '내 위치를 확인하고', text: '위치 권한을 허용하면 주변 환경을 불러와요.' },
  { icon: 'sun', title: '오늘의 환경을 살피고', text: '날씨와 대기질을 보고 운동을 선택해요.' },
  { icon: 'run', title: '가까운 곳에서 시작해요', text: '마음에 드는 장소를 찾고 가볍게 움직여요.' },
] as const

const questions = [
  ['회원가입 없이도 둘러볼 수 있나요?', '네. 기능별 미리보기는 로그인 없이 이용할 수 있어요. 게스트의 이동 경로는 화면에만 표시하며 서버에 저장하지 않습니다. 즐겨찾기와 계정별 기록 저장은 로그인 후 이용할 수 있어요.'],
  ['위치 권한은 왜 필요한가요?', '현재 위치에 맞는 날씨와 주변 운동 장소를 안내하기 위해 필요해요. 위치 권한은 브라우저 설정에서 언제든 변경할 수 있으며, 권한을 허용하지 않아도 예시 화면은 둘러볼 수 있어요.'],
  ['미리보기의 날씨와 장소는 실제 정보인가요?', '미리보기에는 기능을 설명하기 위한 예시 데이터가 표시됩니다. 실제 기능 화면에서는 현재 위치를 기준으로 날씨와 장소 정보를 불러와요.'],
]

function Brand() {
  return <span className="lm-brand"><span className="lm-brand-mark"><Icon name="activity" size={23} /></span>FitMap<span className="lm-brand-dot">.</span></span>
}

export default function Landing({ onNavigateLogin, onNavigateSignup }: LandingProps) {
  const [activity, setActivity] = useState(0)
  const selected = activities[activity]

  return (
    <div className="landing-page" id="landing-top">
      <a className="lm-skip" href="#landing-content">본문으로 건너뛰기</a>
      <header className="lm-header">
        <nav className="lm-container lm-nav" aria-label="메인 메뉴">
          <a href="#landing-top" aria-label="FitMap 처음으로"><Brand /></a>
          <div className="lm-nav-links"><a href="#features">주요 기능</a><a href="#how-it-works">이용 방법</a><a href="#questions">궁금한 점</a></div>
          <div className="lm-auth"><button className="lm-login" onClick={onNavigateLogin}>로그인</button><button className="lm-button lm-button-small" onClick={onNavigateSignup}>시작하기 <span aria-hidden="true">↗</span></button></div>
        </nav>
      </header>

      <main id="landing-content" className="lm-main">
        <section className="lm-hero" aria-labelledby="lm-hero-title">
          <div className="lm-container lm-hero-grid">
            <div className="lm-hero-copy">
              <span className="lm-eyebrow"><span className="lm-live-dot" /> 일상에 운동을 더하는 가장 가까운 방법</span>
              <h1 id="lm-hero-title">오늘의 운동,<br />시작점은 <span>지금 여기.</span></h1>
              <p>어디서, 어떤 운동을 할지 고민될 때.<br />내 주변의 날씨와 장소를 살펴보고<br className="lm-mobile-break" /> 나에게 맞는 움직임을 찾아보세요.</p>
              <div className="lm-hero-actions"><button className="lm-button" onClick={onNavigateSignup}>나의 운동 시작하기 <span aria-hidden="true">↗</span></button><a className="lm-text-link" href="/preview/location">먼저 둘러보기 <span aria-hidden="true">→</span></a></div>
              <div className="lm-hero-note"><Icon name="pin" size={14} /> 내 위치 기반 안내 <span>·</span> 로그인 없이 미리보기</div>
            </div>

            <div className="lm-demo" aria-label="운동 장소 미리보기 예시">
              <div className="lm-demo-top"><span><span className="lm-live-dot" /> MY NEIGHBORHOOD</span><small>예시 화면</small></div>
              <div className="lm-demo-map">
                <svg className="lm-map-art" viewBox="0 0 520 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                  <rect width="520" height="360" fill="#eeeee7" />
                  <path d="M-20 270C110 240 135 330 270 285S430 210 550 260" stroke="#c5dde5" strokeWidth="68" fill="none" />
                  <path d="M-10 55L160 85 235 0M90 0L160 220 310 250 360 370M520 45L355 130 370 230M260 0L280 160 520 190" stroke="#fff" strokeWidth="16" fill="none" />
                  <path d="M0 160L220 140 355 130M210 360L220 140M410 0L355 130 510 330" stroke="#fff" strokeWidth="8" fill="none" />
                  <path d="M45 30L115 45 140 120 35 135Z M300 25L365 28 331 99 298 110Z M275 180L340 170 345 218 280 220Z" fill="#d6e3cc" />
                  <g fill="#e0dfd7"><rect x="35" y="180" width="42" height="40" rx="7" /><rect x="90" y="170" width="48" height="57" rx="7" /><rect x="395" y="80" width="54" height="38" rx="7" /><rect x="420" y="132" width="68" height="29" rx="6" /></g>
                  <path d="M160 195L208 185Q220 184 220 168L220 143 282 139 310 100" stroke="#7e6be5" strokeWidth="5" strokeDasharray="7 7" strokeLinecap="round" fill="none" />
                  <circle cx="160" cy="195" r="20" fill="#7760e5" opacity=".13" /><circle cx="160" cy="195" r="8" fill="#7760e5" stroke="white" strokeWidth="3" />
                </svg>
                <span className="lm-map-label lm-map-label-park">초록 산책공원</span><span className="lm-map-label lm-map-label-river">강변 산책로</span>
                <span className="lm-map-pin"><Icon name={selected.icon} size={22} /></span>
                <div className="lm-weather-float"><span className="lm-sun"><Icon name="sun" size={27} /></span><div><strong>24° <small>맑음</small></strong><p>미세먼지 좋음 <span>·</span> 예시</p></div></div>
                <span className="lm-map-current">내 위치</span>
              </div>
              <div className="lm-demo-bottom">
                <div className="lm-demo-heading"><strong>오늘은 어떻게 움직일까요?</strong><span>가까운 곳부터</span></div>
                <div className="lm-activity-options" aria-label="예시 운동 선택">{activities.map((item, index) => <button key={item.label} aria-pressed={activity === index} onClick={() => setActivity(index)}><Icon name={item.icon} size={16} />{item.label}</button>)}</div>
                <a className="lm-place-row" href="/preview/place" aria-live="polite"><span className="lm-place-symbol"><Icon name={selected.icon} size={22} /></span><span><strong>{selected.place}</strong><small>{selected.detail}</small></span><span className="lm-place-distance">{selected.distance}<span aria-hidden="true">↗</span></span></a>
              </div>
              <div className="lm-demo-caption"><Icon name="map" size={13} /> 기능 이해를 돕기 위한 예시 지도와 데이터입니다.</div>
            </div>
          </div>
          <div className="lm-container lm-hero-bottom"><span>FIND YOUR OWN PACE</span><p>산책 한 번도, 새로운 코스도. <strong>움직이는 모든 순간을 위해.</strong></p><a href="#features" aria-label="주요 기능으로 내려가기">↓</a></div>
        </section>

        <section className="lm-features lm-container" id="features" aria-labelledby="lm-features-title">
          <div className="lm-section-heading"><div><span className="lm-kicker">EVERYDAY, A LITTLE MORE ACTIVE</span><h2 id="lm-features-title">운동을 시작하는 데 필요한 것,<br />한곳에 모았어요.</h2></div><p>오늘의 환경을 확인하고, 장소를 찾고, 저장하기까지.<br />궁금한 기능을 눌러 먼저 경험해 보세요.</p></div>
          <div className="lm-feature-grid">{features.map((feature, index) => <article className={`lm-feature lm-feature-${feature.id}`} key={feature.id}>
            <div className="lm-feature-top"><span className="lm-feature-icon"><Icon name={feature.icon} size={24} /></span><span>0{index + 1}</span></div>
            <small>{feature.tag}</small><h3>{feature.title}</h3><p>{feature.description}</p>
            <a href={`/preview/${feature.id}`} aria-label={`${feature.tag} 미리보기`}>기능 미리보기 <span aria-hidden="true">↗</span></a>
          </article>)}<article className="lm-feature lm-feature-invite"><span className="lm-invite-art" aria-hidden="true">↗</span><small>YOUR NEXT MOVE</small><h3>다음 목적지는<br />조금 더 건강한 일상.</h3><p>나만의 운동 장소와 기록을 만들어 보세요.</p><button onClick={onNavigateSignup}>함께 시작하기 <span aria-hidden="true">→</span></button></article></div>
        </section>

        <section className="lm-how" id="how-it-works" aria-labelledby="lm-how-title"><div className="lm-container"><div className="lm-section-heading"><div><span className="lm-kicker">HOW IT WORKS</span><h2 id="lm-how-title">복잡한 준비 대신,<br />가벼운 세 걸음.</h2></div><a href="/preview/exercise" className="lm-text-link">운동 가이드 둘러보기 <span aria-hidden="true">↗</span></a></div><div className="lm-steps">{steps.map((step, index) => <article key={step.title}><span className="lm-step-number">STEP 0{index + 1}</span><Icon name={step.icon} size={30} /><h3>{step.title}</h3><p>{step.text}</p></article>)}</div></div></section>

        <section className="lm-faq lm-container" id="questions" aria-labelledby="lm-faq-title"><div><span className="lm-kicker">GOOD TO KNOW</span><h2 id="lm-faq-title">시작 전,<br />궁금한 점이 있나요?</h2><p>FitMap을 조금 더 편하게 사용하는 방법.</p></div><div className="lm-faq-list">{questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>

        <section className="lm-cta lm-container"><div><span className="lm-kicker">LET’S GET MOVING</span><h2>오늘의 작은 움직임이<br />내일의 나를 바꾸니까.</h2><p>지금 있는 곳에서, FitMap과 시작해 보세요.</p></div><div><button className="lm-button" onClick={onNavigateSignup}>나의 첫걸음 시작하기 <span aria-hidden="true">↗</span></button><a href="/preview/location">아직 고민된다면, 먼저 둘러보기 →</a></div></section>
      </main>

      <footer className="lm-footer"><div className="lm-container"><div className="lm-footer-top"><a href="#landing-top" aria-label="FitMap 처음으로"><Brand /></a><p>내 위치에서 시작하는, 더 건강한 일상.</p><nav aria-label="하단 메뉴"><a href="#features">주요 기능</a><a href="#how-it-works">이용 방법</a><button onClick={onNavigateLogin}>로그인</button></nav></div><div className="lm-footer-bottom"><span>© {new Date().getFullYear()} FitMap. All rights reserved.</span><span>MOVE A LITTLE. FEEL A LOT.</span></div></div></footer>
    </div>
  )
}
