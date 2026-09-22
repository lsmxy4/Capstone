import { useState } from "react";
import "./Favorites.scss";
import Sidebar from "../components/layout/Sidebar";

const favoritePlaces = [
  {
    id: 1,
    name: "핏니스 헬스장",
    category: "헬스장",
    address: "경기도 양평군 양평읍 중앙로",
    distance: "1.2 km",
    rating: "4.8",
    time: "06:00 - 24:00",
    status: "운동하기 좋아요",
    icon: "🏋️",
  },
  {
    id: 2,
    name: "양평 국민체육센터",
    category: "체육관",
    address: "경기도 양평군 양평읍 체육공원길",
    distance: "2.4 km",
    rating: "4.6",
    time: "09:00 - 22:00",
    status: "실내 운동 추천",
    icon: "🏊",
  },
  {
    id: 3,
    name: "양평 생활체육공원",
    category: "공원",
    address: "경기도 양평군 양평읍 공원로",
    distance: "3.1 km",
    rating: "4.7",
    time: "06:00 - 22:00",
    status: "운동하기 좋아요",
    icon: "🌳",
  },
  {
    id: 4,
    name: "스포츠센터 A",
    category: "체육관",
    address: "경기도 양평군 강상면 스포츠로",
    distance: "3.8 km",
    rating: "4.5",
    time: "07:00 - 23:00",
    status: "실내 운동 추천",
    icon: "⚽",
  },
  {
    id: 5,
    name: "파크 골프장",
    category: "공원",
    address: "경기도 양평군 양서면 공원길",
    distance: "5.2 km",
    rating: "4.6",
    time: "08:00 - 18:00",
    status: "운동하기 좋아요",
    icon: "⛳",
  },
  {
    id: 6,
    name: "양평 러닝파크",
    category: "공원",
    address: "경기도 양평군 양서면 강변로",
    distance: "5.8 km",
    rating: "4.9",
    time: "24시간",
    status: "운동하기 좋아요",
    icon: "🏃",
  },
];

export default function Favorites() {
  const [selectedCategory, setSelectedCategory] = useState("전체");

  const categories = [
    "전체",
    "헬스장",
    "체육관",
    "공원",
  ];

  const filteredPlaces =
    selectedCategory === "전체"
      ? favoritePlaces
      : favoritePlaces.filter(
          (place) => place.category === selectedCategory
        );

  return (
    <div className="favorites-page">
      <Sidebar />

      <main className="favorites-main">
        <header className="favorites-header">
          <div>
            <h1>즐겨찾기</h1>
            <p>내가 저장한 운동 장소를 한눈에 확인하세요.</p>
          </div>

          <div className="header-user">
            <span>안녕하세요, 김민수님 👋</span>
            <button type="button">🔔</button>
          </div>
        </header>

        <section className="favorites-content">
          <div className="favorites-top">
            <div>
              <h2>내 즐겨찾기</h2>
              <span>
                {filteredPlaces.length}개의 장소가 저장되어 있습니다.
              </span>
            </div>

            <div className="favorites-actions">
              <div className="search-box">
                <span>⌕</span>
                <input
                  type="text"
                  placeholder="시설명을 검색하세요"
                />
              </div>

              <select defaultValue="latest">
                <option value="latest">최신순</option>
                <option value="distance">거리순</option>
                <option value="rating">평점순</option>
                <option value="name">이름순</option>
              </select>
            </div>
          </div>

          {/* 카테고리 */}
          <div className="category-tabs">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`category ${
                  selectedCategory === category ? "active" : ""
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {/* 즐겨찾기 카드 */}
          <div className="favorite-grid">
            {filteredPlaces.map((place) => (
              <article
                className="favorite-card"
                key={place.id}
              >
                <div className="place-image">
                  <span className="place-icon">
                    {place.icon}
                  </span>

                  <button
                    className="favorite-star"
                    type="button"
                    aria-label="즐겨찾기 삭제"
                  >
                    ★
                  </button>
                </div>

                <div className="place-info">
                  <div className="place-title">
                    <div>
                      {/* 위쪽 분류 */}
                      <span className="place-type">
                        {place.category}
                      </span>

                      {/* 아래쪽 실제 장소 이름 */}
                      <h3>{place.name}</h3>
                    </div>

                    <span className="rating">
                      ★ {place.rating}
                    </span>
                  </div>

                  <p className="place-address">
                    📍 {place.address}
                  </p>

                  <div className="place-details">
                    <span>📏 {place.distance}</span>
                    <span>🕐 {place.time}</span>
                  </div>

                  <div className="place-status">
                    <span>●</span>
                    {place.status}
                  </div>

                  <div className="card-buttons">
                    <button type="button">
                      상세보기
                    </button>

                    <button type="button">
                      길찾기
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}