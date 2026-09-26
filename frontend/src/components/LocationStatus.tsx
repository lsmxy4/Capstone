export default function LocationStatus({ location }: {
  location: { loading: boolean; coordinates: unknown; accuracyMeters: number | null; locate: () => void }
}) {
  const accuracy = location.accuracyMeters
  return <div className="location-status" role="status">
    <span>{location.loading
      ? `고정밀 위치 확인 중… ${accuracy != null && Number.isFinite(accuracy) ? `(현재 오차 약 ${Math.round(accuracy).toLocaleString('ko-KR')}m) ` : ''}최대 45초 동안 더 정확한 신호를 기다립니다.`
      : location.coordinates && accuracy != null
        ? `위치 연결됨 · 기기가 보고한 오차 약 ${Math.round(accuracy)}m`
        : '휴대폰의 위치 서비스와 브라우저의 정확한 위치 권한을 켜 주세요.'}</span>
    {!location.loading && <button type="button" onClick={location.locate}>위치 다시 확인</button>}
  </div>
}
