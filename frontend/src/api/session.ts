import type { User } from '../contexts/AuthContext'

export async function getCurrentUser(signal: AbortSignal): Promise<User | null> {
  const response = await fetch('/api/auth/me', { credentials: 'same-origin', signal })
  if (response.status === 401) return null
  if (!response.ok) throw new Error('사용자 정보를 불러오지 못했습니다.')
  const data: { user: User } = await response.json()
  return data.user
}

export async function logout(): Promise<void> {
  const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
  if (!response.ok) throw new Error('로그아웃에 실패했습니다. 다시 시도해주세요.')
}
