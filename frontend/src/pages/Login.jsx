import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Code, Music, Globe, Palette, Brain, Camera } from "lucide-react";
import API from "../api/axios";
import { useToast } from "../components/useToast";

const SKILLS = [
  { icon: Code,    label: "React",       color: "#61dafb" },
  { icon: Brain,   label: "Python",      color: "#3b82f6" },
  { icon: Palette, label: "UI Design",   color: "#ec4899" },
  { icon: Music,   label: "Guitar",      color: "#f59e0b" },
  { icon: Globe,   label: "French",      color: "#10b981" },
  { icon: Camera,  label: "Photography", color: "#8b5cf6" },
];

const STATS = [
  { v: "10K+", l: "Learners" },
  { v: "500+", l: "Skills" },
  { v: "25K+", l: "Swaps" },
  { v: "4.9★", l: "Rating" },
];

const TESTIMONIALS = [
  { initials: "P", name: "Priya S.", swap: "React ↔ Guitar", text: "Found my partner in 10 min. She codes now, I play guitar!" },
  { initials: "J", name: "James O.", swap: "Figma ↔ Python", text: "Turned free time into something genuinely useful." },
];

function Login() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleLogin = async (e) => {
    e?.preventDefault();
    try {
      setLoading(true);
      const res = await API.post("/api/users/login", formData);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      window.dispatchEvent(new Event("auth-changed"));
      showToast("Welcome back!", "success");
      navigate("/");
    } catch (error) {
      showToast(error.response?.data?.message || "Login failed", "error");
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
      gridTemplateColumns: '1fr 460px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* bg orbs */}
      <div style={{ position:'fixed', top:'-15%', left:'10%', width:600, height:600, background:'radial-gradient(circle,rgba(245,158,11,0.07) 0%,transparent 70%)', borderRadius:'50%', filter:'blur(80px)', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', bottom:'-10%', left:'30%', width:400, height:400, background:'radial-gradient(circle,rgba(99,102,241,0.06) 0%,transparent 70%)', borderRadius:'50%', filter:'blur(60px)', pointerEvents:'none', zIndex:0 }} />

      {/* LEFT — BRAND PANEL */}
      <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', padding:'60px 64px', position:'relative', zIndex:1, borderRight:'1px solid var(--border)', minWidth:0 }}>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:52 }}>
          <div style={{ width:40, height:40, background:'linear-gradient(135deg,#f59e0b,#fbbf24)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, boxShadow:'0 4px 16px rgba(245,158,11,0.35)', flexShrink:0 }}>✦</div>
          <span style={{ fontFamily:"'DM Serif Display',serif", fontSize:26, color:'var(--text-main)', letterSpacing:'-0.01em' }}>
            Skill<span style={{ color:'var(--primary)', fontStyle:'italic' }}>Swap</span>
          </span>
        </div>

        {/* Headline */}
        <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--primary)', fontFamily:'JetBrains Mono,monospace', marginBottom:16, display:'block' }}>Welcome back</span>
        <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:'clamp(38px,4vw,56px)', fontWeight:400, color:'var(--text-main)', margin:'0 0 18px', lineHeight:1.08, letterSpacing:'-0.025em' }}>
          Continue your<br /><em style={{ color:'var(--primary)' }}>learning journey</em>
        </h1>
        <p style={{ fontSize:16, color:'var(--text-soft)', margin:'0 0 48px', lineHeight:1.72, fontWeight:300, maxWidth:480 }}>
          Sign in to connect with swap partners, continue sessions, and keep growing — completely free, always.
        </p>

        {/* Skill cards grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:44, maxWidth:480 }}>
          {SKILLS.map((s, i) => (
            <div key={i} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'16px 14px', display:'flex', alignItems:'center', gap:10, transition:'all .2s', cursor:'default' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${s.color}44`; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = 'var(--surface-soft)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'var(--surface)'; }}
            >
              <s.icon size={18} style={{ color: s.color, flexShrink:0 }} />
              <span style={{ fontSize:13, fontWeight:600, color:'var(--text-main)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display:'flex', gap:1, background:'var(--border)', borderRadius:14, overflow:'hidden', maxWidth:480 }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ flex:1, background:'var(--surface)', padding:'16px 8px', textAlign:'center' }}>
              <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:22, color:'var(--primary)', lineHeight:1 }}>{s.v}</div>
              <div style={{ fontSize:10, color:'var(--text-faint)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', marginTop:4, fontFamily:'JetBrains Mono,monospace' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div style={{ display:'flex', flexDirection:'column', gap:12, marginTop:28, maxWidth:480 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'16px 18px' }}>
              <p style={{ margin:'0 0 10px', fontSize:13, color:'var(--text-soft)', fontStyle:'italic', fontWeight:300, lineHeight:1.6 }}>"{t.text}"</p>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:30, height:30, background:'linear-gradient(135deg,#f59e0b,#fbbf24)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#070a13', flexShrink:0 }}>{t.initials}</div>
                <div>
                  <p style={{ margin:0, fontSize:12, fontWeight:600, color:'var(--text-main)' }}>{t.name}</p>
                  <p style={{ margin:0, fontSize:11, color:'var(--primary)', fontFamily:'JetBrains Mono,monospace' }}>{t.swap}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — FORM PANEL */}
      <div style={{ background:'var(--surface)', borderLeft:'1px solid var(--border)', display:'flex', flexDirection:'column', justifyContent:'center', padding:'60px 40px', position:'relative', zIndex:1 }}>

        <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:34, fontWeight:400, color:'var(--text-main)', margin:'0 0 6px' }}>
          Sign <span style={{ color:'var(--primary)' }}>in</span>
        </h2>
        <p style={{ fontSize:14, color:'var(--text-soft)', margin:'0 0 32px', fontWeight:300 }}>Enter your credentials to continue.</p>

        <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <label style={{ fontSize:13, fontWeight:600, color:'var(--text-soft)' }}>Email address</label>
            <input type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} className="input" required />
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <label style={{ fontSize:13, fontWeight:600, color:'var(--text-soft)' }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize:12, color:'var(--primary)', fontWeight:600, textDecoration:'none' }}>Forgot password?</Link>
            </div>
            <div style={{ position:'relative' }}>
              <input type={showPassword ? "text" : "password"} name="password" placeholder="Enter your password" value={formData.password} onChange={handleChange} className="input" style={{ paddingRight:48 }} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-faint)', cursor:'pointer', display:'flex', padding:4, transition:'color .15s' }}
                onMouseEnter={e => e.currentTarget.style.color='var(--text-soft)'}
                onMouseLeave={e => e.currentTarget.style.color='var(--text-faint)'}>
                {showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}
              </button>
            </div>
          </div>

          <button type="submit" className="primary-btn" disabled={loading}
            style={{ width:'100%', marginTop:4, padding:'14px', fontSize:16, borderRadius:12, justifyContent:'center', gap:8 }}>
            {loading ? "Signing in…" : <><span>Sign In</span><ArrowRight size={17}/></>}
          </button>
        </form>

        <div style={{ display:'flex', alignItems:'center', gap:12, margin:'28px 0' }}>
          <div style={{ flex:1, height:1, background:'var(--border)' }}/>
          <span style={{ fontSize:12, color:'var(--text-faint)', fontWeight:500, whiteSpace:'nowrap' }}>New to SkillSwap?</span>
          <div style={{ flex:1, height:1, background:'var(--border)' }}/>
        </div>

        <button onClick={() => navigate("/register")} className="ghost-btn"
          style={{ width:'100%', padding:'13px', fontSize:15, justifyContent:'center', borderRadius:12 }}>
          Create a free account
        </button>

        <p style={{ fontSize:12, color:'var(--text-faint)', textAlign:'center', marginTop:24, lineHeight:1.6 }}>
          By signing in you agree to our{' '}
          <Link to="/terms-and-conditions" style={{ color:'var(--primary)', fontWeight:600, textDecoration:'none' }}>Terms</Link>
          {' & '}
          <Link to="/privacy-policy" style={{ color:'var(--primary)', fontWeight:600, textDecoration:'none' }}>Privacy</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
