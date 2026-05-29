import Review from "../models/review.model.js";
import Session from "../models/session.model.js";
import User from "../models/user.model.js";

export const createReview = async (req, res) => {
  try {
    const { sessionId, rating, comment } = req.body;
    const userId = req.user.id;

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.status !== "completed") {
      return res.status(400).json({ message: "Session not completed yet" });
    }

    const isUserA = String(session.userA) === userId;
    const isUserB = String(session.userB) === userId;

    if (!isUserA && !isUserB) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const reviewee = isUserA ? session.userB : session.userA;

    // prevent duplicate review
    const existing = await Review.findOne({
      session: sessionId,
      reviewer: userId,
    });

    if (existing) {
      return res.status(400).json({ message: "Already reviewed" });
    }

    const review = await Review.create({
      session: sessionId,
      reviewer: userId,
      reviewee,
      rating,
      comment,
    });

    // update user rating
    const reviews = await Review.find({ reviewee });

    const avg =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await User.findByIdAndUpdate(reviewee, {
      reputation: avg.toFixed(1),
    });

    res.status(201).json({
      message: "Review submitted",
      review,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};