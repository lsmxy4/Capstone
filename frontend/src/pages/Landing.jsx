import "./Landing.scss";

export default function Landing({
  onNavigateLogin,
  onNavigateSignup,
  onNavigatePage,
}) {
  return (
    <div className="landing-page">
      {/* HEADER */}
      <header className="landing-header">
        <nav className="landing-nav">
          <div className="landing-logo">
            <div className="logo-icon">F</div>
            <span>FitMap</span>
          </div>

          <div className="landing-menu">
            <a href="#service">서비스 소개</a>
            <a href="#features">주요 기능</a>
          </div>

          <div className="landing-auth">
            <button
              type="button"
              className="login-button"
              onClick={onNavigateLogin}
            >
              로그인
            </button>

            <button
              type="button"
              className="signup-button"
              onClick={onNavigateSignup}
            >
              무료 시작하기
            </button>
          </div>
        </nav>
      </header>

      {/* MAIN */}
      <main>
        {/* HERO */}
        <section className="landing-hero" id="service">
          <div className="hero-inner">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              스마트 운동 가이드
            </div>

            <h1>
              내 위치에서 시작하는
              <br />
              <span>스마트 운동 가이드</span>
            </h1>

            <p className="hero-description">
              현재 위치의 날씨와 대기질을 분석하여
              <br />
              오늘 가장 적합한 운동과 주변 운동 장소를
              추천해드립니다.
            </p>

            <div className="hero-buttons">
              <button
                type="button"
                className="hero-primary-button"
                onClick={onNavigateSignup}
              >
                무료로 시작하기
              </button>

              <button
                type="button"
                className="hero-secondary-button"
                onClick={onNavigateLogin}
              >
                로그인
              </button>
            </div>

            {/* DASHBOARD PREVIEW */}
            <div className="dashboard-preview">
              <div className="preview-top">
                <div className="browser-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                <div className="preview-address">
                  fitmap.com
                </div>

                <div className="preview-icons">
                  •••
                </div>
              </div>

              <div className="preview-body">
                <aside className="preview-sidebar">
                  <div className="preview-logo">
                    <span>F</span>
                    FitMap
                  </div>

                  <div className="preview-menu active">
                    <span>⌂</span>
                    대시보드
                  </div>

                  <div className="preview-menu">
                    <span>🏃</span>
                    운동 정보
                  </div>

                  <div className="preview-menu">
                    <span>⌖</span>
                    주변 장소
                  </div>

                  <div className="preview-menu">
                    <span>♡</span>
                    즐겨찾기
                  </div>
                </aside>

                <div className="preview-content">
                  <div className="weather-card">
                    <div>
                      <span className="weather-location">
                        현재 위치 · 양평
                      </span>

                      <div className="weather-temperature">
                        24
                        <span>°C</span>
                      </div>

                      <span className="weather-info">
                        맑음 · 습도 58%
                      </span>
                    </div>

                    <div className="weather-icon">
                      ☀
                    </div>
                  </div>

                  <div className="exercise-tabs">
                    <div className="exercise-tab active">
                      전체
                    </div>

                    <div className="exercise-tab">
                      유산소
                    </div>

                    <div className="exercise-tab">
                      근력
                    </div>

                    <div className="exercise-tab">
                      스트레칭
                    </div>
                  </div>

                  <div className="place-preview-list">
                    <div className="preview-place">
                      <div className="place-preview-icon">
                        🏃
                      </div>

                      <div>
                        <strong>양평 러닝파크</strong>
                        <small>
                          1.2 km · ★ 4.9
                        </small>
                      </div>

                      <span>›</span>
                    </div>

                    <div className="preview-place">
                      <div className="place-preview-icon">
                        🏋
                      </div>

                      <div>
                        <strong>핏니스 헬스장</strong>
                        <small>
                          1.8 km · ★ 4.8
                        </small>
                      </div>

                      <span>›</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section
          className="features-section"
          id="features"
        >
          <div className="section-inner">
            <div className="section-title-area">
              <span className="section-number">
                핵심 기능
              </span>

              <h2>
                FitMap이 제공하는 모든 것
              </h2>

              <p>
                복잡한 설정 없이 위치만 허용하면
                <br />
                나머지는 FitMap이 알아서 분석합니다.
              </p>
            </div>

            <div className="feature-grid">

              {/* 1. 실시간 위치 확인 */}
              <article
                className="feature-card"
                onClick={() =>
                  onNavigatePage("dashboard")
                }
              >
                <div className="feature-icon location">
                  <span>⌖</span>
                </div>

                <h3>
                  실시간 위치 확인
                </h3>

                <p>
                  현재 위치를 확인하고 위치를 기반으로
                  현재 날씨와 운동환경 정보를 제공합니다.
                </p>

                <button
                  type="button"
                  className="feature-link"
                >
                  자세히 보기 →
                </button>
              </article>

              {/* 2. 맞춤형 운동 정보 */}
              <article
                className="feature-card"
                onClick={() =>
                  onNavigatePage("exercise")
                }
              >
                <div className="feature-icon exercise">
                  <span>♧</span>
                </div>

                <h3>
                  맞춤형 운동 정보
                </h3>

                <p>
                  현재 날씨와 운동환경을 분석해
                  적합한 운동 정보를 제공합니다.
                </p>

                <button
                  type="button"
                  className="feature-link"
                >
                  자세히 보기 →
                </button>
              </article>

              {/* 3. 주변 운동 장소 탐색 */}
              <article
                className="feature-card"
                onClick={() =>
                  onNavigatePage("places")
                }
              >
                <div className="feature-icon place">
                  <span>⌗</span>
                </div>

                <h3>
                  주변 운동 장소 탐색
                </h3>

                <p>
                  현재 위치 주변의 공원·운동장·체육시설을
                  확인할 수 있습니다.
                </p>

                <button
                  type="button"
                  className="feature-link"
                >
                  자세히 보기 →
                </button>
              </article>

              {/* 4. 즐겨찾기 */}
              <article
                className="feature-card"
                onClick={() =>
                  onNavigatePage("favorites")
                }
              >
                <div className="feature-icon favorite">
                  <span>♡</span>
                </div>

                <h3>
                  즐겨찾기
                </h3>

                <p>
                  자주 방문하는 운동 장소를 저장하고
                  빠르게 확인할 수 있습니다.
                </p>

                <button
                  type="button"
                  className="feature-link"
                >
                  자세히 보기 →
                </button>
              </article>

              {/* 5. 날씨 & 대기질 분석 */}
              <article
                className="feature-card"
                onClick={() =>
                  onNavigatePage("dashboard")
                }
              >
                <div className="feature-icon weather">
                  <span>☀</span>
                </div>

                <h3>
                  날씨 & 대기질 분석
                </h3>

                <p>
                  현재 위치의 날씨와 대기환경을 확인하고
                  운동하기 좋은 환경인지 분석합니다.
                </p>

                <button
                  type="button"
                  className="feature-link"
                >
                  자세히 보기 →
                </button>
              </article>

            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-logo">
            <div className="logo-icon">
              F
            </div>

            <span>
              FitMap
            </span>
          </div>

          <p>
            내 위치에서 시작하는 스마트 운동 가이드
          </p>

          <span className="footer-copy">
            © 2026 FitMap. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}