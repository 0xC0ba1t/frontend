import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "@/components/LandingPage";
import Home from "@/components/Home";
import DumpDb from "@/pages/DumpDb"; // adjust this path if needed

export default function App() {
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [answers, setAnswers] = useState(null);

  const MainApp = () => (
    !onboardingDone ? (
      <LandingPage onComplete={(a) => { setAnswers(a); setOnboardingDone(true); }} />
    ) : (
      <Home answers={answers} />
    )
  );

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/dump-db" element={<DumpDb />} />
      </Routes>
    </Router>
  );
}
