import { useEffect, useState, useCallback } from "react";
import { Search, UserPlus, MessageCircle, User } from "lucide-react";
import API from "../api/axios";
import { useToast } from "../components/useToast";
import { getImageUrl } from "../utils/getImageUrl";
import ProfileModal from "../components/ProfileModal";
import Skeleton from "../components/Skeleton";
import AISmartMatch from "../components/AISmartMatch";
import "../components/AISmartMatch.css";
import "./Browse.css";

function Browse() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = useCallback(async (query = "") => {
    try {
      setLoading(true);
      const res = await API.get(`/api/users/search?skill=${query}`);
      setUsers(res.data.users || []);
    } catch (error) {
      showToast("Failed to fetch users", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(searchQuery);
  };

  const sendRequest = async (userId, skill) => {
    try {
      await API.post("/api/requests/send", { receiverId: userId, skill });
      showToast("Request sent successfully", "success");
      fetchUsers(searchQuery);
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to send request", "error");
    }
  };

  const renderAvatar = (user) => {
    const imageUrl = getImageUrl(user?.avatar);
    if (imageUrl) {
      return <img src={imageUrl} alt={user?.name} className="user-card-avatar" />;
    }
    return (
      <div className="user-card-avatar-placeholder">
        <User size={28} />
      </div>
    );
  };

  return (
    <div className="browse-container max-w-7xl">

      {/* Page header */}
      <div className="browse-header">
        <h1 className="browse-page-title">Browse Skills</h1>
        <p className="browse-page-subtitle">Find your perfect swap partner from our community of learners and teachers.</p>
        <form className="search-bar-wrap" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search by name, username, or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn">
            <Search size={18} />
            <span>Search</span>
          </button>
        </form>
      </div>

      {/* ✨ AI Smart Match Banner */}
      <AISmartMatch />

      {/* User grid */}
      {loading ? (
        <div className="user-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card user-card-skeleton">
              <Skeleton height={60} width={60} radius="50%" />
              <Skeleton height={20} width="60%" style={{ marginTop: 16 }} />
              <Skeleton height={14} width="40%" style={{ marginTop: 8 }} />
              <Skeleton height={40} width="100%" style={{ marginTop: 24 }} />
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <h3>No users found</h3>
          <p>Try searching for a different skill or name.</p>
        </div>
      ) : (
        <div className="user-grid">
          {users.map((user) => (
            <div key={user._id} className="user-card">
              <div className="user-card-body">
                <div className="user-card-top" onClick={() => setSelectedUser(user)}>
                  {renderAvatar(user)}
                  <div className="user-card-info">
                    <h3 className="user-name">{user.name}</h3>
                    <p className="user-handle">@{user.username || user.name.toLowerCase().replace(/\s+/g, "")}</p>
                  </div>
                </div>

                <p className="user-bio-snippet">
                  {user.bio || "SkillSwap community member."}
                </p>

                <div className="user-skills-section">
                  <div className="skills-group">
                    <h4 className="skills-label teaches">Teaches</h4>
                    <div className="skills-list">
                      {(user.skillsToTeach || []).slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="skill-tag teaches">{skill}</span>
                      ))}
                      {user.skillsToTeach?.length > 3 && (
                        <span className="skill-tag-more">+{user.skillsToTeach.length - 3}</span>
                      )}
                    </div>
                  </div>

                  <div className="skills-group">
                    <h4 className="skills-label learns">Learns</h4>
                    <div className="skills-list">
                      {(user.skillsToLearn || []).slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="skill-tag learns">{skill}</span>
                      ))}
                      {user.skillsToLearn?.length > 3 && (
                        <span className="skill-tag-more">+{user.skillsToLearn.length - 3}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="user-card-actions">
                {user.relationship?.status === "none" ? (
                  <button
                    className="primary-btn-sm"
                    onClick={() => sendRequest(user._id, user.skillsToTeach?.[0] || "General Swap")}
                  >
                    <UserPlus size={16} />
                    <span>Connect</span>
                  </button>
                ) : user.relationship?.status === "accepted" ? (
                  <button
                    className="secondary-btn-sm"
                    onClick={() => window.location.href = `/chat/${user._id}`}
                  >
                    <MessageCircle size={16} />
                    <span>Message</span>
                  </button>
                ) : (
                  <button className="disabled-btn-sm" disabled>
                    <span>Request {user.relationship.status}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedUser && (
        <ProfileModal
          open={true}
          onClose={() => setSelectedUser(null)}
          user={selectedUser}
          title="User profile"
        />
      )}
    </div>
  );
}

export default Browse;