import { useState, useEffect, useRef, useCallback } from "react";
import {
  User, MessageCircle, Users, Send, Inbox, Edit2, Lock,
  Eye, EyeOff, Upload, X, Check, Calendar, ChevronRight,
  Shield, Star, Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useToast } from "../components/useToast";
import { getImageUrl } from "../utils/getImageUrl";
import Skeleton from "../components/Skeleton";
import ChatList from "./ChatList";
import "../App.css";

const POPULAR_SKILLS = [
  "React", "Python", "JavaScript", "Graphic Design", "Photography",
  "French", "UI/UX Design", "Public Speaking", "TypeScript", "Node.js",
  "Figma", "English", "Guitar", "Cooking", "Chess", "Yoga",
  "Video Editing", "Data Science", "Machine Learning", "Painting",
];

const TABS = [
  { key: "profile",            label: "Profile",            icon: User },
  { key: "messages",           label: "Messages",           icon: MessageCircle },
  { key: "friends",            label: "Friends",            icon: Users },
  { key: "requests-received",  label: "Requests Received",  icon: Inbox },
  { key: "requests-sent",      label: "Requests Sent",      icon: Send },
  { key: "sessions",           label: "Sessions",           icon: Calendar },
  { key: "edit-profile",       label: "Edit Profile",       icon: Edit2 },
  { key: "change-password",    label: "Change Password",    icon: Shield },
];

/* ── small helpers ── */
const Avatar = ({ url, name, size = 44, fontSize = 17 }) => {
  if (url) return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border-strong)", flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "var(--accent-gradient)", color: "#070a13", fontWeight: 700, fontSize, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "'DM Serif Display',serif" }}>
      {(name || "U")[0].toUpperCase()}
    </div>
  );
};

const SectionHeader = ({ title, subtitle }) => (
  <div style={{ marginBottom: 24 }}>
    <h2 style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 28, fontWeight: 400, color: "var(--text-main)", margin: 0, letterSpacing: "-0.01em" }}>{title}</h2>
    {subtitle && <p style={{ fontSize: 14, color: "var(--text-soft)", margin: "6px 0 0", fontWeight: 300 }}>{subtitle}</p>}
  </div>
);

const EmptyState = ({ icon: Icon, title, text }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "64px 24px", textAlign: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20 }}>
    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--primary-soft)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
      <Icon size={24} />
    </div>
    <h3 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 20, fontWeight: 400, color: "var(--text-main)", margin: 0 }}>{title}</h3>
    <p style={{ fontSize: 14, color: "var(--text-soft)", margin: 0, fontWeight: 300 }}>{text}</p>
  </div>
);

