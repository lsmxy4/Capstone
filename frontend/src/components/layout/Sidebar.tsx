import { useEffect, useRef, useState } from 'react'
import Icon from '../Icon'
import { useAuth } from '../../contexts/AuthContext'
import './Sidebar.scss'

export default function Sidebar() {
  const { user, loading, error, onLogout } = useAuth()
  const displayName = user?.name?.trim() || user?.email || '게스트'
  const [loggingOut, setLoggingOut] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)

  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)

  const closeTimer =
    useRef<ReturnType<typeof setTimeout> | null>(null)

  const closeMenu = () => {
    if (closing) return

    setClosing(true)

    closeTimer.current = setTimeout(
      () => {
        dialogRef.current?.close()
        setClosing(false)
      },
      window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches
        ? 0
        : 240
    )
  }

  useEffect(() => {
    return () => {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current)
      }
    }
  }, [])

  const menuIcon = (
    <span
      className="menu-lines"
      aria-hidden="true"
    >
      <span />
      <span />
      <span />
    </span>
  )

  useEffect(() => {
    const desktop =
      window.matchMedia('(min-width: 1001px)')

    const resize = () => {
      if (desktop.matches) {
        dialogRef.current?.close()
      }
    }

    desktop.addEventListener('change', resize)

    return () =>
      desktop.removeEventListener(
        'change',
        resize
      )
  }, [])

  useEffect(() => {
    if (!open) return

    const previous =
      document.body.style.overflow

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow =
        previous
    }
  }, [open])

  const currentPath =
    window.location.hash === '#weather'
      ? '/weather'
      : window.location.pathname.replace(
          /\/+$/,
          ''
        ) || '/dashboard'

  const isActive = (path: string) =>
    currentPath === path

  const contents = (
    <>
      <a
        className="logo"
        href="/dashboard"
      >
        <Icon
          name="activity"
          size={24}
        />

        <strong>
          FitMap
        </strong>
      </a>

      <nav
        aria-label="주 메뉴"
        onClick={closeMenu}
      >
        <a
          className={
            isActive('/dashboard')
              ? 'active'
              : ''
          }
          href="/dashboard"
        >
          <Icon name="home" />
          홈
        </a>

        <a
          className={
            isActive('/weather')
              ? 'active'
              : ''
          }
          href="/dashboard#weather"
        >
          <Icon name="pin" />
          내 위치 / 날씨
        </a>

        <a
          className={
            isActive('/exercise')
              ? 'active'
              : ''
          }
          href="/exercise"
        >
          <Icon name="activity" />
          운동 정보
        </a>

        <a
          className={
            isActive('/places')
              ? 'active'
              : ''
          }
          href="/places"
        >
          <Icon name="map" />
          주변 장소
        </a>

        <a
          className={
            isActive('/favorites')
              ? 'active'
              : ''
          }
          href="/favorites"
        >
          <Icon name="star" />
          즐겨찾기
        </a>
      </nav>

      {/* 사용자 영역 */}
      <div className="profile">

        <span className="avatar">
          {user ? Array.from(displayName)[0] : '?'}
        </span>

        <div className="profile-info">
          <b>{loading ? '불러오는 중…' : error ? '조회 실패' : displayName}</b>
          <small>{error || (user ? '사용자 계정' : '로그인이 필요합니다')}</small>
        </div>

        {user ? <button
          type="button"
          className="logout-button"
          disabled={loggingOut}
          onClick={async () => {
            setLoggingOut(true)
            try { await onLogout() } finally { setLoggingOut(false) }
          }}
        >
          {loggingOut ? '로그아웃 중…' : '로그아웃'}
        </button> : !loading && <a href="/login" className="logout-button">로그인</a>}

      </div>
    </>
  )

  return (
    <>
      <div className="sidebar-toolbar">
        <a href="/">
          FitMap
        </a>

        <button
          type="button"
          className="menu-toggle"
          aria-label="메뉴 열기"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => {
            setClosing(false)
            dialogRef.current?.showModal()
            setOpen(true)
          }}
        >
          {menuIcon}
        </button>
      </div>

      <aside className="fitmap-sidebar desktop-sidebar">
        {contents}
      </aside>

      <dialog
        id="mobile-menu"
        ref={dialogRef}
        className={`fitmap-sidebar mobile-sidebar${
          closing ? ' is-closing' : ''
        }`}
        aria-label="전체 메뉴"
        onCancel={(event) => {
          event.preventDefault()
          closeMenu()
        }}
        onClose={() => {
          setOpen(false)
          setClosing(false)
        }}
        onClick={(event) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            closeMenu()
          }
        }}
      >
        <button
          type="button"
          className={`sidebar-close menu-toggle${
            closing ? '' : ' is-open'
          }`}
          aria-label="메뉴 닫기"
          aria-expanded={!closing}
          aria-controls="mobile-menu"
          onClick={closeMenu}
          autoFocus
        >
          {menuIcon}
        </button>

        <div className="sidebar-dialog-content">
          {contents}
        </div>
      </dialog>
    </>
  )
}
