import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { getMediaUrl } from '../components/utils';

function StatCard({ title, value, color }) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-900 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-900 border-emerald-100",
    purple: "bg-purple-50 text-purple-900 border-purple-100"
  };
  return (
    <div className={`p-6 rounded-xl border ${colors[color]}`}>
      <h3 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{title}</h3>
      <span className="text-3xl font-black">{value || 0}</span>
    </div>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusText, setStatusText] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // fetch the current logged-in user's profile
        const userRes = await api.get('users/me/'); 
        const userData = userRes.data;

        // normalize the user role to avoid case-sensitivity issues
        const normalizedRole = userData.role ? String(userData.role).toLowerCase() : 'student';
        const formattedUser = { ...userData, role: normalizedRole };
        setUser(formattedUser);

        // if is admin
        if (normalizedRole === 'admin') {
          const coursesRes = await api.get('courses/admin/all/');
          const fetchedCourses = coursesRes.data.results ? coursesRes.data.results : coursesRes.data;          
          setCourses(Array.isArray(fetchedCourses) ? fetchedCourses : []);
        
        }
        // if is teacher
        else if(normalizedRole === 'teacher'){
          const coursesRes = await api.get('courses/teacher/mine');
          const fetchedCourses = coursesRes.data.results ? coursesRes.data.results : coursesRes.data;          
          setCourses(Array.isArray(fetchedCourses) ? fetchedCourses : []);
        }
        // if is students
        else{
          const coursesRes = await api.get('courses/enrolled/');
          const fetchedCourses = coursesRes.data.results ? coursesRes.data.results : coursesRes.data;          
          setCourses(Array.isArray(fetchedCourses) ? fetchedCourses : []);
        }

      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        if (err.response?.status === 401)
        {
          return;
        }
        setError('Failed to load dashboard. Please try logging in again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // handle status update
  const handlePostStatus = async (e) => {
    e.preventDefault();
    if (!statusText.trim()) return;
    setIsPosting(true);
    try {
      // partially update the user's bio
      await api.patch('users/me/', { bio: statusText }); 
      alert("Status updated successfully on your profile!");
      setStatusText('');
    } catch (err) {
      console.error("Failed to post status:", err);
      alert("Failed to update status.");
    } finally {
      setIsPosting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-indigo-600 font-semibold text-lg">
          Loading your workspace...
        </div>
      </div>
    );
  }

  // error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-red-500 font-medium">{error}</div>
      </div>
    );
  }

  // main layout and role based routing
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* welcome header */}
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Welcome back, {user?.username}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {user?.role === 'teacher' 
                ? 'Manage your courses and empower your students.' 
                : 'Ready to continue your learning journey?'}
            </p>
          </div>
          
          {/* teacher create course button */}
          {user?.role === 'teacher' && (
            <Link 
              to="/courses/create" 
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition-transform hover:-translate-y-0.5"
            >
              + Create New Course
            </Link>
          )}
        </div>
        

        {user?.role !== 'admin' && (
          <div className="mb-10 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mt-8">
            <form onSubmit={handlePostStatus} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">
                {user?.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="Share an update to your profile..."
                  value={statusText}
                  onChange={(e) => setStatusText(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                <button 
                  type="submit" 
                  disabled={isPosting || !statusText.trim()}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  {isPosting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* role based routing */}
        {user?.role === 'admin' ? (
          <AdminWorkspace courses={courses} setCourses={setCourses} />
        ) :user?.role === 'teacher' ? (
          <TeacherWorkspace courses={courses} />
        ) : (
          <StudentWorkspace courses={courses} />
        )}

      </div>
    </div>
  );
}

// Teacher Dashboard
function TeacherWorkspace({ courses }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800 border-b pb-2">My Courses</h2>
      
      {courses.length === 0 ? (
        // empty state
        <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-slate-900">No courses yet</h3>
          <p className="mt-1 text-sm text-slate-500">Get started by creating your very first course.</p>
        </div>
      ) : (
        // Course
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-40 bg-slate-200 w-full relative overflow-hidden">
                {course.image ? (
                  <img 
                    src={course.image} 
                    alt={course.title} 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white/50 text-4xl font-black">
                      {course.title ? course.title.charAt(0).toUpperCase() : 'C'}
                    </div>
                  )}
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-slate-900 truncate">{course.title || "Untitled Course"}</h3>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{course.overview || "No description provided."}</p>
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                  <Link 
                    to={`/courses/${course.id}/edit`} 
                    className="flex-1 text-center text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 py-2 rounded-lg transition-colors"
                  >
                    Curriculum
                  </Link>
                  <Link 
                    to={`/courses/${course.id}/students`} 
                    className="flex-1 text-center text-sm font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:border-slate-300 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    Students
                  </Link>
                  <Link 
                    to={`/courses/${course.id}/chat`} 
                    className="flex-1 text-center text-[13px] font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 hover:border-emerald-200 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    Chat
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// sthdent dashboard
function StudentWorkspace({ courses }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b pb-2">
        <h2 className="text-xl font-bold text-slate-800">My Learning</h2>
        <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
          {courses.length} Enrolled
        </span>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <h3 className="text-xl font-bold text-slate-900">You haven't enrolled in any courses yet.</h3>
          <p className="text-slate-500 mt-2 mb-6">Explore the catalog and start your learning journey today!</p>
          <Link to="/" className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-sm">
            Browse Course Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div key={course.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              
              <div className="aspect-video bg-slate-100 relative">
                {course.image ? (
                  <img src={getMediaUrl(course.image)} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">No Image</div>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">
                  {course.subject || 'General'}
                </span>
                <h3 className="text-lg font-bold text-slate-800 leading-snug mb-4 line-clamp-2">
                  {course.title}
                </h3>
                
                <div className="mt-auto border-t border-slate-100 pt-4">
                  <Link 
                    to={`/student/course/${course.id}`}
                    className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-200 transition-colors"
                  >
                    Continue Learning &rarr;
                  </Link>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminWorkspace({ courses: initialCourses, setCourses: setInitialCourses }) {
  const [activeTab, setActiveTab] = useState('overview'); 
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [newSubject, setNewSubject] = useState({ title: '', slug: '' });
  const [dashboardStats, setDashboardStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [coursesList, setCoursesList] = useState(initialCourses || []);
  const [subjectsList, setSubjectsList] = useState([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // auto generate slug
  const handleTitleChange = (val) => {
    const slug = val.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
    setNewSubject({ title: val, slug: slug });
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (activeTab === 'overview') {
          const res = await api.get('users/admin/dashboard/');
          setDashboardStats(res.data);
        } else if (activeTab === 'users') {
          const res = await api.get('users/admin/users/');
          setUsersList(res.data.results || res.data);
        } else if (activeTab === 'courses') {
          const res = await api.get('courses/admin/all/');
          setCoursesList(res.data.results || res.data);
        } else if (activeTab === 'categories') {
          const res = await api.get('courses/subjects/');
          setSubjectsList(res.data.results || res.data);
        }
      } catch (err) {
        console.error(`Failed to fetch ${activeTab} data:`, err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  // handle add subject
  const handleAddSubject = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('courses/subjects/', newSubject);
      alert("Category added!");
      setShowSubjectModal(false);
      setNewSubject({ title: '', slug: '' });
      if (activeTab === 'categories') {
        const res = await api.get('courses/subjects/');
        setSubjectsList(res.data.results || res.data);
      }
    } catch (err) {
      alert("Error: Title or Slug might already exist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // handle delete subject
  const handleDeleteSubject = async (id, title) => {
    if (!window.confirm(`Delete category "${title}"? Courses in this category might be affected.`)) return;
    try {
      await api.delete(`courses/subjects/${id}/`);
      setSubjectsList(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert("Cannot delete category with active courses.");
    }
  };

  // ban/unbanned user
  const handleToggleActive = async (userId, username, currentStatus) => {
    const action = currentStatus ? "BAN" : "UNBAN";
    if (!window.confirm(`Confirm ${action} for ${username}?`)) return;
    try {
      await api.post(`users/admin/users/${userId}/toggle-active/`);
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, is_active: !u.is_active } : u));
    } catch (err) { alert("Failed to change user status."); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[60vh]">
      
      {/* nav bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-6">
          {['overview', 'users', 'courses', 'categories'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 font-bold text-sm capitalize border-b-2 transition-all cursor-pointer ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              {tab === 'categories' ? 'Manage Categories' : tab}
            </button>
          ))}
        </div>
        
        <button 
          onClick={() => setShowSubjectModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
        >
          + Add New Category
        </button>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="py-20 text-center animate-pulse text-indigo-600 font-bold">Loading...</div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Users" value={dashboardStats?.total_users} color="indigo" />
                <StatCard title="Total Courses" value={dashboardStats?.total_courses} color="emerald" />
                <StatCard title="Enrollments" value={dashboardStats?.total_enrollments} color="purple" />
              </div>
            )}

            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-black text-slate-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersList.map(u => (
                      <tr key={u.id}>
                        <td className="px-4 py-4 text-sm font-bold text-slate-900">{u.username} <span className="block text-xs font-normal text-slate-400">{u.email}</span></td>
                        <td className="px-4 py-4"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 uppercase">{u.role}</span></td>
                        <td className="px-4 py-4"><span className={`text-xs font-bold ${u.is_active ? 'text-emerald-500' : 'text-rose-500'}`}>{u.is_active ? '● Active' : '● Banned'}</span></td>
                        <td className="px-4 py-4 text-right">
                          <button onClick={() => handleToggleActive(u.id, u.username, u.is_active)} disabled={u.role === 'admin'} className="text-xs font-bold text-rose-600 hover:underline cursor-pointer disabled:opacity-30">{u.is_active ? 'Ban' : 'Unban'}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* category list tab */}
            {activeTab === 'categories' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjectsList.map(s => (
                  <div key={s.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center group">
                    <div>
                      <h4 className="font-bold text-slate-800">{s.title}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">{s.slug}</p>
                    </div>
                    <button onClick={() => handleDeleteSubject(s.id, s.title)} className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

          {/* courses list */}
          {activeTab === 'courses' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Course</th>
                <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Instructor</th>
                <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Students</th>
                <th className="px-4 py-3 text-right text-xs font-black text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
          {coursesList.map(c => (
           <tr key={c.id}>
            <td className="px-4 py-4">
             <div className="font-bold text-slate-900">{c.title}</div>
             <div className="text-xs text-indigo-600 font-semibold">{c.subject?.title || c.subject || 'General'}</div>
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-800 font-medium">
             {c.owner_name || 'Unknown'}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500 font-bold">
             {c.student_count || 0} enrolled
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-right">
             <button 
              onClick={() => handleDeleteCourse(c.id, c.title)}
              className="px-3 py-1.5 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
             >
              Force Delete
             </button>
            </td>
           </tr>
          ))}
         </tbody>
        </table>
       </div>
      )}
          </>
        )}
      </div>

      {/* Add Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-lg font-black mb-4">New Category</h3>
              <input type="text" placeholder="Title" value={newSubject.title} onChange={e => handleTitleChange(e.target.value)} className="w-full mb-3 p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
              <input type="text" placeholder="Slug" value={newSubject.slug} onChange={e => setNewSubject({...newSubject, slug: e.target.value})} className="w-full mb-6 p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 italic" />
              <div className="flex gap-3">
                <button onClick={() => setShowSubjectModal(false)} className="flex-1 py-3 font-bold text-slate-500">Cancel</button>
                <button onClick={handleAddSubject} disabled={isSubmitting} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-lg">{isSubmitting ? '...' : 'Add'}</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

