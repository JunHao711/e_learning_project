import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Notification States
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Logout Modal State
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Check login status and fetch user info on mount / route change
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);
    
    if (token) {
      api.get('users/me/')
        .then(res => {
          setCurrentUser(res.data);
          // 🌟 只有非 Admin 用户才需要去拉取通知红点
          if (res.data.role !== 'admin') {
            fetchNotifications();
          }
        })
        .catch(err => console.error(err));
    } else {
      setCurrentUser(null);
    }
  }, [location.pathname]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('users/notifications/');
      const data = res.data.results || res.data;
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };
  
  const handleMarkAsRead = async (notifId, link) => {
    try {
      await api.post(`users/notifications/${notifId}/mark_read/`);
      fetchNotifications();
      setShowDropdown(false);
      if (link) navigate(link);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('users/notifications/mark_all_read/');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  // Click outside to close notification dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setShowLogoutModal(false);
    navigate('/login');
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center">
              <Link to={isLoggedIn ? "/dashboard" : "/"} className="flex-shrink-0 flex items-center gap-2">
                <span className="text-2xl font-black text-indigo-600 tracking-tighter">E Learning Website</span>
              </Link>
            </div>
            
            {/* Navigation Links */}
            <div className="flex items-center gap-6">
              {isLoggedIn ? (
                currentUser?.role === 'admin' ? (
                  // ==========================================
                  // 🛡️ ADMIN 视图 (极简)
                  // ==========================================
                  <>
                    <Link to="/dashboard" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Admin Panel</Link>
                    <button 
                      onClick={() => setShowLogoutModal(true)} 
                      className="ml-4 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  // ==========================================
                  // 👨‍🏫 老师 / 👨‍🎓 学生 视图 (完整)
                  // ==========================================
                  <>
                    <Link to="/" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Catalog</Link>
                    <Link to="/dashboard" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Dashboard</Link>
                    <Link to="/community" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Find People</Link>
                    <Link to="/inbox" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Inbox</Link>
                    <Link to="/profile" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Profile</Link>
                    
                    {/* Notification Bell */}
                    <div className="relative" ref={dropdownRef}>
                      <button onClick={() => setShowDropdown(!showDropdown)} className="p-2 text-slate-500 hover:text-indigo-600 transition-colors relative cursor-pointer">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        {unreadCount > 0 && (
                          <span className="absolute top-1 right-1 flex items-center justify-center h-4 w-4 bg-rose-500 rounded-full text-[9px] font-bold text-white border-2 border-white">
                            {unreadCount}
                          </span>
                        )}
                      </button>

                      {/* Dropdown Menu */}
                      {showDropdown && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden transform opacity-100 scale-100 transition-all origin-top-right">
                          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <span className="font-bold text-slate-800 text-sm">Notifications</span>
                            {unreadCount > 0 && (
                              <button onClick={handleMarkAllRead} className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer">Mark all as read</button>
                            )}
                          </div>
                          <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                              <div className="px-4 py-6 text-center text-sm text-slate-500">You're all caught up!</div>
                            ) : (
                              <ul className="divide-y divide-slate-50">
                                {notifications.map((notif) => (
                                  <li key={notif.id} onClick={() => handleMarkAsRead(notif.id, notif.link)} className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${!notif.is_read ? 'bg-indigo-50/30' : ''}`}>
                                    <div className="flex justify-between items-start mb-1">
                                      <h4 className={`text-sm ${!notif.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>{notif.title}</h4>
                                      {!notif.is_read && <span className="h-2 w-2 bg-indigo-500 rounded-full mt-1.5"></span>}
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-2">{notif.message}</p>
                                    <span className="text-[10px] text-slate-400 mt-2 block">{new Date(notif.created_at).toLocaleString()}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => setShowLogoutModal(true)} 
                      className="ml-4 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      Logout
                    </button>
                  </>
                )
              ) : (
                // ==========================================
                // 👻 未登录访客视图
                // ==========================================
                <>
                  <Link to="/" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Catalog</Link>
                  <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Log in</Link>
                  <Link to="/register" className="ml-4 px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors">Sign up</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ========================================== */}
      {/* Logout Modal */}
      {/* ========================================== */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 transform transition-all">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Ready to leave?</h3>
              <p className="mt-2 text-sm text-slate-500">
                You will need to log in again to access your dashboard and courses.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Yes, Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}