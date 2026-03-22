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
        { sender: userId, receiver: req.user.id }
      ]
    });

    if (!acceptedRequest) {
      return res.status(403).json({
        message: "Chat allowed only after request is accepted"
      });
    }

    const chats = await Chat.find({
  $or: [
    { sender: req.user.id, receiver: userId },
    { sender: userId, receiver: req.user.id }
  ]
})
.populate("sender", "name email")
.populate("receiver", "name email")
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
      .populate("sender", "name")
      .populate("receiver", "name")
      .sort({ updatedAt: -1 });

    // remove duplicates (latest chat per user)
    const map = new Map();

    chats.forEach((chat) => {
      const otherUser =
        chat.sender._id.toString() === userId
          ? chat.receiver
          : chat.sender;

      map.set(otherUser._id.toString(), {
        user: otherUser,
        lastMessage: chat.message,
        time: chat.updatedAt,
      });
    });

    return res.json([...map.values()]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};