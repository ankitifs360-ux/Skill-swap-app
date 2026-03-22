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
import Request from "./src/models/request.model.js";
import {
  extractTokenFromHeader,
  verifyToken,
} from "./src/middlewares/auth.middleware.js";

await connectDB();

const server = http.createServer(app);

/* ================================
   STATIC FILES (AVATAR SUPPORT)
================================ */
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/* ================================
   SOCKET.IO SETUP
================================ */
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

/* ================================
   SOCKET AUTH (JWT)
================================ */
io.use((socket, next) => {
  try {
    const authToken = socket.handshake.auth?.token;
    const headerToken = extractTokenFromHeader(
      socket.handshake.headers?.authorization
    );

    const token = authToken || headerToken;

    if (!token) {
      return next(new Error("No token provided"));
    }

    const decoded = verifyToken(token);
    socket.user = decoded;

    next();
  } catch (error) {
    next(new Error("Unauthorized socket connection"));
  }
});

/* ================================
   SOCKET CONNECTION
================================ */
io.on("connection", (socket) => {
  const userId = socket.user.id;

  // Join personal room
  socket.join(userId);

  console.log("🟢 User connected:", socket.id, "user:", userId);

  /* ================================
     JOIN ROOM (OPTIONAL)
  ================================= */
  socket.on("joinRoom", (roomId) => {
    if (roomId === userId) {
      socket.join(roomId);
      console.log("User joined room:", roomId);
    }
  });

  /* ================================
     SEND MESSAGE
  ================================= */
  socket.on("sendMessage", async (data) => {
    try {
      const { receiver, message } = data;
      const sender = socket.user.id;

      if (!receiver || !message) {
        return socket.emit("messageError", {
          message: "receiver and message are required",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(receiver)) {
        return socket.emit("messageError", {
          message: "Invalid receiver id",
        });
      }

      // Check whether request is accepted
      const acceptedRequest = await Request.findOne({
        status: "accepted",
        $or: [{ sender, receiver }, { sender: receiver, receiver: sender }],
      });

      if (!acceptedRequest) {
        return socket.emit("messageError", {
          message: "Chat allowed only after request is accepted",
        });
      }

      // Create new message
      const newChat = await Chat.create({
        sender,
        receiver,
        message,
        seen: false,
      });

      // Populate for frontend
      const populatedChat = await Chat.findById(newChat._id)
        .populate("sender", "name avatar")
        .populate("receiver", "name avatar");

      // Send message to both users
      io.to(receiver).emit("receiveMessage", populatedChat);
      socket.emit("receiveMessage", populatedChat);

      // Update unread count
      io.to(receiver).emit("unreadUpdated");
      io.to(sender).emit("unreadUpdated");
    } catch (error) {
      console.log("Chat Error:", error.message);
      socket.emit("messageError", { message: error.message });
    }
  });

  /* ================================
     TYPING
  ================================= */
  socket.on("typing", ({ receiver }) => {
    const sender = socket.user.id;

    if (!receiver || !mongoose.Types.ObjectId.isValid(receiver)) return;

    io.to(receiver).emit("typing", { senderId: sender });
  });

  socket.on("stopTyping", ({ receiver }) => {
    const sender = socket.user.id;

    if (!receiver || !mongoose.Types.ObjectId.isValid(receiver)) return;

    io.to(receiver).emit("stopTyping", { senderId: sender });
  });

  /* ================================
     MARK AS READ
  ================================= */
  socket.on("markRead", async ({ senderId }) => {
    try {
      const receiverId = socket.user.id;

      await Chat.updateMany(
        {
          sender: senderId,
          receiver: receiverId,
          seen: false,
        },
        {
          $set: { seen: true },
        }
      );

      io.to(senderId).emit("unreadUpdated");
      io.to(receiverId).emit("unreadUpdated");
    } catch (error) {
      console.log("Mark read error:", error.message);
    }
  });

  /* ================================
     DISCONNECT
  ================================= */
  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

/* ================================
   SERVER START
================================ */
const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});