import { useState } from 'react'
import type { ChangeEvent, FormEvent, MouseEvent } from 'react'
import { login } from '../api/auth'
import './Login.scss'

const initialForm = {
  email: '',
  password: '',
  keepLoggedIn: true,
}

const initialErrors = {
  email: '',
  password: '',
}

type LoginProps = {
  onLoginSuccess?: (user: { email: string; name?: string }) => void
  onNavigateSignup?: () => void
}

export default function Login({ onLoginSuccess, onNavigateSignup }: LoginProps = {}) {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState(initialErrors)
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleKeepLoggedInChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.target
    setForm((prev) => ({ ...prev, keepLoggedIn: checked }))
  }

  const validate = () => {
    const nextErrors = { ...initialErrors }

    if (!form.email.trim()) {
      nextErrors.email = '이메일을 입력해주세요.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = '이메일 형식이 올바르지 않습니다.'
    }

    if (!form.password) {
      nextErrors.password = '비밀번호를 입력해주세요.'
    }

    setErrors(nextErrors)
    return !Object.values(nextErrors).some(Boolean)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError('')

    if (!validate()) return

    setIsSubmitting(true)
    try {
      const { user } = await login(form.email, form.password, form.keepLoggedIn)
      onLoginSuccess?.(user)
    } catch (error: unknown) {
      setSubmitError((error instanceof Error && error.message) || '로그인에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignupClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (onNavigateSignup) {
      event.preventDefault()
      onNavigateSignup()
    }
    // onNavigateSignup이 없으면 <a href="/signup">의 기본 동작을 그대로 사용합니다.
  }

  return (
    <div className="login-page">
      <div className="login-container">
        {/* 좌측: 서비스 소개 영역 */}
        <section className="login-visual" aria-label="서비스 소개">
          <a className="login-logo" href="/">
            <span className="login-logo-mark" aria-hidden="true">
              <LoginIcon name="pulse" size={18} />
            </span>
            FitMap
          </a>

          <h1>
            위치 기반
            <br />
            스마트 운동 가이드
          </h1>
          <p className="placeholder-copy">
            현재 위치의 날씨와 주변 운동 장소를
            <br />한 번에 확인하세요.
          </p>

          <div className="login-stats" aria-label="서비스 통계">
            {[["12,000+", "활성 사용자"], ["5,400+", "등록 장소"], ["98%", "만족도"]].map(([value, label]) => (
              <div key={label}><strong>{value}</strong><span>{label}</span></div>
            ))}
          </div>

          <span className="login-badge">
            <LoginIcon name="pin" size={13} />
            Geolocation API 기반 서비스
          </span>
        </section>

        {/* 우측: 로그인 폼 영역 */}
        <section className="login-form-area" aria-label="로그인 폼">
          <h2>다시 만나서 반가워요 👋</h2>
          <p className="login-subtitle">계정에 로그인하세요</p>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="email">이메일</label>
              <div className="input-wrap">
                <LoginIcon name="mail" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="이메일을 입력하세요"
                  value={form.email}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="field-error" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="form-field">
              <div className="form-field-label-row">
                <label htmlFor="password">비밀번호</label>
                {/* 비밀번호 찾기 페이지/기능은 이번 작업 범위 밖 — 추후 연결 */}
                <a href="#find-password" className="link-muted">비밀번호 찾기</a>
              </div>
              <div className="input-wrap">
                <LoginIcon name="lock" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="비밀번호를 입력하세요"
                  value={form.password}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                >
                  {showPassword ? <LoginIcon name="eyeoff" /> : <LoginIcon name="eye" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="field-error" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="login-form-row">
              <label className="checkbox-field">
                <input type="checkbox" name="keepLoggedIn" checked={form.keepLoggedIn} onChange={handleKeepLoggedInChange} />
                로그인 상태 유지
              </label>
            </div>

            {submitError && (
              <p className="form-error" role="alert">
                {submitError}
              </p>
            )}

            <button type="submit" className="submit-button" disabled={isSubmitting}>
              {isSubmitting ? '로그인 중...' : '로그인 →'}
            </button>
          </form>

          <div className="divider">또는</div>

          {/* 카카오 로그인 연동 전까지 비활성화 */}
          <button type="button" className="kakao-button" disabled>
            <span className="kakao-icon-circle" aria-hidden="true">K</span>
            카카오로 계속하기
          </button>

          <p className="signup-prompt">
            아직 계정이 없으신가요?{' '}
            <a href="/signup" onClick={handleSignupClick}>
              무료 회원가입 →
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}

const iconPaths = {
  pulse: <><path d="M2 12h4l2-7 4 14 2-7h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></>,
  pin: <><path d="M12 21s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></>,
  lock: <><rect x="4" y="11" width="16" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" /></>,
  eyeoff: <><path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a13.5 13.5 0 0 1-3.2 4.1M6.6 6.6C3.9 8.3 2 12 2 12s3.5 7 10 7a9.8 9.8 0 0 0 3.4-.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></>,
}

function LoginIcon({ name, size = 16 }: { name: keyof typeof iconPaths; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">{iconPaths[name]}</svg>
}
