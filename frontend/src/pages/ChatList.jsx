import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../api/axios";
import { getImageUrl } from "../utils/getImageUrl";
import { formatChatListTime, formatRelativeLastSeen } from "../utils/formatters";
import ProfileModal from "../components/ProfileModal";
import Skeleton from "../components/Skeleton";

function ChatList({ onNavigate = () => {} }) {
  const [chats, setChats] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  const fetchChats = useCallback(async () => {
    try {
      setLoading((prev) => (chats.length ? prev : true));
      const res = await API.get("/api/chat/list");
      setChats(res.data || []);
    } catch (error) {
      console.log(error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  }, [chats.length]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (!token) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("receiveMessage", fetchChats);
    socket.on("unreadUpdated", fetchChats);

    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users || []);
    });

    socket.on("lastSeenUpdated", ({ userId, lastSeen }) => {
      setChats((prev) =>
        prev.map((chat) =>
          chat.user?._id === userId
            ? {
                ...chat,
                user: { ...chat.user, lastSeen },
              }
            : chat
        )
      );
    });

    const interval = setInterval(fetchChats, 12000);

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [fetchChats, token]);

  const filteredChats = useMemo(() => {
    const value = search.trim().toLowerCase();

    return [...chats]
      .filter((chat) => {
        if (!value) return true;
        return (
          chat.user?.name?.toLowerCase().includes(value) ||
          chat.lastMessage?.toLowerCase().includes(value)
        );
      })
      .sort((a, b) => {
        const aOnline = onlineUsers.includes(a.user?._id);
        const bOnline = onlineUsers.includes(b.user?._id);

        if (aOnline && !bOnline) return -1;
        if (!aOnline && bOnline) return 1;

        return new Date(b.time) - new Date(a.time);
      });
  }, [chats, onlineUsers, search]);

  return (
    <>
      <input
        className="chat-search-bar"
        placeholder="Search chats…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 8 }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="chat-list-item">
              <Skeleton height={46} width={46} radius={999} />
              <div style={{ flex: 1 }}>
                <Skeleton height={16} width="42%" />
                <Skeleton height={14} width="84%" style={{ marginTop: 10 }} />
                <Skeleton height={12} width="34%" style={{ marginTop: 10 }} />
              </div>
            </div>
          ))
        ) : filteredChats.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <h3>No chats found</h3>
            <p>Your accepted request conversations will appear here.</p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isActive = location.pathname === `/chat/${chat.user._id}`;
            const avatarUrl = getImageUrl(chat.user?.avatar);
            const isOnline = onlineUsers.includes(chat.user?._id);

            return (
              // ✅ CHANGED: button → div
              <div
                key={chat.user._id}
                className={`chat-list-item ${isActive ? "chat-list-item-active" : ""}`}
                onClick={() => {
                  navigate(`/chat/${chat.user._id}`);
                  onNavigate();
                }}
                style={{ cursor: "pointer" }}
              >
                <div className="chat-avatar-wrap">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={chat.user?.name} className="chat-avatar" />
                  ) : (
                    <div className="chat-avatar-placeholder">
                      {(chat.user?.name || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <span className={`presence-dot ${isOnline ? "presence-online" : "presence-offline"}`} />
                </div>

                <div className="chat-list-content">
                  <div className="chat-list-top">
                    {/* ✅ CHANGED: button → span */}
                    <span
                      className="chat-list-name-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUser(chat.user);
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      {chat.user?.name}
                    </span>

                    <span className="chat-time-text">
                      {formatChatListTime(chat.time)}
                    </span>
                  </div>

                  <p className="chat-list-preview">
                    {chat.lastMessage || "No messages yet"}
                  </p>

                  <div className="chat-list-bottom">
                    <span className={`chat-list-presence ${isOnline ? "chat-status-online" : ""}`}>
                      {isOnline
                        ? "Online"
                        : `Last seen ${formatRelativeLastSeen(chat.user?.lastSeen)}`}
                    </span>

                    {chat.unreadCount > 0 && (
                      <span className="badge">{chat.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ProfileModal
        open={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        user={selectedUser}
        isOnline={onlineUsers.includes(selectedUser?._id)}
        title="User profile"
      />
    </>
  );
}

export default ChatList;
