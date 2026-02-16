// src/pages/CourseStudents.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';

export default function CourseStudents() {
  const { id } = useParams(); // Course ID
  const [course, setCourse] = useState(null);
  
  const [activeStudents, setActiveStudents] = useState([]);
  const [blockedStudents, setBlockedStudents] = useState([]);
  
  // Tab Management: 'active' or 'blocked'
  const [currentTab, setCurrentTab] = useState('active');
  const [isLoading, setIsLoading] = useState(true);

  // Helper function for media URLs
  const getMediaUrl = (path) => {
    if (!path) return '';
    return path.startsWith('http') ? path : `http://localhost:8000${path}`;
  };

  const fetchCourseAndStudents = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Course Info (for the header)
      const courseRes = await api.get(`courses/teacher/${id}/`);
      setCourse(courseRes.data);

      // 2. Fetch Active Enrolled Students
      const activeRes = await api.get(`courses/teacher/${id}/students/`);
      const activeData = activeRes.data.results || activeRes.data;
      setActiveStudents(Array.isArray(activeData) ? activeData : []);

      // 3. Fetch Blocked Students
      const blockedRes = await api.get(`courses/teacher/${id}/students/?filter=blocked`);
      const blockedData = blockedRes.data.results || blockedRes.data;
      setBlockedStudents(Array.isArray(blockedData) ? blockedData : []);

    } catch (err) {
      console.error("Failed to load students:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseAndStudents();
  }, [id]);

  // 🌟 Action: Kick & Block Student
  const handleBlock = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to block ${studentName}? They will be removed from the course.`)) return;
    
    try {
      await api.post(`courses/teacher/${id}/students/${studentId}/block/`);
      // Refresh the lists to reflect the change immediately
      fetchCourseAndStudents();
    } catch (err) {
      alert("Failed to block user.");
      console.error(err);
    }
  };

  // 🌟 Action: Unblock Student
  const handleUnblock = async (studentId, studentName) => {
    if (!window.confirm(`Unblock ${studentName}? They will need to re-enroll manually.`)) return;
    
    try {
      await api.post(`courses/teacher/${id}/students/${studentId}/unblock/`);
      fetchCourseAndStudents();
    } catch (err) {
      alert("Failed to unblock user.");
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center animate-pulse text-indigo-600 font-bold text-xl">Loading Roster...</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div>
          <Link to="/dashboard" className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1 mb-2">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            Manage Students
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">
              {course?.title}
            </span>
          </h1>
        </div>

        {/* 🌟 Tab Navigation */}
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setCurrentTab('active')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-bold text-sm transition-colors cursor-pointer ${
                currentTab === 'active'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Active Enrolled ({activeStudents.length})
            </button>
            <button
              onClick={() => setCurrentTab('blocked')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-bold text-sm transition-colors cursor-pointer ${
                currentTab === 'blocked'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Blocked List ({blockedStudents.length})
            </button>
          </nav>
        </div>

        {/* 🌟 Content Area: Active Students */}
        {currentTab === 'active' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {activeStudents.length === 0 ? (
              <div className="p-10 text-center text-slate-500 font-medium">No students enrolled yet.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {activeStudents.map((student) => (
                  <li key={student.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <Link to={`/profile/${student.username}`} className="w-12 h-12 rounded-full border border-slate-200 overflow-hidden bg-slate-100 flex-shrink-0 cursor-pointer">
                        {student.photo ? (
                          <img src={getMediaUrl(student.photo)} alt={student.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-indigo-600 font-bold text-lg">
                            {student.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </Link>
                      
                      {/* Info & Role Badge */}
                      <div>
                        <Link to={`/profile/${student.username}`} className="text-lg font-bold text-slate-900 hover:text-indigo-600 cursor-pointer flex items-center gap-2">
                          {student.username}
                          {/* 🌟 The Smart Role Badge */}
                          <span className={`px-2 py-0.5 text-[10px] uppercase font-black rounded-sm ${
                            student.role === 'teacher' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {student.role === 'teacher' ? 'Peer Teacher' : 'Student'}
                          </span>
                        </Link>
                        <p className="text-sm text-slate-500">{student.email}</p>
                      </div>
                    </div>

                    {/* Action */}
                    <button 
                      onClick={() => handleBlock(student.id, student.username)}
                      className="px-4 py-2 text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                    >
                      Block & Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 🌟 Content Area: Blocked Students */}
        {currentTab === 'blocked' && (
          <div className="bg-white rounded-2xl shadow-sm border border-rose-200 overflow-hidden">
            <div className="bg-rose-50 px-6 py-4 border-b border-rose-200">
              <p className="text-sm text-rose-700 font-semibold">
                Users on this list are permanently banned from viewing or enrolling in this course.
              </p>
            </div>
            {blockedStudents.length === 0 ? (
              <div className="p-10 text-center text-slate-500 font-medium">No blocked users.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {blockedStudents.map((student) => (
                  <li key={student.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full border border-slate-200 overflow-hidden bg-slate-100 flex-shrink-0 grayscale opacity-70">
                        {student.photo ? (
                          <img src={getMediaUrl(student.photo)} alt={student.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-lg">
                            {student.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-lg font-bold text-slate-900 line-through decoration-rose-500 decoration-2">
                          {student.username}
                        </span>
                        <p className="text-sm text-slate-500">{student.email}</p>
                      </div>
                    </div>

                    {/* Action */}
                    <button 
                      onClick={() => handleUnblock(student.id, student.username)}
                      className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Unblock
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

      </div>
    </div>
  );
}