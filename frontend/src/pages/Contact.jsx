import React, { useState } from 'react';
import { Send } from 'lucide-react';
import API from '../api/axios';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error'

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setStatus({ type: 'error', msg: 'Please fill in all fields.' });
      return;
    }
    try {
      setLoading(true);
      setStatus(null);
      await API.post('/api/contact', form);
      setStatus({ type: 'success', msg: "Feedback sent successfully. We'll get back to you soon!" });
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.message || 'Failed to send message. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page" style={{ padding: '80px 20px', maxWidth: '600px', margin: '0 auto' }}>

      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ fontSize: '42px', fontWeight: 800, color: '#111827', marginBottom: '12px' }}>
          Send us Feedback
        </h1>
        <p style={{ fontSize: '17px', color: '#6b7280' }}>We'd love to hear your thoughts, suggestions, or issues</p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ background: '#ffffff', padding: '40px', borderRadius: '24px', border: '1px solid #f3f4f6', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}
      >
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
            Your Name
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter your name"
            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '15px', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
            onFocus={e => e.target.style.borderColor = '#2563eb'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
            Your Email
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter your email"
            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '15px', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
            onFocus={e => e.target.style.borderColor = '#2563eb'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>

        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
            Message
          </label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            rows="5"
            placeholder="Share your feedback, suggestions, or report an issue..."
            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '15px', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
            onFocus={e => e.target.style.borderColor = '#2563eb'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>

        {status && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: 500,
            background: status.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: status.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${status.type === 'success' ? '#bbf7d0' : '#fee2e2'}`,
          }}>
            {status.msg}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            background: loading ? '#93c5fd' : '#2563eb',
            color: '#ffffff',
            fontWeight: 700,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            transition: 'background 0.2s',
          }}
        >
          <Send size={18} />
          {loading ? 'Sending...' : 'Send Feedback'}
        </button>
      </form>
    </div>
  );
};

export default Contact;
