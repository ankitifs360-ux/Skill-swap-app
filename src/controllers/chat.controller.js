import mongoose from "mongoose";
import Chat from "../models/chat.model.js";
import Request from "../models/request.model.js";

export const getChat = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const acceptedRequest = await Request.findOne({
      status: "accepted",
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id },
      ],
    });

    if (!acceptedRequest) {
      return res.status(403).json({
        message: "Chat allowed only after request is accepted",
      });
    }

    const chats = await Chat.find({
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id },
      ],
    })
      .populate("sender", "name email avatar lastSeen")
      .populate("receiver", "name email avatar lastSeen")
      .sort({ createdAt: 1 });

    return res.json(chats);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getChatList = async (req, res) => {
  try {
    const userId = req.user.id;

    const chats = await Chat.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate("sender", "name avatar lastSeen reputation skillsToTeach skillsToLearn email createdAt")
      .populate("receiver", "name avatar lastSeen reputation skillsToTeach skillsToLearn email createdAt")
      .sort({ createdAt: -1 });

    const unreadRows = await Chat.aggregate([
      {
        $match: {
          receiver: new mongoose.Types.ObjectId(userId),
          seen: false,
        },
      },
      {
        $group: {
          _id: "$sender",
          count: { $sum: 1 },
        },
      },
    ]);

    const unreadMap = unreadRows.reduce((acc, row) => {
      acc[row._id.toString()] = row.count;
      return acc;
    }, {});

    const map = new Map();

    chats.forEach((chat) => {
      const isCurrentUserSender = chat.sender._id.toString() === userId;
      const otherUser = isCurrentUserSender ? chat.receiver : chat.sender;
      const otherUserId = otherUser._id.toString();

      if (!map.has(otherUserId)) {
        map.set(otherUserId, {
          user: otherUser,
          lastMessage: chat.message,
          time: chat.createdAt,
          unreadCount: unreadMap[otherUserId] || 0,
          lastMessageIsMine: isCurrentUserSender,
          lastMessageSeen: chat.seen,
        });
      }
    });

    return res.json([...map.values()]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUnreadChatCount = async (req, res) => {
  try {
    const unreadCount = await Chat.countDocuments({
      receiver: req.user.id,
      seen: false,
    });

    return res.json({ unreadCount });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const markConversationRead = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const seenAt = new Date();

    const updateResult = await Chat.updateMany(
      {
        sender: userId,
        receiver: req.user.id,
        seen: false,
      },
      { $set: { seen: true, seenAt } }
    );

    const io = req.app.get("io");
    if (updateResult.modifiedCount > 0 && io) {
      io.to(String(userId)).emit("unreadUpdated");
      io.to(String(req.user.id)).emit("unreadUpdated");
      io.to(String(userId)).emit("messagesSeen", {
        readerId: String(req.user.id),
        conversationUserId: String(userId),
        seenAt,
      });
    }

    return res.json({ message: "Conversation marked as read" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};