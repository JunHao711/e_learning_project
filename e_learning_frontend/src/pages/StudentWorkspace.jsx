// src/pages/StudentWorkspace.jsx
import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function StudentWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [activeContent, setActiveContent] = useState(null);
  const [expandedModuleId, setExpandedModuleId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarking, setIsMarking] = useState(false);

  const getMediaUrl = (path) => {
    if (!path) return '';
    return path.startsWith('http') ? path : `http://localhost:8000${path}`;
  };

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const response = await api.get(`courses/${id}/`);
        setCourse(response.data);

        // Auto-select first uncompleted content, or very first content
        if (response.data.modules?.length > 0) {
          const firstMod = response.data.modules[0];
          setExpandedModuleId(firstMod.id);
          if (firstMod.contents?.length > 0) {
             // Basic fallback: just pick the first one
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

  // 🌟 核心算法：将多层级的课程内容压平为一维数组 (Flattening)
  const flatContents = useMemo(() => {
    if (!course?.modules) return [];
    let contents = [];
    course.modules.forEach(mod => {
      const sorted = [...(mod.contents || [])].sort((a, b) => a.order - b.order);
      sorted.forEach(c => contents.push({ ...c, moduleId: mod.id }));
    });
    return contents;
  }, [course]);

  // 计算当前课程在所有课程中的索引
  const currentIndex = activeContent ? flatContents.findIndex(c => c.id === activeContent.id) : -1;
  const prevContent = currentIndex > 0 ? flatContents[currentIndex - 1] : null;
  const nextContent = currentIndex >= 0 && currentIndex < flatContents.length - 1 ? flatContents[currentIndex + 1] : null;

  // 🌟 计算总体进度百分比 (Progress Bar Calculation)
  const progressPercentage = useMemo(() => {
    if (flatContents.length === 0) return 0;
    const completedCount = flatContents.filter(c => c.is_completed).length;
    return Math.round((completedCount / flatContents.length) * 100);
  }, [flatContents]);

  // 🌟 处理完成并进入下一节 (Mark Complete & Continue)
  const handleCompleteAndContinue = async () => {
    if (!activeContent) return;
    setIsMarking(true);

    try {
      // 1. 调用后端 API 打卡
      if (!activeContent.is_completed) {
        await api.post(`courses/content/${activeContent.id}/mark-complete/`);
        
        // 2. 🌟 严格遵循 React 的不可变(Immutable)原则更新状态
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

      // 3. 导航到下一节，或者庆祝完课
      if (nextContent) {
        setActiveContent(nextContent);
        setExpandedModuleId(nextContent.moduleId); // 自动展开下一个模块的文件夹
      } else {
        // 🌟 核心修复：延迟 300 毫秒弹出！
        // 让 React 有足够的时间把进度条拉到 100%，并画出最后一个绿色勾勾 ✅
        setTimeout(() => {
          alert("🎉 Congratulations! You have completed the entire course!");
        }, 300);
      }
    } catch (err) {
      console.error("Failed to mark complete:", err);
      alert("Failed to save progress. Please try again.");
    } finally {
      setIsMarking(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center animate-pulse text-indigo-600 font-bold">Loading Workspace...</div>;
  if (!course) return <div className="min-h-screen flex items-center justify-center text-rose-600 font-bold">Error loading course.</div>;

  return (
    <div className="h-[calc(100vh-64px)] bg-slate-50 flex overflow-hidden">
      
      {/* ========================================== */}
      {/* Sidebar: Curriculum */}
      {/* ========================================== */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex-shrink-0">
        
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <Link to={`/course/${course.id}`} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider mb-2 block transition-colors">
            &larr; Back to Detail
          </Link>
          <h2 className="text-lg font-extrabold text-slate-900 leading-tight mb-4">
            {course.title}
          </h2>
          
          {/* 🌟 真实的进度条 (Live Progress Bar) */}
          <div>
            <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
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
          <ul className="divide-y divide-slate-100">
            {course.modules?.map((module, index) => {
              const isExpanded = expandedModuleId === module.id;
              const sortedContents = module.contents ? [...module.contents].sort((a, b) => a.order - b.order) : [];

              return (
                <li key={module.id} className="bg-white">
                  <button 
                    onClick={() => setExpandedModuleId(isExpanded ? null : module.id)}
                    className="w-full text-left px-5 py-4 hover:bg-slate-50 flex justify-between items-center cursor-pointer group"
                  >
                    <div className="pr-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Section {index + 1}</span>
                      <h3 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">{module.title}</h3>
                    </div>
                    <svg className={`w-5 h-5 text-slate-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </button>

                  {isExpanded && (
                    <ul className="bg-slate-50/50 pb-2 border-t border-slate-50">
                      {sortedContents.map((content, cIndex) => {
                        const isActive = activeContent?.id === content.id;
                        return (
                          <li key={content.id}>
                            <button
                              onClick={() => { setActiveContent(content); setExpandedModuleId(module.id); }}
                              className={`w-full text-left px-5 py-3 pl-8 flex items-start gap-3 transition-colors cursor-pointer border-l-4 ${
                                isActive ? 'bg-indigo-50 border-indigo-600' : 'hover:bg-slate-100 border-transparent'
                              }`}
                            >
                              {/* 🌟 动态图标：如果完成了，显示绿色勾勾 */}
                              <div className="mt-0.5 relative">
                                <span className={`text-lg ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                                  {content.item.type === 'video' ? '📺' : content.item.type === 'text' ? '📝' : content.item.type === 'file' ? '📁' : '🖼️'}
                                </span>
                                {content.is_completed && (
                                  <span className="absolute -bottom-1 -right-1 bg-white rounded-full">
                                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className={`text-sm font-medium truncate ${isActive ? 'text-indigo-900 font-bold' : content.is_completed ? 'text-slate-500' : 'text-slate-700'}`}>
                                  {cIndex + 1}. {content.item.title}
                                </h4>
                                <span className={`text-[9px] uppercase font-bold tracking-widest ${isActive ? 'text-indigo-500' : 'text-slate-400'}`}>
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

      {/* ========================================== */}
      {/* Main Screen: Renderer & Navigation */}
      {/* ========================================== */}
      <div className="flex-1 flex flex-col h-full bg-white relative">
        <div className="h-16 border-b border-slate-200 flex items-center justify-between px-8 bg-white z-10 flex-shrink-0">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            {activeContent ? activeContent.item.title : 'Course Overview'}
          </h1>
          <Link to={`/courses/${id}/chat`} className="px-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm">
            Course Chat
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
          <div className="max-w-4xl mx-auto">
            {activeContent && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {activeContent.item.type === 'video' && (
                  <div className="aspect-video bg-black">
                    <iframe width="100%" height="100%" src={activeContent.item.url.includes('youtube.com') ? `https://www.youtube.com/embed/${activeContent.item.url.split('v=')[1]}` : activeContent.item.url} frameBorder="0" allowFullScreen></iframe>
                  </div>
                )}
                {activeContent.item.type === 'text' && (
                  <div className="p-10 prose prose-indigo max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap text-lg font-medium">
                    {activeContent.item.content}
                  </div>
                )}
                {activeContent.item.type === 'image' && (
                  <div className="p-8 flex justify-center bg-slate-100">
                    <img src={getMediaUrl(activeContent.item.file)} alt="lesson" className="max-h-[70vh] rounded-xl shadow-md border border-slate-200" />
                  </div>
                )}
                {activeContent.item.type === 'file' && (
                  <div className="flex flex-col h-[75vh]">
                    <iframe src={getMediaUrl(activeContent.item.file)} width="100%" height="100%" className="bg-slate-100 border-b border-slate-200"></iframe>
                    <div className="p-4 bg-white flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-500">Document preview</span>
                      <a href={getMediaUrl(activeContent.item.file)} target="_blank" rel="noreferrer" className="px-5 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-indigo-700">Download File</a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 🌟 智能底部导航栏 (Smart Navigation) */}
            {activeContent && (
              <div className="mt-8 flex justify-between items-center pb-12">
                {prevContent ? (
                  <button 
                    onClick={() => { setActiveContent(prevContent); setExpandedModuleId(prevContent.moduleId); }}
                    className="px-6 py-3 text-slate-500 font-bold hover:bg-white hover:shadow-sm rounded-xl border border-transparent hover:border-slate-200 transition-all cursor-pointer flex items-center gap-2"
                  >
                    &larr; Previous Lesson
                  </button>
                ) : <div></div>}

                <button 
                  onClick={handleCompleteAndContinue}
                  disabled={isMarking}
                  className={`px-8 py-3 font-black rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2 transform hover:-translate-y-0.5 ${
                    activeContent.is_completed && !nextContent 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  }`}
                >
                  {isMarking 
                    ? 'Saving...' 
                    : !nextContent && activeContent.is_completed 
                      ? 'Course Completed ✅' 
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