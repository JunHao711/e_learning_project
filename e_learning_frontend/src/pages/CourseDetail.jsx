import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const res = await api.get('users/me/');
          setCurrentUser(res.data);
        } catch (err) {
          console.error("Failed to fetch user info", err);
        }
      }
    };
    fetchUser();
  }, []);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setIsSubmittingReview(true);
    try {
      await api.post(`courses/${id}/review/`, { rating, comment });
      alert("Thank you for your feedback!");
      // 重新拉取一次课程详情，以刷新评价列表和平均分
      const response = await api.get(`courses/${id}/`);
      setCourse(response.data);
      setComment('');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to submit review.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getMediaUrl = (path) => {
    if (!path) return '';
    return path.startsWith('http') ? path : `http://localhost:8000${path}`;
  };

  useEffect(() => {
    const fetchCourseDetail = async () => {
      try {
        const response = await api.get(`courses/${id}/`);
        setCourse(response.data);
      } catch (err) {
        console.error("Failed to load course details:", err);
        setError("Course not found or unavailable.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourseDetail();
  }, [id]);

  const handleEnroll = async () => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      alert("Please log in to enroll in this course.");
      navigate('/login');
      return;
    }

    setIsEnrolling(true);
    try {
      await api.post(`courses/${id}/enroll/`);
      alert("Successfully enrolled! Welcome to the course.");
      setCourse(prev => ({ ...prev, is_enrolled: true }));
    } catch (err) {
      console.error("Enrollment failed:", err);
      const backendError = err.response?.data?.error;
      if(backendError){
        alert(backendError);
      }else if (err.response && err.response.status === 403) {
        alert("You are not allowed to enroll in this course.");
      } else {
        alert("Enrollment failed. Please try again.");
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center animate-pulse text-indigo-600 text-xl font-bold">Loading...</div>;
  if (error || !course) return <div className="min-h-screen flex items-center justify-center text-rose-600 font-bold">{error}</div>;

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* ========================================== */}
        {/* 🌟 极简版头部：左侧图片，右侧信息与报名按钮 */}
        {/* ========================================== */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* 左侧：课程封面 */}
          <div className="w-full md:w-1/2 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 aspect-video">
            {course.image ? (
              <img src={getMediaUrl(course.image)} alt={course.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">
                No Preview Image
              </div>
            )}
          </div>

          {/* 右侧：课程信息 */}
          <div className="w-full md:w-1/2 flex flex-col h-full">
            <Link to="/" className="text-indigo-600 hover:underline text-sm font-semibold mb-4 inline-block">
              &larr; Back to Catalog
            </Link>
            
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              {course.subject || 'General'}
            </span>
            
            <h1 className="text-3xl font-extrabold text-slate-900 mb-4 leading-tight">
              {course.title}
            </h1>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                {course.owner?.photo ? (
                  <img src={getMediaUrl(course.owner.photo)} alt="Instructor" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xs">
                    {course.owner?.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-sm font-medium text-slate-600">By {course.owner?.username || 'Unknown'}</span>
            </div>

            <p className="text-slate-600 leading-relaxed mb-8">
              {course.overview || "No description provided for this course."}
            </p>

            {/* 操作区 (Enroll / Go to Course) */}
            <div className="mt-auto pt-6 border-t border-slate-100">
              {(() => {
                // 1. 如果是管理员
                if (currentUser?.role === 'admin') {
                  return (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 text-sm font-bold text-center">
                      Admin View: Overview Mode
                    </div>
                  );
                }

                const isOwner = course.owner?.id === currentUser?.id || course.owner?.username === currentUser?.username;

                // 2. 如果是课程创建者 (老师本人)
                if (isOwner) {
                  return (
                    <Link 
                      to={`/courses/${course.id}/edit`}
                      className="block w-full text-center py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-md"
                    >
                      Manage Curriculum & Content
                    </Link>
                  );
                }

                // 3. 如果已经报名
                if (course.is_enrolled) {
                  return (
                    <button 
                      onClick={() => navigate(`/student/course/${course.id}`)}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-md"
                    >
                      Go to Course Area &rarr;
                    </button>
                  );
                }

                // 4. 普通访客或未报名学生
                return (
                  <button 
                    onClick={handleEnroll}
                    disabled={isEnrolling}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg disabled:bg-indigo-400 transition-all transform hover:-translate-y-0.5 cursor-pointer shadow-lg"
                  >
                    {isEnrolling ? 'Enrolling...' : 'Enroll in This Course'}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* 🌟 极简版大纲 (Syllabus) */}
        {/* ========================================== */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b border-slate-200 pb-2">Course Modules</h2>
          
          {!course.modules || course.modules.length === 0 ? (
            <p className="text-slate-500 italic">No modules have been added yet.</p>
          ) : (
            <ul className="space-y-4">
              {course.modules.map((module, index) => (
                <li key={module.id} className="bg-slate-50 rounded-lg p-5 border border-slate-100 flex gap-4">
                  <span className="font-bold text-indigo-300 text-xl">{index + 1}.</span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{module.title}</h3>
                    {module.description && <p className="text-sm text-slate-600 mt-1">{module.description}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
          <div className="mt-16 pt-12 border-t border-slate-200">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900">Student Feedback</h2>
            {/* 显示平均分 */}
            {course.average_rating > 0 && (
              <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                <span className="text-amber-500 text-lg">★</span>
                <span className="font-bold text-amber-700">{course.average_rating} Course Rating</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            {/* 左侧：留下评价的表单 (仅限已报名用户) */}
            <div className="md:col-span-1">
              {course.is_enrolled ? (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 sticky top-24">
                  <h3 className="font-bold text-slate-900 mb-4">Leave a Review</h3>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className={`text-2xl transition-transform hover:scale-110 cursor-pointer ${rating >= star ? 'text-amber-400' : 'text-slate-300'}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Your feedback</label>
                      <textarea
                        rows="4"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="What did you think of this course?"
                        className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                      ></textarea>
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSubmittingReview || !comment.trim()}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg disabled:bg-indigo-300 transition-colors cursor-pointer"
                    >
                      {isSubmittingReview ? 'Submitting...' : 'Post Review'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center text-slate-500">
                  <p className="text-sm font-medium">Enroll in this course to leave your feedback.</p>
                </div>
              )}
            </div>

            <div className="md:col-span-2 space-y-6">
              {!course.reviews || course.reviews.length === 0 ? (
                <div className="text-center py-10 text-slate-500 italic">
                  No reviews yet. Be the first to share your thoughts!
                </div>
              ) : (
                course.reviews.map((review) => (
                  <div key={review.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex gap-4">
                    {/* User Avatar */}
                    <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                      {review.student_photo ? (
                        <img src={getMediaUrl(review.student_photo)} alt="user" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                          {review.student_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {/* Review Content */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-900">{review.student_name}</h4>
                        <span className="text-[10px] text-slate-400">• {new Date(review.created).toLocaleDateString()}</span>
                      </div>
                      <div className="flex text-amber-400 text-sm mb-2">
                        {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">{review.comment}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}