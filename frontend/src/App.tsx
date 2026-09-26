import { useEffect, useRef, useState } from "react";
import { AuthContext, type User } from "./contexts/AuthContext";
import { getCurrentUser, logout } from "./api/session";
import { authNavigationUrl, safeReturnTo } from './utils/authNavigation';

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import Dashboard from "./pages/Dashboard";
import ExerciseInfo from "./pages/ExerciseInfo";
import NearbyPlaces from "./pages/NearbyPlaces";
import Favorites from "./pages/Favorites";
import MyPage from "./pages/MyPage";
import FeaturePreview, { isFeatureId } from "./components/FeaturePreview";
import "./pages/FeaturePreview.scss";

import "./App.scss";

const pagePaths = {
  landing: "/",
  login: "/login",
  signup: "/signup",
  exercise: "/exercise",
  dashboard: "/dashboard",
  places: "/places",
  favorites: "/favorites",
  mypage: "/mypage",
  preview: "/preview/location",
} as const;

type Page = keyof typeof pagePaths;

function getInitialPage(): Page {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path.startsWith('/preview/') && isFeatureId(path.slice('/preview/'.length))) return 'preview';
  return (Object.keys(pagePaths) as Page[]).find(
    (page) => pagePaths[page] === path,
  ) ?? "landing";
}

export default function App() {
  const [page, setPage] = useState<Page>(getInitialPage);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const sessionRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    const onPopState = () => setPage(getInitialPage());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    sessionRequest.current = controller;
    getCurrentUser(controller.signal)
      .then((currentUser) => {
        if (!controller.signal.aborted) setUser(currentUser);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError("사용자 정보를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const navigate = (nextPage: Page) => {
    const path = pagePaths[nextPage];
    const destination = nextPage === 'login' || nextPage === 'signup'
      ? authNavigationUrl(nextPage === 'login' ? '/login' : '/signup', window.location.search)
      : path;
    window.history.pushState({}, "", destination);
    setPage(nextPage);
    window.scrollTo(0, 0);
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    sessionRequest.current?.abort();
    setLoading(false);
    setError("");
    setUser(loggedInUser);
    const destination = safeReturnTo(new URLSearchParams(window.location.search).get('returnTo'));
    window.history.replaceState({}, '', destination);
    setPage(getInitialPage());
    window.scrollTo(0, 0);
  };

  const handleLogout = async () => {
    try {
      await logout();
      sessionRequest.current?.abort();
      setUser(null);
      setLoading(false);
      setError("");
      navigate("landing");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "로그아웃에 실패했습니다.");
    }
  };

  const renderPage = () => {
    switch (page) {
      case "preview": {
        const id = window.location.pathname.replace(/\/+$/, '').split('/').pop() || '';
        if (!isFeatureId(id)) return null;
        const destination = id === 'place' ? 'places' : id === 'favorite' ? 'favorites' : id === 'exercise' ? 'exercise' : 'dashboard';
        return (
          <main className="feature-preview-page">
            <a href="/" className="feature-preview-brand">FitMap <span>기능 둘러보기</span></a>
            <FeaturePreview key={id} id={id} onClose={() => navigate('landing')}
              onStart={() => navigate(destination)} />
          </main>
        );
      }
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
        return <Dashboard />;
      case "places":
        return <NearbyPlaces />;
      case "favorites":
        return <Favorites />;
      case "mypage":
        return <MyPage />;
      default:
        return (
          <Landing
            onNavigateLogin={() => navigate("login")}
            onNavigateSignup={() => navigate("signup")}
            onNavigatePage={navigate}
          />
        );
    }
    };

  return (
    <AuthContext.Provider value={{ user, loading, error, onLogout: handleLogout }}>
      {renderPage()}
    </AuthContext.Provider>
  );
}
