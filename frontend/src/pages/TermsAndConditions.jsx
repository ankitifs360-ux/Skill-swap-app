import React from 'react';

const TermsAndConditions = () => {
  return (
    <div style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto', lineHeight: 1.75 }}>
      <h1 style={{ fontSize: '38px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>Terms &amp; Conditions</h1>
      <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '40px' }}>Last updated: January 2025</p>

      <section style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>1. Acceptance of Terms</h2>
        <p style={{ color: '#4b5563', fontSize: '15px' }}>
          By accessing or using SkillSwap, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our platform.
        </p>
      </section>

      <section style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>2. User Accounts</h2>
        <p style={{ color: '#4b5563', fontSize: '15px' }}>
          You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate and complete information when creating your account and to update it as necessary. You must be at least 13 years old to use SkillSwap.
        </p>
      </section>

      <section style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>3. Acceptable Use</h2>
        <p style={{ color: '#4b5563', fontSize: '15px', marginBottom: '12px' }}>
          You agree not to use SkillSwap to:
        </p>
        <ul style={{ color: '#4b5563', fontSize: '15px', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>Post false, misleading, or harmful content</li>
          <li>Harass, abuse, or threaten other users</li>
          <li>Engage in any fraudulent or illegal activities</li>
          <li>Violate the intellectual property rights of others</li>
          <li>Attempt to gain unauthorized access to our systems</li>
        </ul>
      </section>

      <section style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>4. Platform Use</h2>
        <p style={{ color: '#4b5563', fontSize: '15px' }}>
          SkillSwap is a peer-to-peer skill exchange platform provided free of charge. We do not endorse, guarantee, or take responsibility for the quality or accuracy of the skills, information, or interactions exchanged between users. All exchanges are conducted directly between users.
        </p>
      </section>

      <section style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>5. Privacy</h2>
        <p style={{ color: '#4b5563', fontSize: '15px' }}>
          Your use of SkillSwap is also governed by our{' '}
          <a href="/privacy-policy" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</a>,
          which is incorporated into these Terms by reference.
        </p>
      </section>

      <section style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>6. Termination</h2>
        <p style={{ color: '#4b5563', fontSize: '15px' }}>
          We reserve the right to suspend or terminate your account at our discretion if we believe you have violated these Terms and Conditions or engaged in harmful behavior on the platform.
        </p>
      </section>

      <section style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>7. Changes to Terms</h2>
        <p style={{ color: '#4b5563', fontSize: '15px' }}>
          We reserve the right to update these Terms at any time. Continued use of the platform after changes constitutes your acceptance of the new Terms.
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>8. Contact</h2>
        <p style={{ color: '#4b5563', fontSize: '15px' }}>
          For questions about these Terms, contact us at{' '}
          <a href="mailto:ankitifs360@gmail.com" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>support@skillswap.tech</a>
        </p>
      </section>
    </div>
  );
};

export default TermsAndConditions;
