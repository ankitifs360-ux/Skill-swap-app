import { useEffect, useState } from "react";
import API from "../api/axios";
import "./Home.css";

function Home() {
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");
  const [searchSkill, setSearchSkill] = useState("");
  const [users, setUsers] = useState([]);
  const [searchMessage, setSearchMessage] = useState("");

  const [skillsToTeach, setSkillsToTeach] = useState("");
  const [skillsToLearn, setSkillsToLearn] = useState("");

  // FETCH PROFILE
  const fetchProfile = async () => {
    try {
      const res = await API.get("/api/users/profile");

      const userData = res.data.user || res.data;

      setProfile(userData);

      setSkillsToTeach((userData.skillsToTeach || []).join(", "));
      setSkillsToLearn((userData.skillsToLearn || []).join(", "));

      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.log(error.response?.data || error.message);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) fetchProfile();
  }, []);

  // UPDATE PROFILE
  const handleUpdateProfile = async () => {
    setMessage("");

    try {
      const res = await API.put("/api/users/profile", {
        skillsToTeach: skillsToTeach
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        skillsToLearn: skillsToLearn
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });

      const updatedUser = res.data.user || res.data;

      setMessage("Profile updated successfully ✅");
      setProfile(updatedUser);

      setSkillsToTeach((updatedUser.skillsToTeach || []).join(", "));
      setSkillsToLearn((updatedUser.skillsToLearn || []).join(", "));

      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Profile update failed ❌"
      );
    }
  };

  // SEARCH USERS
  const handleSearch = async () => {
    const skill = searchSkill.trim();

    if (!skill) {
      setUsers([]);
      setSearchMessage("Please enter a skill to search");
      return;
    }

    try {
      setSearchMessage("");

      const res = await API.get(
        `/api/users/search?skill=${encodeURIComponent(skill)}`
      );

      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

      const filteredUsers = (res.data.users || []).filter(
        (user) => user._id !== currentUser._id
      );

      setUsers(filteredUsers);

      if (filteredUsers.length === 0) {
        setSearchMessage("No users found");
      }
    } catch (error) {
      console.log(error.response?.data || error.message);
      setUsers([]);
      setSearchMessage("Search failed ❌");
    }
  };

  // SEND REQUEST
  const handleSendRequest = async (receiverId) => {
    try {
      const res = await API.post("/api/requests/send", {
        receiverId,
        skill: searchSkill.trim(),
      });

      alert(res.data.message || "Request sent ✅");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Request failed ❌"
      );
    }
  };

  return (
    <div className="home-wrapper">
      <h2 className="page-title">Home</h2>

      {/* PROFILE */}
      {profile && (
        <div className="card">
          <h3>My Profile</h3>

          <div className="profile-grid">
            <p><strong>Name:</strong> {profile.name}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p>
              <strong>Skills To Teach:</strong>{" "}
              {profile.skillsToTeach?.join(", ") || "None"}
            </p>
            <p>
              <strong>Skills To Learn:</strong>{" "}
              {profile.skillsToLearn?.join(", ") || "None"}
            </p>
            <p><strong>Reputation:</strong> {profile.reputation ?? 0}</p>
          </div>
        </div>
      )}

      {/* UPDATE */}
      <div className="card">
        <h3>Update Profile</h3>

        <div className="form-row">
          <input
            placeholder="Skills to teach (comma separated)"
            value={skillsToTeach}
            onChange={(e) => setSkillsToTeach(e.target.value)}
          />

          <input
            placeholder="Skills to learn (comma separated)"
            value={skillsToLearn}
            onChange={(e) => setSkillsToLearn(e.target.value)}
          />

          <button onClick={handleUpdateProfile}>Update</button>
        </div>

        {message && <p className="message">{message}</p>}
      </div>

      {/* SEARCH */}
      <div className="card">
        <h3>Search Users By Skill</h3>

        <div className="form-row">
          <input
            placeholder="Enter skill"
            value={searchSkill}
            onChange={(e) => {
              setSearchSkill(e.target.value);

              if (e.target.value.trim() === "") {
                setUsers([]);
                setSearchMessage("");
              }
            }}
          />

          <button onClick={handleSearch} disabled={!searchSkill.trim()}>
            Search
          </button>
        </div>

        {searchMessage && <p className="message">{searchMessage}</p>}

        {users.length > 0 && (
          <div className="user-list">
            {users.map((user) => (
              <div key={user._id} className="user-card">
                <div>
                  <strong>{user.name}</strong> <br />
                  Teach: {user.skillsToTeach?.join(", ") || "None"} <br />
                  Learn: {user.skillsToLearn?.join(", ") || "None"} <br />
                  Reputation: {user.reputation ?? 0}
                </div>

                <button onClick={() => handleSendRequest(user._id)}>
                  Request
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;