import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "@/components/LandingPage";
import Home from "@/components/Home";
import DumpDb from "@/pages/DumpDb"; // adjust this path if needed
import CanvasStarfield from './CanvasStarfield';

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

export default function App() {
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [answers, setAnswers] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const existingId = getUserIdFromCookie();
    if (existingId) {
      setUserId(existingId);
      // Fetch preferences from backend
      fetch(`https://8000-01jtrkrgvb5brn7hg3gkn1gyv1.cloudspaces.litng.ai/load-preferences?user_id=${existingId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.preferences) {
            setAnswers(data.preferences);
            setOnboardingDone(true);
          } else {
            setOnboardingDone(false);
          }
          setLoading(false);
        })
        .catch(() => {
          setOnboardingDone(false);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      console.log("Current user_id:", userId);
    }
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
    try {
      const payload = { user_id: id, preferences: a };
      await fetch('https://8000-01jtrkrgvb5brn7hg3gkn1gyv1.cloudspaces.litng.ai/save-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      console.log('Onboarding completed. Answers:', { user_id: id, preferences: a });
    } catch (e) {
      console.log('Onboarding completed (API error):', { user_id: id, preferences: a });
    }
  };

  const MainApp = () => (
    <>
      <CanvasStarfield />
      {!onboardingDone ? (
        <LandingPage onComplete={handleComplete} />
      ) : (
        <Home answers={answers} userId={userId} />
      )}
    </>
  );

  return (
    <Router>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">Loading...</div>
      ) : (
        <Routes>
          <Route path="/" element={<MainApp />} />
          <Route path="/dump-db" element={
            <>
              <CanvasStarfield />
              <DumpDb />
            </>
          } />
        </Routes>
      )}
    </Router>
  );
}
