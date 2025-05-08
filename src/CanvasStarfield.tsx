import React, { useEffect, useRef } from 'react';

const SMALL_SCREEN = typeof window !== 'undefined' && window.innerWidth < 700;
const STAR_COUNT = SMALL_SCREEN ? 62 : 110;
const SUPERSTAR_FRAC = 0.14;
const STAR_COL_MIN = 242;
const STAR_COL_MAX = 255; // nearly pure white now
const STAR_MIN_SIZE = 1.25;
const STAR_MAX_SIZE = 3.8;
const SUPERSTAR_SIZE = 5.8;
const STAR_MIN_SPEED = 0.02;
const STAR_MAX_SPEED = 0.08;
const STAR_BASE_MIN_ALPHA = 0.31; // reduce brightness 20%+
const STAR_BASE_MAX_ALPHA = 0.69;
const BLINK_MIN = 0.85;
const BLINK_MAX = 1.28;
const BLINKSPEED_MIN = 850;
const BLINKSPEED_MAX = 2550;
const PARALLAX_PX = 32;
const FRAME_DELAY = 1000 / 34; // lock to 34 fps max

// Util for random [min, max)
function rand(r1: number, r2: number) {
  return r1 + Math.random() * (r2 - r1);
}

// Star type
interface Star {
  x: number;
  y: number;
  baseAlpha: number;
  blinkSpeed: number;
  blinkPhase: number;
  blinkAmp: number; // per-star amplitude for smooth blinking
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  superstar: boolean;
}

