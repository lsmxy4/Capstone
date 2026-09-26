export type MovementPoint = { latitude: number; longitude: number }

export function acceptedMovementMeters(from: MovementPoint, to: MovementPoint, accuracy: number) {
  if (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100) return 0
  const radians = (degrees: number) => degrees * Math.PI / 180
  const a = Math.sin(radians(to.latitude - from.latitude) / 2) ** 2
    + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude))
    * Math.sin(radians(to.longitude - from.longitude) / 2) ** 2
  const segment = 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))))
  return segment >= Math.max(5, accuracy * .5) && segment < 1000 ? segment : 0
}
