import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, Search, Handshake, Code, Music, Utensils, MessageCircle, Brain, Palette, Scissors, Camera, Globe, Mic, ChevronDown, ChevronUp, DollarSign, Users, Zap, ArrowRight, Star } from "lucide-react";
import "./Home.css";

const faqs = [
  {
    q: "How do I connect with someone?",
    a: "Browse users by skills, send a connection request, and once accepted, you can start chatting and exchanging skills.",
  },
  {
    q: "Can I both teach and learn?",
    a: "Absolutely! You can offer skills you're confident in and learn skills you're interested in at the same time.",
  },
  {
    q: "Do I need to be an expert to teach?",
    a: "Not at all! As long as you have solid fundamental knowledge or a skill to share, you can teach. Peer learning is about sharing what you know.",
  },
  {
    q: "Is there any limit to how many skills I can add?",
    a: "No! You can list as many skills as you want to teach or learn to find the best match.",
  },
];

const stats = [
  { value: "10K+", label: "Active Learners" },
  { value: "500+", label: "Skills Available" },
  { value: "25K+", label: "Swaps Completed" },
  { value: "4.9★", label: "Avg. Rating" },
];

const floatingSkills = [
  "React", "Python", "Guitar", "Photography", "French",
  "UI/UX", "Writing", "Yoga", "Spanish", "Drawing",
  "Marketing", "Excel"
];

function Home() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (idx) => setOpenFaq(openFaq === idx ? null : idx);

  return (
    <div className="home-container">

      {/* Hero Section */}
      <section className="hero-section">
        {/* Background mesh */}
        <div className="hero-bg-mesh" aria-hidden="true">
          <div className="mesh-orb mesh-orb-1" />
          <div className="mesh-orb mesh-orb-2" />
          <div className="mesh-orb mesh-orb-3" />
          <div className="hero-grid-pattern" />
        </div>

        {/* Floating skill pills */}
        <div className="floating-pills" aria-hidden="true">
          {floatingSkills.map((skill, i) => (
            <span key={i} className={`floating-pill pill-${i + 1}`}>{skill}</span>
          ))}
        </div>

        <div className="hero-content">
          <div className="hero-kicker">
            <span className="kicker-dot" />
            Free peer-to-peer skill exchange
          </div>
          <h1 className="hero-title">
            Learn anything.<br />
            <em>Teach what you know.</em>
          </h1>
          <p className="hero-subtitle">
            SkillSwap connects people to exchange knowledge for free — whether it's coding, design, music, or language. Find your swap partner, build real connections, and grow together.
          </p>
          <div className="hero-actions">
            <button className="primary-btn hero-btn-primary" onClick={() => navigate("/browse")}>
              Start Swapping
              <ArrowRight size={18} />
            </button>
            <button className="hero-btn-ghost" onClick={() => navigate("/about")}>
              How it works
            </button>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="stats-bar">
        <div className="stats-bar-inner max-w-7xl">
          {stats.map((stat, i) => (
            <div key={i} className="stat-item">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section-container">
        <div className="section-header">
          <span className="section-tag">The Process</span>
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Exchange skills in 3 simple steps</p>
        </div>
        <div className="how-grid">
          <div className="how-card">
            <div className="how-step-badge">01</div>
            <div className="how-card-icon">
              <UserPlus size={26} />
            </div>
            <h3 className="how-card-title">Create a Profile</h3>
            <p className="how-card-desc">Tell us what skills you possess and what you want to learn.</p>
            <div className="how-card-arrow"><ArrowRight size={16} /></div>
          </div>

          <div className="how-card">
            <div className="how-step-badge">02</div>
            <div className="how-card-icon">
              <Search size={26} />
            </div>
            <h3 className="how-card-title">Find a Partner</h3>
            <p className="how-card-desc">Browse other users, search by skills, and send a swap request.</p>
            <div className="how-card-arrow"><ArrowRight size={16} /></div>
          </div>

          <div className="how-card how-card-highlight">
            <div className="how-step-badge">03</div>
            <div className="how-card-icon">
              <Handshake size={26} />
            </div>
            <h3 className="how-card-title">Start Learning</h3>
            <p className="how-card-desc">Once accepted, connect directly to swap knowledge and grow together.</p>
          </div>
        </div>
      </section>

      {/* Popular Skills Section */}
      <section className="section-container skills-section">
        <div className="section-header">
          <span className="section-tag">Community</span>
          <h2 className="section-title">Popular Skills</h2>
        </div>
        <div className="skills-grid">
          {[
            { icon: Code, name: "React", color: "#61dafb" },
            { icon: Brain, name: "Python", color: "#3b82f6" },
            { icon: MessageCircle, name: "JavaScript", color: "#f59e0b" },
            { icon: Palette, name: "Graphic Design", color: "#ec4899" },
            { icon: Camera, name: "Photography", color: "#8b5cf6" },
            { icon: Globe, name: "French", color: "#10b981" },
            { icon: Scissors, name: "UI/UX Design", color: "#f97316" },
            { icon: Mic, name: "Public Speaking", color: "#06b6d4" },
          ].map((skill, index) => (
            <div key={index} className="skill-pill-card" style={{"--skill-color": skill.color}}>
              <div className="skill-pill-icon">
                <skill.icon size={22} />
              </div>
              <span className="skill-pill-name">{skill.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Why SkillSwap */}
      <section className="section-container why-section">
        <div className="section-header">
          <span className="section-tag">Why Us</span>
          <h2 className="section-title">Why use <em>SkillSwap?</em></h2>
        </div>
        <div className="why-grid">
          <div className="why-card">
            <div className="why-icon-wrap">
              <DollarSign size={28} />
            </div>
            <h3 className="why-card-title">100% Free</h3>
            <p className="why-card-desc">No hidden fees, no subscriptions. Exchange knowledge purely on a swap basis — now and always.</p>
          </div>

          <div className="why-card why-card-featured">
            <div className="why-icon-wrap">
              <Users size={28} />
            </div>
            <h3 className="why-card-title">Real Connections</h3>
            <p className="why-card-desc">Build meaningful professional and personal connections with like-minded peers from around the world.</p>
          </div>

          <div className="why-card">
            <div className="why-icon-wrap">
              <Zap size={28} />
            </div>
            <h3 className="why-card-title">Flexible Learning</h3>
            <p className="why-card-desc">Learn at your own pace, on your own terms, directly from real people with real experience.</p>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="section-container faq-section">
        <div className="section-header">
          <span className="section-tag">Questions</span>
          <h2 className="section-title">Frequently Asked</h2>
        </div>
        <div className="faq-container">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className={`faq-item${openFaq === idx ? " open" : ""}`}
              onClick={() => toggleFaq(idx)}
            >
              <div className="faq-question-row">
                <h4 className="faq-question">{faq.q}</h4>
                <div className="faq-chevron-wrap">
                  {openFaq === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>
              {openFaq === idx && (
                <p className="faq-answer">{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-bg-orb" aria-hidden="true" />
        <div className="cta-content">
          <h2 className="cta-title">Ready to start swapping?</h2>
          <p className="cta-subtitle">Join thousands of learners and teachers already growing together on SkillSwap.</p>
          <button className="primary-btn cta-btn" onClick={() => navigate("/register")}>
            Join for Free
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

    </div>
  );
}

export default Home;
