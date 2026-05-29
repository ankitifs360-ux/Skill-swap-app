import { Link } from "react-router-dom";
import { formatDateTime, formatDurationMinutes, formatSessionMode } from "../utils/formatters";
import {useState} from "react";

const statusToneMap = {
  pending: "pending",
  accepted: "accepted",
  rescheduled: "pending",
  completed: "accepted",
  cancelled: "rejected",
  rejected: "rejected",
};

function SessionCard({ session, currentUserId, onRespond, onReschedule, onCancel, onComplete }) {
  const isUserA = String(session.userA?._id || session.userA) === String(currentUserId);
  const otherUser = isUserA ? session.userB : session.userA;
  const isProposer = String(session.proposedBy?._id || session.proposedBy) === String(currentUserId);
  const canRespond = ["pending", "rescheduled"].includes(session.status) && !isProposer;
  const canReschedule = ["pending", "accepted", "rescheduled"].includes(session.status);
  const canCancel = !["completed", "cancelled", "rejected"].includes(session.status);
  const canComplete = session.status === "accepted";
  const modeLabel = formatSessionMode(session.mode);
  const [openReview,setOpenReview]=useState(false);

  return (
    <div className="card-surface" style={{ padding: 20 }}>
      <div className="request-card-top">
        <div>
          <p className="eyebrow-text" style={{ marginBottom: 6 }}>
            Session with {otherUser?.name || "Connection"}
          </p>
          <h3 style={{ margin: 0, color: "var(--text-main)" }}>{session.topic || session.skill || "Skill session"}</h3>
          <p className="section-subtitle" style={{ marginTop: 8 }}>
            {session.description?.trim() || "No extra details added for this session yet."}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className={`status-pill ${statusToneMap[session.status] || "pending"}`.trim()}>
            {session.status}
          </span>
          <span className="presence-pill">{modeLabel}</span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 10,
          marginTop: 16,
        }}
      >
        <div className="request-meta-box">
          <span>Scheduled for</span>
          <strong>{formatDateTime(session.scheduledFor)}</strong>
        </div>
        <div className="request-meta-box">
          <span>Duration</span>
          <strong>{formatDurationMinutes(session.durationMinutes)}</strong>
        </div>
        <div className="request-meta-box">
          <span>Skill</span>
          <strong>{session.skill || "General"}</strong>
        </div>
        <div className="request-meta-box">
          <span>Proposed by</span>
          <strong>{session.proposedBy?.name || "User"}</strong>
        </div>
      </div>

      {(session.meetingLink || session.location || session.cancelReason) && (
        <div
          style={{
            marginTop: 14,
            padding: 14,
            borderRadius: 14,
            border: "1px solid var(--border)",
            background: "var(--surface-soft)",
            display: "grid",
            gap: 8,
          }}
        >
          {session.meetingLink && (
            <p style={{ margin: 0, color: "var(--text-soft)", lineHeight: 1.55, wordBreak: "break-word" }}>
              <strong>Link:</strong> {session.meetingLink}
            </p>
          )}
          {session.location && (
            <p style={{ margin: 0, color: "var(--text-soft)", lineHeight: 1.55, wordBreak: "break-word" }}>
              <strong>Location:</strong> {session.location}
            </p>
          )}
          {session.cancelReason && (
            <p style={{ margin: 0, color: "var(--text-soft)", lineHeight: 1.55, wordBreak: "break-word" }}>
              <strong>Reason:</strong> {session.cancelReason}
            </p>
          )}
          {session.status === "completed" && (
            <button onClick={() => setOpenReview(true)}>
                Rate user
            </button>
            )}
        </div>
        
      )}

      <div className="request-action-row">
        <Link to={`/chat/${otherUser?._id}`} className="top-link">
          Open chat
        </Link>

        {canRespond && (
          <>
            <button className="primary-btn" onClick={() => onRespond(session, "accepted")}>
              Accept
            </button>
            <button className="ghost-btn" onClick={() => onRespond(session, "rejected")}>
              Reject
            </button>
          </>
        )}

        {canReschedule && (
          <button className="ghost-btn" onClick={() => onReschedule(session)}>
            Reschedule
          </button>
        )}

        {canCancel && (
          <button className="ghost-btn" onClick={() => onCancel(session)}>
            Cancel
          </button>
        )}

        {canComplete && (
          <button className="primary-btn" onClick={() => onComplete(session)}>
            Mark completed
          </button>
        )}
        {openReview && (
            <ReviewForm
                session={session}
                onClose={() => setOpenReview(false)}
                onSuccess={() => window.location.reload()}
            />
            )}
         </div>
    </div>
  );
}

export default SessionCard;
