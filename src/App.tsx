import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from "react-router-dom";
import LandingPage from "@/components/LandingPage";
import Home from "@/components/Home";
import DumpDb from "@/pages/DumpDb";
import CanvasStarfield from "@/CanvasStarfield";
import About from "@/components/About";
import SearchPage from "@/components/SearchPage";

const API_PASSWORD = import.meta.env.VITE_API_PASSWORD;
const API_BASE = "https://8000-01jtrkrgvb5brn7hg3gkn1gyv1.cloudspaces.litng.ai";

function getUserIdFromCookie() {
  const match = document.cookie.match(/user_id=([^;]+)/);
  return match ? match[1] : null;
}
function setUserIdCookie(userId) {
  const d = new Date();
  d.setTime(d.getTime() + 7*24*60*60*1000);
  document.cookie = `user_id=${userId}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
}
function generateUserId() {
  return 'user_' + Math.random().toString(36).slice(2) + Date.now();
}

function AppRoutes({ loading, onboardingDone, handleComplete, answers, userId, showWelcomeTransition }) {
  const location = useLocation();

  const MainApp = () => (
    <>
      <CanvasStarfield />
      {!onboardingDone ? (
        <LandingPage onComplete={handleComplete} />
      ) : showWelcomeTransition ? (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black bg-opacity-80 z-50 absolute top-0 left-0 w-full h-full">
          <div className="text-3xl font-bold text-white mb-4">Welcome!</div>
          <div className="text-lg text-gray-200">Your preferences have been saved.</div>
        </div>
      ) : (
        <Home answers={answers} userId={userId} />
      )}
    </>
  );

  return (
    <>
      {location.pathname === "/about" ? (
        <Link
          to="/"
          className="fixed top-4 right-5 sm:right-10 z-50 text-sm font-mono px-4 py-2 rounded-xl bg-white/70 dark:bg-zinc-900/70 border border-black/10 dark:border-white/10 shadow-md hover:bg-indigo-300/20 hover:underline transition-colors"
          style={{ transition: 'all 0.18s' }}
        >
          Home
        </Link>
      ) : (
        <Link
          to="/about"
          className="fixed top-4 right-5 sm:right-10 z-50 text-sm font-mono px-4 py-2 rounded-xl bg-white/70 dark:bg-zinc-900/70 border border-black/10 dark:border-white/10 shadow-md hover:bg-indigo-300/20 hover:underline transition-colors"
          style={{ transition: 'all 0.18s' }}
        >
          About
        </Link>
      )}
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/about" element={<About />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/dump-db" element={
          <>
            <CanvasStarfield />
            <DumpDb />
          </>
        } />
      </Routes>
    </>
  );
}

export default function App() {
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [answers, setAnswers] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWelcomeTransition, setShowWelcomeTransition] = useState(false);

  useEffect(() => {
    const existingId = getUserIdFromCookie();
    if (existingId) {
      setUserId(existingId);
      fetch(`${API_BASE}/load-preferences?user_id=${existingId}`, {
        headers: {
          'Authorization': `Bearer ${API_PASSWORD}`
        }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.preferences) {
            setAnswers(data.preferences);
            setOnboardingDone(true);
          } else {
            setAnswers(null);
            setOnboardingDone(false);
          }
          setLoading(false);
        })
        .catch(() => {
          setAnswers(null);
          setOnboardingDone(false);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) { console.log("Current user_id:", userId); }
  }, [userId]);

  const handleComplete = async (a) => {
    let id = userId;
    if (!id) {
      id = generateUserId();
      setUserId(id);
      setUserIdCookie(id);
    }
    setAnswers(a);
    setOnboardingDone(true);
    setShowWelcomeTransition(true);
    try {
      const payload = { user_id: id, preferences: a };
      await fetch(`${API_BASE}/save-preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_PASSWORD}`,
        },
        body: JSON.stringify(payload)
      });
      console.log('Onboarding completed. Answers:', { user_id: id, preferences: a });
      setTimeout(() => { window.location.reload(); }, 2000);
    } catch (e) {
      console.log('Onboarding completed (API error):', { user_id: id, preferences: a });
      setTimeout(() => { window.location.reload(); }, 2000);
    }
  };

  return (
    <Router>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">Loading...</div>
      ) : (
        <AppRoutes
          loading={loading}
          onboardingDone={onboardingDone}
          handleComplete={handleComplete}
          answers={answers}
          userId={userId}
          showWelcomeTransition={showWelcomeTransition}
        />
      )}
    </Router>
  );
}
