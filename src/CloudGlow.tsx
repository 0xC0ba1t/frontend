import React, { useEffect, useState, useRef } from "react";

// Cursor Glow (much tighter)
const GLOW_RADIUS = 28;
const STAR_COUNT = 13;
const STAR_OUTLIERS = 2;
const STAR_BASE_SIZE: [number, number] = [1.6, 3.8];
const TRAIL_LENGTH = 7;
const FADE_DURATION = 540;
const INACTIVITY_TIMEOUT = 2500;
const RIPPLE_DURATION = 550;

type Star = {
  angle: number;
  dist: number;
  size: number;
  blinkSpeed: number;
  blinkOffset: number;
  isOutlier: boolean;
  id: number;
};

function useBlinkingStars(count: number, outliers: number): Star[] {
  const [stars] = useState<Star[]>(() =>
    Array(count + outliers)
      .fill(0)
      .map((_, i) => {
        const angle = Math.random() * 2 * Math.PI;
        const distRaw = Math.random();
        const dist =
          i < count
            ? distRaw * 0.94 * GLOW_RADIUS
            : 1.03 * GLOW_RADIUS + Math.random() * (GLOW_RADIUS * 0.4);
        const size = STAR_BASE_SIZE[0] + Math.random() * (STAR_BASE_SIZE[1] - STAR_BASE_SIZE[0]);
        const blinkSpeed = 800 + Math.random() * 1050;
        const blinkOffset = Math.random() * 5000;
        const id = crypto.getRandomValues(new Uint32Array(1))[0];
        return { angle, dist, size, blinkSpeed, blinkOffset, isOutlier: i >= count, id };
      })
  );
  return stars;
}

