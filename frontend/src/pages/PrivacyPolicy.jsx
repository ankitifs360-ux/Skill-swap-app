import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto', lineHeight: 1.75 }}>
      <h1 style={{ fontSize: '38px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>Privacy Policy</h1>
      <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '40px' }}>Last updated: January 2025</p>

      <section style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>1. Information We Collect</h2>
        <p style={{ color: '#4b5563', fontSize: '15px', marginBottom: '12px' }}>
          When you use SkillSwap, we collect the following information:
        </p>
        <ul style={{ color: '#4b5563', fontSize: '15px', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li><strong>Account Information:</strong> Name, email address, and password (stored securely as a hash)</li>
          <li><strong>Profile Information:</strong> Username, bio, skills to teach, skills to learn, and profile picture</li>
          <li><strong>Activity Data:</strong> Messages sent, connection requests, sessions scheduled</li>
          <li><strong>Usage Data:</strong> Log data, last seen timestamps, and platform interactions</li>
        </ul>
      </section>

      <section style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>2. How We Use Your Information</h2>
        <p style={{ color: '#4b5563', fontSize: '15px', marginBottom: '12px' }}>
          We use the information we collect to:
        </p>
        <ul style={{ color: '#4b5563', fontSize: '15px', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>Provide and improve the SkillSwap platform</li>
          <li>Match you with relevant skill-swap partners</li>
          <li>Enable communication between users</li>
          <li>Send important notifications about your account</li>
          <li>Maintain security and prevent abuse</li>
        </ul>
      </section>

      <section style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>3. Information Sharing</h2>
        <p style={{ color: '#4b5563', fontSize: '15px' }}>
          We do not sell, trade, or rent your personal information to third parties. Your profile information (name, bio, skills) is visible to other users based on your privacy settings. Email addresses are only shared if you choose to make them public in your privacy settings.
        </p>
      </section>

      <section style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>4. Privacy Controls</h2>
        <p style={{ color: '#4b5563', fontSize: '15px' }}>
          SkillSwap gives you control over your privacy. You can choose to make your profile public or private, show or hide your email address, and control the visibility of your learning goals. Manage these settings in your profile's Edit Profile section.
        </p>
      </section>

      <section style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>5. Data Security</h2>
        <p style={{ color: '#4b5563', fontSize: '15px' }}>
          We take reasonable measures to protect your personal information. Passwords are stored using bcrypt hashing. Communication data is transmitted over secure connections (HTTPS). We regularly review our security practices to maintain a safe platform.
        </p>
      </section>

      <section style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>6. Your Rights</h2>
        <p style={{ color: '#4b5563', fontSize: '15px', marginBottom: '12px' }}>
          You have the right to:
        </p>
        <ul style={{ color: '#4b5563', fontSize: '15px', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>Access and update your personal information at any time</li>
          <li>Request deletion of your account and associated data</li>
          <li>Control your privacy settings</li>
          <li>Opt out of non-essential communications</li>
        </ul>
      </section>

      <section style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>7. Cookies</h2>
        <p style={{ color: '#4b5563', fontSize: '15px' }}>
          SkillSwap uses local storage (not cookies) to maintain your login session. No tracking cookies or third-party advertising cookies are used on our platform.
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>8. Contact Us</h2>
        <p style={{ color: '#4b5563', fontSize: '15px' }}>
          If you have questions or concerns about this Privacy Policy, please contact us at{' '}
          <a href="mailto:ankitifs360@gmail.com" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>support@skillswap.tech</a>
        </p>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
