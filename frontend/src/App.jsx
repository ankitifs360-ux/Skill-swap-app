import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Requests from "./pages/Requests";
import Chat from "./pages/Chat";
import ChatList from "./pages/ChatList";

function App() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [dark, setDark] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div
      style={{
        background: dark ? "#0f172a" : "#f9fafb",
        color: dark ? "#e5e7eb" : "#111827",
        minHeight: "100vh",
      }}
    >
      {/* NAVBAR */}
      <nav style={styles.nav}>
        <div style={styles.left}>
          <Link to="/" style={styles.link}>Home</Link>
          {token && <Link to="/requests" style={styles.link}>Requests</Link>}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setDark(!dark)}>
            Toggle Mode
          </button>

          {token && (
            <button onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>
      </nav>

      {/* MAIN LAYOUT */}
      {token ? (
        <div style={{ display: "flex" }}>
          <ChatList /> {/* LEFT SIDEBAR */}

          <Routes>
            <Route path="/chat/:userId" element={<Chat />} />
            <Route path="/" element={<Home />} />
            <Route path="/requests" element={<Requests />} />
          </Routes>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      )}
    </div>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px",
    borderBottom: "1px solid #ccc",
  },
  left: {
    display: "flex",
    gap: "10px",
  },
  link: {
    textDecoration: "none",
  },
};

export default App;