export function BgStarfield(): JSX.Element {
  const BG_STAR_COUNT = 120;
  const PAD = 6;
  const [cursor, setCursor] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const [now, setNow] = useState<number>(Date.now());
  const [stars] = useState(() => {
    return Array(BG_STAR_COUNT).fill(0).map(() => {
      return {
        x: PAD + Math.random() * (1 - (PAD * 2 / window.innerWidth)),
        y: PAD + Math.random() * (1 - (PAD * 2 / window.innerHeight)),
        tw: Math.random(),
        size: 3.0 + Math.random() * 4.8, // EVEN bigger/fatter for extreme visibility
        blinkSpeed: 2000 + Math.random() * 5200,
        blinkPhase: Math.random() * 5000,
        id: crypto.getRandomValues(new Uint32Array(1))[0],
      };
    });
  });
  useEffect(() => {
    function onMove(e: MouseEvent | TouchEvent) {
      let x = 0.5;
      let y = 0.5;
      if ('touches' in e && e.touches[0]) {
        x = e.touches[0].clientX / window.innerWidth;
        y = e.touches[0].clientY / window.innerHeight;
      } else if ('clientX' in e) {
        x = e.clientX / window.innerWidth;
        y = e.clientY / window.innerHeight;
      }
      setCursor({ x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) });
    }
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
    };
  }, []);
  useEffect(() => {
    let af: number;
    function loop() {
      setNow(Date.now());
      af = requestAnimationFrame(loop);
    }
    af = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(af);
  }, []);
  const [vw, setVw] = useState<number>(window.innerWidth);
  const [vh, setVh] = useState<number>(window.innerHeight);
  useEffect(() => {
    function update() {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    }
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return (
    <div className="pointer-events-none fixed left-0 top-0 w-full h-full z-0 select-none" aria-hidden style={{ userSelect: 'none' }}>
      <svg
        width={vw}
        height={vh}
        style={{ position: 'absolute', left: 0, top: 0, width: '100vw', height: '100vh', display: 'block' }}
      >
        {stars.map(star => {
          const px = star.x * vw + (cursor.x - 0.5) * 44 * star.tw;
          const py = star.y * vh + (cursor.y - 0.5) * 41 * star.tw;
          const driftX = Math.sin(now / 18000 + star.tw * 14.7) * 17 * star.tw;
          const driftY = Math.cos(now / 16600 + star.tw * 5.6) * 14 * (1 - star.tw);
          const blink = 0.95 + Math.sin((now + star.blinkPhase) / star.blinkSpeed) * 0.67;
          const opacity = 0.11 + blink * (0.4 + 0.88 * star.tw); // MAXIMUM visibility
          return (
            <circle
              key={star.id}
              cx={px + driftX}
              cy={py + driftY}
              r={star.size / 2}
              fill="white"
              opacity={opacity}
              style={{
                filter: 'blur(0.55px)',
                transition: 'opacity 0.20s cubic-bezier(.42,0,.58,1)',
                pointerEvents: 'none',
                mixBlendMode: 'plus-lighter',
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}

export default function CloudGlow(): JSX.Element {
  // ALWAYS render BgStarfield behind everything
  return <><BgStarfield /><CursorGlow /></>;
}

// --- Cursor Glow with trail and click ripple and inactivity ---
function CursorGlow(): JSX.Element {
  const stars = useBlinkingStars(STAR_COUNT, STAR_OUTLIERS);
  const [visible, setVisible] = useState(true);
  const [fade, setFade] = useState(1);
  const fadeRef = useRef(fade);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [trail, setTrail] = useState<{ x: number; y: number; t: number }[]>([
    { x: window.innerWidth / 2, y: window.innerHeight / 2, t: Date.now() },
  ]);
  const [now, setNow] = useState<number>(Date.now());
  const [ripple, setRipple] = useState<null | { x: number; y: number; start: number }>(null);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rippleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    let anim: number;
    const start = performance.now();
    const initial = fadeRef.current;
    const end = visible ? 1 : 0;
    if (initial === end) return;
    function tick(now: number) {
      const t = Math.min(1, (now - start) / FADE_DURATION);
      const eased = initial + (end - initial) * (1 - Math.cos(t * Math.PI)) / 2;
      setFade(eased);
      fadeRef.current = eased;
      if (t < 1) anim = requestAnimationFrame(tick);
      else setFade(end);
    }
    anim = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(anim);
  }, [visible]);
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      let x = pos.x;
      let y = pos.y;
      if ('touches' in e && e.touches[0]) {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
      } else if ('clientX' in e) {
        x = e.clientX;
        y = e.clientY;
      }
      setPos({ x, y });
      setTrail(old => {
        const t = Date.now();
        const merged = [...old, { x, y, t }];
        return merged.slice(-TRAIL_LENGTH).filter((pt, i, a) => i === 0 || Math.hypot(pt.x - a[i - 1].x, pt.y - a[i - 1].y) > 4 || i === a.length - 1);
      });
      setVisible(true);
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => setVisible(false), INACTIVITY_TIMEOUT);
    };
    window.addEventListener('mousemove', handleMove, { passive: true });
    window.addEventListener('touchmove', handleMove, { passive: true });
    inactivityTimer.current = setTimeout(() => setVisible(false), INACTIVITY_TIMEOUT);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [pos.x, pos.y]);
  useEffect(() => {
    function hide() { setVisible(false); }
    function show() { setVisible(true); }
    window.addEventListener('mouseleave', hide);
    window.addEventListener('blur', hide);
    window.addEventListener('mouseenter', show);
    window.addEventListener('focus', show);
    return () => {
      window.removeEventListener('mouseleave', hide);
      window.removeEventListener('blur', hide);
      window.removeEventListener('mouseenter', show);
      window.removeEventListener('focus', show);
    };
  }, []);
  useEffect(() => {
    let af: number;
    const loop = () => {
      setNow(Date.now());
      af = requestAnimationFrame(loop);
    };
    af = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(af);
  }, []);
  useEffect(() => {
    const handleClick = (e: MouseEvent | TouchEvent) => {
      let x = pos.x; let y = pos.y;
      if ('touches' in e && e.touches[0]) {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
      } else if ('clientX' in e) {
        x = e.clientX;
        y = e.clientY;
      }
      setRipple({ x, y, start: Date.now() });
      if (rippleTimeout.current) clearTimeout(rippleTimeout.current);
      rippleTimeout.current = setTimeout(() => setRipple(null), RIPPLE_DURATION);
    };
    window.addEventListener("mousedown", handleClick);
    window.addEventListener("touchstart", handleClick);
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("touchstart", handleClick);
      if (rippleTimeout.current) clearTimeout(rippleTimeout.current);
    };
  }, [pos.x, pos.y]);
  const trailEls = trail.slice(0, -1).map((pt, i, a) => {
    const fadePos = i / (a.length);
    const age = (now - pt.t) / 150;
    const opacity = 0.17 * (1 - fadePos) * fade * Math.max(0, 1 - age);
    const key = `${pt.x},${pt.y},${pt.t}`;
    return (
      <CursorStars
        key={key}
        x={pt.x}
        y={pt.y}
        stars={stars}
        now={now}
        mainGlow={false}
        opacityOverride={opacity}
      />
    );
  });
  return (
    <div className="pointer-events-none fixed left-0 top-0 w-full h-full z-40 select-none" aria-hidden style={{ userSelect: 'none' }}>
      {trailEls}
      <CursorStars
        x={pos.x}
        y={pos.y}
        stars={stars}
        now={now}
        mainGlow={true}
        opacityOverride={fade}
      />
      {ripple && <CursorRipple x={ripple.x} y={ripple.y} start={ripple.start} now={now} />}
    </div>
  );
}

function CursorRipple({ x, y, start, now }: { x: number; y: number; start: number; now: number }) {
  const progress = Math.min(1, (now - start) / RIPPLE_DURATION);
  const baseSize = GLOW_RADIUS * 2.3;
  const size = baseSize + baseSize * progress * 1.5;
  const opacity = 0.26 * (1 - progress);
  return (
    <span
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: "50%",
        pointerEvents: "none",
        opacity,
        background: "radial-gradient(circle, rgba(255,255,255,0.42) 10%, rgba(255,255,255,0.08) 87%, transparent 100%)",
        filter: "blur(2.5px)",
        zIndex: 44,
        transition: 'opacity 0.2s',
      }}
    />
  );
}

