const destinations = new Set(['/dashboard', '/exercise', '/places', '/favorites', '/mypage'])

export function safeReturnTo(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\s]/.test(value)) return '/dashboard'
  const path = value.split(/[?#]/, 1)[0]
  return destinations.has(path) ? value : '/dashboard'
}

export function loginUrl(returnTo: string): string {
  return `/login?returnTo=${encodeURIComponent(safeReturnTo(returnTo))}`
}

export function authNavigationUrl(path: '/login' | '/signup', search: string): string {
  const returnTo = new URLSearchParams(search).get('returnTo')
  return returnTo ? `${path}?returnTo=${encodeURIComponent(safeReturnTo(returnTo))}` : path
}
