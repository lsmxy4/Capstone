import type { Place } from '../types/place'

export type FavoritePlace = Place & { savedAt: string }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/auth/favorites${path}`, {
    credentials: 'same-origin',
    ...init,
  })
  const body = await response.text()
  let data: unknown
  try {
    data = body ? JSON.parse(body) : null
  } catch {
    data = null
  }
  if (!response.ok) {
    if (response.status === 401) throw new Error('즐겨찾기를 사용하려면 로그인해 주세요.')
    throw new Error('즐겨찾기를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.')
  }
  return data as T
}

export function getFavorites() {
  return request<{ favorites: FavoritePlace[] }>('')
}

export function addFavorite(place: Place) {
  return request<{ favorite: Place }>(`/${encodeURIComponent(place.id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(place),
  })
}

export function removeFavorite(placeId: string) {
  return request<{ removed: boolean }>(`/${encodeURIComponent(placeId)}`, { method: 'DELETE' })
}
