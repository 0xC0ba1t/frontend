import type React from "react";
import { useEffect, useState, useRef } from "react";
import { Avatar } from "@/components/ui/avatar";

interface Book {
  id: number;
  title: string;
  author: string;
  cost: number;
  genre: string;
  age_rating: string;
  coverUrl?: string;
  description?: string;
}

interface FrostedBookCardProps {
  book: Book;
  glow: { mx: number; my: number, velocity?: number } | null;
  onMouseMove?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  onMouseLeave?: () => void;
  extra?: React.ReactNode;
}

// Detect if we're on mobile
const IS_MOBILE = typeof window !== 'undefined' &&
  (navigator.maxTouchPoints > 0 ||
   window.matchMedia('(pointer: coarse)').matches);

// Animation settings (less intense for mobile)
const ANIMATION_SETTINGS = {
  hoverScale: IS_MOBILE ? 1.0 : 1.05, // No hover scale on mobile
  tiltMax: IS_MOBILE ? 0 : 2.5,       // No tilt on mobile
  glowSize: IS_MOBILE ? 120 : 175,    // Smaller glow for mobile
  glowIntensity: IS_MOBILE ? 0.7 : 0.95, // Reduced intensity
  transitionSpeed: IS_MOBILE ? "0.6s" : "0.35s" // Slower for better mobile performance
};

export function FrostedBookCard({ book, glow, onMouseMove, onMouseLeave, extra }: FrostedBookCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const lastPosition = useRef<{x: number, y: number}>({ x: 0, y: 0 });
  const velocity = useRef<number>(0);

  // Handle hover state
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTiltStyle({
      transform: `perspective(1000px) scale(1) rotateX(0deg) rotateY(0deg)`,
      transition: `all ${ANIMATION_SETTINGS.transitionSpeed} cubic-bezier(0.23, 1, 0.32, 1)`
    });
    if (onMouseLeave) onMouseLeave();
  };

  // Tilt effect handler (3D movement)
  const handleMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!cardRef.current || IS_MOBILE) return;

    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate tilt
    const tiltX = (mouseY / height - 0.5) * ANIMATION_SETTINGS.tiltMax;
    const tiltY = (mouseX / width - 0.5) * -ANIMATION_SETTINGS.tiltMax;

    // Calculate velocity for glow size
    const now = Date.now();
    const dx = mouseX - lastPosition.current.x;
    const dy = mouseY - lastPosition.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    velocity.current = Math.min(distance, 30); // Cap at 30px for reasonable effect

    lastPosition.current = { x: mouseX, y: mouseY };

    setTiltStyle({
      transform: `perspective(1000px) scale(${isHovered ? ANIMATION_SETTINGS.hoverScale : 1}) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
      filter: isHovered ? 'brightness(1.08) contrast(1.02)' : '',
      transition: `all 0.05s cubic-bezier(0.03, 0.95, 0.22, 0.95)`,
      boxShadow: isHovered ? '0 10px 60px 1px rgba(170,180,240,0.25),0 2px 22px 0 rgba(140,140,170,0.13)' : ''
    });

    if (onMouseMove) onMouseMove(e);
  };

  // Prepare touch handlers
  const handleTouch = () => {
    if (IS_MOBILE) {
      setIsHovered(true);
      setTimeout(() => setIsHovered(false), 500); // Short highlight on tap
    }
  };

  // Dynamic glow size based on velocity & finger pressure
  const glowSize = glow ? ANIMATION_SETTINGS.glowSize + (velocity.current * 0.7) : 0;

  return (
    <div
      ref={cardRef}
      className="relative px-7 py-5 rounded-2xl flex flex-col gap-4 shadow-xl border transition-all overflow-hidden group"
      style={{
        background: "rgba(255,255,255,0.15)",
        borderRadius: "1.3rem",
        boxShadow: "0 8px 56px 1px rgba(170,170,220,0.15),0 1.5px 18px 0 rgba(90,90,120,0.11)",
        backdropFilter: "blur(22px) brightness(1.13) contrast(1.36)",
        WebkitBackdropFilter: "blur(22px) brightness(1.13) contrast(1.36)",
        border: "1.8px solid rgba(255,255,255,0.26)",
        ...tiltStyle
      }}
      onMouseMove={handleMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouch}
      onTouchEnd={() => setIsHovered(false)}
    >
      {/* Enhanced dynamic glow that follows cursor with variable size/intensity */}
      {glow && (
        <>
          {/* Large outer diffusion (faint, wide) */}
          <span
            className="pointer-events-none absolute z-9"
            style={{
              left: glow.mx - (glowSize * 1.4),
              top: glow.my - (glowSize * 1.4),
              width: glowSize * 2.8,
              height: glowSize * 2.8,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 70%, transparent 100%)",
              filter: "blur(15px)",
              opacity: isHovered ? 0.95 : 0.5,
              pointerEvents: "none",
              transition: "none",
            }}
          />
          {/* Medium glow (more defined, medium spread) */}
          <span
            className="pointer-events-none absolute z-10"
            style={{
              left: glow.mx - (glowSize * 0.7),
              top: glow.my - (glowSize * 0.7),
              width: glowSize * 1.4,
              height: glowSize * 1.4,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.07) 60%, transparent 100%)",
              filter: "blur(8px)",
              opacity: ANIMATION_SETTINGS.glowIntensity * 0.8,
              pointerEvents: "none",
              transition: "none",
            }}
          />
          {/* Hot center spot (intense, small) */}
          <span
            className="pointer-events-none absolute z-11"
            style={{
              left: glow.mx - (glowSize * 0.2),
              top: glow.my - (glowSize * 0.2),
              width: glowSize * 0.4,
              height: glowSize * 0.4,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.93) 0%, rgba(255,255,255,0.28) 60%, transparent 100%)",
              filter: "blur(3px)",
              opacity: ANIMATION_SETTINGS.glowIntensity,
              pointerEvents: "none",
              transition: "none",
            }}
          />
        </>
      )}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <Avatar className="rounded-2xl w-16 h-20 bg-muted overflow-hidden border border-border">
          <img
            src={book.coverUrl || "https://same-assets.com/placeholder/book-dark.svg"}
            alt={book.title}
            className="object-cover w-full h-full rounded-2xl"
            onError={(e) =>
              (e.currentTarget.src =
                "https://same-assets.com/placeholder/book-dark.svg")
            }
          />
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-lg leading-5 mb-1 truncate">
            {book.title}
          </div>
          <div className="text-muted-foreground text-sm mb-2">
            {book.author}
          </div>
          <div className="text-muted-foreground text-xs uppercase pt-1 tracking-wide">
            {book.genre}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 text-sm pt-2">
        <span className="rounded-full px-3 py-1 bg-background/30 text-foreground/85 border border-border">
          ${book.cost.toFixed(2)}
        </span>
        <span className="rounded-full px-3 py-1 bg-secondary/30 text-foreground/85 border border-secondary">
          Age: {book.age_rating}
        </span>
      </div>
      {extra}
    </div>
  );
}
