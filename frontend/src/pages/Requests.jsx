import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";

function Requests() {
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");

  const fetchRequests = async () => {
    try {
      const res = await API.get("/api/requests/my-requests");
      setRequests(res.data.requests || []);
    } catch (error) {
      console.log(error.response?.data || error.message);
      setMessage("Failed to load requests");
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleResponse = async (requestId, status) => {
    try {
      const res = await API.put("/api/requests/respond", {
        requestId,
        status,
      });

      setMessage(res.data.message || `Request ${status}`);
      fetchRequests();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to update request"
      );
    }
  };

  return (
    <div style={styles.container}>
      <h2>Incoming Requests</h2>

      {message && <p>{message}</p>}

      {requests.length === 0 ? (
        <p>No requests found</p>
      ) : (
        requests.map((req) => (
          <div key={req._id} style={styles.card}>
            <p><strong>Sender:</strong> {req.sender?.name}</p>
            <p><strong>Email:</strong> {req.sender?.email}</p>
            <p><strong>Skill:</strong> {req.skill || "Not specified"}</p>
            <p><strong>Status:</strong> {req.status}</p>

            {req.status === "pending" && (
              <div style={styles.row}>
                <button
                  onClick={() => handleResponse(req._id, "accepted")}
                  style={styles.button}
                >
                  Accept
                </button>

                <button
                  onClick={() => handleResponse(req._id, "rejected")}
                  style={styles.button}
                >
                  Reject
                </button>
              </div>
            )}

            {req.status === "accepted" && (
              <div style={styles.row}>
                <Link to={`/chat/${req.sender?._id}`} style={styles.linkButton}>
                  Open Chat
                </Link>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "900px",
    margin: "20px auto",
    padding: "0 16px",
  },
  card: {
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px",
    background: "#fff",
  },
  row: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  },
  button: {
    padding: "10px 14px",
    cursor: "pointer",
  },
  linkButton: {
    textDecoration: "none",
    color: "black",
    border: "1px solid #999",
    padding: "10px 14px",
    display: "inline-block",
  },
};

export default Requests;