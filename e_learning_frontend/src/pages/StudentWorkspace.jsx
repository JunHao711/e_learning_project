import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getMediaUrl } from '../components/utils';

export default function StudentWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [activeContent, setActiveContent] = useState(null); 
  const [expandedModuleId, setExpandedModuleId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarking, setIsMarking] = useState(false); 
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fetching course
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const response = await api.get(`courses/${id}/`);
        setCourse(response.data);

        if (response.data.modules?.length > 0) {
          const firstMod = response.data.modules[0];
          setExpandedModuleId(firstMod.id);
          if (firstMod.contents?.length > 0) {
             setActiveContent(firstMod.contents.sort((a, b) => a.order - b.order)[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load workspace:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourseData();
  }, [id]);

  const flatContents = useMemo(() => {
    if (!course?.modules) return [];
    let contents = [];
    course.modules.forEach(mod => {
      const sorted = [...(mod.contents || [])].sort((a, b) => a.order - b.order);
      sorted.forEach(c => contents.push({ ...c, moduleId: mod.id }));
    });
    return contents;
  }, [course]);

  const currentIndex = activeContent ? flatContents.findIndex(c => c.id === activeContent.id) : -1;
  const prevContent = currentIndex > 0 ? flatContents[currentIndex - 1] : null;
  const nextContent = currentIndex >= 0 && currentIndex < flatContents.length - 1 ? flatContents[currentIndex + 1] : null;

  const progressPercentage = useMemo(() => {
    if (flatContents.length === 0) return 0;
    const completedCount = flatContents.filter(c => c.is_completed).length;
    return Math.round((completedCount / flatContents.length) * 100);
  }, [flatContents]);

  const handleCompleteAndContinue = async () => {
    if (!activeContent) return;
    setIsMarking(true);

    try {
      if (!activeContent.is_completed) {
        await api.post(`courses/content/${activeContent.id}/mark-complete/`);

        setCourse(prev => {
          const newCourse = { ...prev };
          newCourse.modules = newCourse.modules.map(mod => {
            if (mod.id === activeContent.moduleId) {
              return {
                ...mod,
                contents: mod.contents.map(c => 
                  c.id === activeContent.id ? { ...c, is_completed: true } : c
                )
              };
            }
            return mod; 
          });
          return newCourse;
        });
      }

      if (nextContent) {
        setActiveContent(nextContent);
        setExpandedModuleId(nextContent.moduleId);
      } else {
        setTimeout(() => {
          alert("Congratulations! You have completed the entire course!");
        }, 300);
      }
    } catch (err) {
      console.error("Failed to mark complete:", err);
      alert("Failed to save progress. Please try again.");
    } finally {
      setIsMarking(false);
    }
  };

  const handleSelectContent = (content, moduleId) => {
    setActiveContent(content);
    setExpandedModuleId(moduleId);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center animate-pulse text-indigo-600 font-bold">Loading Workspace...</div>;
  if (!course) return <div className="min-h-screen flex items-center justify-center text-rose-600 font-bold">Error loading course.</div>;

  return (
    <div className="h-[calc(100dvh-64px)] sm:h-[calc(100vh-64px)] bg-slate-50 flex overflow-hidden relative">
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Curriculum Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-[80%] sm:w-80 bg-white border-r border-slate-200 flex flex-col h-full shadow-2xl md:shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex-shrink-0 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 relative flex-shrink-0">
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-200 rounded-full">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <Link to={`/course/${course.id}`} className="text-[10px] sm:text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider mb-2 block transition-colors w-fit">
            &larr; Back to Detail
          </Link>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight mb-4 pr-6 line-clamp-2">
            {course.title}
          </h2>
          
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-[9px] sm:text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
              <span>Course Progress</span>
              <span className="text-indigo-600">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-700 ease-out" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <ul className="divide-y divide-slate-100 pb-20 md:pb-0">
            {course.modules?.map((module, index) => {
              const isExpanded = expandedModuleId === module.id;
              const sortedContents = module.contents ? [...module.contents].sort((a, b) => a.order - b.order) : [];

              return (
                <li key={module.id} className="bg-white">
                  <button 
                    onClick={() => setExpandedModuleId(isExpanded ? null : module.id)}
                    className="w-full text-left px-4 sm:px-5 py-3 sm:py-4 hover:bg-slate-50 flex justify-between items-center cursor-pointer group"
                  >
                    <div className="pr-3 sm:pr-4">
                      <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5 sm:mb-1">Section {index + 1}</span>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2">{module.title}</h3>
                    </div>
                    <svg className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </button>

                  {isExpanded && (
                    <ul className="bg-slate-50/50 pb-2 border-t border-slate-50">
                      {sortedContents.map((content, cIndex) => {
                        const isActive = activeContent?.id === content.id;
                        return (
                          <li key={content.id}>
                            <button
                              onClick={() => handleSelectContent(content, module.id)}
                              className={`w-full text-left px-4 sm:px-5 py-2.5 sm:py-3 pl-6 sm:pl-8 flex items-start gap-2 sm:gap-3 transition-colors cursor-pointer border-l-4 ${
                                isActive ? 'bg-indigo-50 border-indigo-600' : 'hover:bg-slate-100 border-transparent'
                              }`}
                            >
                              <div className="mt-0.5 relative flex-shrink-0">
                                {content.is_completed && (
                                  <span className="absolute -bottom-1 -right-1 bg-white rounded-full">
                                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className={`text-xs sm:text-sm font-medium line-clamp-2 ${isActive ? 'text-indigo-900 font-bold' : content.is_completed ? 'text-slate-500' : 'text-slate-700'}`}>
                                  {cIndex + 1}. {content.item.title}
                                </h4>
                                <span className={`text-[8px] sm:text-[9px] uppercase font-bold tracking-widest ${isActive ? 'text-indigo-500' : 'text-slate-400'}`}>
                                  {content.item.type}
                                </span>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Main Screen */}
      <div className="flex-1 flex flex-col h-full bg-white relative min-w-0">
        <div className="h-14 sm:h-16 border-b border-slate-200 flex items-center justify-between px-3 sm:px-8 bg-white z-10 flex-shrink-0">
          
          <div className="flex items-center flex-1 min-w-0 pr-2">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="md:hidden mr-2 p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg flex-shrink-0"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="text-sm sm:text-xl font-bold text-slate-800 flex items-center gap-3 truncate">
              {activeContent ? activeContent.item.title : 'Course Overview'}
            </h1>
          </div>

          <Link to={`/courses/${id}/chat`} className="px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-sm flex-shrink-0">
            <svg className="w-4 h-4 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            Chat
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-8">
          <div className="max-w-4xl mx-auto">
            {activeContent && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {activeContent.item.type === 'video' && (
                  <div className="aspect-video bg-black">
                    <iframe width="100%" height="100%" src={activeContent.item.url.includes('youtube.com') ? `https://www.youtube.com/embed/${activeContent.item.url.split('v=')[1]}` : activeContent.item.url} frameBorder="0" allowFullScreen></iframe>
                  </div>
                )}
                {activeContent.item.type === 'text' && (
                  <div className="p-5 sm:p-10 prose prose-sm sm:prose-lg prose-indigo max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                    {activeContent.item.content}
                  </div>
                )}
                {activeContent.item.type === 'image' && (
                  <div className="p-4 sm:p-8 flex justify-center bg-slate-100">
                    <img src={getMediaUrl(activeContent.item.file)} alt="lesson" className="max-h-[50vh] sm:max-h-[70vh] rounded-xl shadow-md border border-slate-200" />
                  </div>
                )}
                {activeContent.item.type === 'file' && (
                  <div className="flex flex-col h-[60vh] sm:h-[75vh]">
                    <iframe src={getMediaUrl(activeContent.item.file)} width="100%" height="100%" className="bg-slate-100 border-b border-slate-200"></iframe>
                    <div className="p-3 sm:p-4 bg-white flex justify-between items-center">
                      <span className="text-xs sm:text-sm font-medium text-slate-500">Document preview</span>
                      <a href={getMediaUrl(activeContent.item.file)} target="_blank" rel="noreferrer" className="px-4 py-1.5 sm:px-5 sm:py-2 bg-indigo-600 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm hover:bg-indigo-700">Download File</a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigate back to previous or next */}
            {activeContent && (
              <div className="mt-6 sm:mt-8 flex flex-col-reverse sm:flex-row justify-between sm:items-center pb-8 sm:pb-12 gap-4">
                {prevContent ? (
                  <button 
                    onClick={() => { setActiveContent(prevContent); setExpandedModuleId(prevContent.moduleId); }}
                    className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 text-slate-500 text-sm sm:text-base font-bold hover:bg-white hover:shadow-sm rounded-xl border border-transparent hover:border-slate-200 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    &larr; Previous Lesson
                  </button>
                ) : <div className="hidden sm:block"></div>}

                <button 
                  onClick={handleCompleteAndContinue}
                  disabled={isMarking}
                  className={`w-full sm:w-auto px-6 sm:px-8 py-3 text-sm sm:text-base font-black rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 transform hover:-translate-y-0.5 ${
                    activeContent.is_completed && !nextContent 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  }`}
                >
                  {isMarking 
                    ? 'Saving...' 
                    : !nextContent && activeContent.is_completed 
                      ? 'Course Completed' 
                      : 'Complete & Continue \u2192'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}