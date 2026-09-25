import { useState } from 'react'
import Icon from './Icon'

const previews = {
  location: {
    title: '내 위치에서 시작하는 하루', subtitle: '위치를 허용하면 주변 환경을 한눈에 확인할 수 있어요.',
    label: '현재 위치', value: '서울숲 인근', detail: '서울 성동구 · 위치 확인 완료',
    rows: [['주변 공원', '도보 5분 거리'], ['오늘의 날씨', '맑음 · 24°C'], ['추천 활동', '가볍게 산책하기']],
    note: '실제 화면에서는 기기의 위치 권한을 허용하면 현재 위치를 기준으로 정보를 불러옵니다.',
  },
  exercise: {
    title: '오늘은 어떤 운동을 할까요?', subtitle: '날씨와 대기환경에 맞는 운동 정보를 살펴보세요.',
    label: '오늘의 운동 예시', value: '가벼운 걷기', detail: '바깥 공기를 느끼며 천천히 시작해 보세요.',
    rows: [['운동 종류', '걷기 · 러닝 · 자전거'], ['확인할 환경', '기온 · 강수확률 · 자외선'], ['이동 기록', '오늘 이동한 거리와 경로']],
    note: '운동 화면에서 종목을 선택하면 현재 환경에 맞는 안내와 이동 기록을 확인할 수 있습니다.',
  },
  place: {
    title: '멀리 가지 않아도 괜찮아요', subtitle: '내 주변에서 운동하기 좋은 장소를 찾아보세요.',
    label: '주변 장소 예시', value: '걸어서 만나는 운동 공간', detail: '거리와 장소 정보를 함께 확인하세요.',
    rows: [['초록 산책공원', '350m · 산책로'], ['우리동네 체육관', '800m · 실내 운동'], ['강변 자전거길', '1.2km · 자전거']],
    note: '실제 장소 화면은 현재 위치를 기준으로 검색하며, 장소를 선택하면 상세 정보를 볼 수 있습니다.',
  },
  favorite: {
    title: '마음에 든 장소를 나만의 목록에', subtitle: '다시 가고 싶은 운동 공간을 간편하게 모아두세요.',
    label: '저장 기능 체험', value: '초록 산책공원', detail: '산책로 · 서울숲 인근',
    rows: [['한 번의 클릭', '장소의 별 버튼으로 저장'], ['모아 보기', '즐겨찾기에서 빠르게 확인'], ['간편한 관리', '필요하지 않은 장소는 삭제']],
    note: '아래 버튼으로 저장 동작을 체험해 보세요. 실제 즐겨찾기는 로그인한 계정에 저장됩니다.',
  },
  weather: {
    title: '나가기 전, 운동 환경 확인', subtitle: '날씨와 대기질을 함께 보고 오늘의 활동을 계획하세요.',
    label: '날씨 예시', value: '24°C · 맑음', detail: '서울숲 인근 · 야외 활동을 계획해 보세요.',
    rows: [['강수확률', '10%'], ['미세먼지 PM10', '22㎍/㎥ · 좋음'], ['자외선 지수', '3 · 보통']],
    note: '실제 대시보드에서는 현재 위치의 기상·대기질 데이터를 조회합니다. 이 수치는 설명을 위한 예시입니다.',
  },
} as const

export type FeatureId = keyof typeof previews
export const isFeatureId = (value: string): value is FeatureId => Object.hasOwn(previews, value)

export default function FeaturePreview({ id, onClose, onStart }: {
  id: FeatureId; onClose: () => void; onStart: () => void
}) {
  const [saved, setSaved] = useState(false)
  const preview = previews[id]


  return (
    <section className="feature-preview" aria-labelledby="feature-preview-title">
      <span className="feature-preview-badge">기능 미리보기 · 예시 데이터</span>
      <h2 id="feature-preview-title">{preview.title}</h2>
      <p className="feature-preview-subtitle">{preview.subtitle}</p>
      <div className={`feature-preview-sample sample-${id}`}>
        <small>{preview.label}</small>
        <strong>{preview.value}</strong>
        <span>{preview.detail}</span>
        {(id === 'location' || id === 'place') && (
          <div className="feature-preview-map" role="img" aria-label="주변 위치를 표현한 예시 지도">
            <span className="sample-park">산책공원</span>
            <span className="sample-pin"><Icon name="pin" size={24} /> 내 위치</span>
            <span className="sample-gym">체육관</span>
          </div>
        )}
      </div>
      <dl className="feature-preview-facts">
        {preview.rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
      <p className="feature-preview-note">{preview.note}</p>
      {id === 'favorite' && <button type="button" className="feature-preview-save" aria-pressed={saved}
        onClick={() => setSaved(!saved)}>{saved ? '★ 예시 목록에 저장됨 · 다시 눌러 취소' : '☆ 즐겨찾기 저장 체험'}</button>}
      <div className="feature-preview-actions">
        <button type="button" onClick={onClose}>← 메인으로 돌아가기</button>
        <button type="button" onClick={onStart}>실제 기능 열기 <span aria-hidden="true">→</span></button>
      </div>
    </section>
  )
}
