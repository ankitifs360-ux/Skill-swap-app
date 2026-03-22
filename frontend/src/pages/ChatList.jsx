import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { motion } from "framer-motion";

function ChatList() {
  const [chats, setChats] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await API.get("/api/chat/list");
        setChats(res.data || []);
      } catch (error) {
        console.log(error);
      }
    };

    fetchChats();
  }, []);

  return (
    <div style={styles.container}>
      <h3>Chats</h3>

      {chats.map((chat, index) => (
        <motion.div
          key={index}
          whileHover={{ scale: 1.03, background: "#f1f5f9" }}
          style={styles.chatItem}
          onClick={() => navigate(`/chat/${chat.user._id}`)}
        >
          <strong>{chat.user.name}</strong>
          <p>{chat.lastMessage}</p>
        </motion.div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    width: "300px",
    borderRight: "1px solid #ccc",
    padding: "10px",
  },
  chatItem: {
    padding: "10px",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export default ChatList;