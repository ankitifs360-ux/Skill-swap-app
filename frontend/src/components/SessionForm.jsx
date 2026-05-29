import { useEffect, useMemo, useState } from "react";
import { X, Calendar, Clock, Monitor, Timer } from "lucide-react";
import API from "../api/axios";
import { useToast } from "./useToast";

const defaultFormState = {
  topic: "",
  description: "",
  mode: "chat",
  date: "",
  time: "",
  durationMinutes: 60,
  meetingLink: "",
  location: "",
};

const toDateTimeInputParts = (value) => {
  if (!value) return { date: "", time: "" };
  const date = new Date(value);
  const pad = (num) => String(num).padStart(2, "0");
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
};

function SessionForm({
  open, onClose, onSuccess,
  requestId = "", partnerId = "",
  requestSkill = "", requestUserName = "",
  session = null, mode = "create",
}) {
  const { showToast } = useToast();
  const [form, setForm] = useState(defaultFormState);
  const [saving, setSaving] = useState(false);

  const heading = mode === "reschedule" ? "Reschedule Session" : "Book a Session";
  const helperText = mode === "reschedule"
    ? "Propose a better time — the other participant can confirm it."
    : "Choose a time, mode, and topic so both users can prepare.";

  useEffect(() => {
    if (!open) return;
    if (session) {
      const parts = toDateTimeInputParts(session.scheduledFor);
      setForm({ topic: session.topic || "", description: session.description || "", mode: session.mode || "chat", date: parts.date, time: parts.time, durationMinutes: session.durationMinutes || 60, meetingLink: session.meetingLink || "", location: session.location || "" });
      return;
    }
    const now = new Date(Date.now() + 60 * 60 * 1000);
    const parts = toDateTimeInputParts(now.toISOString());
    setForm({ ...defaultFormState, topic: requestSkill ? `${requestSkill} session` : "", date: parts.date, time: parts.time });
  }, [open, requestSkill, session]);

  const payload = useMemo(() => {
    if (!form.date || !form.time) return null;
    return {
      requestId: requestId || undefined,
      partnerId: partnerId || undefined,
      topic: form.topic.trim(),
      description: form.description.trim(),
      mode: form.mode,
      scheduledFor: new Date(`${form.date}T${form.time}`).toISOString(),
      durationMinutes: Number(form.durationMinutes),
      meetingLink: form.meetingLink.trim(),
      location: form.location.trim(),
    };
  }, [form, partnerId, requestId]);

  if (!open) return null;

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!payload) { showToast("Choose both date and time", "info"); return; }
    try {
      setSaving(true);
      const res = mode === "reschedule"
        ? await API.put(`/api/sessions/${session._id}/reschedule`, payload)
        : await API.post("/api/sessions", payload);
      showToast(res.data.message || (mode === "reschedule" ? "Session rescheduled" : "Session created"), "success");
      onSuccess?.(res.data.session);
      onClose?.();
    } catch (error) {
      showToast(error.response?.data?.message || error.response?.data?.error || "Session action failed", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="session-modal-overlay" onClick={onClose}>
      <div className="session-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">

        {/* Close button */}
        <button className="session-modal-close" onClick={onClose} aria-label="Close">
          <X size={17} />
        </button>

        {/* Header */}
        <div className="session-modal-header">
          <p className="session-modal-kicker">
            {mode === "reschedule" ? "Reschedule" : "Session planner"}
          </p>
          <h2 className="session-modal-title">{heading}</h2>
          <p className="session-modal-sub">{helperText}</p>
        </div>

        {/* Session with chip */}
        {requestUserName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--primary-soft)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-lg)', marginBottom: 24 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#070a13', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
              {requestUserName[0]?.toUpperCase()}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'JetBrains Mono, monospace' }}>Session with</p>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-main)', fontFamily: "'DM Serif Display', serif" }}>{requestUserName}{requestSkill ? ` · ${requestSkill}` : ""}</p>
            </div>
          </div>
        )}

        {/* Topic */}
        <div className="form-field">
          <label className="form-label">Topic</label>
          <input className="input" value={form.topic} onChange={(e) => handleChange("topic", e.target.value)} placeholder="e.g. React hooks basics, Guitar fingerpicking..." />
        </div>

        {/* Description */}
        <div className="form-field">
          <label className="form-label">Description <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(optional)</span></label>
          <textarea className="input" value={form.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="What should both users prepare before the session?" rows={3} style={{ resize: "vertical", minHeight: 90 }} />
        </div>

        {/* 2-col grid for Mode, Duration, Date, Time */}
        <div className="session-form-grid">
          <div className="form-field">
            <label className="form-label">
              <Monitor size={13} style={{ display: 'inline', marginRight: 5 }} />Mode
            </label>
            <select className="input" value={form.mode} onChange={(e) => handleChange("mode", e.target.value)}>
              <option value="chat">💬 Chat</option>
              <option value="video">📹 Video</option>
              <option value="audio">🎙️ Audio</option>
              <option value="in_person">🤝 In person</option>
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">
              <Timer size={13} style={{ display: 'inline', marginRight: 5 }} />Duration
            </label>
            <select className="input" value={form.durationMinutes} onChange={(e) => handleChange("durationMinutes", e.target.value)}>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>2 hours</option>
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">
              <Calendar size={13} style={{ display: 'inline', marginRight: 5 }} />Date
            </label>
            <input type="date" className="input" value={form.date} onChange={(e) => handleChange("date", e.target.value)} />
          </div>

          <div className="form-field">
            <label className="form-label">
              <Clock size={13} style={{ display: 'inline', marginRight: 5 }} />Time
            </label>
            <input type="time" className="input" value={form.time} onChange={(e) => handleChange("time", e.target.value)} />
          </div>
        </div>

        {/* Conditional extra fields */}
        {(form.mode === "video" || form.mode === "audio") && (
          <div className="form-field">
            <label className="form-label">Meeting link</label>
            <input className="input" value={form.meetingLink} onChange={(e) => handleChange("meetingLink", e.target.value)} placeholder="Paste Google Meet, Zoom, or any link" />
          </div>
        )}

        {form.mode === "in_person" && (
          <div className="form-field">
            <label className="form-label">Location</label>
            <input className="input" value={form.location} onChange={(e) => handleChange("location", e.target.value)} placeholder="Add a meetup location or note" />
          </div>
        )}

        {/* Actions */}
        <div className="session-modal-actions">
          <button className="ghost-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : mode === "reschedule" ? "Send New Time" : "Create Session"}
          </button>
        </div>

      </div>
    </div>
  );
}

export default SessionForm;
