import React, { useMemo, useState, useEffect, useRef } from "react";

function randomColor() {
  const h = Math.floor(Math.random() * 360);
  const s = 60 + Math.random() * 30;
  const l = 46 + Math.random() * 14;
  return `hsl(${h},${s}%,${l}%)`;
}
function randomGradient(steps: number = 3) {
  const angle = Math.floor(Math.random() * 360);
  return `linear-gradient(${angle}deg, ${Array(steps).fill(0).map(() => randomColor()).join(", ")})`;
}
function randomBWColor() {
  // Blend between black and white (bw = [0,1])
  const bw = Math.random();
  const val = Math.round(bw * 255);
  return `rgb(${val},${val},${val})`;
}
function randomBWGradient(steps = 2) {
  const angle = Math.floor(Math.random() * 360);
  // Always guarantee both 0 (black) and 255 (white)
  let stops = ["rgb(0,0,0)", "rgb(255,255,255)"];
  // If steps > 2, add random grays between
  if (steps > 2) {
    for (let i = 0; i < steps - 2; ++i) {
      const val = Math.round(Math.random() * 255);
      stops.splice(1, 0, `rgb(${val},${val},${val})`); // insert between
    }
  }
  // At random, flip direction
  if (Math.random() > 0.5) stops = stops.reverse();
  return `linear-gradient(${angle}deg, ${stops.join(", ")})`;
}

// --- Genres/authors: stub; would fetch from API in real app
const GENRES = [
  "Fantasy", "Science Fiction", "Romance", "Mystery", "Nonfiction", "Horror", "Classic", "Dystopian"
];
const AUTHORS = [
  "J.K. Rowling", "J.R.R. Tolkien", "George Orwell", "Harper Lee", "F. Scott Fitzgerald", "Jane Austen", "Isaac Asimov"
];

const questions = [
  { key: "name", label: "What is your name?", type: "input" },
  { key: "genres", label: "What genres do you like?", type: "multi", options: GENRES },
  { key: "budget", label: "What is your budget?", type: "input", inputType: "number", prefix: "$" },
  { key: "age", label: "What is your age?", type: "input", inputType: "number" },
  { key: "authors", label: "Do you have preferences towards certain authors?", type: "multi", options: AUTHORS, last: true },
];

