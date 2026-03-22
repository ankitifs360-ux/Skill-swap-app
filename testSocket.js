import { io } from "socket.io-client";

const TOKEN = "PASTE_YOUR_JWT_TOKEN_HERE";
const RECEIVER_ID = "PASTE_RECEIVER_OBJECT_ID_HERE";

console.log("Starting socket test...");

const socket = io("http://localhost:8000", {
  auth: {
    token: TOKEN
  },
  transports: ["websocket"]
});

socket.on("connect", () => {
  console.log("✅ Connected:", socket.id);

  socket.emit("sendMessage", {
    receiver: RECEIVER_ID,
    message: "Hello from secure socket test"
  });
});

socket.on("receiveMessage", (data) => {
  console.log("📩 Received:", data);
});

socket.on("messageError", (data) => {
  console.log("❌ Message Error:", data);
});

socket.on("connect_error", (err) => {
  console.log("❌ Error:", err.message);
});