import { useState } from "react";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import Dashboard from "./pages/Dashboard";
import ExerciseInfo from "./pages/ExerciseInfo";
import NearbyPlaces from "./pages/NearbyPlaces";
import Favorites from "./pages/Favorites";

import "./App.scss";

const pagePaths = {
  landing: "/",
  login: "/login",
  signup: "/signup",
  exercise: "/exercise",
  dashboard: "/dashboard",
  places: "/places",
  favorites: "/favorites",
} as const;

type Page = keyof typeof pagePaths;
type User = { email: string; name?: string };

function getInitialPage(): Page {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  return (Object.keys(pagePaths) as Page[]).find(
    (page) => pagePaths[page] === path,
  ) ?? "landing";
}

export default function App() {
  const [page, setPage] = useState<Page>(getInitialPage);
  const [user, setUser] = useState<User | null>(null);

  const navigate = (nextPage: Page) => {
    window.history.pushState({}, "", pagePaths[nextPage]);
    setPage(nextPage);
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    navigate("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    navigate("landing");
  };

  switch (page) {
    case "login":
      return (
        <Login
          onLoginSuccess={handleLoginSuccess}
          onNavigateSignup={() => navigate("signup")}
        />
      );
    case "signup":
      return <Signup onNavigateLogin={() => navigate("login")} />;
    case "exercise":
      return <ExerciseInfo />;
    case "dashboard":
      return <Dashboard user={user} onLogout={handleLogout} />;
    case "places":
      return <NearbyPlaces />;
    case "favorites":
      return <Favorites />;
    default:
      return (
        <Landing
          onNavigateLogin={() => navigate("login")}
          onNavigateSignup={() => navigate("signup")}
          onNavigatePage={navigate}
        />
      );
  }
}
