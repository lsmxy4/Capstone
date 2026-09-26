import test from 'node:test'
import assert from 'node:assert/strict'
import { acceptedMovementMeters } from '../src/utils/movementDistance.ts'
import { safeReturnTo, loginUrl, authNavigationUrl } from '../src/utils/authNavigation.ts'

const pointAt = (meters: number) => ({ latitude: meters / 6371000 * 180 / Math.PI, longitude: 0 })

test('short steps accumulate from the last accepted point', () => {
  let anchor = pointAt(0)
  let total = 0
  for (const meters of [2, 4, 6, 8, 10, 12]) {
    const next = pointAt(meters)
    const distance = acceptedMovementMeters(anchor, next, 5)
    if (distance > 0) { total += distance; anchor = next }
  }
  assert.ok(Math.abs(total - 12) < .01)
})
test('stationary jitter, poor accuracy and large GPS jumps are rejected', () => {
  assert.equal(acceptedMovementMeters(pointAt(0), pointAt(2), 5), 0)
  assert.equal(acceptedMovementMeters(pointAt(0), pointAt(20), 150), 0)
  assert.equal(acceptedMovementMeters(pointAt(0), pointAt(2000), 5), 0)
  assert.ok(acceptedMovementMeters(pointAt(0), pointAt(6), 5) > 5)
})
test('login keeps original page and hash through signup and back', () => {
  for (const destination of ['/favorites', '/mypage', '/places', '/exercise', '/dashboard#weather']) {
    const search = loginUrl(destination).slice('/login'.length)
    const signup = authNavigationUrl('/signup', search)
    const login = authNavigationUrl('/login', signup.slice('/signup'.length))
    assert.equal(safeReturnTo(new URLSearchParams(login.slice('/login'.length)).get('returnTo')), destination)
  }
})
test('missing, external, authentication-loop and unsupported destinations use dashboard', () => {
  for (const destination of [null, '', 'https://example.com', '//example.com', '/\\example.com', '/login', '/signup', '/unknown', '/places/../login']) {
    assert.equal(safeReturnTo(destination), '/dashboard')
  }
})
