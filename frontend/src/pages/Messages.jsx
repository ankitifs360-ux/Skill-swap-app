import { useNavigate, useParams, Routes, Route } from "react-router-dom";
import ChatList from "./ChatList";
import Chat from "./Chat";
import { MessageCircle } from "lucide-react";

function Messages() {
  const navigate = useNavigate();

  return (
    <div className="chat-dashboard">
      {/* Left sidebar — chat list */}
      <aside className="chat-list-sidebar">
        <div className="chat-list-sidebar-header">
          <h2 className="chat-list-sidebar-title">Messages</h2>
        </div>
        <div className="chat-list-scroll">
          <ChatList onNavigate={() => {}} />
        </div>
      </aside>

      {/* Right panel — actual chat or placeholder */}
      <main className="chat-main-area">
        <div className="chat-select-placeholder">
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-soft)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <MessageCircle size={28} />
          </div>
          <h3>Select a conversation</h3>
          <p>Choose a chat from the left to start messaging.</p>
        </div>
      </main>
    </div>
  );
}

export default Messages;
