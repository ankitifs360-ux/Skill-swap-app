import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Video, Send, User, Calendar, Info, MessageCircle } from "lucide-react";
import API from "../api/axios";
import ProfileModal from "../components/ProfileModal";
import SessionForm from "../components/SessionForm";
import Skeleton from "../components/Skeleton";
import { useToast } from "../components/useToast";
import VideoCallRoom from "../components/VideoCallRoom";
import { getImageUrl } from "../utils/getImageUrl";
import {
  formatMessageTime,
  formatRelativeLastSeen,
  getDayLabel,
} from "../utils/formatters";

function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [otherUser, setOtherUser] = useState(null);
  const [typing, setTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [sessionFormOpen, setSessionFormOpen] = useState(false);
  
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const chatWindowRef = useRef(null);
  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const scrollToBottom = (behavior = "auto") => {
    const el = chatWindowRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  };

  const isNearBottom = () => {
    const el = chatWindowRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const markConversationAsRead = useCallback(async () => {
    try {
      await API.put(`/api/chat/read/${userId}`);
      socketRef.current?.emit("markRead", { senderId: userId });
      window.dispatchEvent(new Event("app:data-refresh"));
    } catch (error) {
      console.log(error.response?.data || error.message);
    }
  }, [userId]);

  const fetchChat = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get(`/api/chat/${userId}`);
      setMessages(Array.isArray(res.data) ? res.data : []);
      await markConversationAsRead();
      requestAnimationFrame(() => scrollToBottom("auto"));
    } catch (error) {
      showToast("Failed to load chat", "error");
    } finally {
      setLoading(false);
    }
  }, [markConversationAsRead, showToast, userId]);

  useEffect(() => {
    if (!token || !userId) return undefined;
    fetchChat();

    const fetchUser = async () => {
      try {
        const res = await API.get(`/api/users/${userId}`);
        setOtherUser(res.data.user);
      } catch (error) {
        console.log(error.message);
      }
    };
    fetchUser();

    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("receiveMessage", (newMessage) => {
      const senderId = typeof newMessage.sender === "object" ? newMessage.sender._id : newMessage.sender;
      const receiverId = typeof newMessage.receiver === "object" ? newMessage.receiver._id : newMessage.receiver;
      if (senderId !== userId && receiverId !== userId) return;

      const shouldStick = isNearBottom();
      setMessages((prev) => {
        if (prev.some(m => m._id === newMessage._id)) return prev;
        return [...prev, newMessage];
      });

      if (senderId === userId) markConversationAsRead();
      if (shouldStick) requestAnimationFrame(() => scrollToBottom("smooth"));
    });

    socket.on("typing", ({ senderId }) => senderId === userId && setTyping(true));
    socket.on("stopTyping", ({ senderId }) => senderId === userId && setTyping(false));
    socket.on("onlineUsers", (users) => setOnlineUsers(users || []));
    socket.on("incoming-call", (payload) => payload.callerId === userId && setIncomingCall(payload));
    socket.on("call-ended", () => { setIncomingCall(null); setActiveCall(null); });

    return () => socket.disconnect();
  }, [token, userId, fetchChat, markConversationAsRead]);

  const handleSend = () => {
    if (!text.trim() || !socketRef.current) return;
    socketRef.current.emit("sendMessage", { receiver: userId, message: text });
    socketRef.current.emit("stopTyping", { receiver: userId });
    setText("");
    requestAnimationFrame(() => scrollToBottom("smooth"));
  };

  const isOnline = onlineUsers.includes(userId);
  const avatarUrl = getImageUrl(otherUser?.avatar);

  const timeline = useMemo(() => {
    return messages.reduce((acc, msg, index) => {
      const prev = messages[index - 1];
      const day = getDayLabel(msg.createdAt);
      if (!prev || getDayLabel(prev.createdAt) !== day) {
        acc.push({ type: "divider", label: day });
      }
      acc.push({ type: "message", msg });
      return acc;
    }, []);
  }, [messages]);

  return (
    <div className="chat-container">
      <div className="chat-card shadow-lg" style={{ position: 'relative', flexDirection: 'row' }}>
        {/* Chat column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          {/* Chat Header */}
          <div className="chat-page-header">
            <div className="chat-user-info" onClick={() => setProfileOpen(true)}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={otherUser?.name} className="chat-header-avatar" />
              ) : (
                <div className="chat-header-avatar-placeholder"><User size={24} /></div>
              )}
              <div className="chat-user-meta">
                <h3 className="chat-user-name">{otherUser?.name || "Loading..."}</h3>
                <p className="chat-user-status">
                  {isOnline ? (
                    <span className="status-online">Online now</span>
                  ) : (
                    <span>Last seen {formatRelativeLastSeen(otherUser?.lastSeen)}</span>
                  )}
                </p>
              </div>
            </div>

            <div className="chat-actions">
              <button className="chat-actions .icon-btn" style={{ width:38, height:38, borderRadius:'50%', border:'none', background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-soft)', cursor:'pointer', transition:'all 0.15s' }}
                onClick={() => setActiveCall({ isIncoming: false, partnerId: userId, partnerName: otherUser?.name })}
                onMouseEnter={e=>e.currentTarget.style.color='var(--primary)'}
                onMouseLeave={e=>e.currentTarget.style.color='var(--text-soft)'}
              >
                <Video size={18} />
              </button>
              <button style={{ width:38, height:38, borderRadius:'50%', border:'none', background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-soft)', cursor:'pointer', transition:'all 0.15s' }}
                onClick={() => setSessionFormOpen(true)}
                onMouseEnter={e=>e.currentTarget.style.color='var(--primary)'}
                onMouseLeave={e=>e.currentTarget.style.color='var(--text-soft)'}
              >
                <Calendar size={18} />
              </button>
              <button style={{ width:38, height:38, borderRadius:'50%', border:'none', background: infoOpen ? 'var(--primary)' : 'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', color: infoOpen ? '#070a13' : 'var(--text-soft)', cursor:'pointer', transition:'all 0.15s' }}
                onClick={() => setInfoOpen(!infoOpen)}
              >
                <Info size={18} />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div ref={chatWindowRef} className="chat-messages-area">
            {loading ? (
              <div className="p-4 space-y-4">
                <Skeleton height={60} width="60%" radius={12} />
                <Skeleton height={60} width="50%" radius={12} style={{ marginLeft: "auto" }} />
                <Skeleton height={40} width="70%" radius={12} />
              </div>
            ) : messages.length === 0 ? (
              <div className="chat-empty">
                <MessageCircle size={48} className="text-gray-300 mb-4" />
                <h3>Start a conversation</h3>
                <p>Say hi to {otherUser?.name || "your match"}!</p>
              </div>
            ) : (
              timeline.map((item, idx) => (
                item.type === "divider" ? (
                  <div key={idx} className="chat-time-divider">{item.label}</div>
                ) : (
                  <div key={item.msg._id} className={`message-bubble-wrap ${item.msg.sender === currentUser?._id || item.msg.sender?._id === currentUser?._id ? "mine" : "theirs"}`}>
                    <div className="message-bubble">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.msg.message}</ReactMarkdown>
                      <span className="message-time">{formatMessageTime(item.msg.createdAt)}</span>
                    </div>
                  </div>
                )
              ))
            )}
            {typing && <div className="typing-notice">{otherUser?.name} is typing...</div>}
          </div>

          {/* Chat Input */}
          <div className="chat-input-wrap">
            <input
              type="text"
              className="chat-input"
              placeholder="Type a message..."
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                socketRef.current?.emit("typing", { receiver: userId });
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => {
                  socketRef.current?.emit("stopTyping", { receiver: userId });
                }, 1000);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button className="chat-send-btn" onClick={handleSend}>
              <Send size={20} />
            </button>
          </div>
        </div>

        {/* === SLIDE-IN INFO PANEL === */}
        {infoOpen && (
          <div className="chat-info-panel">
            <div className="chat-info-panel-header">
              <h3 className="chat-info-panel-title">User Info</h3>
              <button className="chat-info-close" onClick={() => setInfoOpen(false)}>✕</button>
            </div>
            <div className="chat-info-panel-body">
              {/* Avatar + name */}
              <div className="chat-info-avatar-row">
                {avatarUrl
                  ? <img src={avatarUrl} alt={otherUser?.name} className="chat-info-avatar" />
                  : <div className="chat-info-avatar-placeholder">{otherUser?.name?.[0]?.toUpperCase()}</div>
                }
                <h3 className="chat-info-name">{otherUser?.name}</h3>
                <p className="chat-info-handle">@{otherUser?.username || otherUser?.name?.toLowerCase().replace(/\s+/g, '')}</p>
                <span className={`chat-info-status ${isOnline ? 'chat-info-online' : 'chat-info-offline'}`}>
                  {isOnline ? '● Online' : 'Offline'}
                </span>
              </div>

              {/* Bio */}
              {otherUser?.bio && (
                <div>
                  <p className="chat-info-section-title">About</p>
                  <p className="chat-info-bio">{otherUser.bio}</p>
                </div>
              )}

              {/* Skills to Teach */}
              {otherUser?.skillsToTeach?.length > 0 && (
                <div>
                  <p className="chat-info-section-title">Teaches</p>
                  <div className="chat-info-chips">
                    {otherUser.skillsToTeach.map((s, i) => (
                      <span key={i} className="skill-chip teach-chip">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills to Learn */}
              {otherUser?.skillsToLearn?.length > 0 && (
                <div>
                  <p className="chat-info-section-title">Learning</p>
                  <div className="chat-info-chips">
                    {otherUser.skillsToLearn.map((s, i) => (
                      <span key={i} className="skill-chip learn-chip">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <button className="primary-btn w-full" style={{ marginTop: 4, justifyContent: 'center' }} onClick={() => { setSessionFormOpen(true); setInfoOpen(false); }}>
                <Calendar size={15} /> Book a Session
              </button>
            </div>
          </div>
        )}
      </div>

      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={otherUser}
        isOnline={isOnline}
        title="User profile"
      />

      <SessionForm
        open={sessionFormOpen}
        onClose={() => setSessionFormOpen(false)}
        partnerId={userId}
        requestUserName={otherUser?.name || "User"}
      />

      {incomingCall && !activeCall && (
        <div className="incoming-call-toast shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="animate-pulse bg-blue-100 p-3 rounded-full">
              <Video size={24} className="text-blue-600" />
            </div>
            <div>
              <h4 className="font-bold">Incoming Call</h4>
              <p className="text-sm text-gray-500">{incomingCall.callerName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 bg-green-500 text-white py-2 rounded-lg font-bold" onClick={() => {
              setActiveCall({ isIncoming: true, partnerId: incomingCall.callerId, partnerName: incomingCall.callerName, initialOffer: incomingCall.offer });
              setIncomingCall(null);
            }}>Accept</button>
            <button className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold" onClick={() => {
              socketRef.current?.emit("end-call", { targetUserId: incomingCall.callerId });
              setIncomingCall(null);
            }}>Decline</button>
          </div>
        </div>
      )}

      {activeCall && (
        <VideoCallRoom
          socket={socketRef.current}
          partnerId={activeCall.partnerId}
          partnerName={activeCall.partnerName}
          isIncoming={activeCall.isIncoming}
          initialOffer={activeCall.initialOffer}
          onClose={() => setActiveCall(null)}
        />
      )}
    </div>
  );
}

export default Chat;
