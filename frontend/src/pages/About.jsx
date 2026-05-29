import React from 'react';

const About = () => {
  return (
    <div style={{ padding: '60px 24px 100px', maxWidth: '900px', margin: '0 auto' }}>

      {/* Heading */}
      <div style={{ textAlign: 'center', marginBottom: '60px', animation: 'staggerIn 0.5s ease both' }}>
        <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--primary)', background: 'var(--primary-soft)', padding: '5px 14px', borderRadius: '999px', border: '1px solid rgba(245,158,11,0.2)', marginBottom: '20px' }}>Our Story</span>
        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(40px, 6vw, 60px)', fontWeight: 400, color: 'var(--text-main)', marginBottom: '20px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          About Us
        </h1>
        <p style={{ fontSize: '18px', color: 'var(--text-soft)', lineHeight: 1.75, maxWidth: '680px', margin: '0 auto', fontWeight: 300 }}>
          SkillSwap is a community-driven platform connecting people who want to share their knowledge and learn new skills. We believe everyone has something to teach and something to learn.
        </p>
      </div>

      {/* What We Offer */}
      <div style={{ background: 'var(--surface)', padding: '48px', borderRadius: '24px', border: '1px solid var(--border)', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '28px', fontWeight: 400, color: 'var(--text-main)', marginBottom: '28px' }}>
          What We Offer
        </h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            'Browse and connect with people who share skills.',
            'Offer your expertise in exchange for learning something new.',
            'Build meaningful connections within a global learning community.',
          ].map((item, idx) => (
            <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', fontSize: '16px', color: 'var(--text-soft)', lineHeight: 1.65 }}>
              <span style={{ width: '22px', height: '22px', background: 'var(--primary-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--primary)', fontWeight: 700, fontSize: '12px', marginTop: '2px', border: '1px solid rgba(245,158,11,0.2)' }}>✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Our Values */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '28px', fontWeight: 400, color: 'var(--text-main)', marginBottom: '24px' }}>
          Our Values
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {[
            { title: 'Collaboration', desc: 'Learning works best when shared with others.', emoji: '🤝' },
            { title: 'Accessibility', desc: 'Knowledge should be available to everyone, everywhere.', emoji: '🌍' },
            { title: 'Trust', desc: 'We promote safe, respectful, and fair exchanges between users.', emoji: '🛡️' },
          ].map((value, idx) => (
            <div key={idx} style={{ background: 'var(--surface)', padding: '32px', borderRadius: '20px', border: '1px solid var(--border)', transition: 'all 0.25s ease' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.25)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ width: '44px', height: '44px', background: 'var(--primary-soft)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', fontSize: '20px', border: '1px solid rgba(245,158,11,0.15)' }}>
                {value.emoji}
              </div>
              <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '20px', fontWeight: 400, color: 'var(--text-main)', marginBottom: '8px' }}>{value.title}</h3>
              <p style={{ fontSize: '15px', color: 'var(--text-soft)', lineHeight: 1.65, margin: 0, fontWeight: 300 }}>{value.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Support CTA */}
      <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, var(--surface) 100%)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '20px', padding: '36px', textAlign: 'center' }}>
        <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '22px', fontWeight: 400, color: 'var(--text-main)', marginBottom: '10px' }}>Have questions or feedback?</h3>
        <p style={{ fontSize: '16px', color: 'var(--text-soft)', margin: 0, fontWeight: 300 }}>
          Reach out at{' '}
          <a href="mailto:support@skillswap.tech" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            support@skillswap.tech
          </a>
        </p>
      </div>

    </div>
  );
};

export default About;
