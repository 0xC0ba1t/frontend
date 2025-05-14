import React, { useEffect, useRef, useState } from "react";

const AUDIO_SRC = "/uploads/335711__dnlburnett__ambience-busy-office-call-center.wav";

function BouncingPhone() {
  // Phone size (px), v = vector, p = position, d = direction
  const phoneSize = 44; // px
  const [pos, setPos] = useState({ x: 120, y: 160 });
  const [dir, setDir] = useState({ dx: 1, dy: 1 });
  const [angle, setAngle] = useState(0);
  const requestRef = useRef<number>();
  const speed = 1.35; // px per frame

  useEffect(() => {
    const animate = () => {
      setPos(p => {
        let { x, y } = p;
        let { dx, dy } = dir;
        const sw = window.innerWidth;
        const sh = window.innerHeight;
        x += dx * speed;
        y += dy * speed;
        // Bounce
        let bounced = false;
        if (x < 0) { dx = Math.abs(dx); bounced = true; }
        if (x > sw - phoneSize) { dx = -Math.abs(dx); bounced = true; }
        if (y < 0) { dy = Math.abs(dy); bounced = true; }
        if (y > sh - phoneSize) { dy = -Math.abs(dy); bounced = true; }
        if (bounced) {
          setDir({ dx, dy });
          setAngle(a => (a + Math.random()*120 + 90)%360); // wiggle/shake
        }
        return { x, y };
      });
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [dir]);

  return (
    <div
      style={{
        position: "fixed", left: pos.x, top: pos.y, width: phoneSize, height: phoneSize, zIndex: 100,
        userSelect: "none", pointerEvents: "none",
        fontSize: phoneSize * 0.61,
        transition: 'background 0.15s',
        filter: "drop-shadow(0 2px 8px #2d2f4cab)",
        transform: `rotate(${angle}deg) scale(1.18)`,
        animation: "egg_ringing 0.44s infinite alternate"
      }}
    >
      <span role="img" aria-label="Ringing phone" style={{ display: "block", pointerEvents: "none" }}>
        ☎️
      </span>
      <style>{`
        @keyframes egg_ringing {
          0% { transform: scale(1.18) translateY(0px) rotate(-10deg); }
          32% { transform: scale(1.18) translateY(-6px) rotate(20deg); }
          53% { transform: scale(1.18) translateY(7px) rotate(-20deg); }
          75% { transform: scale(1.19) translateY(-8px) rotate(10deg); }
          100% { transform: scale(1.18) translateY(3px) rotate(-8deg); }
        }
      `}</style>
    </div>
  );
}

export default function About() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [audioAttempted, setAudioAttempted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = 0.35;
      audio.currentTime = 0;
      audio
        .play()
        .then(() => setAudioBlocked(false))
        .catch(() => setAudioBlocked(true));
      setAudioAttempted(true);
    }
    return () => {
      if (audio) audio.pause();
    };
  }, []);

  const handleEnableAudio = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.play().then(() => setAudioBlocked(false));
      setAudioAttempted(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center w-full px-4 bg-gradient-to-br from-[#f8fafc] via-[#e8f0fc] to-[#dee5ef] dark:from-[#141218] dark:to-[#232637] transition-bg duration-300">
      <audio ref={audioRef} src={AUDIO_SRC} loop preload="auto" style={{ display: 'none' }} />
      {audioBlocked && audioAttempted && (
        <button
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-zinc-800/80 text-white font-mono px-4 py-2 rounded-2xl border border-white/10 shadow-md hover:bg-indigo-400/80 transition-colors"
          style={{ minWidth: 190 }}
          onClick={handleEnableAudio}
        >
          🔊 Enable office ambience
        </button>
      )}
      <BouncingPhone />
      <section className="flex flex-col items-center justify-center max-w-xl text-center rounded-2xl px-5 py-14 mt-10 bg-white/80 dark:bg-black/60 shadow-xl border border-black/10">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-indigo-400 via-green-500 to-sky-500 bg-clip-text text-transparent select-none">Call Center (Group 4)</h1>
        <div className="text-zinc-800 dark:text-zinc-100 text-2xl font-semibold mb-4">Created by</div>
        <div className="text-zinc-700 dark:text-zinc-300 font-mono text-lg whitespace-pre-line leading-relaxed">
          Aditya<br />
          Ankit<br />
          Nitya<br />
          Yatin
        </div>
      </section>
      <footer className="opacity-70 text-xs py-4 w-full text-center mt-16">
        &copy; {new Date().getFullYear()} Call Center Group 4
      </footer>
    </div>
  );
}
