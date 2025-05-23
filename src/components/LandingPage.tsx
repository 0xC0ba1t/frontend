import React, { useMemo, useState, useEffect, useRef } from "react";
import "@/components/LandingPage.css";

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

const GENRES = [
  "Fantasy", "Science Fiction", "Romance", "Mystery", "Nonfiction", "Horror", "Classic", "Dystopian"
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
  onFinish,
  answers,
  handleFinishFromNo,
  options = [],
}: {
  q: any,
  value: any,
  onChange: (val: any) => void,
  onNext: () => void,
  autoFocus?: boolean,
  gradient: string,
  isLast?: boolean,
  canFinish?: boolean,
  onFinish?: () => void,
  answers?: any,
  handleFinishFromNo?: () => void,
  options?: string[],
}) {
  if (q.type === 'yesno') {
    const [localValue, setLocalValue] = React.useState(value);
    React.useEffect(() => { setLocalValue(value); }, [value]);
    const userNo = localValue === false;
    function finishWithSave() {
      onChange(false);
      setTimeout(() => { handleFinishFromNo && handleFinishFromNo(); }, 30);
    }
    return (
      <div className="flex flex-col items-center justify-center w-full h-full px-4 sm:px-0 min-h-[60vh] overflow-y-auto w-full flex-1" style={{ maxWidth: 430, fontFamily: 'Special Elite, IBM Plex Mono, Courier, monospace' }}>
        <div className="qcard-yesno-label w-full text-2xl sm:text-3xl md:text-4xl text-center mb-8 font-bold select-none leading-tight" style={{ background: gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          {q.label}
        </div>
        <div className="flex flex-col xs:flex-row gap-4 w-full items-center justify-center qcard-yesno-row">
          <button
            type="button"
            tabIndex={0}
            className={`qcard-yesno-pill${localValue === true ? ' qcard-yesno-pill--active' : ''}`}
            onClick={() => { setLocalValue(true); onChange(true); }}
            aria-pressed={localValue === true}
            autoFocus={localValue === null || localValue === undefined}
          >Yes</button>
          <button
            type="button"
            tabIndex={0}
            className={`qcard-yesno-pill${userNo ? ' qcard-yesno-pill--active' : ''}`}
            onClick={() => { setLocalValue(false); onChange(false); }}
            aria-pressed={userNo}
            autoFocus={localValue === false}
          >No</button>
        </div>
        {localValue === true && (
          <button
            className="mt-10 px-8 py-3 rounded-2xl bg-gradient-to-br from-teal-400 via-cyan-500 to-indigo-400 text-black font-mono font-bold text-xl tracking-wide shadow-xl disabled:opacity-30 transition-all"
            onClick={onNext}
            disabled={typeof localValue !== 'boolean'}
          >Next</button>
        )}
        {userNo && (
          <button
            className="mt-10 px-8 py-3 rounded-2xl bg-gradient-to-br from-lime-400 via-teal-400 to-blue-500 text-black font-mono font-bold text-xl tracking-wide shadow-2xl disabled:opacity-30 transition-all"
            onClick={finishWithSave}
          >FINISH</button>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col justify-center items-center w-full h-full mx-auto px-4 sm:px-0 min-h-[70vh] overflow-y-auto w-full flex-1"
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
        <div className={`flex flex-wrap gap-3 mb-8 justify-center w-full ${q.key === 'authors' ? 'authors-scroll-y' : ''}`}>
          {(options || []).map(opt => (
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
                  ? onChange(value.filter((a: string) => a !== opt))
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
const AnimatedLogoHeader = ({ stage, gradient, logoTop, logoShrink }) => {
  return (
    <div
      className={`landing-logo-header${logoTop ? ' is-top' : ''}`}
      style={{
        background: gradient,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        WebkitTextFillColor: 'transparent',
        filter: 'drop-shadow(0 3px 38px #000b)',
        textShadow: '0 1.5px 9px #0007',
        opacity: 1,
        pointerEvents: 'none',
      }}
    >
      <span className="landing-logo-header-text">Book Recommender</span>
    </div>
  );
};

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

  // --- Fetch authors from API ---
  const [authors, setAuthors] = useState<string[]>([]);
  const [authorsLoading, setAuthorsLoading] = useState(true);

  const API_PASSWORD = import.meta.env.VITE_API_PASSWORD;

  useEffect(() => {
    fetch('https://8000-01jtrkrgvb5brn7hg3gkn1gyv1.cloudspaces.litng.ai/authors', {
      headers: {
        'Authorization': `Bearer ${API_PASSWORD}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAuthors(data);
        else if (Array.isArray(data.authors)) setAuthors(data.authors);
        setAuthorsLoading(false);
      })
      .catch(() => setAuthorsLoading(false));
  }, []);
  const authorsFailed = !authorsLoading && authors.length === 0;

  // Move questions array inside component to use dynamic authors
  const GENRES = ["Fantasy", "Science Fiction", "Romance", "Mystery", "Nonfiction", "Horror", "Classic", "Dystopian"];
  const questions = [
    { key: "name", label: "What is your name?", type: "input" },
    { key: "genres", label: "What genres do you like?", type: "multi", options: GENRES },
    { key: "budget", label: "What is your budget?", type: "input", inputType: "number", prefix: "$" },
    { key: "age", label: "What is your age?", type: "input", inputType: "number" },
    { key: "author_preference", label: "Do you have preferences towards certain authors?", type: "yesno" },
    { key: "authors", label: "Select your authors", type: "multi", options: authors, last: true },
  ];

  // --- Blast overlay state
  const [showBlast, setShowBlast] = useState(false);
  const [blastOpacity, setBlastOpacity] = useState(1);
  const blastGradient = useRef(randomGradient(7)); // lock for consistency per visit

  const wizardBWGradient = useMemo(() => randomBWGradient(2), []);
  const bgGradient = useMemo(() => randomGradient(5), []);
  const logoBWGradient = useMemo(() => randomBWGradient(3), []);

  // FADE STATE
  const [fadeBg, setFadeBg] = useState(false); // for fade-in state
  const altBgGradient = useMemo(() => randomGradient(4), []); // bg right before blast

  const openHandled = useRef(false);
  const progressTimer = useRef<any>();

  useEffect(() => {
    if (progressTimer.current) clearTimeout(progressTimer.current);
    if (stage === 'closed') {
      progressTimer.current = setTimeout(() => setStage('opening'), 800);
      openHandled.current = false;
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
    if (stage === 'opening') {
      setFadeBg(true);
    }
    if (stage === 'closed') setFadeBg(false);
    if (stage === 'blast' || stage === 'logo' || stage === 'wizard' || stage === 'done' || stage === 'fading') {
      setFadeBg(false);
    }
    return () => {
      if (progressTimer.current) clearTimeout(progressTimer.current);
    };
  }, [stage, blastDone, answers, onComplete]);

  useEffect(() => {
    if (stage === 'blast') {
      setShowBlast(true);
      setBlastOpacity(1);
    }
    if (stage === 'logo' && showBlast) {
      setBlastOpacity(1);
      const fadeTimer = setTimeout(() => setBlastOpacity(0), 100);
      const removeTimer = setTimeout(() => setShowBlast(false), 950);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [stage, showBlast]);

  useEffect(() => {
    if (stage === 'wizard') {
      setShowWizard(false);
      const t = setTimeout(() => setShowWizard(true), 350);
      return () => clearTimeout(t);
    }
    if (stage !== 'wizard') setShowWizard(false);
  }, [stage]);

  const handleOpenComplete = () => {
    if (!openHandled.current && stage === 'opening') {
      openHandled.current = true;
      setStage('blast');
    }
  };

  function handleFinishFromNo() {
    const qkey = 'author_preference';
    const next = { ...answers, [qkey]: false };
    setAnswers(next);
    console.log('Onboarding completed. Answers:', next);
    setPrevAnimDir('right');
    setTimeout(() => setStage('done'), 400);
  }

  function handleWizardNext(val) {
    const qkey = questions[questionIdx].key;
    const next = { ...answers, [qkey]: val };
    setAnswers(next);

    if (qkey === 'authors' && questionIdx === questions.length - 1) {
      console.log('Onboarding completed. Answers:', next);
    }

    setPrevAnimDir('right');
    if (qkey === 'author_preference' && val === false) {
      setTimeout(() => setStage('done'), 400);
      return;
    }
    if (questionIdx < questions.length - 1) {
      setTimeout(() => setQuestionIdx((idx) => idx + 1), 330);
    } else {
      setTimeout(() => setStage('done'), 400);
    }
  }
  function handleWizardBack() {
    if (questions[questionIdx].key === 'authors' && answers.author_preference === false) {
      setPrevAnimDir('left');
      setTimeout(() => setQuestionIdx((idx) => Math.max(0, idx - 2)), 260);
      return;
    }
    setPrevAnimDir('left');
    setTimeout(() => setQuestionIdx((idx) => Math.max(0, idx - 1)), 260);
  }

  function shouldShowQuestion(i) {
    const q = questions[i];
    if (q.key === 'authors') {
      return answers.author_preference === true;
    }
    return true;
  }

  function getDisplayQuestions() {
    if (answers.author_preference === false) {
      return questions.filter(q => q.key !== 'authors');
    }
    return questions;
  }
  const displayQuestions = getDisplayQuestions();
  const displayQuestionIdx = Math.min(questionIdx, displayQuestions.length - 1);
  const currentQ = displayQuestions[displayQuestionIdx];

  return (
    <div className="fixed inset-0 flex flex-col justify-center items-center min-h-screen min-w-full transition-bg duration-1000 overflow-hidden landing-main-bg text-black dark:text-black" style={{ background: bgGradient }}>
      <div className={`landing-bg-fade${fadeBg ? ' landing-bg-fade--show' : ''}`} style={{ background: altBgGradient }} />
      {(stage === 'closed' || stage === 'opening') && (
        <AnimatedBook isOpen={stage === 'opening'} onOpenComplete={handleOpenComplete} />
      )}

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

      {(stage === 'logo' || stage === 'wizard' || stage === 'done' || stage === 'fading') && (
        <AnimatedLogoHeader
          stage={stage}
          gradient={logoBWGradient}
          logoTop={stage === 'wizard' || stage === 'done' || stage === 'fading'}
          logoShrink={stage === 'wizard' || stage === 'done' || stage === 'fading'}
        />
      )}

      {stage === 'wizard' && showWizard && (
        authorsLoading ? (
          <div className="flex items-center justify-center h-32 text-lg text-black dark:text-black">Loading authors...</div>
        ) : authorsFailed ? (
          <div className="flex flex-col items-center justify-center h-32 text-lg text-black dark:text-black">
            Failed to load the authors list.<br/>Please refresh or try again later.
          </div>
        ) : (
          <>
            {displayQuestionIdx > 0 && (
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
                {displayQuestions.map((q, i) => (
                  <div
                    key={q.key}
                    style={{
                      position: i === displayQuestionIdx ? 'relative' : 'absolute',
                      left: 0,
                      right: 0,
                      top: 0,
                      zIndex: i === displayQuestionIdx ? 2 : 1,
                      opacity: i === displayQuestionIdx ? 1 : 0,
                      transform: i === displayQuestionIdx ? 'none' : prevAnimDir === 'right' ? 'translateX(38vw)' : 'translateX(-38vw)',
                      pointerEvents: i === displayQuestionIdx ? 'auto' : 'none',
                      transition: 'all 0.55s cubic-bezier(.73,.21,0,1.08)',
                    }}>
                    <QuestionCard
                      q={q}
                      value={answers[q.key] || (q.type === "multi" ? [] : "")}
                      options={q.options || []}
                      onChange={val => setAnswers(a => ({ ...a, [q.key]: val }))}
                      onNext={() => handleWizardNext(answers[q.key])}
                      autoFocus={i === displayQuestionIdx}
                      gradient={wizardBWGradient}
                      isLast={q.last && (answers.author_preference !== false)}
                      canFinish={q.key === 'authors'
                        ? Array.isArray(answers[q.key]) && answers[q.key].length > 0
                        : undefined}
                      onFinish={() => handleWizardNext(answers[q.key])}
                      answers={answers}
                      handleFinishFromNo={handleFinishFromNo}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )
      )}

      {(stage === 'done' || stage === 'fading') && (
        <div className={`fixed inset-0 flex flex-col items-center justify-center text-center z-30 bg-black/70 ${stage==='fading' ? 'opacity-0 transition-opacity duration-700' : 'opacity-100 transition-opacity duration-800'} text-black dark:text-black`}>
          <h2 className="text-3xl md:text-4xl mb-6" style={{ fontFamily: 'Special Elite, IBM Plex Mono, Courier, monospace', background: wizardBWGradient, WebkitBackgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent' }}>Welcome, {answers.name}!</h2>
          <div className="text-xl font-mono mb-4">Your preferences have been saved.<br/>Loading your recommendations...</div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
