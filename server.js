import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import path from "path";

import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import Chat from "./src/models/chat.model.js";
import Notification from "./src/models/notification.model.js";
import Request from "./src/models/request.model.js";
import User from "./src/models/user.model.js";
import { extractTokenFromHeader, verifyToken } from "./src/middlewares/auth.middleware.js";

await connectDB();

const server = http.createServer(app);

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    allowedHeaders: ["Authorization"],
  },
});

app.set("io", io);

const onlineUsers = new Map();

const addOnlineUser = (userId, socketId) => {
  const id = String(userId);

  if (!onlineUsers.has(id)) {
    onlineUsers.set(id, new Set());
  }

  onlineUsers.get(id).add(socketId);
};

const removeOnlineUser = (userId, socketId) => {
  const id = String(userId);

  if (!onlineUsers.has(id)) return false;

  const sockets = onlineUsers.get(id);
  sockets.delete(socketId);

  if (sockets.size === 0) {
    onlineUsers.delete(id);
    return true;
  }

  return false;
};

const getOnlineUserIds = () => Array.from(onlineUsers.keys());
const emitOnlineUsers = () => io.emit("onlineUsers", getOnlineUserIds());

const buildMessageNotificationText = (senderName, count) => {
  if (count > 1) {
    return `${senderName || "Someone"} sent you ${count} messages`;
  }

  return `${senderName || "Someone"} sent you a message`;
};

io.use((socket, next) => {
  try {
    const authToken = socket.handshake.auth?.token;
    const headerToken = extractTokenFromHeader(socket.handshake.headers?.authorization);
    const token = authToken || headerToken;

    if (!token) {
      return next(new Error("No token provided"));
    }

    const decoded = verifyToken(token);
    socket.user = decoded;
    return next();
  } catch (error) {
    return next(new Error("Unauthorized socket connection"));
  }
});

io.on("connection", async (socket) => {
  const userId = String(socket.user.id);

  socket.join(userId);
  addOnlineUser(userId, socket.id);
  emitOnlineUsers();

  try {
    await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
  } catch (error) {
    console.log("Presence update error:", error.message);
  }

  socket.on("sendMessage", async (data) => {
    try {
      const { receiver, message } = data;
      const sender = socket.user.id;
      const trimmedMessage = message?.trim();

      if (!receiver || !trimmedMessage) {
        return socket.emit("messageError", {
          message: "receiver and message are required",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(receiver)) {
        return socket.emit("messageError", {
          message: "Invalid receiver id",
        });
      }

      const acceptedRequest = await Request.findOne({
        status: "accepted",
        $or: [{ sender, receiver }, { sender: receiver, receiver: sender }],
      });

      if (!acceptedRequest) {
        return socket.emit("messageError", {
          message: "Chat allowed only after request is accepted",
        });
      }

      const newChat = await Chat.create({
        sender,
        receiver,
        message: trimmedMessage,
        seen: false,
        seenAt: null,
      });

      const populatedChat = await Chat.findById(newChat._id)
        .populate("sender", "name avatar lastSeen")
        .populate("receiver", "name avatar lastSeen");

      const senderName = populatedChat.sender?.name || "Someone";

      const existingMessageNotification = await Notification.findOne({
        recipient: receiver,
        sender,
        type: "message",
        read: false,
      }).sort({ updatedAt: -1, createdAt: -1 });

      if (existingMessageNotification) {
        const nextCount = Number(existingMessageNotification.messageCount || 1) + 1;

        existingMessageNotification.title = "New messages";
        existingMessageNotification.messageCount = nextCount;
        existingMessageNotification.message = buildMessageNotificationText(senderName, nextCount);
        existingMessageNotification.latestMessagePreview = trimmedMessage;
        existingMessageNotification.relatedUser = sender;
        await existingMessageNotification.save();
      } else {
        await Notification.create({
          recipient: receiver,
          sender,
          type: "message",
          title: "New message",
          message: buildMessageNotificationText(senderName, 1),
          messageCount: 1,
          latestMessagePreview: trimmedMessage,
          relatedUser: sender,
        });
      }

      io.to(String(receiver)).emit("receiveMessage", populatedChat);
      socket.emit("receiveMessage", populatedChat);
      io.to(String(receiver)).emit("unreadUpdated");
      io.to(String(sender)).emit("unreadUpdated");
      io.to(String(receiver)).emit("notificationUpdated");
    } catch (error) {
      console.log("Chat Error:", error.message);
      socket.emit("messageError", { message: error.message });
    }
  });

  socket.on("typing", ({ receiver }) => {
    const sender = String(socket.user.id);
    if (!receiver || !mongoose.Types.ObjectId.isValid(receiver)) return;
    io.to(String(receiver)).emit("typing", { senderId: sender });
  });

  socket.on("stopTyping", ({ receiver }) => {
    const sender = String(socket.user.id);
    if (!receiver || !mongoose.Types.ObjectId.isValid(receiver)) return;
    io.to(String(receiver)).emit("stopTyping", { senderId: sender });
  });

  socket.on("markRead", async ({ senderId }) => {
    try {
      const receiverId = socket.user.id;
      const seenAt = new Date();

      const result = await Chat.updateMany(
        {
          sender: senderId,
          receiver: receiverId,
          seen: false,
        },
        {
          $set: { seen: true, seenAt },
        }
      );

      await Notification.updateMany(
        {
          recipient: receiverId,
          sender: senderId,
          type: "message",
          read: false,
        },
        {
          $set: {
            read: true,
            messageCount: 1,
          },
        }
      );

      io.to(String(senderId)).emit("unreadUpdated");
      io.to(String(receiverId)).emit("unreadUpdated");
      io.to(String(receiverId)).emit("notificationUpdated");

      if (result.modifiedCount > 0) {
        io.to(String(senderId)).emit("messagesSeen", {
          readerId: String(receiverId),
          conversationUserId: String(senderId),
          seenAt,
        });
      }
    } catch (error) {
      console.log("Mark read error:", error.message);
    }
  });

  socket.on("call-user", ({ targetUserId, offer, callerName }) => {
    io.to(String(targetUserId)).emit("incoming-call", {
      callerId: String(socket.user.id),
      callerName,
      offer,
    });
  });

  socket.on("answer-call", ({ callerId, answer }) => {
    io.to(String(callerId)).emit("call-answered", {
      answer,
    });
  });

  socket.on("ice-candidate", ({ targetUserId, candidate }) => {
    io.to(String(targetUserId)).emit("ice-candidate", {
      candidate,
    });
  });

  socket.on("end-call", ({ targetUserId }) => {
    io.to(String(targetUserId)).emit("call-ended");
  });

  socket.on("disconnect", async () => {
    const removedCompletely = removeOnlineUser(userId, socket.id);

    if (removedCompletely) {
      const lastSeen = new Date();

      try {
        await User.findByIdAndUpdate(userId, { lastSeen });
      } catch (error) {
        console.log("Last seen update error:", error.message);
      }

      io.emit("lastSeenUpdated", { userId, lastSeen });
    }

    emitOnlineUsers();
  });
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});