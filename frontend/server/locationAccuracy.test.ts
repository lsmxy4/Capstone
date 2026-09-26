import test from 'node:test'
import assert from 'node:assert/strict'
import { isUsableLocation, inaccurateLocationMessage } from '../src/utils/locationAccuracy.ts'

test('coarse browser locations are rejected before displaying or saving a pin', () => {
  for (const accuracy of [101, 3000, Infinity, NaN, -1]) {
    assert.equal(isUsableLocation({ latitude: 37, longitude: 127, accuracy }), false)
  }
})
test('accurate valid coordinates pass and invalid coordinates do not', () => {
  assert.equal(isUsableLocation({ latitude: 37, longitude: 127, accuracy: 100 }), true)
  assert.equal(isUsableLocation({ latitude: 37, longitude: 127, accuracy: 5 }), true)
  assert.equal(isUsableLocation({ latitude: 91, longitude: 127, accuracy: 5 }), false)
  assert.equal(isUsableLocation({ latitude: 37, longitude: NaN, accuracy: 5 }), false)
})
test('poor accuracy message reports uncertainty rather than claiming a real position', () => {
  assert.match(inaccurateLocationMessage(3000), /3,000m/)
  assert.match(inaccurateLocationMessage(3000), /현재 위치를 표시하지 않습니다/)
})

test('general pages accept coarse coordinates while nearby places reject them', () => {
  const approximate = { latitude: 37, longitude: 127, accuracy: 3000 }
  assert.equal(isUsableLocation(approximate, Infinity), true)
  assert.equal(isUsableLocation(approximate, 100), false)
  assert.equal(isUsableLocation({ ...approximate, accuracy: 50 }, 100), true)
  assert.equal(isUsableLocation({ ...approximate, latitude: NaN }, Infinity), false)
  assert.equal(isUsableLocation({ ...approximate, accuracy: NaN }, Infinity), false)
})
