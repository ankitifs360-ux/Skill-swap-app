import { useEffect, useMemo, useState } from "react";
import { Star, Mail, Calendar, User, MessageCircle, UserPlus, CheckCircle } from "lucide-react";
import API from "../api/axios";
import Skeleton from "./Skeleton";
import { getImageUrl } from "../utils/getImageUrl";
import { formatDateTime, formatRelativeLastSeen } from "../utils/formatters";
import "./ProfileModal.css";

function ProfileModal({ open, onClose, user, isOnline = false, title = "Profile" }) {
  const [profileData, setProfileData] = useState(user || null);
  const [loading, setLoading] = useState(false);

  const isOwnProfile = useMemo(() => title === "My profile", [title]);

  useEffect(() => {
    if (!open) return undefined;
    const handleEscape = (e) => e.key === "Escape" && onClose?.();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !user?._id || isOwnProfile) {
      if (isOwnProfile) setProfileData(user);
      return;
    }

    let isMounted = true;
    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/api/users/${user._id}`);
        if (isMounted) setProfileData(res.data.user || user);
      } catch (error) {
        if (isMounted) setProfileData(user);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadProfile();
    return () => { isMounted = false; };
  }, [open, user, isOwnProfile]);

  if (!open || !user) return null;

  const profile = profileData || user;
  const avatarUrl = getImageUrl(profile.avatar);
  const privacy = profile.privacy || {};
  const showEmail = isOwnProfile || privacy.canViewEmail;
  const showLearningGoals = isOwnProfile || privacy.canViewLearningGoals;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card profile-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-close-wrapper">
          <button className="icon-btn modal-close-btn" onClick={onClose}>×</button>
        </div>

        {loading ? (
          <div className="p-8 space-y-6">
            <Skeleton height={120} width={120} radius="50%" />
            <Skeleton height={32} width="50%" />
            <Skeleton height={20} width="80%" />
            <Skeleton height={150} width="100%" />
          </div>
        ) : (
          <div className="profile-modal-body">
            {/* Header Section */}
            <div className="profile-header">
              <div className="profile-avatar-large">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={profile.name} className="avatar-img" />
                ) : (
                  <div className="avatar-placeholder"><User size={48} /></div>
                )}
              </div>

              <div className="profile-info-main">
                <h2 className="profile-name">{profile.name}</h2>
                <p className="profile-username">@{profile.name.toLowerCase().replace(/\s+/g, "")}</p>
                
                <div className="profile-action-btns">
                  {!isOwnProfile && (
                    <>
                      <button className="btn-primary-action">
                        <UserPlus size={18} />
                        <span>Send Request</span>
                      </button>
                      <button className="btn-secondary-action">
                        <MessageCircle size={18} />
                        <span>Message</span>
                      </button>
                    </>
                  )}
                  {isOwnProfile && (
                    <button className="btn-secondary-action" onClick={() => window.location.href = "/onboarding"}>
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>

              <div className="profile-stats-box">
                <div className="stat-item">
                  <span className="stat-value">{profile.reputation || 0}</span>
                  <span className="stat-label">Connections</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{profile.skillsToTeach?.length || 0}</span>
                  <span className="stat-label">Skills</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{profile.skillsToLearn?.length || 0}</span>
                  <span className="stat-label">Learning</span>
                </div>
              </div>
            </div>

            {/* About Me Section */}
            <div className="profile-section">
              <h4 className="section-title">About Me</h4>
              <p className="profile-bio">
                {profile.bio || "SkillSwap community member."}
              </p>
            </div>

            {/* Skills Grid */}
            <div className="profile-skills-grid">
              <div className="skills-box">
                <h4 className="skills-box-title teaches">Can Teach</h4>
                <div className="skills-chips">
                  {profile.skillsToTeach?.map((s, idx) => (
                    <span key={idx} className="skill-chip">{s}</span>
                  )) || <span className="muted-text">No skills listed</span>}
                </div>
              </div>
              <div className="skills-box">
                <h4 className="skills-box-title learns">Wants to Learn</h4>
                <div className="skills-chips">
                  {showLearningGoals ? (
                    profile.skillsToLearn?.map((s, idx) => (
                      <span key={idx} className="skill-chip">{s}</span>
                    ))
                  ) : (
                    <span className="muted-text">Private</span>
                  )}
                  {showLearningGoals && !profile.skillsToLearn?.length && (
                    <span className="muted-text">No goals listed</span>
                  )}
                </div>
              </div>
            </div>

            {/* Meta Info */}
            <div className="profile-meta">
              {showEmail && (
                <div className="meta-item">
                  <Mail size={16} />
                  <span>{profile.email}</span>
                </div>
              )}
              <div className="meta-item">
                <Calendar size={16} />
                <span>Joined {formatDateTime(profile.createdAt)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileModal;
