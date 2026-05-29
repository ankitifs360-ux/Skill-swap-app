import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import API from "../api/axios";
import ProfileModal from "../components/ProfileModal";
import SessionForm from "../components/SessionForm";
import Skeleton from "../components/Skeleton";
import { useToast } from "../components/useToast";
import { getImageUrl } from "../utils/getImageUrl";
import { formatDateTime } from "../utils/formatters";

function Requests() {
  const { showToast } = useToast();
  const [tab, setTab] = useState("incoming");
  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({ incomingPending: 0, outgoingPending: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sessionTarget, setSessionTarget] = useState(null);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await API.get("/api/requests/counts");
      setCounts(res.data || {});
    } catch (error) {
      console.log(error.response?.data || error.message);
    }
  }, []);

  const fetchRequests = useCallback(
    async (activeTab = tab) => {
      try {
        setLoading(true);
        const res = await API.get(`/api/requests/my-requests?type=${activeTab}`);
        setRequests(res.data.requests || []);
      } catch (error) {
        showToast(error.response?.data?.message || "Failed to load requests", "error");
      } finally {
        setLoading(false);
      }
    },
    [showToast, tab]
  );

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  useEffect(() => {
    fetchRequests(tab);
  }, [fetchRequests, tab]);

  const handleResponse = async (requestId, status) => {
    try {
      const res = await API.put("/api/requests/respond", {
        requestId,
        status,
      });

      showToast(res.data.message || `Request ${status}`, "success");
      fetchRequests(tab);
      fetchCounts();
      window.dispatchEvent(new Event("app:data-refresh"));
    } catch (error) {
      showToast(
        error.response?.data?.message || error.response?.data?.error || "Failed to update request",
        "error"
      );
    }
  };

  const renderAvatar = (user) => {
    const imageUrl = getImageUrl(user?.avatar);
    if (imageUrl) {
      return <img src={imageUrl} alt={user?.name} className="mini-avatar" />;
    }
    return <div className="mini-avatar-placeholder">{(user?.name || "U").slice(0, 1)}</div>;
  };

  const summaryText = useMemo(() => {
    if (tab === "incoming") {
      return `${counts.incomingPending || 0} pending request${counts.incomingPending === 1 ? "" : "s"} waiting for your response.`;
    }
    return `${counts.outgoingPending || 0} outgoing request${counts.outgoingPending === 1 ? "" : "s"} currently awaiting reply.`;
  }, [counts.incomingPending, counts.outgoingPending, tab]);

  const getRequestLine = (req, person) => {
    const skill = req.skill || "a skill exchange";

    if (tab === "incoming") {
      if (req.status === "accepted") return `${person?.name} is now connected with you for ${skill}.`;
      if (req.status === "rejected") return `You declined ${person?.name}'s request for ${skill}.`;
      return `${person?.name} wants to learn ${skill} from you.`;
    }

    if (req.status === "accepted") return `${person?.name} accepted your request for ${skill}.`;
    if (req.status === "rejected") return `${person?.name} rejected your request for ${skill}.`;
    return `Waiting for ${person?.name} to respond to your ${skill} request.`;
  };

  const getFlowLabel = (req) => {
    if (req.status === "accepted") return "Chat + session available";
    if (req.status === "rejected") return "Closed";
    return tab === "incoming" ? "Action needed" : "Awaiting reply";
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
            <p className="eyebrow-text">Collaboration</p>
            <h2 className="page-title">Requests</h2>
            <p className="page-subtitle">
              Review incoming requests, track outgoing requests, open chat after approval, and start booking skill sessions.
            </p>
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
                Request queue
              </p>
              <h3 style={{ margin: 0, color: "var(--text-main)" }}>{summaryText}</h3>
            </div>
            <span className="presence-pill">{requests.length} visible</span>
          </div>

          <div className="request-tabs-row">
            <button className={tab === "incoming" ? "active" : ""} onClick={() => setTab("incoming")}>
              Incoming {counts.incomingPending > 0 ? `(${counts.incomingPending})` : ""}
            </button>
            <button className={tab === "outgoing" ? "active" : ""} onClick={() => setTab("outgoing")}>
              Outgoing {counts.outgoingPending > 0 ? `(${counts.outgoingPending})` : ""}
            </button>
          </div>

          {loading ? (
            <div className="request-grid">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="card-surface request-card">
                  <div className="request-user-row">
                    <Skeleton height={54} width={54} radius={999} />
                    <div style={{ width: "100%" }}>
                      <Skeleton height={18} width="30%" />
                      <Skeleton height={14} width="56%" style={{ marginTop: 10 }} />
                    </div>
                  </div>
                  <Skeleton height={56} style={{ marginTop: 14 }} />
                </div>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">↔</div>
              <h3>No {tab} requests yet</h3>
              <p>
                {tab === "incoming"
                  ? "When someone wants to connect and learn from you, it will appear here."
                  : "Your outgoing requests will appear here until the other user responds."}
              </p>
            </div>
          ) : (
            <div className="request-grid">
              {requests.map((req) => {
                const person = tab === "incoming" ? req.sender : req.receiver;

                return (
                  <div
                    key={req._id}
                    className="card-surface request-card"
                    style={{
                      borderLeft: `4px solid ${
                        req.status === "accepted" ? "#22c55e" : req.status === "rejected" ? "#ef4444" : "#f59e0b"
                      }`,
                    }}
                  >
                    <div className="request-card-top">
                      <div className="request-user-row">
                        {renderAvatar(person)}
                        <div>
                          <button className="card-title-button" onClick={() => setSelectedUser(person)}>
                            {person?.name}
                          </button>
                          <p style={{ margin: "5px 0", color: "var(--text-soft)" }}>{getRequestLine(req, person)}</p>
                          <small className="muted-text">{formatDateTime(req.createdAt)}</small>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span className={`status-pill ${req.status}`.trim()}>
                          <span>{req.status === "accepted" ? "✓" : req.status === "rejected" ? "✕" : "⏳"}</span>
                          {req.status}
                        </span>
                        <span className="presence-pill">{tab === "incoming" ? "Incoming" : "Outgoing"}</span>
                      </div>
                    </div>

                    <div className="request-meta-grid">
                      <div className="request-meta-box">
                        <span>Requested skill</span>
                        <strong>{req.skill || "Not specified"}</strong>
                      </div>
                      <div className="request-meta-box">
                        <span>Reputation</span>
                        <strong>{person?.reputation ?? 0}</strong>
                      </div>
                      <div className="request-meta-box">
                        <span>Flow</span>
                        <strong>{getFlowLabel(req)}</strong>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: 14,
                        padding: 12,
                        borderRadius: 14,
                        border: "1px solid var(--border)",
                        background: "var(--surface-soft)",
                        color: "var(--text-soft)",
                        lineHeight: 1.55,
                      }}
                    >
                      {tab === "incoming"
                        ? "Accept to unlock chat. Once connected, you can also schedule a proper skill session."
                        : req.status === "pending"
                        ? "The other user can review your request and respond when ready."
                        : req.status === "accepted"
                        ? "You can now continue the conversation directly in chat or book a learning session."
                        : "This request is closed. Send another request later if needed."}
                    </div>

                    <div className="request-action-row">
                      {tab === "incoming" && req.status === "pending" && (
                        <>
                          <button className="primary-btn" onClick={() => handleResponse(req._id, "accepted")}>
                            Accept request
                          </button>
                          <button className="danger-btn" onClick={() => handleResponse(req._id, "rejected")}>
                            Reject request
                          </button>
                        </>
                      )}

                      {req.status === "accepted" && (
                        <>
                          <Link to={`/chat/${person?._id}`} className="top-link">
                            Open chat
                          </Link>
                          <button className="ghost-btn" onClick={() => setSessionTarget({ request: req, person })}>
                            Book session
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ProfileModal
        open={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        user={selectedUser}
        title="User profile"
      />

      <SessionForm
        open={Boolean(sessionTarget)}
        onClose={() => setSessionTarget(null)}
        onSuccess={() => {
          setSessionTarget(null);
          window.dispatchEvent(new Event("app:data-refresh"));
        }}
        requestId={sessionTarget?.request?._id || ""}
        requestSkill={sessionTarget?.request?.skill || ""}
        requestUserName={sessionTarget?.person?.name || "Connection"}
      />
    </motion.div>
  );
}

export default Requests;
