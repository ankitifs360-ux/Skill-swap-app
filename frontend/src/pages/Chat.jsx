import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../api/axios";
import { motion } from "framer-motion";

function Chat() {
  const { userId } = useParams();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [rating, setRating] = useState("");
  const [ratingMessage, setRatingMessage] = useState("");
  const [otherUser, setOtherUser] = useState(null);
  const [typing, setTyping] = useState(false);

  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const token = localStorage.getItem("token");

  const fetchChat = async () => {
    try {
      const res = await API.get(`/api/chat/${userId}`);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch {
      setStatus("Failed to load chat");
    }
  };

  useEffect(() => {
    if (!token || !userId) return;

    fetchChat();

    const fetchUser = async () => {
      try {
        const res = await API.get(`/api/users/${userId}`);
        setOtherUser(res.data.user);
      } catch (error) {
        console.log(error);
      }
    };

    fetchUser();

    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("receiveMessage", (newMessage) => {
      const senderId =
        typeof newMessage.sender === "object"
          ? newMessage.sender._id
          : newMessage.sender;

      const receiverId =
        typeof newMessage.receiver === "object"
          ? newMessage.receiver._id
          : newMessage.receiver;

      if (senderId === userId || receiverId === userId) {
        setMessages((prev) => [...prev, newMessage]);
      }
    });

    socket.on("typing", ({ senderId }) => {
      if (senderId === userId) {
        setTyping(true);
      }
    });

    socket.on("stopTyping", ({ senderId }) => {
      if (senderId === userId) {
        setTyping(false);
      }
    });

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.disconnect();
    };
  }, [token, userId]);

  const handleSend = () => {
    if (!text.trim() || !socketRef.current) return;

    socketRef.current.emit("sendMessage", {
      receiver: userId,
      message: text,
    });

    socketRef.current.emit("stopTyping", {
      receiver: userId,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setText("");
  };

  const handleRateUser = async () => {
    try {
      const res = await API.post("/api/requests/rate", {
        userId,
        rating: Number(rating),
      });

      setRatingMessage(res.data.message);
      setRating("");
    } catch {
      setRatingMessage("Rating failed");
    }
  };

  return (
    <motion.div
      style={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h2>Chat</h2>

      <div style={styles.header}>
        <div style={styles.onlineDot}></div>
        <div>
          <strong>{otherUser ? otherUser.name : "Loading..."}</strong>
          <p style={{ fontSize: "12px" }}>
            Reputation: {otherUser?.reputation ?? 0}
          </p>
        </div>
      </div>

      {status && <p style={styles.status}>{status}</p>}
      {typing && <p style={styles.typing}>Typing...</p>}

      <div style={styles.chatBox}>
        {messages.map((msg) => {
          const senderId =
            typeof msg.sender === "object"
              ? msg.sender._id
              : msg.sender;

          const isOther = senderId === userId;

          return (
            <motion.div
              key={msg._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                ...styles.message,
                alignSelf: isOther ? "flex-start" : "flex-end",
                background: isOther ? "#e2e8f0" : "#3b82f6",
                color: isOther ? "#000" : "#fff",
              }}
            >
              <p>{msg.message}</p>
              <small>
                {isOther ? msg.sender?.name || "Other" : "You"} •{" "}
                {new Date(msg.createdAt).toLocaleTimeString()}
              </small>
            </motion.div>
          );
        })}
      </div>

      <div style={styles.row}>
        <input
          value={text}
          onChange={(e) => {
            const value = e.target.value;
            setText(value);

            if (!socketRef.current) return;

            socketRef.current.emit("typing", {
              receiver: userId,
            });

            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
              socketRef.current?.emit("stopTyping", {
                receiver: userId,
              });
            }, 1000);
          }}
          placeholder="Type message"
          style={styles.input}
        />

        <button style={styles.button} onClick={handleSend}>
          Send
        </button>
      </div>

      <div style={styles.ratingBox}>
        <h3>Rate user</h3>
        <div style={styles.row}>
          <input
            type="number"
            min="1"
            max="5"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            style={styles.input}
          />
          <button style={styles.button} onClick={handleRateUser}>
            Submit
          </button>
        </div>
        {ratingMessage && <p>{ratingMessage}</p>}
      </div>
    </motion.div>
  );
}

const styles = {
  container: {
    flex: 1,
    padding: "20px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
  },
  onlineDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "green",
  },
  chatBox: {
    height: "400px",
    padding: "16px",
    borderRadius: "12px",
    background: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    overflowY: "auto",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
  },
  message: {
    padding: "12px",
    borderRadius: "12px",
    maxWidth: "70%",
  },
  row: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  },
  input: {
    flex: 1,
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  button: {
    padding: "10px 16px",
    borderRadius: "6px",
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },
  ratingBox: {
    marginTop: "20px",
  },
  status: {
    color: "red",
  },
  typing: {
    fontSize: "12px",
    color: "gray",
  },
};

export default Chat;