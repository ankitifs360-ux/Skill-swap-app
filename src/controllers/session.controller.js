import mongoose from "mongoose";
import Notification from "../models/notification.model.js";
import Request from "../models/request.model.js";
import Session from "../models/session.model.js";
import User from "../models/user.model.js";
import { sendSessionNotificationEmail } from "../utils/emailService.js";

const SESSION_MODES = ["chat", "video", "audio", "in_person"];
const RESPONSE_STATUSES = ["accepted", "rejected"];
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const getRequestUsers = (request) => {
  const senderId = request.sender?._id?.toString?.() || request.sender?.toString?.() || String(request.sender);
  const receiverId =
    request.receiver?._id?.toString?.() || request.receiver?.toString?.() || String(request.receiver);

  return { senderId, receiverId };
};

const getOtherParticipantId = (session, currentUserId) => {
  const userAId = session.userA?._id?.toString?.() || session.userA?.toString?.() || String(session.userA);
  const userBId = session.userB?._id?.toString?.() || session.userB?.toString?.() || String(session.userB);
  return userAId === String(currentUserId) ? userBId : userAId;
};

const getParticipantIds = (session) => {
  const userAId = session.userA?._id?.toString?.() || session.userA?.toString?.() || String(session.userA);
  const userBId = session.userB?._id?.toString?.() || session.userB?.toString?.() || String(session.userB);
  return [userAId, userBId];
};

const validateSessionInput = ({ scheduledFor, durationMinutes, mode }) => {
  const sessionDate = new Date(scheduledFor);
  if (Number.isNaN(sessionDate.getTime())) {
    return { error: "Invalid scheduledFor date" };
  }

  if (sessionDate <= new Date()) {
    return { error: "Session time must be in the future" };
  }

  const duration = Number(durationMinutes);
  if (Number.isNaN(duration) || duration < 15 || duration > 240) {
    return { error: "durationMinutes must be between 15 and 240" };
  }

  if (mode && !SESSION_MODES.includes(mode)) {
    return { error: "Invalid session mode" };
  }

  return {
    sessionDate,
    duration,
    normalizedMode: SESSION_MODES.includes(mode) ? mode : "chat",
  };
};

const buildSessionPayload = ({
  request,
  currentUserId,
  topic,
  description,
  mode,
  scheduledFor,
  durationMinutes,
  meetingLink,
  location,
}) => {
  const validation = validateSessionInput({ scheduledFor, durationMinutes, mode });
  if (validation.error) return validation;

  const { senderId, receiverId } = getRequestUsers(request);

  return {
    request: request._id,
    proposedBy: currentUserId,
    userA: senderId,
    userB: receiverId,
    skill: request.skill || "General skill session",
    topic: topic?.trim() || "",
    description: description?.trim() || "",
    mode: validation.normalizedMode,
    scheduledFor: validation.sessionDate,
    durationMinutes: validation.duration,
    meetingLink: meetingLink?.trim() || "",
    location: location?.trim() || "",
  };
};

const createSessionNotification = async ({
  io,
  recipient,
  sender,
  type,
  title,
  message,
  relatedRequest,
  relatedSession,
}) => {
  await Notification.create({
    recipient,
    sender,
    type,
    title,
    message,
    relatedUser: sender,
    relatedRequest,
    relatedSession,
  });

  io?.to(String(recipient)).emit("notificationUpdated");
};

const resolveAcceptedRequest = async ({ requestId, partnerId, currentUserId }) => {
  if (requestId) {
    if (!isValidObjectId(requestId)) {
      return { error: "Invalid requestId", status: 400 };
    }

    const request = await Request.findById(requestId).populate("sender", "name").populate("receiver", "name");

    if (!request) {
      return { error: "Request not found", status: 404 };
    }

    const { senderId, receiverId } = getRequestUsers(request);
    if (![senderId, receiverId].includes(String(currentUserId))) {
      return { error: "Not authorized for this request", status: 403 };
    }

    if (request.status !== "accepted") {
      return { error: "Session can only be created for accepted requests", status: 400 };
    }

    return { request };
  }

  if (!partnerId) {
    return { error: "requestId or partnerId is required", status: 400 };
  }

  if (!isValidObjectId(partnerId)) {
    return { error: "Invalid partnerId", status: 400 };
  }

  const request = await Request.findOne({
    status: "accepted",
    $or: [
      { sender: currentUserId, receiver: partnerId },
      { sender: partnerId, receiver: currentUserId },
    ],
  })
    .sort({ updatedAt: -1, createdAt: -1 })
    .populate("sender", "name")
    .populate("receiver", "name");

  if (!request) {
    return { error: "No accepted request found with this user", status: 404 };
  }

  return { request };
};

