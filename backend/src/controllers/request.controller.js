import mongoose from "mongoose";
import Request from "../models/request.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const buildRelationshipPayload = (request, viewerId) => {
  if (!request) {
    return {
      status: "none",
      direction: null,
      requestId: null,
    };
  }

  const senderId = request.sender?.toString?.() || String(request.sender);
  const direction = senderId === String(viewerId) ? "outgoing" : "incoming";

  return {
    status: request.status,
    direction,
    requestId: request._id,
    skill: request.skill || "",
    updatedAt: request.updatedAt,
    createdAt: request.createdAt,
  };
};

export const sendRequest = async (req, res) => {
  try {
    const io = req.app.get("io");
    const sender = req.user.id;
    const { receiverId, skill } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: "receiverId is required" });
    }

    if (!isValidObjectId(receiverId)) {
      return res.status(400).json({ message: "Invalid receiverId" });
    }

    if (sender === receiverId) {
      return res.status(400).json({ message: "You cannot send a request to yourself" });
    }

    const [senderUser, receiver, latestRelationship] = await Promise.all([
      User.findById(sender),
      User.findById(receiverId),
      Request.findOne({
        $or: [
          { sender, receiver: receiverId },
          { sender: receiverId, receiver: sender },
        ],
      }).sort({ updatedAt: -1, createdAt: -1 }),
    ]);

    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    if (latestRelationship?.status === "pending") {
      const relationship = buildRelationshipPayload(latestRelationship, sender);

      return res.status(409).json({
        message:
          relationship.direction === "outgoing"
            ? "Request already sent"
            : "This user already sent you a request",
        relationship,
      });
    }

    if (latestRelationship?.status === "accepted") {
      return res.status(409).json({
        message: "You are already connected with this user",
        relationship: buildRelationshipPayload(latestRelationship, sender),
      });
    }

    const request = await Request.create({
      sender,
      receiver: receiverId,
      skill: skill?.trim() || "",
    });

    await Notification.create({
      recipient: receiverId,
      sender,
      type: "request_sent",
      title: "New skill request",
      message: `${senderUser?.name || "Someone"} sent you a skill request${
        skill?.trim() ? ` for ${skill.trim()}` : ""
      }`,
      relatedUser: sender,
      relatedRequest: request._id,
    });

    io?.to(receiverId).emit("notificationUpdated");

    return res.status(201).json({
      message: "Request sent",
      request,
      relationship: buildRelationshipPayload(request, sender),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const respondRequest = async (req, res) => {
  try {
    const io = req.app.get("io");
    const { requestId, status } = req.body;

    if (!requestId || !status) {
      return res.status(400).json({ message: "requestId and status are required" });
    }

    if (!isValidObjectId(requestId)) {
      return res.status(400).json({ message: "Invalid requestId" });
    }

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be accepted or rejected" });
    }

    const request = await Request.findById(requestId)
      .populate("sender", "name")
      .populate("receiver", "name");

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.receiver._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    request.status = status;
    await request.save();

    await Notification.create({
      recipient: request.sender._id,
      sender: request.receiver._id,
      type: status === "accepted" ? "request_accepted" : "request_rejected",
      title: status === "accepted" ? "Request accepted" : "Request rejected",
      message: `${request.receiver.name} ${status} your request${
        request.skill ? ` for ${request.skill}` : ""
      }`,
      relatedUser: request.receiver._id,
      relatedRequest: request._id,
    });

    io?.to(request.sender._id.toString()).emit("notificationUpdated");

    return res.json({
      message: `Request ${status}`,
      request,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getMyRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const type = req.query.type || "incoming";

    let filter = {};
    let populateField = "sender";

    if (type === "outgoing") {
      filter = { sender: userId };
      populateField = "receiver";
    } else {
      filter = { receiver: userId };
      populateField = "sender";
    }

    const requests = await Request.find(filter)
      .populate(populateField, "name email skillsToTeach skillsToLearn reputation avatar")
      .sort({ createdAt: -1 });

    return res.json({ requests });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getRequestCounts = async (req, res) => {
  try {
    const userId = req.user.id;

    const [incomingPending, outgoingPending, incomingTotal, outgoingTotal] = await Promise.all([
      Request.countDocuments({ receiver: userId, status: "pending" }),
      Request.countDocuments({ sender: userId, status: "pending" }),
      Request.countDocuments({ receiver: userId }),
      Request.countDocuments({ sender: userId }),
    ]);

    return res.json({
      incomingPending,
      outgoingPending,
      incomingTotal,
      outgoingTotal,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const rateUser = async (req, res) => {
  try {
    const { userId, rating } = req.body;
    const numericRating = Number(rating);

    if (!userId || Number.isNaN(numericRating)) {
      return res.status(400).json({
        message: "userId and rating required",
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        message: "Invalid userId",
      });
    }

    if (req.user.id === userId) {
      return res.status(400).json({
        message: "You cannot rate yourself",
      });
    }

    if (numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    const acceptedRequest = await Request.findOne({
      status: "accepted",
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id },
      ],
    });

    if (!acceptedRequest) {
      return res.status(400).json({
        message: "You can only rate after an accepted request",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.ratings.push(numericRating);

    const avg = user.ratings.reduce((a, b) => a + b, 0) / user.ratings.length;
    user.reputation = Number(avg.toFixed(2));

    await user.save();

    return res.json({
      message: "User rated",
      reputation: user.reputation,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};