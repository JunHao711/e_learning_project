import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { getMediaUrl } from '../components/utils';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { username: targetUsername } = useParams();
  const isOwnProfile = !targetUsername;
  const [newStatus, setNewStatus] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ bio: '' });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // fetch profile data
  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      let usernameToFetch = targetUsername;

      // If viewing own profile, check out who "me" is first
      if (isOwnProfile) {
          const meRes = await api.get('users/me/');
          usernameToFetch = meRes.data.username;
          // Pre-fill the edit form with own bio
          setEditForm({ bio: meRes.data.bio || '' });
      }

      // Fetch the public profile data using the determined username
      const profileRes = await api.get(`users/profile/${usernameToFetch}/`);
      setProfile(profileRes.data);
    
    } catch (err) {
      setError('User not found or failed to load profile.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // trigger when url parameter (targetUsername) changes
  useEffect(() => {
    fetchProfileData();
  }, [targetUsername]);

  // handle post status
  const handlePostStatus = async (e) => {
    e.preventDefault();

    if (!newStatus.trim()) return;
    
    setIsPosting(true);

    try {
      await api.post('users/status/', { content: newStatus });
      setNewStatus('');
      // Refresh the profile data to show the new status immediately
      fetchProfileData();
    } catch (err) {
      alert('Failed to post status.');
    } finally {
      setIsPosting(false);
    }
  };

  // Handle local image selection and generate a preview URL
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Submit Profile Updates
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    // use FormData to handle both text and photo
    const submitData = new FormData();
    submitData.append('bio', editForm.bio);
    if (photoFile) {
      submitData.append('photo', photoFile);
    }

    try {
      // Use PATCH for partial updates
      await api.patch('users/me/', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Reset UI states on success
      setIsEditing(false);
      setPhotoFile(null);
      setPhotoPreview(null);
      fetchProfileData(); 
    } catch (err) {
      alert('Failed to update profile.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center animate-pulse text-indigo-600 font-bold text-xl">Loading Profile...</div>;
  
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
          <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          <div className="px-8 pb-8 relative">
            <div className="flex justify-between items-end -mt-12 mb-6">
              {/* Profile image */}
              <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-200 overflow-hidden shadow-md flex-shrink-0">
                {profile.photo ? (
                  <img src={getMediaUrl(profile.photo)} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-3xl font-bold bg-slate-100">
                    {profile.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              {/* Edit button */}
              {isOwnProfile && (
                <button 
                onClick={() => setIsEditing(true)}
                className="px-5 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                    Edit Profile
                </button>
              )}
              {!isOwnProfile && profile.id && (
                <Link 
                  to={`/inbox/${profile.id}`}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  Message {profile.username}
                </Link>
              )}
            </div>

            {/* User information */}
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                {profile.username}
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold uppercase rounded-full tracking-wider">
                  {profile.role}
                </span>
              </h1>
              <p className="text-slate-500 mt-1 font-medium">{profile.email}</p>
              
              <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 mb-2 uppercase tracking-wide">About Me</h3>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {profile.bio || "This user hasn't written a bio yet."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status side */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            Announcements & Status
          </h2>

          {/* 发布框 */}
          {isOwnProfile && (
            <form onSubmit={handlePostStatus} className="mb-8">
                <div className="relative">
                <textarea 
                    rows="3" 
                    placeholder="Share an update, announcement, or thought with your students..."
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none pr-24 transition-colors"
                    required
                ></textarea>
                <div className="absolute bottom-3 right-3">
                    <button 
                    type="submit" 
                    disabled={isPosting || !newStatus.trim()}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg disabled:bg-indigo-300 transition-colors cursor-pointer shadow-sm"
                    >
                    {isPosting ? 'Posting...' : 'Post'}
                    </button>
                </div>
                </div>
            </form>
            )}
          {/* 状态列表 */}
          <div className="space-y-6">
            {!profile.statuses || profile.statuses.length === 0 ? (
              <p className="text-center text-slate-500 py-8 italic border-t border-slate-100">No status updates yet.</p>
            ) : (
              profile.statuses.map((status) => (
                <div key={status.id} className="flex gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center flex-shrink-0">
                    {profile.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <h4 className="font-bold text-slate-900">{status.user}</h4>
                      <span className="text-xs text-slate-400">
                        {new Date(status.created).toLocaleDateString()} at {new Date(status.created).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{status.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Edit Profile</h3>
            
            <form onSubmit={handleSaveProfile} className="space-y-5">
              
              {/* avatar upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Profile Photo</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 border border-slate-300">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : profile.photo ? (
                      <img src={getMediaUrl(profile.photo)} alt="Current" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xl font-bold">
                        {profile.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors"
                  />
                </div>
              </div>

              {/* bio */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Bio (About Me)</label>
                <textarea 
                  rows="4" 
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Tell your students a bit about your experience and teaching style..."
                  className="block w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-y"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                <button 
                  type="button" 
                  onClick={() => { setIsEditing(false); setPhotoFile(null); setPhotoPreview(null); }} 
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving} 
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm disabled:bg-indigo-400 transition-colors cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}