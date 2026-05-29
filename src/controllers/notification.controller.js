import Notification from "../models/notification.model.js";

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate("sender", "name avatar")
      .populate("relatedUser", "name avatar reputation")
      .populate("relatedSession", "skill topic status scheduledFor mode durationMinutes")
      .sort({ updatedAt: -1, createdAt: -1 });

    return res.json({ notifications });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getUnreadNotificationCount = async (req, res) => {
  try {
    const [nonMessageUnreadCount, unreadMessageSenders] = await Promise.all([
      Notification.countDocuments({
        recipient: req.user.id,
        read: false,
        type: { $ne: "message" },
      }),
      Notification.distinct("sender", {
        recipient: req.user.id,
        read: false,
        type: "message",
      }),
    ]);

    const unreadCount = nonMessageUnreadCount + unreadMessageSenders.filter(Boolean).length;

    return res.json({ unreadCount });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { $set: { read: true } }
    );

    return res.json({ message: "Notifications marked as read" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};