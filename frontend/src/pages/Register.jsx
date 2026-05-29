import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Check, Sparkles } from "lucide-react";
import API from "../api/axios";
import { useToast } from "../components/useToast";

const PERKS = [
  "Completely free — no subscriptions ever",
  "Teach your skills, learn what you love",
  "Connect with real people worldwide",
  "Flexible — schedule at your own pace",
  "Build a portfolio of skills traded",
];

const SKILL_PILLS = [
  { label: "React",        color: "#61dafb", bg: "rgba(97,218,251,0.08)",  border: "rgba(97,218,251,0.2)"  },
  { label: "Python",       color: "#3b82f6", bg: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.2)"  },
  { label: "Guitar",       color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)"  },
  { label: "French",       color: "#10b981", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.2)"  },
  { label: "Yoga",         color: "#ec4899", bg: "rgba(236,72,153,0.08)",  border: "rgba(236,72,153,0.2)"  },
  { label: "UI/UX",        color: "#8b5cf6", bg: "rgba(139,92,246,0.08)",  border: "rgba(139,92,246,0.2)"  },
  { label: "Chess",        color: "#f97316", bg: "rgba(249,115,22,0.08)",  border: "rgba(249,115,22,0.2)"  },
  { label: "Photography",  color: "#06b6d4", bg: "rgba(6,182,212,0.08)",   border: "rgba(6,182,212,0.2)"   },
  { label: "Figma",        color: "#f24e1e", bg: "rgba(242,78,30,0.08)",   border: "rgba(242,78,30,0.2)"   },
  { label: "Spanish",      color: "#4ade80", bg: "rgba(74,222,128,0.08)",  border: "rgba(74,222,128,0.2)"  },
  { label: "DSA",          color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.2)"  },
  { label: "Writing",      color: "#a78bfa", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.2)" },
];

const AVATARS = [
  { initial: "P", color: "#f59e0b" },
  { initial: "J", color: "#3b82f6" },
  { initial: "A", color: "#10b981" },
  { initial: "S", color: "#ec4899" },
];