export const createSession = async (req, res) => {
  try {
    const io = req.app.get("io");
    const currentUserId = req.user.id;
    const {
      requestId,
      partnerId,
      topic,
      description,
      mode,
      scheduledFor,
      durationMinutes,
      meetingLink,
      location,
    } = req.body;

    if (!scheduledFor || !durationMinutes) {
      return res.status(400).json({
        message: "scheduledFor and durationMinutes are required",
      });
    }

    const requestResult = await resolveAcceptedRequest({ requestId, partnerId, currentUserId });
    if (requestResult.error) {
      return res.status(requestResult.status).json({ message: requestResult.error });
    }

    const request = requestResult.request;
    const payload = buildSessionPayload({
      request,
      currentUserId,
      topic,
      description,
      mode,
      scheduledFor,
      durationMinutes,
      meetingLink,
      location,
    });

    if (payload.error) {
      return res.status(400).json({ message: payload.error });
    }

    const session = await Session.create({
      ...payload,
      status: "pending",
    });

    const { senderId, receiverId } = getRequestUsers(request);
    const otherUserId = String(currentUserId) === senderId ? receiverId : senderId;
    const proposerName = String(currentUserId) === senderId ? request.sender.name : request.receiver.name;

    await createSessionNotification({
      io,
      recipient: otherUserId,
      sender: currentUserId,
      type: "session_created",
      title: "New session proposal",
      message: `${proposerName} proposed a session${request.skill ? ` for ${request.skill}` : ""}`,
      relatedRequest: request._id,
      relatedSession: session._id,
    });

    // Fire-and-forget: send email notification to the other participant
    User.findById(otherUserId)
      .select("name email")
      .then((otherUser) => {
        if (otherUser?.email) {
          sendSessionNotificationEmail({
            recipientEmail: otherUser.email,
            recipientName: otherUser.name,
            proposerName,
            skill: request.skill || "General",
            scheduledFor: payload.scheduledFor,
            mode: payload.mode,
            durationMinutes: payload.durationMinutes,
          });
        }
      })
      .catch((err) => console.error("Session email error:", err.message));

    return res.status(201).json({
      message: "Session proposed successfully",
      session,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getMySessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, scope } = req.query;

    const filter = {
      $or: [{ userA: userId }, { userB: userId }],
    };

    if (status) {
      filter.status = status;
    }

    if (scope === "upcoming") {
      filter.status = { $in: ["pending", "accepted", "rescheduled"] };
      filter.scheduledFor = { $gte: new Date(Date.now() - 5 * 60 * 1000) };
    }

    if (scope === "history") {
      filter.status = { $in: ["completed", "cancelled", "rejected"] };
    }

    if (scope === "pending") {
      filter.status = { $in: ["pending", "rescheduled"] };
    }

    const sessions = await Session.find(filter)
      .populate("request", "skill status sender receiver")
      .populate("proposedBy", "name avatar")
      .populate("userA", "name avatar reputation")
      .populate("userB", "name avatar reputation")
      .populate("cancelledBy", "name")
      .sort({ scheduledFor: 1, createdAt: -1 });

    return res.json({ sessions });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getSessionById = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!isValidObjectId(sessionId)) {
      return res.status(400).json({ message: "Invalid sessionId" });
    }

    const session = await Session.findById(sessionId)
      .populate("request", "skill status sender receiver")
      .populate("proposedBy", "name avatar")
      .populate("userA", "name avatar reputation")
      .populate("userB", "name avatar reputation")
      .populate("cancelledBy", "name");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const participantIds = getParticipantIds(session);
    if (!participantIds.includes(String(req.user.id))) {
      return res.status(403).json({ message: "Not authorized" });
    }

    return res.json({ session });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const respondToSession = async (req, res) => {
  try {
    const io = req.app.get("io");
    const currentUserId = req.user.id;
    const { sessionId } = req.params;
    const { status } = req.body;

    if (!isValidObjectId(sessionId)) {
      return res.status(400).json({ message: "Invalid sessionId" });
    }

    if (!RESPONSE_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Status must be accepted or rejected" });
    }

    const session = await Session.findById(sessionId)
      .populate("proposedBy", "name")
      .populate("userA", "name")
      .populate("userB", "name")
      .populate("request", "skill");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const participantIds = getParticipantIds(session);
    if (!participantIds.includes(String(currentUserId))) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!["pending", "rescheduled"].includes(session.status)) {
      return res.status(400).json({ message: "Only pending or rescheduled sessions can be answered" });
    }

    const proposerId = session.proposedBy?._id?.toString?.() || String(session.proposedBy);
    if (proposerId === String(currentUserId)) {
      return res.status(400).json({ message: "You cannot respond to your own proposal" });
    }

    session.status = status === "accepted" ? "accepted" : "rejected";
    await session.save();

    const responderName =
      participantIds[0] === String(currentUserId) ? session.userA?.name || "Someone" : session.userB?.name || "Someone";

    await createSessionNotification({
      io,
      recipient: proposerId,
      sender: currentUserId,
      type: status === "accepted" ? "session_accepted" : "session_rejected",
      title: status === "accepted" ? "Session accepted" : "Session rejected",
      message: `${responderName} ${status} your session${session.request?.skill ? ` for ${session.request.skill}` : ""}`,
      relatedRequest: session.request?._id || null,
      relatedSession: session._id,
    });

    return res.json({
      message: `Session ${status}`,
      session,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const rescheduleSession = async (req, res) => {
  try {
    const io = req.app.get("io");
    const currentUserId = req.user.id;
    const { sessionId } = req.params;
    const { topic, description, mode, scheduledFor, durationMinutes, meetingLink, location } = req.body;

    if (!isValidObjectId(sessionId)) {
      return res.status(400).json({ message: "Invalid sessionId" });
    }

    const session = await Session.findById(sessionId)
      .populate("request", "skill")
      .populate("userA", "name")
      .populate("userB", "name");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const participantIds = getParticipantIds(session);
    if (!participantIds.includes(String(currentUserId))) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!["pending", "accepted", "rescheduled"].includes(session.status)) {
      return res.status(400).json({ message: "This session cannot be rescheduled" });
    }

    const validation = validateSessionInput({ scheduledFor, durationMinutes, mode });
    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    session.topic = typeof topic === "string" ? topic.trim() : session.topic;
    session.description = typeof description === "string" ? description.trim() : session.description;
    session.mode = validation.normalizedMode;
    session.scheduledFor = validation.sessionDate;
    session.durationMinutes = validation.duration;
    session.meetingLink = typeof meetingLink === "string" ? meetingLink.trim() : session.meetingLink;
    session.location = typeof location === "string" ? location.trim() : session.location;
    session.status = "rescheduled";
    session.proposedBy = currentUserId;
    session.cancelledBy = null;
    session.cancelReason = "";
    await session.save();

    const otherUserId = getOtherParticipantId(session, currentUserId);
    const proposerName =
      participantIds[0] === String(currentUserId) ? session.userA?.name || "Someone" : session.userB?.name || "Someone";

    await createSessionNotification({
      io,
      recipient: otherUserId,
      sender: currentUserId,
      type: "session_rescheduled",
      title: "Session rescheduled",
      message: `${proposerName} proposed a new time${session.request?.skill ? ` for ${session.request.skill}` : ""}`,
      relatedRequest: session.request?._id || null,
      relatedSession: session._id,
    });

    return res.json({
      message: "Session rescheduled successfully",
      session,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const cancelSession = async (req, res) => {
  try {
    const io = req.app.get("io");
    const currentUserId = req.user.id;
    const { sessionId } = req.params;
    const { reason } = req.body;

    if (!isValidObjectId(sessionId)) {
      return res.status(400).json({ message: "Invalid sessionId" });
    }

    const session = await Session.findById(sessionId)
      .populate("request", "skill")
      .populate("userA", "name")
      .populate("userB", "name");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const participantIds = getParticipantIds(session);
    if (!participantIds.includes(String(currentUserId))) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (["cancelled", "completed", "rejected"].includes(session.status)) {
      return res.status(400).json({ message: "This session is already closed" });
    }

    session.status = "cancelled";
    session.cancelledBy = currentUserId;
    session.cancelReason = typeof reason === "string" ? reason.trim() : "";
    await session.save();

    const otherUserId = getOtherParticipantId(session, currentUserId);
    const cancellerName =
      participantIds[0] === String(currentUserId) ? session.userA?.name || "Someone" : session.userB?.name || "Someone";

    await createSessionNotification({
      io,
      recipient: otherUserId,
      sender: currentUserId,
      type: "session_cancelled",
      title: "Session cancelled",
      message: `${cancellerName} cancelled the session${session.request?.skill ? ` for ${session.request.skill}` : ""}`,
      relatedRequest: session.request?._id || null,
      relatedSession: session._id,
    });

    return res.json({
      message: "Session cancelled successfully",
      session,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const completeSession = async (req, res) => {
  try {
    const io = req.app.get("io");
    const currentUserId = req.user.id;
    const { sessionId } = req.params;

    if (!isValidObjectId(sessionId)) {
      return res.status(400).json({ message: "Invalid sessionId" });
    }

    const session = await Session.findById(sessionId)
      .populate("request", "skill")
      .populate("userA", "name")
      .populate("userB", "name");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const participantIds = getParticipantIds(session);
    if (!participantIds.includes(String(currentUserId))) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (session.status !== "accepted") {
      return res.status(400).json({ message: "Only accepted sessions can be completed" });
    }

    if (session.scheduledFor > new Date()) {
      return res.status(400).json({ message: "Session cannot be completed before its scheduled time" });
    }

    session.status = "completed";
    session.completedAt = new Date();
    await session.save();

    const otherUserId = getOtherParticipantId(session, currentUserId);
    const completerName =
      participantIds[0] === String(currentUserId) ? session.userA?.name || "Someone" : session.userB?.name || "Someone";

    await createSessionNotification({
      io,
      recipient: otherUserId,
      sender: currentUserId,
      type: "session_completed",
      title: "Session completed",
      message: `${completerName} marked the session as completed${session.request?.skill ? ` for ${session.request.skill}` : ""}`,
      relatedRequest: session.request?._id || null,
      relatedSession: session._id,
    });

    return res.json({
      message: "Session marked as completed",
      session,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};