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
  
  // Status states
  const [newStatus, setNewStatus] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  
  // Edit Modal states
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'security'
  const [editForm, setEditForm] = useState({ bio: '' });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Password states
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      let usernameToFetch = targetUsername;
      if (isOwnProfile) {
          const meRes = await api.get('users/me/');
          usernameToFetch = meRes.data.username;
          setEditForm({ bio: meRes.data.bio || '' });
      }
      const profileRes = await api.get(`users/profile/${usernameToFetch}/`);
      setProfile(profileRes.data);
    } catch (err) {
      setError('User not found or failed to load profile.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [targetUsername]);

  const handlePostStatus = async (e) => {
    e.preventDefault();
    if (!newStatus.trim()) return;
    setIsPosting(true);
    try {
      await api.post('users/status/', { content: newStatus });
      setNewStatus('');
      fetchProfileData();
    } catch (err) {
      alert('Failed to post status.');
    } finally {
      setIsPosting(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const submitData = new FormData();
    submitData.append('bio', editForm.bio);
    if (photoFile) {
      submitData.append('photo', photoFile);
    }
    try {
      await api.patch('users/me/', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setIsEditing(false);
      setPhotoFile(null);
      setPhotoPreview(null);
      fetchProfileData(); 
    } catch (err) {
      alert('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwords.new !== passwords.confirm) {
      setPasswordError("New passwords don't match.");
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.put('users/me/change-password/', {
        old_password: passwords.current,
        new_password: passwords.new
      });
      setPasswordSuccess('Password successfully updated!');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.old_password) {
        setPasswordError(errorData.old_password[0]);
      } else if (errorData?.new_password) {
        setPasswordError(errorData.new_password[0]);
      } else {
        setPasswordError('Failed to change password. Please check your inputs.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center animate-pulse text-indigo-600 font-bold text-xl">Loading Profile...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
            
            {/* Avatar */}
            <div className="w-32 h-32 rounded-full border-4 border-slate-50 bg-slate-100 overflow-hidden shadow-sm mb-4">
              {profile.photo ? (
                <img src={getMediaUrl(profile.photo)} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-4xl font-bold bg-slate-100">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Basic Info */}
            <h1 className="text-2xl font-bold text-slate-900">{profile.username}</h1>
            <p className="text-slate-500 font-medium mb-3">{profile.email}</p>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold uppercase rounded-full tracking-wider mb-6">
              {profile.role}
            </span>

            {/* Actions */}
            {isOwnProfile ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="w-full py-2.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Edit Profile
              </button>
            ) : (
              <Link 
                to={`/inbox/${profile.id}`}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-colors flex justify-center items-center gap-2 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                Message
              </Link>
            )}
          </div>

          {/* Bio Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide border-b border-slate-100 pb-2">About Me</h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm">
              {profile.bio || "This user hasn't written a bio yet."}
            </p>
          </div>
        </div>

        {/* Status Feed */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" /></svg>
              Activity & Announcements
            </h2>

            {/* Post Input */}
            {isOwnProfile && (
              <form onSubmit={handlePostStatus} className="mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <textarea 
                  rows="3" 
                  placeholder="Share an update or thought..."
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="block w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-colors mb-3 text-sm"
                  required
                ></textarea>
                <div className="flex justify-end">
                  <button 
                    type="submit" 
                    disabled={isPosting || !newStatus.trim()}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg disabled:bg-indigo-300 transition-colors shadow-sm cursor-pointer"
                  >
                    {isPosting ? 'Posting...' : 'Post Update'}
                  </button>
                </div>
              </form>
            )}

            {/* Feed List */}
            <div className="space-y-4">
              {!profile.statuses || profile.statuses.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                  <p className="text-slate-500 italic text-sm">No recent activity to show.</p>
                </div>
              ) : (
                profile.statuses.map((status) => (
                  <div key={status.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 hover:shadow-sm transition-shadow bg-white">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center flex-shrink-0 border border-indigo-100">
                      {profile.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-slate-900 text-sm">{status.user}</h4>
                        <span className="text-xs text-slate-400 font-medium">
                          {new Date(status.created).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{status.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            
            {/* Header & Tabs */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-900">Settings</h3>
                <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="flex gap-6 text-sm font-semibold">
                <button 
                  onClick={() => setActiveTab('profile')}
                  className={`pb-2 border-b-2 transition-colors cursor-pointer ${activeTab === 'profile' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  Profile Info
                </button>
                <button 
                  onClick={() => setActiveTab('security')}
                  className={`pb-2 border-b-2 transition-colors cursor-pointer ${activeTab === 'security' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  Security
                </button>
              </div>
            </div>

            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Avatar</label>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : profile.photo ? (
                        <img src={getMediaUrl(profile.photo)} alt="Current" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                          {profile.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <input 
                      type="file" accept="image/*" onChange={handlePhotoChange}
                      className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Fixed Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Username</label>
                    <input type="text" disabled value={profile.username} className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-sm cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
                    <input type="email" disabled value={profile.email} className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-sm cursor-not-allowed" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Bio</label>
                  <textarea 
                    rows="4" value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                  ></textarea>
                </div>

                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={isSaving} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg shadow-sm disabled:bg-indigo-400 cursor-pointer">
                    {isSaving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            )}

            {/* Tab Content: Security */}
            {activeTab === 'security' && (
              <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                {passwordError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{passwordError}</div>}
                {passwordSuccess && <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100">{passwordSuccess}</div>}
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Current Password</label>
                  <input type="password" required value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">New Password</label>
                  <input type="password" required value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Confirm New Password</label>
                  <input type="password" required value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
                </div>

                <div className="flex justify-end pt-4">
                  <button type="submit" disabled={isChangingPassword} className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-lg shadow-sm disabled:bg-slate-500 cursor-pointer">
                    {isChangingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
}