function CursorStars({ x, y, stars, now, mainGlow, opacityOverride }: {
  x: number;
  y: number;
  stars: Star[];
  now: number;
  mainGlow: boolean;
  opacityOverride?: number;
}): JSX.Element {
  return (
    <div style={{
      position: "absolute",
      left: x - GLOW_RADIUS,
      top: y - GLOW_RADIUS,
      width: GLOW_RADIUS * 2,
      height: GLOW_RADIUS * 2,
      pointerEvents: "none",
      zIndex: mainGlow ? 45 : 44,
      opacity: opacityOverride ?? 1,
      borderRadius: "50%",
      filter: mainGlow ? "blur(0.3px)" : "blur(0.7px)",
    }}>
      {mainGlow && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.07) 54%, rgba(255,255,255,0.00) 97%)",
          }}
        />
      )}
      {stars.map((star) => {
        const a = star.angle + ((now / 1857) * (star.isOutlier ? 1.02 : 0.7));
        const drift = star.isOutlier ? Math.sin(now / 3400 + star.id * 1.17) * 3.1 : 0;
        const r = star.dist + drift;
        const px = GLOW_RADIUS + Math.cos(a) * r;
        const py = GLOW_RADIUS + Math.sin(a) * r;
        const blink = 0.77 + Math.sin((now + star.blinkOffset) / star.blinkSpeed) * 0.38;
        const opacity = (star.isOutlier ? 0.17 : 1) * blink;
        return (
          <span
            key={star.id}
            style={{
              position: "absolute",
              left: px - star.size / 2,
              top: py - star.size / 2,
              width: star.size,
              height: star.size,
              background:
                "radial-gradient(circle, rgba(255,255,255,1.0) 0%, rgba(255,255,255,0.17) 100%)",
              borderRadius: "50%",
              opacity,
              pointerEvents: "none",
              filter: mainGlow ? undefined : "blur(0.5px)",
              boxShadow:
                star.isOutlier
                  ? "0 0 4px 0px rgba(255,255,255,0.08)"
                  : "0 0 12px 0px rgba(255,255,255,0.16)",
            }}
          />
        );
      })}
    </div>
  );
}
