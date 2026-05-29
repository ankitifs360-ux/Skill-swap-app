import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Star } from "lucide-react";
import API from "../api/axios";
import Skeleton from "../components/Skeleton";
import { getImageUrl } from "../utils/getImageUrl";

function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const res = await API.get("/api/users/search"); // Uses our generic user list
        // Sort explicitly by reputation
        const sorted = (res.data.users || []).sort((a, b) => (b.reputation || 0) - (a.reputation || 0)).slice(0, 50);
        setLeaders(sorted);
      } catch (err) {
        console.error("Failed to load leaders", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaders();
  }, []);

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy color="#FFD700" size={28} />; // Gold
    if (index === 1) return <Medal color="#C0C0C0" size={28} />; // Silver
    if (index === 2) return <Medal color="#CD7F32" size={28} />; // Bronze
    return <span style={{ fontWeight: "bold", fontSize: 18, color: "var(--text-soft)" }}>#{index + 1}</span>;
  };

  return (
    <div className="leaderboard-page" style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="text-center mb-12">
        <div style={{ background: '#eff6ff', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', margin: '0 auto 20px' }}>
          <Trophy size={32} />
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#111827', marginBottom: '10px' }}>Community Leaders</h1>
        <p style={{ fontSize: '18px', color: '#6b7280' }}>The most helpful mentors making an impact on SkillSwap.</p>
      </div>

      <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #f3f4f6', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        {loading ? (
          <div style={{ padding: '20px' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height={80} width="100%" radius={16} style={{ marginBottom: '12px' }} />
            ))}
          </div>
        ) : (
          <div>
            {leaders.map((user, index) => (
              <div 
                key={user._id} 
                style={{ 
                  display: "flex", alignItems: "center", gap: '20px', padding: '20px 24px',
                  background: index < 3 ? "rgba(37, 99, 235, 0.02)" : "transparent",
                  borderBottom: "1px solid #f3f4f6",
                  transition: 'background 0.2s',
                  cursor: 'pointer'
                }}
              >
                <div style={{ width: '40px', textAlign: "center", flexShrink: 0 }}>
                  {getRankIcon(index)}
                </div>
                
                <img 
                  src={getImageUrl(user.avatar) || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} 
                  alt={user.name} 
                  style={{ width: '56px', height: '56px', borderRadius: "50%", objectFit: "cover", border: '2px solid #f3f4f6' }}
                />
 
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#111827' }}>{user.name}</h4>
                  <p style={{ margin: '4px 0 0', fontSize: '14px', color: "#6b7280" }}>
                    {user.skillsToTeach?.slice(0,2).join(" • ") || "Expert Mentor"}
                  </p>
                </div>
 
                <div style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: '6px', color: "#1e40af", fontWeight: 800, fontSize: '18px' }}>
                    <Star size={18} fill="#2563eb" color="#2563eb" />
                    {user.reputation || 0}
                  </div>
                  <small style={{ color: "#9ca3af", fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
                    Reputation
                  </small>
                </div>
              </div>
            ))}
            {leaders.length === 0 && (
              <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
                <Users size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <p>No mentors found yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
