import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { getMediaUrl } from '../components/utils';

export default function Home() {
  // store course list
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get('courses/'); 
        const data = response.data.results || response.data;
        setCourses(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load courses:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // Filter courses by search input
  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* header and search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Course Catalog</h1>
            <p className="text-slate-500 mt-1">Find the perfect course for you.</p>
          </div>
          
          <div className="w-full md:w-96">
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* content area */}
        {isLoading ? (
          <div className="text-center text-indigo-600 font-semibold py-20 animate-pulse">
            Loading courses...
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-20 text-slate-500 bg-white rounded-xl border border-slate-200">
            No courses found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map((course) => (
              <Link 
                to={`/course/${course.id}`} 
                key={course.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-indigo-300 transition-all cursor-pointer flex flex-col"
              >
                {/* course image */}
                <div className="aspect-video bg-slate-100 border-b border-slate-100">
                  {course.image ? (
                    <img src={getMediaUrl(course.image)} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">
                      No Image
                    </div>
                  )}
                </div>

                {/* course info */}
                <div className="p-5 flex-1 flex flex-col">
                  <span className="text-xs font-bold text-indigo-600 uppercase mb-1">
                    {course.subject || 'General'}
                  </span>
                  <h3 className="text-lg font-bold text-slate-800 leading-snug mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  
                  <div className="mt-auto pt-4 flex items-center justify-between text-sm text-slate-500 border-t border-slate-100">
                    <span>{course.owner?.username || 'Unknown Instructor'}</span>
                    <span>{course.total_modules || 0} Modules</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        
      </div>
    </div>
  );
}