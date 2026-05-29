import { useState } from "react";
import API from "../api/axios";

function ReviewForm({ session, onClose, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const submitReview = async () => {
    try {
      await API.post("/api/reviews", {
        sessionId: session._id,
        rating,
        comment,
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h3>Rate this session</h3>

        <select
          value={rating}
          onChange={(e) => setRating(e.target.value)}
        >
          {[1,2,3,4,5].map(n => (
            <option key={n} value={n}>{n} ⭐</option>
          ))}
        </select>

        <textarea
          placeholder="Write feedback..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <button onClick={submitReview}>Submit</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

export default ReviewForm;
