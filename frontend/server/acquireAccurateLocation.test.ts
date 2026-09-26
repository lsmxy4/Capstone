import test from 'node:test'
import assert from 'node:assert/strict'
import { acquireAccurateLocation } from '../src/utils/acquireAccurateLocation.ts'

function setup(timeout = 45000) {
  let success: PositionCallback
  let failure: PositionErrorCallback
  let options: PositionOptions | undefined
  let clears = 0
  const accepted: number[] = []
  const accuracies: number[] = []
  const errors: string[] = []
  const stop = acquireAccurateLocation({
    watchPosition(onSuccess, onError, opts) { success = onSuccess; failure = onError!; options = opts; return 7 },
    clearWatch(id) { assert.equal(id, 7); clears++ },
  }, { onSuccess: p => accepted.push(p.coords.accuracy), onAccuracy: a => accuracies.push(a), onError: e => errors.push(e) }, timeout)
  const emit = (accuracy: number) => success({ coords: { latitude: 37, longitude: 127, accuracy }, timestamp: Date.now() } as GeolocationPosition)
  const reject = (code: number) => failure({ code } as GeolocationPositionError)
  return { stop, emit, reject, accepted, accuracies, errors, get options() { return options }, get clears() { return clears } }
}

test('coarse first fix waits for accurate GPS and stops watching after acceptance', () => {
  const s = setup()
  try {
    assert.equal(s.options?.enableHighAccuracy, true)
    assert.equal(s.options?.maximumAge, 0)
    s.emit(3000)
    assert.deepEqual(s.accepted, [])
    assert.deepEqual(s.errors, [])
    s.emit(15)
    assert.deepEqual(s.accepted, [15])
    assert.equal(s.clears, 1)
    s.emit(10)
    assert.deepEqual(s.accepted, [15])
  } finally { s.stop() }
})
test('temporary location failure can recover, permission denial stops immediately', () => {
  const s = setup()
  try { s.reject(2); s.reject(3); s.emit(20); assert.deepEqual(s.accepted, [20]) } finally { s.stop() }
  const denied = setup()
  try { denied.reject(1); assert.equal(denied.errors.length, 1); denied.emit(5); assert.deepEqual(denied.accepted, []) } finally { denied.stop() }
})
test('cancellation ignores stale fixes', () => {
  const s = setup()
  s.stop()
  s.emit(10)
  assert.deepEqual(s.accepted, [])
  assert.deepEqual(s.accuracies, [])
})
test('overall deadline ends coarse-location wait with actionable error', async () => {
  const s = setup(5)
  try {
    s.emit(3000)
    await new Promise(resolve => setTimeout(resolve, 20))
    assert.equal(s.errors.length, 1)
    assert.match(s.errors[0], /3,000m/)
    assert.equal(s.clears, 1)
    s.emit(10)
    assert.deepEqual(s.accepted, [])
  } finally { s.stop() }
})
