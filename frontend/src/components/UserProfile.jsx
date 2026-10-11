import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const UserProfile = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const fetchProfileAndStatus = async () => {
    setLoading(true);
    try {
      const [userRes, followersRes, followingRes] = await Promise.all([
        api.get(`/users/${id}`),
        api.get(`/users/${id}/followers`),
        api.get(`/users/${id}/following`)
      ]);
      
      setProfile({
        id: id,
        name: userRes.data.name,
        followers: followersRes.data,
        following: followingRes.data
      });
      setEditName(userRes.data.name);

      if (user && user.id.toString() !== id) {
        const statusRes = await api.get(`/users/${id}/is-following`);
        setIsFollowing(statusRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndStatus();
  }, [id, user]);

  const toggleFollow = async () => {
    if (!user) {
      alert("Please login to follow users");
      return;
    }
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await api.delete(`/users/${id}/follow`);
        setIsFollowing(false);
      } else {
        await api.post(`/users/${id}/follow`);
        setIsFollowing(true);
      }
      fetchProfileAndStatus();
    } catch (error) {
      console.error("Failed to toggle follow:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!editName.trim()) return;
    setSavingName(true);
    try {
      const res = await api.put(`/users/me`, { name: editName });
      setProfile({ ...profile, name: res.data.name });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert("Failed to update profile");
    } finally {
      setSavingName(false);
    }
  };

  if (loading) return <div className="dashboard-container" style={{ textAlign: 'center', marginTop: '100px' }}>Loading profile...</div>;
  if (!profile) return <div className="dashboard-container" style={{ textAlign: 'center', marginTop: '100px' }}>User not found</div>;

  const isMyProfile = user && user.id.toString() === id;

  return (
    <div className="dashboard-container animate-fade-in">
      <div className="glass-panel" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--primary)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: 'bold' }}>
          {(profile.name || 'U').charAt(0).toUpperCase()}
        </div>

        {isEditing ? (
          <div style={{ marginBottom: '20px' }}>
            <input 
              type="text" 
              className="glass-input" 
              value={editName || ''}
              onChange={(e) => setEditName(e.target.value)}
              style={{ fontSize: '24px', textAlign: 'center', width: '300px' }}
            />
            <div style={{ marginTop: '10px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={saveProfile} disabled={savingName}>{savingName ? 'Saving...' : 'Save'}</button>
              <button className="btn btn-glass" onClick={() => { setIsEditing(false); setEditName(profile.name || ''); }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
            <h2 style={{ fontSize: '32px', marginBottom: '10px' }}>{profile.name || 'Unknown User'}</h2>
            {isMyProfile && (
              <button className="btn btn-glass" onClick={() => setIsEditing(true)} style={{ padding: '5px 10px' }}>
                ✏️ Edit
              </button>
            )}
          </div>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', margin: '20px 0' }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>{profile.followers?.length || 0}</div>
            <div style={{ color: 'var(--text-muted)' }}>Followers</div>
            {profile.followers && profile.followers.length > 0 && (
              <div style={{ marginTop: '10px', fontSize: '14px', color: '#ccc' }}>
                {profile.followers.map(f => (
                  <div key={f.id} style={{ cursor: 'pointer', padding: '5px' }} onClick={() => navigate(`/user/${f.id}`)}>
                    {f.name || 'Unknown'}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--secondary)' }}>{profile.following?.length || 0}</div>
            <div style={{ color: 'var(--text-muted)' }}>Following</div>
            {profile.following && profile.following.length > 0 && (
              <div style={{ marginTop: '10px', fontSize: '14px', color: '#ccc' }}>
                {profile.following.map(f => (
                  <div key={f.id} style={{ cursor: 'pointer', padding: '5px' }} onClick={() => navigate(`/user/${f.id}`)}>
                    {f.name || 'Unknown'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {!isMyProfile && (
          <button 
            className={`btn ${isFollowing ? 'btn-glass' : 'btn-primary'}`} 
            style={{ padding: '10px 40px', fontSize: '16px', borderRadius: '30px' }}
            onClick={toggleFollow}
            disabled={followLoading}
          >
            {followLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
          </button>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
