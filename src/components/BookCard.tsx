import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";

// Book interface - shared across app
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

// Detect mobile more reliably
const isMobile = () => typeof window !== 'undefined' &&
  (navigator.maxTouchPoints > 0 ||
   window.matchMedia('(pointer: coarse)').matches ||
   window.matchMedia('(max-width: 768px)').matches);

// Card renderer with cursor-following glow effect
export function BookCard({ book, index }: { book: Book, index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const glowRef = useRef<HTMLDivElement>(null);
  const centerGlowRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Direct DOM manipulation for smoother cursor tracking
  useEffect(() => {
    if (!isHovered) return;

    const card = cardRef.current;
    const glow = glowRef.current;
    const centerGlow = centerGlowRef.current;

    if (!card || !glow || !centerGlow) return;

    const updateGlowPosition = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Set position for both glows
      glow.style.left = `${x - 140}px`;
      glow.style.top = `${y - 140}px`;

      centerGlow.style.left = `${x - 50}px`;
      centerGlow.style.top = `${y - 50}px`;

      // Update state for debugging
      setCursorPos({ x, y });
    };

    card.addEventListener('mousemove', updateGlowPosition);

    return () => {
      card.removeEventListener('mousemove', updateGlowPosition);
    };
  }, [isHovered]);

  // Touch handling for mobile
  const handleTouch = (e: React.TouchEvent) => {
    if (isMobile()) {
      setIsHovered(true);

      if (cardRef.current && glowRef.current && centerGlowRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const touch = e.touches[0];

        if (touch) {
          const x = touch.clientX - rect.left;
          const y = touch.clientY - rect.top;

          // For touch, set initial position in the middle if not available
          glowRef.current.style.left = `${x ? x - 140 : '50%'}`;
          glowRef.current.style.top = `${y ? y - 140 : '50%'}`;
          glowRef.current.style.transform = x ? 'none' : 'translate(-50%, -50%)';

          centerGlowRef.current.style.left = `${x ? x - 50 : '50%'}`;
          centerGlowRef.current.style.top = `${y ? y - 50 : '50%'}`;
          centerGlowRef.current.style.transform = x ? 'none' : 'translate(-50%, -50%)';
        }
      }

      setTimeout(() => setIsHovered(false), 800);
    }
  };

  // Apply hover scale effect
  const hoverStyle = isHovered ? {
    transform: `scale(1.03)`,
    boxShadow: '0 10px 40px rgba(160,160,220,0.25), 0 2px 10px rgba(0,0,0,0.1)'
  } : {};

  return (
    <div
      ref={cardRef}
      className="relative rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        ...hoverStyle
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouch}
    >
      <Card className="px-5 py-5 md:px-7 md:py-6 w-full h-full bg-white/10 border border-white/20 shadow-lg relative">
        {/* Cursor-following glow effect */}
        {isHovered && (
          <>
            <div
              ref={glowRef}
              className="absolute pointer-events-none z-10 rounded-full"
              style={{
                width: 280,
                height: 280,
                left: cursorPos.x - 140,
                top: cursorPos.y - 140,
                background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 50%, transparent 80%)',
                filter: 'blur(20px)',
                opacity: 0.9,
                transition: 'none',
                willChange: 'left, top'
              }}
            />
            <div
              ref={centerGlowRef}
              className="absolute pointer-events-none z-10 rounded-full"
              style={{
                width: 100,
                height: 100,
                left: cursorPos.x - 50,
                top: cursorPos.y - 50,
                background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                filter: 'blur(8px)',
                opacity: 0.85,
                transition: 'none',
                willChange: 'left, top'
              }}
            />
          </>
        )}
        {/* Book content - no image, just text! */}
        <div className="flex flex-col h-full gap-4 justify-between">
          <div className="flex flex-row gap-3 items-start">
            <div className="flex-1 min-w-0 overflow-hidden">
              <h2
                className="font-medium text-base md:text-lg mb-1 leading-tight truncate"
                title={book.title}
              >
                {book.title}
              </h2>
              <p className="text-sm text-muted-foreground mb-1">{book.author}</p>
              <p className="text-xs uppercase tracking-wider opacity-70">{book.genre}</p>
            </div>
          </div>
          {/* Tags - with flex-wrap for landscape */}
          <div className="flex flex-wrap gap-2 mt-auto">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10">
              ${book.cost.toFixed(2)}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10">
              Age: {book.age_rating}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
