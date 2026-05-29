import { useState, useEffect, useRef } from "react";
import { Sparkles, X, RotateCcw, Zap, ArrowRight, Brain } from "lucide-react";
import API from "../api/axios";

/* Typewriter effect hook */
function useTypewriter(text, speed = 18) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!text) { setDisplayed(""); setDone(false); return; }
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(interval); setDone(true); }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return { displayed, done };
}

/* Orbiting particles (purely CSS-animated) */
function Particles() {
  return (
    <div className="ai-particles" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`ai-particle ai-particle-${i + 1}`} />
      ))}
    </div>
  );
}

/* Scanning beam animation while loading */
function LoadingBeam() {
  const lines = [
    "Scanning your skill profile…",
    "Analyzing community members…",
    "Computing mutual compatibility…",
    "Ranking best swap potential…",
    "Drafting your personalized match…",
  ];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % lines.length), 900);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="ai-loading-state">
      <div className="ai-loading-orb">
        <Brain size={28} className="ai-brain-icon" />
        <div className="ai-ring ai-ring-1" />
        <div className="ai-ring ai-ring-2" />
        <div className="ai-ring ai-ring-3" />
      </div>
      <div className="ai-loading-text">
        <span key={step} className="ai-loading-step">{lines[step]}</span>
      </div>
      <div className="ai-progress-bar">
        <div className="ai-progress-fill" />
      </div>
    </div>
  );
}

export default function AISmartMatch() {
  const [state, setState] = useState("idle"); // idle | loading | result | error
  const [result, setResult] = useState("");
  const [isSimulation, setIsSimulation] = useState(false);
  const { displayed, done } = useTypewriter(state === "result" ? result : "", 16);
  const token = localStorage.getItem("token");

  const runMatch = async () => {
    setState("loading");
    setResult("");
    try {
      const res = await API.get("/api/ai/match");
      setResult(res.data.message || "No match found.");
      setIsSimulation(!!res.data.isSimulation);
      setState("result");
    } catch (err) {
      setResult(err.response?.data?.message || "Something went wrong. Try again.");
      setIsSimulation(true);
      setState("error");
    }
  };

  const reset = () => { setState("idle"); setResult(""); };

  if (!token) return null;

  return (
    <div className={`ai-match-banner ai-match-${state}`}>
      <Particles />

      {/* Ambient glow */}
      <div className="ai-ambient-1" aria-hidden="true" />
      <div className="ai-ambient-2" aria-hidden="true" />

      {/* Grid texture */}
      <div className="ai-grid-texture" aria-hidden="true" />

      <div className="ai-match-inner">

        {/* === IDLE STATE === */}
        {state === "idle" && (
          <div className="ai-idle-content">
            <div className="ai-idle-left">
              <div className="ai-badge">
                <Zap size={11} />
                Powered by Gemini AI
              </div>
              <h2 className="ai-headline">
                Find your <em>perfect</em> swap match
              </h2>
              <p className="ai-subline">
                Our AI analyzes your skills against the whole community and pinpoints the single best person for a mutual skill exchange — in seconds.
              </p>
            </div>
            <div className="ai-idle-right">
              <button className="ai-cta-btn" onClick={runMatch}>
                <Sparkles size={18} />
                <span>Find My Match</span>
                <ArrowRight size={16} className="ai-arrow" />
              </button>
              <p className="ai-cta-note">Personalized · Free · Instant</p>
            </div>
          </div>
        )}

        {/* === LOADING STATE === */}
        {state === "loading" && <LoadingBeam />}

        {/* === RESULT STATE === */}
        {(state === "result" || state === "error") && (
          <div className="ai-result-content">
            <div className="ai-result-header">
              <div className="ai-result-badge">
                <Sparkles size={12} />
                {isSimulation ? "Simulation Mode" : "AI Match Found"}
              </div>
              <div className="ai-result-actions">
                <button className="ai-refresh-btn" onClick={runMatch} title="Find another match">
                  <RotateCcw size={14} />
                  <span>Retry</span>
                </button>
                <button className="ai-close-btn" onClick={reset} title="Close">
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="ai-result-body">
              <div className="ai-result-icon">
                <Brain size={22} />
              </div>
              <p className="ai-result-text">
                {displayed}
                {!done && <span className="ai-cursor">|</span>}
              </p>
            </div>

            {isSimulation && (
              <p className="ai-simulation-note">
                ⚠ Running in simulation mode — add a <code>GEMINI_API_KEY</code> to your <code>.env</code> to enable live AI matching.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}