import { useState } from "react";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import Dashboard from "./pages/Dashboard";
import ExerciseInfo from "./pages/ExerciseInfo";
import NearbyPlaces from "./pages/NearbyPlaces";
import Favorites from "./pages/Favorites";

import "./App.css";

type Page =
  | "landing"
  | "login"
  | "signup"
  | "exercise"
  | "dashboard"
  | "places"
  | "favorites";

type User = {
  email: string;
  name?: string;
};

export default function App() {
  // 현재 주소 확인
  const path =
    window.location.pathname.replace(/\/+$/, "") || "/";

  // 처음 들어왔을 때 페이지 결정
  const initialPage: Page =
    path === "/login"
      ? "login"
      : path === "/signup"
      ? "signup"
      : path === "/exercise"
      ? "exercise"
      : path === "/places"
      ? "places"
      : path === "/favorites"
      ? "favorites"
      : path === "/dashboard"
      ? "dashboard"
      : "landing";

  const [page, setPage] = useState<Page>(initialPage);

  // 현재 로그인한 사용자
  const [user, setUser] = useState<User | null>(null);

  // 페이지 이동
  const navigate = (
    nextPage: Page,
    path: string
  ) => {
    window.history.pushState({}, "", path);
    setPage(nextPage);
  };

  // 로그인 성공
  const handleLoginSuccess = (
    loggedInUser: User
  ) => {
    console.log("로그인 성공!", loggedInUser);

    setUser(loggedInUser);

    window.history.pushState(
      {},
      "",
      "/dashboard"
    );

    setPage("dashboard");
  };

  // 로그아웃
  const handleLogout = () => {
    console.log("로그아웃");

    setUser(null);

    window.history.pushState(
      {},
      "",
      "/"
    );

    setPage("landing");
  };

  // =========================
  // 로그인 화면
  // =========================

  if (page === "login") {
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onNavigateSignup={() => {
          navigate(
            "signup",
            "/signup"
          );
        }}
      />
    );
  }

  // =========================
  // 회원가입 화면
  // =========================

  if (page === "signup") {
    return (
      <Signup
        onNavigateLogin={() => {
          navigate(
            "login",
            "/login"
          );
        }}
      />
    );
  }

  // =========================
  // 운동 정보
  // =========================

  if (page === "exercise") {
    return <ExerciseInfo />;
  }

  // =========================
  // Dashboard
  // =========================

  if (page === "dashboard") {
    return (
      <Dashboard
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  // =========================
  // 주변 장소
  // =========================

  if (page === "places") {
    return <NearbyPlaces />;
  }

  // =========================
  // 즐겨찾기
  // =========================

  if (page === "favorites") {
    return <Favorites />;
  }

  // =========================
  // Landing
  // =========================

  return (
    <Landing
      onNavigateLogin={() => {
        navigate(
          "login",
          "/login"
        );
      }}

      onNavigateSignup={() => {
        navigate(
          "signup",
          "/signup"
        );
      }}

      onNavigatePage={(nextPage) => {
        if (nextPage === "dashboard") {
          navigate(
            "dashboard",
            "/dashboard"
          );
        }

        if (nextPage === "exercise") {
          navigate(
            "exercise",
            "/exercise"
          );
        }

        if (nextPage === "places") {
          navigate(
            "places",
            "/places"
          );
        }

        if (nextPage === "favorites") {
          navigate(
            "favorites",
            "/favorites"
          );
        }
      }}
    />
  );
}