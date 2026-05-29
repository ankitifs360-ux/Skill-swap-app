import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import API from "../api/axios";
import Skeleton from "../components/Skeleton";
import { useToast } from "../components/useToast";
import { formatDateTime } from "../utils/formatters";
import { getImageUrl } from "../utils/getImageUrl";

const getNotificationTime = (item) => item.updatedAt || item.createdAt;
const SESSION_TYPES = [
  "session_created",
  "session_accepted",
  "session_rescheduled",
  "session_cancelled",
  "session_completed",
  "session_rejected",
];

const FILTERS = [
  { key: "all", label: "All" },
  { key: "message", label: "Messages" },
  { key: "request", label: "Requests" },
  { key: "session", label: "Sessions" },
];

const matchesFilter = (item, filterKey) => {
  if (filterKey === "all") return true;
  if (filterKey === "message") return item.type === "message";
  if (filterKey === "request") return item.type.startsWith("request_");
  if (filterKey === "session") return SESSION_TYPES.includes(item.type);
  return item.type === filterKey;
};

function Notifications() {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const autoReadDone = useRef(false);

  const fetchNotifications = useCallback(async () => {
    const res = await API.get("/api/notifications");
    return res.data.notifications || [];
  }, []);

  const silentMarkAllRead = useCallback(async () => {
    try {
      await API.put("/api/notifications/mark-all-read");
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      window.dispatchEvent(new Event("app:data-refresh"));
    } catch (error) {
      console.log(error.response?.data || error.message);
    }
  }, []);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);
        const list = await fetchNotifications();
        setNotifications(list);

        const hasUnread = list.some((item) => !item.read);
        if (hasUnread && !autoReadDone.current) {
          autoReadDone.current = true;
          await silentMarkAllRead();
        }
      } catch (error) {
        showToast(error.response?.data?.message || "Failed to load notifications", "error");
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [fetchNotifications, showToast, silentMarkAllRead]);

  const handleMarkAllRead = async () => {
    try {
      const res = await API.put("/api/notifications/mark-all-read");
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      showToast(res.data.message || "Notifications marked as read", "success");
      window.dispatchEvent(new Event("app:data-refresh"));
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to update notifications", "error");
    }
  };

  const groupedNotifications = useMemo(() => {
    const grouped = new Map();

    notifications.forEach((item) => {
      if (item.type !== "message") {
        grouped.set(`single-${item._id}`, {
          ...item,
          displayMessage: item.message,
          displayTime: getNotificationTime(item),
          totalCount: 1,
          showCount: false,
        });
        return;
      }

      const senderId = item.sender?._id || item.relatedUser?._id || item._id;
      const key = `message-${senderId}`;
      const itemTime = new Date(getNotificationTime(item)).getTime();
      const itemCount = Number(item.messageCount || 1);
      const preview = item.latestMessagePreview || item.message;

      const current = grouped.get(key) || {
        key,
        type: "message",
        sender: item.sender,
        relatedUser: item.relatedUser,
        unreadCount: 0,
        latestUnreadItem: null,
        latestUnreadTime: 0,
        latestReadItem: null,
        latestReadTime: 0,
      };

      if (item.read) {
        if (itemTime >= current.latestReadTime) {
          current.latestReadTime = itemTime;
          current.latestReadItem = { ...item, preview };
        }
      } else {
        current.unreadCount += itemCount;
        if (itemTime >= current.latestUnreadTime) {
          current.latestUnreadTime = itemTime;
          current.latestUnreadItem = { ...item, preview };
        }
      }

      grouped.set(key, current);
    });

    return Array.from(grouped.values())
      .map((entry) => {
        if (entry.type !== "message") return entry;

        const hasUnread = entry.unreadCount > 0;
        const baseItem = hasUnread ? entry.latestUnreadItem : entry.latestReadItem;

        if (!baseItem) return null;

        return {
          ...baseItem,
          read: !hasUnread,
          totalCount: hasUnread ? entry.unreadCount : 1,
          showCount: hasUnread && entry.unreadCount > 1,
          displayMessage: baseItem.preview || "Open chat to view the latest message.",
          displayTime: getNotificationTime(baseItem),
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.displayTime) - new Date(a.displayTime));
  }, [notifications]);

  const filterCounts = useMemo(() => {
    return FILTERS.reduce((acc, filter) => {
      acc[filter.key] = groupedNotifications.filter((item) => !item.read && matchesFilter(item, filter.key)).length;
      return acc;
    }, {});
  }, [groupedNotifications]);

  const filteredNotifications = useMemo(() => {
    return groupedNotifications.filter((item) => matchesFilter(item, activeFilter));
  }, [activeFilter, groupedNotifications]);

  const getActionLink = (item) => {
    if (item.type.startsWith("request_")) {
      return "/requests";
    }

    if (SESSION_TYPES.includes(item.type)) {
      return "/sessions";
    }

    if (item.type === "message" && item.relatedUser?._id) {
      return `/chat/${item.relatedUser._id}`;
    }

    return "/";
  };

  const getNotificationHeading = (item) => {
    if (item.type !== "message") {
      return item.title;
    }

    const senderName = item.sender?.name || item.relatedUser?.name || "Someone";

    if (!item.read && item.totalCount > 1) {
      return `${senderName} sent ${item.totalCount} messages`;
    }

    return `${senderName} sent you a message`;
  };

  const getTypeLabel = (item) => {
    if (item.type === "message") return { label: "Message", className: "message" };
    if (SESSION_TYPES.includes(item.type)) return { label: "Session", className: "pending" };
    if (item.type === "request_accepted") return { label: "Accepted", className: "accepted" };
    if (item.type === "request_rejected") return { label: "Rejected", className: "rejected" };
    return { label: "Request", className: "pending" };
  };

  const pageVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } }
  };

  return (
    <motion.div 
      className="chat-shell"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="page-hero">
        <div className="page-title-row">
          <p className="eyebrow-text">Activity</p>
          <h2 className="page-title">Notifications</h2>
          <p className="page-subtitle">
            Stay updated with messages, request approvals, and session planning activity.
          </p>
        </div>

        <div className="page-actions">
          <button className="ghost-btn" onClick={handleMarkAllRead}>
            Mark all as read
          </button>
        </div>
      </div>

      <div className="card-surface" style={{ padding: 22 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 18,
            alignItems: "center",
          }}
        >
          <div>
            <p className="eyebrow-text" style={{ marginBottom: 6 }}>
              Filter view
            </p>
            <h3 style={{ margin: 0, color: "var(--text-main)" }}>Browse by notification type</h3>
          </div>
          <span className="presence-pill">{filterCounts[activeFilter] || 0} shown</span>
        </div>

        <div className="request-tabs-row" style={{ marginBottom: 18, flexWrap: "wrap" }}>
          {FILTERS.map((filter) => (
            <button key={filter.key} className={activeFilter === filter.key ? "active" : ""} onClick={() => setActiveFilter(filter.key)}>
              {filter.label} {filterCounts[filter.key] > 0 ? `(${filterCounts[filter.key]})` : ""}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="notification-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="card-surface notification-card">
                <div className="notification-user-row">
                  <Skeleton height={50} width={50} radius={999} />
                  <div style={{ width: "100%" }}>
                    <Skeleton height={18} width="34%" />
                    <Skeleton height={14} width="62%" style={{ marginTop: 10 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔔</div>
            <h3>No notifications here</h3>
            <p>New request, chat, and session activity will appear in this list.</p>
          </div>
        ) : (
          <div className="notification-grid">
            {filteredNotifications.map((item) => {
              const actor = item.sender || item.relatedUser;
              const avatarUrl = getImageUrl(actor?.avatar);
              const typeMeta = getTypeLabel(item);

              return (
                <div
                  key={item._id}
                  className={`card-surface notification-card ${item.read ? "notification-card-read" : "notification-card-unread"}`.trim()}
                >
                  <div className="notification-card-top">
                    <div className="notification-user-row">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={actor?.name || "avatar"} className="mini-avatar" />
                      ) : (
                        <div className="mini-avatar-placeholder">{(actor?.name || "U").slice(0, 1).toUpperCase()}</div>
                      )}

                      <div className="notification-text-wrap">
                        <div className="notification-title-row">
                          <strong>{getNotificationHeading(item)}</strong>
                          <span className={`type-tag ${typeMeta.className}`.trim()}>{typeMeta.label}</span>
                          {item.showCount && <span className="notification-message-count">{item.totalCount}</span>}
                        </div>
                        <p className="notification-preview">{item.displayMessage}</p>
                        <div className="notification-meta">
                          <span className="muted-text">{formatDateTime(item.displayTime)}</span>
                        </div>
                      </div>
                    </div>

                    <Link to={getActionLink(item)} className="top-link">
                      Open
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default Notifications;
