export const formatChatListTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isSameYear = date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    ...(isSameYear ? {} : { year: "numeric" }),
  });
};

export const formatDateTime = (value) => {
  if (!value) return "";

  return new Date(value).toLocaleString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const formatMessageTime = (value) => {
  if (!value) return "";

  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

export const formatRelativeLastSeen = (value) => {
  if (!value) return "unavailable";

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) {
    return "just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return formatDateTime(value);
};

export const normalizeSkillInput = (value = "") =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const getDayLabel = (value) => {
  if (!value) return "";

  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const formatDurationMinutes = (value) => {
  const total = Number(value || 0);
  if (!total) return "";
  if (total < 60) return `${total} min`;

  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (!minutes) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
};

export const formatSessionMode = (value = "") => {
  if (value === "in_person") return "In person";
  if (!value) return "Chat";
  return value.charAt(0).toUpperCase() + value.slice(1);
};
