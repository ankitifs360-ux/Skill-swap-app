import mongoose from "mongoose";
import Request from "../models/request.model.js";
import User from "../models/user.model.js";

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const sendRequest = async (req, res) => {
  try {
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

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    const existing = await Request.findOne({
      sender,
      receiver: receiverId,
      status: "pending"
    });

    if (existing) {
      return res.status(400).json({ message: "Request already sent" });
    }

    const request = await Request.create({
      sender,
      receiver: receiverId,
      skill
    });

    return res.status(201).json({
      message: "Request sent",
      request
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const respondRequest = async (req, res) => {
  try {
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

    const request = await Request.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.receiver.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    request.status = status;
    await request.save();

    return res.json({
      message: `Request ${status}`,
      request
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getMyRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await Request.find({ receiver: userId })
      .populate("sender", "name email skillsToTeach skillsToLearn reputation")
      .sort({ createdAt: -1 });

    return res.json({ requests });
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
        message: "userId and rating required"
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        message: "Invalid userId"
      });
    }

    if (req.user.id === userId) {
      return res.status(400).json({
        message: "You cannot rate yourself"
      });
    }

    if (numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5"
      });
    }

    const acceptedRequest = await Request.findOne({
      status: "accepted",
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id }
      ]
    });

    if (!acceptedRequest) {
      return res.status(400).json({
        message: "You can only rate after an accepted request"
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    user.ratings.push(numericRating);

    const avg = user.ratings.reduce((a, b) => a + b, 0) / user.ratings.length;
    user.reputation = Number(avg.toFixed(2));

    await user.save();

    return res.json({
      message: "User rated",
      reputation: user.reputation
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
};