/* ──────────────────────────────────── */
function ProfilePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit form
  const [editForm, setEditForm] = useState({ name: "", username: "", bio: "", skillsToTeach: [], skillsToLearn: [] });
  const [editLoading, setEditLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Password form
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  // Social data
  const [friends, setFriends] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null); // FIX: was missing, caused blank screen on Messages tab

  /* ── fetch user ── */
  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/api/users/profile");
      const u = res.data.user;
      setUser(u);
      setEditForm({ name: u.name || "", username: u.username || "", bio: u.bio || "", skillsToTeach: u.skillsToTeach || [], skillsToLearn: u.skillsToLearn || [] });
    } catch {
      showToast("Failed to load profile", "error");
      navigate("/");
    } finally {
      setLoading(false);
    }
  }, [showToast, navigate]);

  /* ── fetch requests / friends ── */
  const fetchRequests = useCallback(async () => {
    try {
      setDataLoading(true);
      const [inRes, outRes] = await Promise.all([
        API.get("/api/requests/my-requests?type=incoming"),
        API.get("/api/requests/my-requests?type=outgoing"),
      ]);
      const inc = inRes.data.requests || [];
      const out = outRes.data.requests || [];
      setFriends([...inc, ...out].filter(r => r.status === "accepted"));
      setSentRequests(out.filter(r => r.status === "pending"));
      setReceivedRequests(inc.filter(r => r.status === "pending"));
    } catch { /* silent */ } finally {
      setDataLoading(false);
    }
  }, []);

  /* ── fetch sessions ── */
  const fetchSessions = useCallback(async () => {
    try {
      setDataLoading(true);
      const res = await API.get("/api/sessions/my");
      setSessions(res.data.sessions || []);
    } catch { /* silent */ } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/login"); return; }
    fetchUser();
  }, [fetchUser, navigate]);

  useEffect(() => {
    if (!user) return;
    if (["friends", "requests-sent", "requests-received"].includes(activeTab)) fetchRequests();
    if (activeTab === "sessions") fetchSessions();
    if (activeTab === "messages") setActiveChatId(null); // reset chat view on tab switch
  }, [activeTab, user, fetchRequests, fetchSessions]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      window.dispatchEvent(new Event("auth-changed"));
    }
  }, [user]);

  /* ── actions ── */
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("avatar", file);
    try {
      const res = await API.put("/api/users/avatar", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setUser(res.data.user);
      showToast("Avatar updated!", "success");
    } catch { showToast("Failed to upload", "error"); }
  };

  const toggleSkill = (type, skill) => {
    const key = type === "teach" ? "skillsToTeach" : "skillsToLearn";
    setEditForm(p => ({ ...p, [key]: p[key].includes(skill) ? p[key].filter(s => s !== skill) : [...p[key], skill] }));
  };

  const saveProfile = async () => {
    try {
      setEditLoading(true);
      const res = await API.put("/api/users/profile", { name: editForm.name, username: editForm.username, bio: editForm.bio, skillsToTeach: editForm.skillsToTeach, skillsToLearn: editForm.skillsToLearn });
      setUser(res.data.user);
      showToast("Profile updated!", "success");
      setActiveTab("profile");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update", "error");
    } finally { setEditLoading(false); }
  };

  const changePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) return showToast("Fill all fields", "error");
    if (pwForm.newPassword !== pwForm.confirmPassword) return showToast("Passwords don't match", "error");
    if (pwForm.newPassword.length < 6) return showToast("Min 6 characters", "error");
    try {
      setPwLoading(true);
      await API.put("/api/users/change-password", { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      showToast("Password updated!", "success");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      showToast(err.response?.data?.message || "Failed", "error");
    } finally { setPwLoading(false); }
  };

  const respondRequest = async (requestId, status) => {
    try {
      await API.put("/api/requests/respond", { requestId, status });
      showToast(status === "accepted" ? "Request accepted!" : "Request rejected", "success");
      fetchRequests();
    } catch { showToast("Failed", "error"); }
  };

  /* ── loading skeleton ── */
  if (loading) return (
    <div className="profile-page-layout">
      <aside className="profile-sidebar">
        {TABS.map(t => <div key={t.key} style={{ height: 44, background: "var(--surface-soft)", borderRadius: 10, marginBottom: 4 }} />)}
      </aside>
      <main className="profile-main-area">
        <Skeleton height={120} width={120} radius="50%" />
        <Skeleton height={32} width="50%" style={{ marginTop: 20 }} />
        <Skeleton height={16} width="70%" style={{ marginTop: 12 }} />
      </main>
    </div>
  );

  const avatarUrl = getImageUrl(user?.avatar);

  /* ───────────── RENDER ───────────── */
  return (
    <div className="profile-page-layout">

      {/* ── LEFT SIDEBAR ── */}
      <aside className="profile-sidebar">
        <div className="profile-sidebar-user">
          <Avatar url={avatarUrl} name={user?.name} size={44} />
          <div style={{ minWidth: 0 }}>
            <p className="sidebar-user-name">{user?.name}</p>
            <p className="sidebar-user-handle">@{user?.username || user?.name?.toLowerCase().replace(/\s+/g, "")}</p>
          </div>
        </div>
        <nav className="profile-tab-nav">
          {TABS.map(tab => (
            <button key={tab.key} className={`profile-tab-btn${activeTab === tab.key ? " active" : ""}`} onClick={() => setActiveTab(tab.key)}>
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── RIGHT CONTENT ── */}
      <main className="profile-main-area">

        {/* ═══ PROFILE ═══ */}
        {activeTab === "profile" && (
          <div className="profile-tab-content">
            <div className="profile-info-card">
              <div className="profile-avatar-section">
                <div className="profile-avatar-xl">
                  {avatarUrl ? <img src={avatarUrl} alt={user.name} className="avatar-img-xl" /> : <User size={44} />}
                </div>
                <div>
                  <h1 className="profile-display-name">{user.name}</h1>
                  <p className="profile-display-username">@{user.username || user.name?.toLowerCase().replace(/\s+/g, "")}</p>
                  <p className="profile-display-bio">{user.bio || "SkillSwap community member."}</p>
                </div>
              </div>
              <div className="profile-stats-row">
                <div className="profile-stat"><span className="stat-num">{user.reputation || 0}</span><span className="stat-lbl">Reputation</span></div>
                <div className="profile-stat"><span className="stat-num">{user.skillsToTeach?.length || 0}</span><span className="stat-lbl">Teaching</span></div>
                <div className="profile-stat"><span className="stat-num">{user.skillsToLearn?.length || 0}</span><span className="stat-lbl">Learning</span></div>
              </div>
            </div>
            <div className="profile-skills-grid-view">
              <div className="profile-skills-box">
                <h3 className="skills-box-heading teaches">Skills to Teach</h3>
                <div className="skills-chip-list">
                  {user.skillsToTeach?.length ? user.skillsToTeach.map((s, i) => <span key={i} className="skill-chip teach-chip">{s}</span>) : <p className="no-skills-text">No skills added yet</p>}
                </div>
              </div>
              <div className="profile-skills-box">
                <h3 className="skills-box-heading learns">Skills to Learn</h3>
                <div className="skills-chip-list">
                  {user.skillsToLearn?.length ? user.skillsToLearn.map((s, i) => <span key={i} className="skill-chip learn-chip">{s}</span>) : <p className="no-skills-text">No skills added yet</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ MESSAGES ═══ */}
        {activeTab === "messages" && (
          <div className="profile-tab-content">
            <SectionHeader title="Messages" subtitle="Click a conversation to open the chat" />
            <div style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              overflow: "hidden",
              minHeight: 300,
              padding: "12px 12px 0",
            }}>
              <ChatList />
            </div>
          </div>
        )}

        {/* ═══ FRIENDS ═══ */}
        {activeTab === "friends" && (
          <div className="profile-tab-content">
            <SectionHeader title="Friends" subtitle={`${friends.length} active connection${friends.length !== 1 ? "s" : ""}`} />
            {dataLoading ? <Skeleton height={72} width="100%" /> :
             friends.length === 0 ? <EmptyState icon={Users} title="No connections yet" text="Accept a request to start building your network." /> : (
              <div className="requests-list">
                {friends.map(r => {
                  const other = r.sender?._id === user._id ? r.receiver : r.sender;
                  return (
                    <div key={r._id} className="request-card">
                      <div className="request-user-info">
                        <Avatar url={getImageUrl(other?.avatar)} name={other?.name} size={44} />
                        <div>
                          <p className="request-user-name">{other?.name}</p>
                          <p className="request-skill-tag">Skill: {r.skill || "General"}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="primary-btn" style={{ padding: "8px 16px", fontSize: 13 }} onClick={() => { setActiveChatId(other?._id); setActiveTab("messages"); }}>
                          <MessageCircle size={14} /> Message
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ REQUESTS RECEIVED ═══ */}
        {activeTab === "requests-received" && (
          <div className="profile-tab-content">
            <SectionHeader title="Requests Received" subtitle={`${receivedRequests.length} pending request${receivedRequests.length !== 1 ? "s" : ""} waiting for your response`} />
            {dataLoading ? <Skeleton height={72} width="100%" /> :
             receivedRequests.length === 0 ? <EmptyState icon={Inbox} title="No pending requests" text="When someone wants to swap skills with you, it'll appear here." /> : (
              <div className="requests-list">
                {receivedRequests.map(r => (
                  <div key={r._id} className="request-card" style={{ borderLeft: "3px solid var(--primary)" }}>
                    <div className="request-user-info">
                      <Avatar url={getImageUrl(r.sender?.avatar)} name={r.sender?.name} size={44} />
                      <div>
                        <p className="request-user-name">{r.sender?.name}</p>
                        <p className="request-skill-tag">Wants to learn: <strong style={{ color: "var(--primary)" }}>{r.skill || "General Swap"}</strong></p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="primary-btn" style={{ padding: "8px 16px", fontSize: 13 }} onClick={() => respondRequest(r._id, "accepted")}>
                        <Check size={14} /> Accept
                      </button>
                      <button className="danger-btn" style={{ padding: "8px 16px", fontSize: 13 }} onClick={() => respondRequest(r._id, "rejected")}>
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ REQUESTS SENT ═══ */}
        {activeTab === "requests-sent" && (
          <div className="profile-tab-content">
            <SectionHeader title="Requests Sent" subtitle={`${sentRequests.length} pending request${sentRequests.length !== 1 ? "s" : ""} awaiting reply`} />
            {dataLoading ? <Skeleton height={72} width="100%" /> :
             sentRequests.length === 0 ? <EmptyState icon={Send} title="No pending sent requests" text="Browse users and send a swap request to get started." /> : (
              <div className="requests-list">
                {sentRequests.map(r => (
                  <div key={r._id} className="request-card">
                    <div className="request-user-info">
                      <Avatar url={getImageUrl(r.receiver?.avatar)} name={r.receiver?.name} size={44} />
                      <div>
                        <p className="request-user-name">{r.receiver?.name}</p>
                        <p className="request-skill-tag">Skill: <strong>{r.skill || "General Swap"}</strong></p>
                      </div>
                    </div>
                    <span className="request-status-badge pending">⏳ Pending</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ SESSIONS ═══ */}
        {activeTab === "sessions" && (
          <div className="profile-tab-content">
            <SectionHeader title="Sessions" subtitle="Your upcoming and past skill sessions" />
            {dataLoading ? <Skeleton height={100} width="100%" /> :
             sessions.length === 0 ? <EmptyState icon={Calendar} title="No sessions yet" text="Accept a request and book a session to start learning together." /> : (
              <div className="requests-list">
                {sessions.slice().reverse().map(s => {
                  const statusColor = { pending: "#fbbf24", accepted: "#4ade80", completed: "#4ade80", cancelled: "#f87171", rejected: "#f87171", rescheduled: "#fbbf24" }[s.status] || "#7c8db5";
                  const otherUser = String(s.userA?._id || s.userA) === String(user._id) ? s.userB : s.userA;
                  return (
                    <div key={s._id} className="request-card" style={{ borderLeft: `3px solid ${statusColor}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                        <div>
                          <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600, color: "var(--text-main)", fontFamily: "'DM Serif Display',serif" }}>
                            {s.topic || s.skill || "Skill Session"}
                          </p>
                          <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--text-soft)" }}>with {otherUser?.name || "Connection"}</p>
                          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, color: "var(--text-faint)" }}><Clock size={11} style={{ display: "inline", marginRight: 4 }} />{new Date(s.scheduledFor).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                            <span style={{ fontSize: 12, color: "var(--text-faint)" }}>· {s.durationMinutes || 60} min</span>
                            <span style={{ fontSize: 12, color: "var(--text-faint)" }}>· {s.mode}</span>
                          </div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 999, background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}40`, textTransform: "capitalize" }}>
                          {s.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ EDIT PROFILE ═══ */}
        {activeTab === "edit-profile" && (
          <div className="profile-tab-content">
            <SectionHeader title="Edit Profile" subtitle="Update your info and skills" />
            <div className="edit-profile-form">
              <div className="edit-avatar-section">
                <Avatar url={avatarUrl} name={user?.name} size={68} />
                <div>
                  <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600, color: "var(--text-main)" }}>Profile Picture</p>
                  <button className="ghost-btn" style={{ fontSize: 13, padding: "7px 16px" }} onClick={() => fileInputRef.current?.click()}>
                    <Upload size={13} /> Change Photo
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
                </div>
              </div>

              {[
                { label: "Full Name", key: "name", placeholder: "Your full name" },
                { label: "Username", key: "username", placeholder: "your_username" },
              ].map(({ label, key, placeholder }) => (
                <div key={key} className="form-field">
                  <label className="form-label">{label}</label>
                  <input type="text" className="input" placeholder={placeholder} value={editForm[key]}
                    onChange={e => setEditForm(p => ({ ...p, [key]: key === "username" ? e.target.value.toLowerCase().replace(/\s+/g, "") : e.target.value }))} />
                </div>
              ))}

              <div className="form-field">
                <label className="form-label">Bio</label>
                <textarea className="input" rows={3} maxLength={220} style={{ resize: "none" }} placeholder="Tell the community about yourself..."
                  value={editForm.bio} onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))} />
                <p style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 4 }}>{editForm.bio.length}/220</p>
              </div>

              {[
                { label: "Skills to Teach", key: "skillsToTeach", type: "teach", color: "var(--primary)", selClass: "selected-teach", note: "Select what you can teach" },
                { label: "Skills to Learn", key: "skillsToLearn", type: "learn", color: "#4ade80", selClass: "selected-learn", note: "Select what you want to learn" },
              ].map(({ label, type, color, selClass, note, key }) => (
                <div key={key} className="form-field">
                  <label className="form-label" style={{ color }}>{label}</label>
                  <p style={{ fontSize: 13, color: "var(--text-soft)", margin: "0 0 10px", fontWeight: 300 }}>{note}</p>
                  <div className="skills-picker">
                    {POPULAR_SKILLS.map(skill => (
                      <button key={skill} type="button" className={`skill-pick-btn${editForm[key].includes(skill) ? ` ${selClass}` : ""}`} onClick={() => toggleSkill(type, skill)}>
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <button className="primary-btn save-changes-btn" onClick={saveProfile} disabled={editLoading}>
                {editLoading ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {/* ═══ CHANGE PASSWORD ═══ */}
        {activeTab === "change-password" && (
          <div className="profile-tab-content">
            <SectionHeader title="Change Password" subtitle="Keep your account secure with a strong password" />
            <div className="password-form">
              {[
                { key: "current", label: "Current Password", field: "currentPassword" },
                { key: "new",     label: "New Password",     field: "newPassword" },
                { key: "confirm", label: "Confirm New Password", field: "confirmPassword" },
              ].map(({ key, label, field }) => (
                <div key={key} className="form-field">
                  <label className="form-label">{label}</label>
                  <div className="password-input-wrap">
                    <input type={showPw[key] ? "text" : "password"} className="input" style={{ paddingRight: 48 }}
                      placeholder={`Enter ${label.toLowerCase()}`} value={pwForm[field]}
                      onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))} />
                    <button type="button" className="pw-eye-btn" onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}>
                      {showPw[key] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              ))}
              <button className="primary-btn save-changes-btn" onClick={changePassword} disabled={pwLoading}>
                {pwLoading ? "Updating…" : "Update Password"}
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default ProfilePage;