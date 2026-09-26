import Icon from './Icon'

export default function RecommendationRetry({ location, weather, retry }: {
  location: { loading: boolean; coordinates: unknown; locate: () => void }
  weather: { loading: boolean; data: unknown }
  retry: () => void
}) {
  if (weather.data || location.loading || weather.loading) return null
  return <button className="recommendation-retry" type="button" onClick={location.coordinates ? retry : location.locate}>
    <Icon name="refresh" size={15} />{location.coordinates ? '날씨 다시 불러오기' : '위치 다시 확인하기'}
  </button>
}