function QuestionCard({
  q,
  value,
  onChange,
  onNext,
  autoFocus = false,
  gradient,
  isLast,
  canFinish,
  onFinish
}) {
  return (
    <div
      className="flex flex-col justify-center items-center w-full h-full mx-auto px-4 sm:px-0 min-h-[70vh]"
      style={{ fontFamily: 'Special Elite, IBM Plex Mono, Courier, monospace', maxWidth: 440 }}>
      <div
        className="w-full text-4xl md:text-5xl text-center mb-8 font-bold select-none leading-tight"
        style={{
          background: gradient,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>{q.label}</div>
      {q.type === "input" && (
        <input
          type={q.inputType || "text"}
          placeholder={q.label.replace(/\?$/, "...")}
          className="block w-full max-w-md bg-black/60 text-white border border-white/20 text-2xl md:text-3xl rounded-2xl px-5 py-4 outline-none focus:border-emerald-400 transition-all font-mono tracking-wide mb-8 shadow-xl"
          value={value || ""}
          autoFocus={autoFocus}
          inputMode={q.inputType === 'number' ? 'numeric' : undefined}
          onChange={e => onChange(q.inputType === 'number' ? e.target.value.replace(/[^\d.]/g,"") : e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && value) onNext();
          }}
        />
      )}
      {q.type === "multi" && (
        <div className="flex flex-wrap gap-3 mb-8 justify-center w-full">
          {q.options.map(opt => (
            <button
              key={opt}
              className={
                "px-4 py-2 rounded-2xl border font-mono text-[1.07rem] transition-all " +
                (value?.includes(opt)
                  ? "bg-gradient-to-tr from-pink-400 via-orange-300 to-yellow-400 text-black border-transparent scale-105 shadow-lg"
                  : "bg-black/60 text-white border-white/25 hover:scale-105 hover:z-10")
              }
              onClick={() =>
                value?.includes(opt)
                  ? onChange(value.filter((a) => a !== opt))
                  : onChange([...(value || []), opt])}
              type="button"
            >{opt}</button>
          ))}
        </div>
      )}
      {q.type !== "multi" && (!isLast) && (
        <button className="mt-2 px-8 py-3 rounded-2xl bg-gradient-to-br from-teal-400 via-cyan-500 to-indigo-400 text-black font-mono font-bold text-xl tracking-wide shadow-xl disabled:opacity-30 transition-all"
          onClick={onNext}
          disabled={q.type === "multi" ? !Array.isArray(value) || value.length === 0 : !value}
          type="button">Next</button>
      )}
      {q.type === "multi" && !isLast && (
        <button className="mt-2 px-8 py-3 rounded-2xl bg-gradient-to-br from-teal-400 via-cyan-500 to-indigo-400 text-black font-mono font-bold text-xl tracking-wide shadow-xl disabled:opacity-30 transition-all"
          onClick={onNext}
          disabled={!Array.isArray(value) || value.length === 0}
          type="button">Next</button>
      )}
      {isLast && (
        <button className="mt-3 px-10 py-3 rounded-2xl bg-gradient-to-br from-lime-400 via-teal-400 to-blue-500 text-black font-mono font-bold text-xl tracking-wide shadow-2xl disabled:opacity-30 transition-all"
          onClick={onFinish}
          disabled={!canFinish}
          type="button">FINISH</button>
      )}
    </div>);
}

// --- LandingPage Top Animation & Wizard ---
const AnimatedLogoHeader = ({ stage, gradient, logoTop, logoShrink }) => (
  <div
    className="fixed left-1/2 z-40 select-none"
    style={{
      top: logoTop ? 32 : '50%',
      transform: `translate(-50%, ${logoTop ? '0' : '-50%'}) scale(${logoShrink ? .89 : 1.15})`,
      fontFamily: 'Special Elite, IBM Plex Mono, Consolas, Courier, monospace',
      fontWeight: 700,
      fontSize: 'clamp(2.9rem,7vw,5.4rem)',
      lineHeight: '1.04',
      background: gradient,
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      WebkitTextFillColor: 'transparent',
      filter: 'drop-shadow(0 3px 38px #000b)',
      textShadow: '0 1.5px 9px #0007',
      letterSpacing: '0.018em',
      opacity: 1,
      transition: 'top .86s cubic-bezier(.64,.08,0,1), font-size .62s, transform .72s, color .62s',
      pointerEvents: 'none',
    }}
  >
    Book Recommender
  </div>
);

// --- AnimatedBook: now only handles book opening, not blast
type AnimatedBookProps = { isOpen: boolean; onOpenComplete: () => void; };
const AnimatedBook: React.FC<AnimatedBookProps> = ({ isOpen, onOpenComplete }) => {
  const [opened, setOpened] = useState(false);
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setOpened(true);
        setTimeout(onOpenComplete, 1200);
      }, 1300);
    }
  }, [isOpen, onOpenComplete]);
  return (
    <div className="relative flex flex-col items-center" style={{minHeight:180, minWidth:170}}>
      <div className={`book-svg-origin z-20 ${isOpen ? "book-open" : ""}`}
        style={{
          transition: 'transform 1.15s cubic-bezier(.2,.5,0,1.1), filter 0.7s',
          transform: isOpen ? 'rotateY(-11deg) scale(1.12)' : 'scale(1.07)',
        }}
      >
        <svg width="144" height="160" viewBox="0 0 144 160" style={{ display: 'block', filter: isOpen ? 'drop-shadow(0 5px 110px #fff8)' : 'drop-shadow(0 8px 32px #222b)' }}>
          <g>
            <rect x="12" y="12" width="23" height="136" rx="10" fill="#29221f" stroke="#fff7" strokeWidth="4" style={{ transition: 'all 1.2s cubic-bezier(.21,.93,.69,1.3)', transform: isOpen ? 'scaleX(0.86) rotateZ(3deg)' : 'none' }} />
            <rect x="28" y="26" width="40" height="108" rx="11" fill="#fffbee" stroke="#e0d9c8" strokeWidth="2.5"
              style={{
                transform: isOpen ? 'rotateY(-38deg) skewY(-2deg)' : 'rotateY(0deg)',
                transition: 'all 1.18s cubic-bezier(.21,.93,.2,1.1)'
              }}
            />
            <rect x="68" y="26" width="48" height="108" rx="13" fill="#fff9f4" stroke="#efe8d9" strokeWidth="2.7"
              style={{
                transform: isOpen ? 'rotateY(38deg) skewY(2deg)' : 'rotateY(0deg)',
                transition: 'all 1.14s cubic-bezier(.17,.75,.4,1.27) 110ms'
              }}
            />
            <rect x="30.5" y="28" width="39" height="104" rx="9.5" fill="#fffe" opacity=".045" />
            <rect x="93" y="36" width="16" height="50" rx="7" fill="#fff" opacity=".18" />
          </g>
        </svg>
      </div>
    </div>
  );
};

