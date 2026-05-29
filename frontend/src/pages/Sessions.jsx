import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import API from "../api/axios";
import SessionCard from "../components/SessionCard";
import SessionForm from "../components/SessionForm";
import Skeleton from "../components/Skeleton";
import { useToast } from "../components/useToast";

function Sessions() {
  const { showToast } = useToast();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("upcoming");
  const [rescheduleTarget, setRescheduleTarget] = useState(null);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/api/sessions/my");
      setSessions(res.data.sessions || []);
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to load sessions", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    const handleRefresh = () => fetchSessions();
    window.addEventListener("app:data-refresh", handleRefresh);
    return () => window.removeEventListener("app:data-refresh", handleRefresh);
  }, [fetchSessions]);

  const grouped = useMemo(() => {
    const now = new Date();
    return {
      upcoming: sessions.filter(
        (item) =>
          ["pending", "accepted", "rescheduled"].includes(item.status) &&
          new Date(item.scheduledFor) >= new Date(now.getTime() - 5 * 60 * 1000)
      ),
      pending: sessions.filter((item) => ["pending", "rescheduled"].includes(item.status)),
      history: sessions.filter((item) => ["completed", "cancelled", "rejected"].includes(item.status)),
    };
  }, [sessions]);

  const activeSessions = grouped[tab] || [];

  const handleRespond = async (session, status) => {
    try {
      const res = await API.put(`/api/sessions/${session._id}/respond`, { status });
      showToast(res.data.message || `Session ${status}`, "success");
      fetchSessions();
      window.dispatchEvent(new Event("app:data-refresh"));
    } catch (error) {
      showToast(error.response?.data?.message || "Session update failed", "error");
    }
  };

  const handleCancel = async (session) => {
    const reason = window.prompt("Optional cancel reason", "") || "";

    try {
      const res = await API.put(`/api/sessions/${session._id}/cancel`, { reason });
      showToast(res.data.message || "Session cancelled", "success");
      fetchSessions();
      window.dispatchEvent(new Event("app:data-refresh"));
    } catch (error) {
      showToast(error.response?.data?.message || "Cancel failed", "error");
    }
  };

  const handleComplete = async (session) => {
    try {
      const res = await API.put(`/api/sessions/${session._id}/complete`);
      showToast(res.data.message || "Session completed", "success");
      fetchSessions();
      window.dispatchEvent(new Event("app:data-refresh"));
    } catch (error) {
      showToast(error.response?.data?.message || "Complete action failed", "error");
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } }
  };

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="chat-shell">
        <div className="page-hero">
          <div className="page-title-row">
            <p className="eyebrow-text">Learning workflow</p>
            <h2 className="page-title">Sessions</h2>
            <p className="page-subtitle">
              Organize real learning time after a request is accepted. Track proposals, reschedules, and completed sessions here.
            </p>
          </div>
        </div>

        <div className="card-surface" style={{ padding: 22 }}>
          <div className="request-tabs-row">
            <button className={tab === "upcoming" ? "active" : ""} onClick={() => setTab("upcoming")}>
              Upcoming {grouped.upcoming.length > 0 ? `(${grouped.upcoming.length})` : ""}
            </button>
            <button className={tab === "pending" ? "active" : ""} onClick={() => setTab("pending")}>
              Pending {grouped.pending.length > 0 ? `(${grouped.pending.length})` : ""}
            </button>
            <button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}>
              History {grouped.history.length > 0 ? `(${grouped.history.length})` : ""}
            </button>
          </div>

          {loading ? (
            <div className="notification-grid">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="card-surface request-card">
                  <Skeleton height={22} width="35%" />
                  <Skeleton height={18} width="55%" style={{ marginTop: 12 }} />
                  <Skeleton height={110} style={{ marginTop: 16 }} />
                </div>
              ))}
            </div>
          ) : activeSessions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🗓️</div>
              <h3>No sessions in this view</h3>
              <p>
                Open an accepted request or a chat and click <strong>Book session</strong> to create your first session.
              </p>
            </div>
          ) : (
            <div className="notification-grid">
              {activeSessions.map((session) => (
                <SessionCard
                  key={session._id}
                  session={session}
                  currentUserId={currentUser?._id}
                  onRespond={handleRespond}
                  onReschedule={setRescheduleTarget}
                  onCancel={handleCancel}
                  onComplete={handleComplete}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <SessionForm
        open={Boolean(rescheduleTarget)}
        onClose={() => setRescheduleTarget(null)}
        onSuccess={() => {
          setRescheduleTarget(null);
          fetchSessions();
          window.dispatchEvent(new Event("app:data-refresh"));
        }}
        session={rescheduleTarget}
        mode="reschedule"
        requestSkill={rescheduleTarget?.skill || ""}
        requestUserName={
          String(rescheduleTarget?.userA?._id || rescheduleTarget?.userA) === String(currentUser?._id)
            ? rescheduleTarget?.userB?.name || "Connection"
            : rescheduleTarget?.userA?.name || "Connection"
        }
      />
    </motion.div>
  );
}

export default Sessions;
