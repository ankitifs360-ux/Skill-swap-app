import { useEffect, useState } from "react";
import { NavLink, Navigate, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import { Bell, Inbox, User, LogOut, Menu, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import API from "./api/axios";
import ProfileModal from "./components/ProfileModal";
import Footer from "./components/Footer";
import Chat from "./pages/Chat";
import ChatList from "./pages/ChatList";
import Messages from "./pages/Messages";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Notifications from "./pages/Notifications";
import Onboarding from "./pages/Onboarding";
import Register from "./pages/Register";
import Requests from "./pages/Requests";
import ResetPassword from "./pages/ResetPassword";
import Sessions from "./pages/Sessions";
import Leaderboard from "./pages/Leaderboard";
import Browse from "./pages/Browse";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ProfilePage from "./pages/ProfilePage";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import "./App.css";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [storedUser, setStoredUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [counts, setCounts] = useState({
    unreadChats: 0,
    unreadNotifications: 0,
    pendingRequests: 0,
  });

  const refreshCounts = async () => {
    const activeToken = localStorage.getItem("token");
    if (!activeToken) {
      setCounts({ unreadChats: 0, unreadNotifications: 0, pendingRequests: 0 });
      return;
    }
    try {
      const [chatRes, notificationRes, requestRes] = await Promise.all([
        API.get("/api/chat/unread-count"),
        API.get("/api/notifications/unread-count"),
        API.get("/api/requests/counts"),
      ]);
      setCounts({
        unreadChats: chatRes.data.unreadCount || 0,
        unreadNotifications: notificationRes.data.unreadCount || 0,
        pendingRequests: requestRes.data.incomingPending || 0,
      });
    } catch (error) {
      console.log(error.response?.data || error.message);
    }
  };

  useEffect(() => {
    const syncAuth = () => {
      setToken(localStorage.getItem("token"));
      try {
        setStoredUser(JSON.parse(localStorage.getItem("user") || "null"));
      } catch {
        setStoredUser(null);
      }
    };
    window.addEventListener("storage", syncAuth);
    window.addEventListener("auth-changed", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("auth-changed", syncAuth);
    };
  }, []);

  // Track scroll for topbar shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!token) return undefined;
    const initTimer = window.setTimeout(() => { refreshCounts(); }, 0);
    const handleRefresh = () => refreshCounts();
    const interval = window.setInterval(refreshCounts, 10000);
    window.addEventListener("app:data-refresh", handleRefresh);
    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
      window.removeEventListener("app:data-refresh", handleRefresh);
    };
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
    });
    socket.on("unreadUpdated", refreshCounts);
    socket.on("notificationUpdated", refreshCounts);
    socket.on("onlineUsers", (users) => setOnlineUsers(users || []));
    return () => { socket.disconnect(); };
  }, [token]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setStoredUser(null);
    setCounts({ unreadChats: 0, unreadNotifications: 0, pendingRequests: 0 });
    setOnlineUsers([]);
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/login");
  };

  const navClassName = ({ isActive }) =>
    `nav-link ${isActive ? "active" : ""}`.trim();

  if (storedUser && storedUser.onboardingComplete === false && token) {
    return (
      <Onboarding
        user={storedUser}
        onComplete={(updatedUser) => {
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setStoredUser(updatedUser);
          window.dispatchEvent(new Event("auth-changed"));
        }}
      />
    );
  }

  return (
    <>
      <div className="app-shell">
        {/* Topbar */}
        <header className={`main-topbar${scrolled ? " topbar-scrolled" : ""}`}>
          <div className="topbar-content max-w-7xl">

            {/* Logo */}
            <div className="topbar-logo" onClick={() => navigate("/")}>
              <div className="topbar-logo-icon" aria-hidden="true">✦</div>
              <span className="logo-text">Skill<span className="logo-accent">Swap</span></span>
            </div>

            {/* Center Nav */}
            <nav className="topbar-nav">
              <NavLink to="/" end className={navClassName}>Home</NavLink>
              <NavLink to="/browse" className={navClassName}>Browse</NavLink>
              {token && <NavLink to="/requests" className={navClassName}>
                Requests
                {counts.pendingRequests > 0 && (
                  <span className="nav-badge">{counts.pendingRequests}</span>
                )}
              </NavLink>}
              {token && <NavLink to="/sessions" className={navClassName}>Sessions</NavLink>}
              <NavLink to="/about" className={navClassName}>About</NavLink>
              <NavLink to="/contact" className={navClassName}>Contact</NavLink>
            </nav>

            {/* Right Actions */}
            <div className="topbar-actions">
              {token ? (
                <>
                  <button className="icon-btn" onClick={() => navigate("/notifications")} title="Notifications">
                    <Bell size={18} />
                    {counts.unreadNotifications > 0 && <span className="badge-dot" />}
                  </button>

                  <button className="icon-btn" onClick={() => navigate("/messages")} title="Messages">
                    <Inbox size={18} />
                    {counts.unreadChats > 0 && <span className="badge-dot" />}
                  </button>

                  <div className="topbar-divider" />

                  <div
                    className="user-chip-btn"
                    onClick={() => navigate("/profile/me")}
                    title="My Profile"
                  >
                    <div className="user-chip-avatar">
                      {storedUser?.avatar
                        ? <img src={storedUser.avatar} alt={storedUser.name} />
                        : (storedUser?.name?.[0]?.toUpperCase() || <User size={14} />)
                      }
                    </div>
                    <span className="user-chip-name">
                      {storedUser?.name?.split(" ")[0] || "Profile"}
                    </span>
                  </div>

                  <button className="logout-btn" onClick={handleLogout} title="Log out">
                    <LogOut size={15} />
                  </button>
                </>
              ) : (
                <>
                  <button className="ghost-btn" onClick={() => navigate("/login")}>Login</button>
                  <button className="primary-btn" onClick={() => navigate("/register")}>Sign Up</button>
                </>
              )}

              <button
                className="mobile-hamburger"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {/* Mobile Nav Drawer */}
          {mobileMenuOpen && (
            <div className="mobile-nav">
              <NavLink to="/" end className={navClassName}>Home</NavLink>
              <NavLink to="/browse" className={navClassName}>Browse</NavLink>
              {token && <NavLink to="/requests" className={navClassName}>Requests</NavLink>}
              {token && <NavLink to="/sessions" className={navClassName}>Sessions</NavLink>}
              <NavLink to="/about" className={navClassName}>About</NavLink>
              <NavLink to="/contact" className={navClassName}>Contact</NavLink>
              {token && (
                <div className="mobile-nav-auth">
                  <div className="mobile-nav-user">
                    <div className="user-chip-avatar" style={{ width: 32, height: 32, fontSize: 14 }}>
                      {storedUser?.avatar
                        ? <img src={storedUser.avatar} alt={storedUser.name} />
                        : (storedUser?.name?.[0]?.toUpperCase() || <User size={14} />)
                      }
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>
                      {storedUser?.name || "My Account"}
                    </span>
                  </div>
                  <button className="logout-btn mobile-logout" onClick={handleLogout}>
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              )}
              {!token && (
                <div className="mobile-nav-auth">
                  <button className="ghost-btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate("/login")}>Login</button>
                  <button className="primary-btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate("/register")}>Sign Up</button>
                </div>
              )}
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="main-content" style={{ flex: 1 }}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />

              {!token ? (
                <>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </>
              ) : (
                <>
                  <Route path="/browse" element={<Browse />} />
                  <Route path="/requests" element={<Requests />} />
                  <Route path="/sessions" element={<Sessions />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/chat/:userId" element={<Chat />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/profile/me" element={<ProfilePage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </>
              )}
            </Routes>
          </AnimatePresence>
        </main>

        <Footer />
      </div>

      {token && (
        <ProfileModal
          open={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          user={storedUser}
          isOnline={onlineUsers.includes(storedUser?._id)}
          title="My profile"
        />
      )}
    </>
  );
}

export default App;