function Register() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleRegister = async (e) => {
    e?.preventDefault();
    try {
      setLoading(true);
      const res = await API.post("/api/users/register", formData);
      showToast(res.data.message || "Account created!", "success");
      setTimeout(() => navigate("/login"), 500);
    } catch (error) {
      showToast(error.response?.data?.message || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'var(--bg-main)',
      display: 'grid',
      gridTemplateColumns: '460px 1fr',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background orbs */}
      <div style={{ position:'fixed', top:'-15%', right:'10%', width:600, height:600, background:'radial-gradient(circle,rgba(245,158,11,0.07) 0%,transparent 70%)', borderRadius:'50%', filter:'blur(80px)', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', bottom:'-10%', left:'20%', width:400, height:400, background:'radial-gradient(circle,rgba(99,102,241,0.06) 0%,transparent 70%)', borderRadius:'50%', filter:'blur(60px)', pointerEvents:'none', zIndex:0 }} />

      {/* LEFT — FORM PANEL */}
      <div style={{ background:'var(--surface)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', justifyContent:'center', padding:'60px 40px', position:'relative', zIndex:1, overflowY:'auto' }}>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:44 }}>
          <div style={{ width:40, height:40, background:'linear-gradient(135deg,#f59e0b,#fbbf24)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, boxShadow:'0 4px 16px rgba(245,158,11,0.35)', flexShrink:0 }}>✦</div>
          <span style={{ fontFamily:"'DM Serif Display',serif", fontSize:26, color:'var(--text-main)', letterSpacing:'-0.01em' }}>
            Skill<span style={{ color:'var(--primary)', fontStyle:'italic' }}>Swap</span>
          </span>
        </div>

        <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--primary)', fontFamily:'JetBrains Mono,monospace', marginBottom:14, display:'block' }}>Get started free</span>
        <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:34, fontWeight:400, color:'var(--text-main)', margin:'0 0 6px', lineHeight:1.15 }}>
          Create your <span style={{ color:'var(--primary)' }}>account</span>
        </h2>
        <p style={{ fontSize:14, color:'var(--text-soft)', margin:'0 0 32px', fontWeight:300, lineHeight:1.65 }}>
          Join the community — always free, no subscriptions.
        </p>

        <form onSubmit={handleRegister} style={{ display:'flex', flexDirection:'column', gap:18 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <label style={{ fontSize:13, fontWeight:600, color:'var(--text-soft)' }}>Full name</label>
            <input type="text" name="name" placeholder="Your full name" value={formData.name} onChange={handleChange} className="input" required />
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <label style={{ fontSize:13, fontWeight:600, color:'var(--text-soft)' }}>Email address</label>
            <input type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} className="input" required />
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <label style={{ fontSize:13, fontWeight:600, color:'var(--text-soft)' }}>Password</label>
            <div style={{ position:'relative' }}>
              <input type={showPassword ? "text" : "password"} name="password" placeholder="Create a strong password" value={formData.password} onChange={handleChange} className="input" style={{ paddingRight:48 }} required minLength={6} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-faint)', cursor:'pointer', display:'flex', padding:4, transition:'color .15s' }}
                onMouseEnter={e => e.currentTarget.style.color='var(--text-soft)'}
                onMouseLeave={e => e.currentTarget.style.color='var(--text-faint)'}>
                {showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}
              </button>
            </div>
          </div>

          <button type="submit" className="primary-btn" disabled={loading}
            style={{ width:'100%', padding:'14px', fontSize:16, borderRadius:12, justifyContent:'center', gap:8, marginTop:4 }}>
            {loading ? "Creating account…" : <><span>Create Account</span><ArrowRight size={17}/></>}
          </button>

          <p style={{ fontSize:12, color:'var(--text-faint)', textAlign:'center', margin:'0', lineHeight:1.6 }}>
            By signing up you agree to our{' '}
            <Link to="/terms-and-conditions" style={{ color:'var(--primary)', fontWeight:600, textDecoration:'none' }}>Terms</Link>
            {' & '}
            <Link to="/privacy-policy" style={{ color:'var(--primary)', fontWeight:600, textDecoration:'none' }}>Privacy Policy</Link>
          </p>
        </form>

        <div style={{ display:'flex', alignItems:'center', gap:12, margin:'28px 0' }}>
          <div style={{ flex:1, height:1, background:'var(--border)' }}/>
          <span style={{ fontSize:12, color:'var(--text-faint)', fontWeight:500, whiteSpace:'nowrap' }}>Already have an account?</span>
          <div style={{ flex:1, height:1, background:'var(--border)' }}/>
        </div>

        <button onClick={() => navigate("/login")} className="ghost-btn"
          style={{ width:'100%', padding:'13px', fontSize:15, justifyContent:'center', borderRadius:12 }}>
          Sign in instead
        </button>
      </div>

      {/* RIGHT — BRAND PANEL */}
      <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', padding:'60px 64px', position:'relative', zIndex:1, minWidth:0 }}>

        <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--primary)', fontFamily:'JetBrains Mono,monospace', marginBottom:16, display:'block' }}>Join thousands of learners</span>

        <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(36px,4vw,52px)', fontWeight:400, color:'var(--text-main)', margin:'0 0 18px', lineHeight:1.08, letterSpacing:'-0.025em' }}>
          Teach what you know.<br /><em style={{ color:'var(--primary)' }}>Learn what you love.</em>
        </h2>

        <p style={{ fontSize:16, color:'var(--text-soft)', margin:'0 0 40px', lineHeight:1.72, fontWeight:300, maxWidth:460 }}>
          SkillSwap connects curious people to exchange knowledge. No money, no courses — just two people helping each other grow.
        </p>

        {/* Perks list */}
        <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:40, maxWidth:460 }}>
          {PERKS.map((perk, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:24, height:24, background:'var(--primary-soft)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Check size={13} style={{ color:'var(--primary)' }} />
              </div>
              <span style={{ fontSize:14, color:'var(--text-soft)', fontWeight:400, lineHeight:1.5 }}>{perk}</span>
            </div>
          ))}
        </div>

        {/* Skills being swapped */}
        <div style={{ maxWidth:460 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <Sparkles size={13} style={{ color:'var(--primary)' }} />
            <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-faint)', fontFamily:'JetBrains Mono,monospace' }}>Skills being swapped right now</span>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {SKILL_PILLS.map((s, i) => (
              <span key={i} style={{ padding:'5px 13px', background:s.bg, border:`1px solid ${s.border}`, borderRadius:999, fontSize:12, fontWeight:600, color:s.color, whiteSpace:'nowrap' }}>
                {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Social proof */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginTop:36, padding:'16px 20px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, maxWidth:460 }}>
          <div style={{ display:'flex' }}>
            {AVATARS.map((av, i) => (
              <div key={i} style={{ width:34, height:34, borderRadius:'50%', background:`linear-gradient(135deg, ${av.color}, ${av.color}99)`, border:'2px solid var(--surface)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#070a13', marginLeft:i > 0 ? -10 : 0, flexShrink:0 }}>
                {av.initial}
              </div>
            ))}
          </div>
          <div>
            <p style={{ margin:0, fontSize:14, fontWeight:600, color:'var(--text-main)' }}>10,000+ learners</p>
            <p style={{ margin:0, fontSize:12, color:'var(--text-soft)', fontWeight:300 }}>already swapping skills today</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;