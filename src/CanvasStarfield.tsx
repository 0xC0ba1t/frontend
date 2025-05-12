import React, { useEffect, useRef } from 'react';

// Enhanced parameters for a more dynamic starfield
const SMALL_SCREEN = typeof window !== 'undefined' && window.innerWidth < 700;
const STAR_COUNT = SMALL_SCREEN ? 78 : 140; // More stars for a richer field
const SUPERSTAR_FRAC = 0.14;
const STAR_COL_MIN = 232;
const STAR_COL_MAX = 255; // nearly pure white now
const STAR_MIN_SIZE = 0.8;
const STAR_MAX_SIZE = 4.7;
const SUPERSTAR_SIZE = 6.7;
const STAR_MIN_SPEED = 0.012;
const STAR_MAX_SPEED = 0.11;
const STAR_BASE_MIN_ALPHA = 0.19; // allow some very faint stars
const STAR_BASE_MAX_ALPHA = 0.82;
const BLINK_MIN = 0.7;
const BLINK_MAX = 1.38;
const BLINKSPEED_MIN = 650;
const BLINKSPEED_MAX = 2550;
const PARALLAX_PX = 32;
const CURSOR_GRAVITY = 3.5; // Stronger pull toward cursor
const CURSOR_INFLUENCE_RADIUS = SMALL_SCREEN ? 110 : 180; // How far cursor pull reaches
const FRAME_DELAY = 1000 / 38; // slightly higher FPS for smoother motion

// Util for random [min, max)
function rand(r1: number, r2: number) {
  return r1 + Math.random() * (r2 - r1);
}

// Star type
interface Star {
  x: number;
  y: number;
  baseAlpha: number;
  originalAlpha: number;
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
      // More varied sizes and brightness
      const size = superstar
        ? SUPERSTAR_SIZE
        : rand(STAR_MIN_SIZE, STAR_MAX_SIZE) * rand(0.7, 1.2);
      const baseAlpha = rand(STAR_BASE_MIN_ALPHA, STAR_BASE_MAX_ALPHA) * (superstar ? 2 : 1) * rand(0.7, 1.1);
      arr.push({
        x: Math.random() * width,
        y: Math.random() * height,
        baseAlpha: baseAlpha,
        originalAlpha: baseAlpha,
        blinkSpeed: rand(BLINKSPEED_MIN, BLINKSPEED_MAX),
        blinkPhase: rand(0, 2000),
        blinkAmp: rand(BLINK_MIN, BLINK_MAX), // assign once per star
        size: size,
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
    let removeOrientation: (() => void) | undefined;

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

    // Add device orientation handler for mobile parallax
    if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
      const handleOrientation = (event: DeviceOrientationEvent) => {
        // Use device tilt as parallax input on mobile
        if (typeof event.beta === 'number' && typeof event.gamma === 'number') {
          // Beta is front-back tilt, gamma is left-right tilt
          // Normalize to [-1, 1] range for parallax effect
          const tiltX = Math.min(Math.max(event.gamma / 45, -1), 1) * 0.5 + 0.5;
          const tiltY = Math.min(Math.max(event.beta / 45, -1), 1) * 0.5 + 0.5;
          parallax.current.targetX = tiltX;
          parallax.current.targetY = tiltY;
        }
      };

      window.addEventListener('deviceorientation', handleOrientation, true);
      // Clean up in return below
      removeOrientation = () =>
        window.removeEventListener('deviceorientation', handleOrientation, true);
    }

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

        // Standard parallax position
        let px = star.x + (parallax.current.x - 0.5) * (w * 0.02 + i * PARALLAX_PX / STAR_COUNT);
        let py = star.y + (parallax.current.y - 0.5) * (h * 0.025 + i * PARALLAX_PX / STAR_COUNT);

        // Enhanced cursor gravity: calculate distance to cursor
        const cursorX = parallax.current.x * w;
        const cursorY = parallax.current.y * h;
        const dx = cursorX - px;
        const dy = cursorY - py;
        const distToCursor = Math.sqrt(dx * dx + dy * dy);

        // Apply gravity if within influence radius
        if (distToCursor < CURSOR_INFLUENCE_RADIUS) {
          // Strength increases as stars get closer to cursor (inverse square law)
          const strength = CURSOR_GRAVITY * (1 - distToCursor / CURSOR_INFLUENCE_RADIUS) ** 2;
          // Apply a pull toward cursor, stronger for smaller stars
          const gravityFactor = strength * (1.05 - star.size / 6.0);

          // Move toward cursor position
          px += dx * gravityFactor * 0.012;
          py += dy * gravityFactor * 0.012;

          // Add subtle "energy boost" to stars near cursor
          star.baseAlpha = Math.min(star.originalAlpha * (1 + strength * 0.7), 1);

          // Subtle "attract" animation: pulse size slightly
          const attractPulse = 1 + 0.13 * strength * Math.abs(Math.sin(t / 180 + i));
          ctx.save();
          ctx.beginPath();
          ctx.arc(px, py, star.size * attractPulse, 0, 2 * Math.PI);
          ctx.globalAlpha = fade.current * star.baseAlpha * star.blinkAmp * 0.7;
          ctx.fillStyle = star.superstar ? '#fff' : star.color;
          ctx.shadowBlur = star.superstar ? 16 : 0;
          ctx.shadowColor = star.superstar ? '#fff' : 'transparent';
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.restore();
        } else {
          // Return to original state when not influenced
          star.baseAlpha = star.baseAlpha * 0.95 + star.originalAlpha * 0.05;
        }

        // Regular twinkling with enhanced brightness near cursor
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
      if (typeof removeOrientation === 'function') removeOrientation();
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