export const LandingPage: React.FC<{ onComplete: (answers: any) => void }> = ({ onComplete }) => {
  const [stage, setStage] = useState<'closed'|'opening'|'blast'|'logo'|'wizard'|'done'|'fading'>('closed');
  const [blastDone, setBlastDone] = useState(false);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [prevAnimDir, setPrevAnimDir] = useState<'left'|'right'>('right');
  const [showWizard, setShowWizard] = useState(false);

  // --- Blast overlay state
  const [showBlast, setShowBlast] = useState(false);
  const [blastOpacity, setBlastOpacity] = useState(1);
  const blastGradient = useRef(randomGradient(7)); // lock for consistency per visit

  const wizardBWGradient = useMemo(() => randomBWGradient(2), []);
  const bgGradient = useMemo(() => randomGradient(5), []);
  const logoBWGradient = useMemo(() => randomBWGradient(3), []);

  const openHandled = useRef(false);
  const progressTimer = useRef<any>();

  useEffect(() => {
    if (progressTimer.current) clearTimeout(progressTimer.current);
    if (stage === 'closed') {
      // Show closed book briefly, then start opening
      progressTimer.current = setTimeout(() => setStage('opening'), 800);
      openHandled.current = false; // can open
    } else if (stage === 'blast') {
      progressTimer.current = setTimeout(() => {
        setBlastDone(true);
        setStage('logo');
      }, 1200);
    } else if (stage === 'logo' && blastDone) {
      progressTimer.current = setTimeout(() => setStage('wizard'), 1300);
    } else if (stage === 'done') {
      progressTimer.current = setTimeout(() => setStage('fading'), 1200);
    } else if (stage === 'fading') {
      progressTimer.current = setTimeout(() => { onComplete(answers); }, 720);
    }
    return () => {
      if (progressTimer.current) clearTimeout(progressTimer.current);
    };
  }, [stage, blastDone, answers, onComplete]);

  // --- Blast overlay effect: show on blast, fade out after logo
  useEffect(() => {
    if (stage === 'blast') {
      setShowBlast(true);
      setBlastOpacity(1);
    }
    if (stage === 'logo' && showBlast) {
      setBlastOpacity(1);
      const fadeTimer = setTimeout(() => setBlastOpacity(0), 100);
      // Remove from DOM after fade out
      const removeTimer = setTimeout(() => setShowBlast(false), 950);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [stage, showBlast]);

  // Delay showing wizard after logo reaches top
  useEffect(() => {
    if (stage === 'wizard') {
      setShowWizard(false);
      const t = setTimeout(() => setShowWizard(true), 350);
      return () => clearTimeout(t);
    }
    if (stage !== 'wizard') setShowWizard(false);
  }, [stage]);

  // Book open animation only triggers a transition ONCE
  const handleOpenComplete = () => {
    if (!openHandled.current && stage === 'opening') {
      openHandled.current = true;
      setStage('blast');
    }
  };

  function handleWizardNext(val) {
    const qkey = questions[questionIdx].key;
    const next = { ...answers, [qkey]: val };
    setAnswers(next);

    // Only log once when FINISH (last step, authors) is clicked
    if (qkey === 'authors' && questionIdx === questions.length - 1) {
      console.log('Onboarding completed. Answers:', next);
    }

    setPrevAnimDir('right');
    if (questionIdx < questions.length - 1) {
      setTimeout(() => setQuestionIdx((idx) => idx + 1), 330);
    } else {
      setTimeout(() => setStage('done'), 400);
    }
  }
  function handleWizardBack() {
    setPrevAnimDir('left');
    setTimeout(() => setQuestionIdx((idx) => Math.max(0, idx - 1)), 260);
  }

  return (
    <div className="fixed inset-0 flex flex-col justify-center items-center min-h-screen min-w-full transition-bg duration-1000 overflow-hidden" style={{ background: bgGradient }}>
      {/* Entrance Animation: Book → Color Blast → (logo flies to top) */}
      {(stage === 'closed' || stage === 'opening') && (
        <AnimatedBook isOpen={stage === 'opening'} onOpenComplete={handleOpenComplete} />
      )}

      {/* Blast overlay: always appears on blast, fades out after logo */}
      {showBlast && (
        <div
          className="fixed inset-0 z-30 pointer-events-none"
          aria-hidden
          style={{
            opacity: blastOpacity,
            transition: 'opacity 1s cubic-bezier(.5,.38,.41,1.1)',
            background: blastGradient.current,
            filter: 'blur(22px) saturate(1.10)',
          }}
        />
      )}

      {/* Animated Header + Transitioned logo */}
      {(stage === 'logo' || stage === 'wizard' || stage === 'done' || stage === 'fading') && (
        <AnimatedLogoHeader
          stage={stage}
          gradient={logoBWGradient}
          logoTop={stage === 'wizard' || stage === 'done' || stage === 'fading'}
          logoShrink={stage === 'wizard' || stage === 'done' || stage === 'fading'}
        />
      )}

      {/* Q&A Wizard stepper, animations, gradients, retro font */}
      {stage === 'wizard' && showWizard && (
        <>
          {questionIdx > 0 && (
            <button
              className="fixed left-5 top-5 md:left-8 md:top-7 z-50 bg-black/65 border border-white/20 text-white/90 px-4 py-2 rounded-full shadow-2xl font-mono text-lg hover:bg-black/90 backdrop-blur-md transition-all"
              onClick={handleWizardBack}
              type="button"
              aria-label="Go Back"
              style={{fontFamily:"Special Elite, IBM Plex Mono, Courier, monospace"}}
            >&#8592; Back</button>
          )}
          <div className="fixed inset-0 z-30 flex flex-col items-center justify-end md:justify-center bg-transparent px-2 pt-36 pb-8 md:pt-44 md:pb-24" style={{ pointerEvents: "auto" }}>
            <div className="relative w-full mx-auto max-w-lg min-h-[60vh]">
              {questions.map((q, i) => (
                <div
                  key={q.key}
                  style={{
                    position: i === questionIdx ? 'relative' : 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    zIndex: i === questionIdx ? 2 : 1,
                    opacity: i === questionIdx ? 1 : 0,
                    transform: i === questionIdx ? 'none' : prevAnimDir === 'right' ? 'translateX(38vw)' : 'translateX(-38vw)',
                    pointerEvents: i === questionIdx ? 'auto' : 'none',
                    transition: 'all 0.55s cubic-bezier(.73,.21,0,1.08)',
                  }}>
                  <QuestionCard
                    q={q}
                    value={answers[q.key] || (q.type === "multi" ? [] : "")}
                    onChange={val => setAnswers(a => ({ ...a, [q.key]: val }))}
                    onNext={() => handleWizardNext(answers[q.key])}
                    autoFocus={i === questionIdx}
                    gradient={wizardBWGradient}
                    isLast={q.last}
                    canFinish={q.key === 'authors' ? Array.isArray(answers[q.key]) && answers[q.key].length > 0 : undefined}
                    onFinish={() => handleWizardNext(answers[q.key])}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Final transition: Move to main app/homepage (integrate or show answers as desired) */}
      {(stage === 'done' || stage === 'fading') && (
        <div className={`fixed inset-0 flex flex-col items-center justify-center text-center z-30 bg-black/70 ${stage==='fading' ? 'opacity-0 transition-opacity duration-700' : 'opacity-100 transition-opacity duration-800'}`}>
          <h2 className="text-3xl md:text-4xl mb-6" style={{ fontFamily: 'Special Elite, IBM Plex Mono, Courier, monospace', background: wizardBWGradient, WebkitBackgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent' }}>Welcome, {answers.name}!</h2>
          <div className="text-xl text-white/90 font-mono mb-4">Your preferences have been saved.<br/>Loading your recommendations...</div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
