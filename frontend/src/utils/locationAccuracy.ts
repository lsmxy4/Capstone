export const MAX_LOCATION_ACCURACY_METERS = 100

export function isUsableLocation(coords: { latitude: number; longitude: number; accuracy: number }, maxAccuracy = MAX_LOCATION_ACCURACY_METERS) {
  return Number.isFinite(coords.latitude) && Math.abs(coords.latitude) <= 90
    && Number.isFinite(coords.longitude) && Math.abs(coords.longitude) <= 180
    && Number.isFinite(coords.accuracy) && coords.accuracy >= 0
    && coords.accuracy <= maxAccuracy
}

export function inaccurateLocationMessage(accuracy: number) {
  const detail = Number.isFinite(accuracy) && accuracy >= 0 ? `약 ${Math.round(accuracy).toLocaleString('ko-KR')}m` : '알 수 없는 수준'
  return `브라우저가 보고한 위치 오차가 ${detail}이어서 현재 위치를 표시하지 않습니다. 기기의 정확한 위치 설정을 확인하거나 GPS를 사용할 수 있는 휴대폰에서 다시 시도해 주세요.`
}