interface Parallax {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

export default function CanvasStarfield(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Store stars and animation handler
  const stars = useRef<Star[]>([]);
  const anim = useRef<number | null>(null);
  const parallax = useRef<Parallax>({
    x: 0.5,
    y: 0.5,
    targetX: 0.5,
    targetY: 0.5,
  });

  const fade = useRef(1); // fade in/out (1 = visible, 0 = gone)
  const fadeTarget = useRef(1);
  const fadeTicking = useRef(false);
  const nextRespawnTimer = useRef<NodeJS.Timeout | null>(null);

  function resetStars(width: number, height: number) {
    const arr: Star[] = [];
    for (let i = 0; i < STAR_COUNT; ++i) {
      const superstar = i < SUPERSTAR_FRAC * STAR_COUNT;
      arr.push({
        x: Math.random() * width,
        y: Math.random() * height,
        baseAlpha: rand(STAR_BASE_MIN_ALPHA, STAR_BASE_MAX_ALPHA) * (superstar ? 2 : 1),
        blinkSpeed: rand(BLINKSPEED_MIN, BLINKSPEED_MAX),
        blinkPhase: rand(0, 2000),
        blinkAmp: rand(BLINK_MIN, BLINK_MAX), // assign once per star
        size: superstar ? SUPERSTAR_SIZE : rand(STAR_MIN_SIZE, STAR_MAX_SIZE),
        color: `rgb(${Math.floor(rand(STAR_COL_MIN, STAR_COL_MAX))},${Math.floor(rand(STAR_COL_MIN, STAR_COL_MAX))},255)`,
        speedX: rand(-STAR_MAX_SPEED, STAR_MAX_SPEED),
        speedY: rand(STAR_MIN_SPEED, STAR_MAX_SPEED),
        superstar,
      });
    }
    stars.current = arr.sort(() => Math.random() - 0.5); // shuffle
  }

  function triggerRespawn() {
    fadeTarget.current = 0; // fade out
    fadeTicking.current = true;
    setTimeout(() => {
      const el = canvasRef.current;
      if (el) {
        resetStars(el.width, el.height);
      }
      fadeTarget.current = 1;
    }, 1050);
    if (nextRespawnTimer.current) clearTimeout(nextRespawnTimer.current);
    const interval = Math.random() * (31.2 - 13.5) * 1000 + 13500;
    nextRespawnTimer.current = setTimeout(triggerRespawn, interval);
  }

  useEffect(() => {
    function resize() {
      const el = canvasRef.current;
      if (!el) return;
      el.width = window.innerWidth;
      el.height = window.innerHeight;
      resetStars(el.width, el.height);
    }

    window.addEventListener('resize', resize);
    resize();

    // Mouse/move parallax handler (desktop and mobile touch)
    function parallaxMove(e: MouseEvent | TouchEvent) {
      let x = 0.5;
      let y = 0.5;
      if ('touches' in e && e.touches[0]) {
        x = e.touches[0].clientX / window.innerWidth;
        y = e.touches[0].clientY / window.innerHeight;
      } else if ('clientX' in e) {
        x = e.clientX / window.innerWidth;
        y = e.clientY / window.innerHeight;
      }
      parallax.current.targetX = x;
      parallax.current.targetY = y;
    }
    window.addEventListener('mousemove', parallaxMove, { passive: true });
    window.addEventListener('touchmove', parallaxMove, { passive: true });

    // Animation loop (lowered FPS, skips frames)
    let running = true;
    let lastDraw = 0;
    function draw(nowT?: number) {
      const now = nowT ?? performance.now();
      if (!running) return;
      if (now - lastDraw < FRAME_DELAY) {
        anim.current = requestAnimationFrame(draw);
        return;
      }
      lastDraw = now;
      const el = canvasRef.current;
      if (!el) return;
      const ctx = el.getContext('2d');
      if (!ctx) return;
      const w = el.width;
      const h = el.height;
      ctx.clearRect(0, 0, w, h);

      // Animate parallax (ease current toward target)
      parallax.current.x += (parallax.current.targetX - parallax.current.x) * 0.13;
      parallax.current.y += (parallax.current.targetY - parallax.current.y) * 0.13;

      // Fade logic
      if (fadeTicking.current) {
        if (Math.abs(fade.current - fadeTarget.current) < 0.01) {
          fade.current = fadeTarget.current;
          fadeTicking.current = false;
        } else {
          fade.current += (fadeTarget.current - fade.current) * 0.13;
        }
      }

      const t = now;
      for (let i = 0; i < stars.current.length; ++i) {
        const star = stars.current[i];
        // Parallax: stars near edge shift opposite pointer direction
        const px = star.x + (parallax.current.x - 0.5) * (w * 0.02 + i * PARALLAX_PX / STAR_COUNT);
        const py = star.y + (parallax.current.y - 0.5) * (h * 0.025 + i * PARALLAX_PX / STAR_COUNT);
        // Totally smooth twinkle, amplitude unique per star
        const blink = star.blinkAmp * Math.abs(Math.sin((t + star.blinkPhase) / star.blinkSpeed));
        const ga = fade.current * star.baseAlpha * blink * (star.superstar ? 1.1 : 0.82);
        if (ga < 0.013) continue; // skip star if too faint
        ctx.globalAlpha = ga;
        ctx.beginPath();
        ctx.arc(px, py, star.size, 0, 2 * Math.PI);
        ctx.fillStyle = star.superstar ? '#fff' : star.color;
        ctx.shadowBlur = star.superstar ? 12 : 0;
        ctx.shadowColor = star.superstar ? '#fff' : 'transparent';
        ctx.fill();
        ctx.shadowBlur = 0;

        // Superstar glint: draw a cross for the brightest stars
        if (star.superstar) {
          ctx.save();
          ctx.globalAlpha = 0.12 * ctx.globalAlpha;
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(px - star.size * 2.2, py);
          ctx.lineTo(px + star.size * 2.2, py);
          ctx.moveTo(px, py - star.size * 2.2);
          ctx.lineTo(px, py + star.size * 2.2);
          ctx.stroke();
          ctx.restore();
        }

        // Animate star position (drift)
        star.x += star.speedX * 0.1;
        star.y += star.speedY * 0.12;
        // Wrap-around
        if (star.x < 0) star.x = w;
        if (star.y < 0) star.y = h;
        if (star.x > w) star.x = 0;
        if (star.y > h) star.y = 0;
      }
      ctx.globalAlpha = 1;
      anim.current = requestAnimationFrame(draw);
    }
    anim.current = requestAnimationFrame(draw);

    if (nextRespawnTimer.current) clearTimeout(nextRespawnTimer.current);
    const interval = Math.random() * (31.2 - 13.5) * 1000 + 13500;
    nextRespawnTimer.current = setTimeout(triggerRespawn, interval);

    return () => {
      running = false;
      if (anim.current) cancelAnimationFrame(anim.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', parallaxMove);
      window.removeEventListener('touchmove', parallaxMove);
      if (nextRespawnTimer.current) clearTimeout(nextRespawnTimer.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={typeof window !== 'undefined' ? window.innerWidth : 500}
      height={typeof window !== 'undefined' ? window.innerHeight : 500}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        display: 'block',
        background: 'transparent',
        userSelect: 'none',
      }}
      aria-hidden
    />
  );
}
