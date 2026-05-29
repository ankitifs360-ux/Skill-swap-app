import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import API from "../api/axios";
import { useToast } from "../components/useToast";

function Onboarding({ user, onComplete }) {
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [skillsToTeach, setSkillsToTeach] = useState(user?.skillsToTeach || []);
  const [skillsToLearn, setSkillsToLearn] = useState(user?.skillsToLearn || []);
  const [bio, setBio] = useState(user?.bio || "");
  const [teachInput, setTeachInput] = useState("");
  const [learnInput, setLearnInput] = useState("");

  const handleAddSkill = (type, e) => {
    e.preventDefault();
    const value = type === "teach" ? teachInput.trim() : learnInput.trim();
    if (!value) return;

    if (type === "teach" && !skillsToTeach.includes(value)) {
      setSkillsToTeach(prev => [...prev, value]);
      setTeachInput("");
    } else if (type === "learn" && !skillsToLearn.includes(value)) {
      setSkillsToLearn(prev => [...prev, value]);
      setLearnInput("");
    }
  };

  const handleRemoveSkill = (type, skill) => {
    if (type === "teach") {
      setSkillsToTeach(prev => prev.filter(s => s !== skill));
    } else {
      setSkillsToLearn(prev => prev.filter(s => s !== skill));
    }
  };

  const submitOnboarding = async () => {
    try {
      setLoading(true);
      const res = await API.put("/api/users/profile", {
        skillsToTeach,
        skillsToLearn,
        bio,
        onboardingComplete: true
      });
      showToast("Profile set up beautifully!", "success");
      onComplete(res.data.user);
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to complete onboarding", "error");
    } finally {
      setLoading(false);
    }
  };

  const pageVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand-panel">
        <div className="auth-brand-logo">
          <div className="auth-brand-logo-icon">✨</div>
          Skill Swap
        </div>
        <div style={{ position: "relative", zIndex: 1, color: "white" }}>
          <p className="auth-brand-kicker">Welcome aboard</p>
          <h1 className="auth-brand-heading">
            Let's build your <span>Profile</span>
          </h1>
          <p className="auth-brand-sub">
            Your profile acts as your resume to the community. Add your skills so others can easily discover and connect with you.
          </p>
        </div>
      </div>

      <div className="auth-form-panel" style={{ backgroundColor: "var(--bg-main)" }}>
        <div className="auth-card" style={{ maxWidth: 440 }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[1, 2, 3].map(num => (
                <div 
                  key={num} 
                  style={{ 
                    flex: 1, 
                    height: 4, 
                    borderRadius: 2, 
                    background: step >= num ? "var(--primary)" : "var(--border-strong)",
                    transition: "all 0.3s ease"
                  }} 
                />
              ))}
            </div>
            <p className="eyebrow-text">Step {step} of 3</p>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" variants={pageVariants} initial="hidden" animate="visible" exit="exit">
                <h2 className="auth-title">What can you teach?</h2>
                <p className="auth-subtitle" style={{ marginBottom: 24 }}>
                  List the skills, languages, or tools you are confident enough to teach someone else.
                </p>
                
                <form onSubmit={(e) => handleAddSkill("teach", e)} style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  <input
                    value={teachInput}
                    onChange={(e) => setTeachInput(e.target.value)}
                    className="input"
                    placeholder="e.g. React, Python, UI Design"
                  />
                  <button type="submit" className="secondary-btn">Add</button>
                </form>

                <div className="chip-list" style={{ minHeight: 60, marginBottom: 24 }}>
                  {skillsToTeach.map(skill => (
                    <span key={skill} className="skill-chip">
                      {skill} 
                      <button onClick={() => handleRemoveSkill("teach", skill)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", marginLeft: 4 }}>×</button>
                    </span>
                  ))}
                  {skillsToTeach.length === 0 && <span className="muted-text">No skills added yet</span>}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button className="primary-btn" onClick={() => setStep(2)}>
                    Next step <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" variants={pageVariants} initial="hidden" animate="visible" exit="exit">
                <h2 className="auth-title">What do you want to learn?</h2>
                <p className="auth-subtitle" style={{ marginBottom: 24 }}>
                  List the skills you are actively looking to acquire. This helps others find you.
                </p>

                <form onSubmit={(e) => handleAddSkill("learn", e)} style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  <input
                    value={learnInput}
                    onChange={(e) => setLearnInput(e.target.value)}
                    className="input"
                    placeholder="e.g. Machine Learning, Figma"
                  />
                  <button type="submit" className="secondary-btn">Add</button>
                </form>

                <div className="chip-list" style={{ minHeight: 60, marginBottom: 24 }}>
                  {skillsToLearn.map(skill => (
                    <span key={skill} className="skill-chip">
                      {skill} 
                      <button onClick={() => handleRemoveSkill("learn", skill)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", marginLeft: 4 }}>×</button>
                    </span>
                  ))}
                  {skillsToLearn.length === 0 && <span className="muted-text">No skills added yet</span>}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <button className="ghost-btn" onClick={() => setStep(1)}>Back</button>
                  <button className="primary-btn" onClick={() => setStep(3)}>
                    Next step <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" variants={pageVariants} initial="hidden" animate="visible" exit="exit">
                <h2 className="auth-title">Write a short bio</h2>
                <p className="auth-subtitle" style={{ marginBottom: 24 }}>
                  Tell the community a little bit about yourself, your background, and goals.
                </p>

                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="input"
                  placeholder="I am a software engineer looking to swap my knowledge of Javascript for some experience in 3D modeling..."
                  style={{ marginBottom: 24, minHeight: 120 }}
                  maxLength={220}
                />
                
                <p className="muted-text" style={{ fontSize: 13, marginBottom: 24 }}>
                  {bio.length} / 220 characters
                </p>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <button className="ghost-btn" onClick={() => setStep(2)}>Back</button>
                  <button className="primary-btn" onClick={submitOnboarding} disabled={loading}>
                    {loading ? "Finishing..." : "Complete Setup"} <Check size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default Onboarding;
