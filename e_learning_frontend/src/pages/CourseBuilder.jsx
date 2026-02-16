import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function CourseBuilder() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDesc, setNewModuleDesc] = useState('');
  const [isAddingModule, setIsAddingModule] = useState(false);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [courseForm, setCourseForm] = useState({ title: '', course_code: '', overview: '' });
  const [courseImageFile, setCourseImageFile] = useState(null);
  const [isUpdatingCourse, setIsUpdatingCourse] = useState(false);
  
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [contentType, setContentType] = useState('text');
  const [contentForm, setContentForm] = useState({ title: '', content: '', url: '' });
  const [contentFile, setContentFile] = useState(null);
  const [isAddingContent, setIsAddingContent] = useState(false);

  const [previewItem, setPreviewItem] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // 🌟 核心修复器：确保媒体路径强制指向 Django 的 8000 端口
  const getMediaUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path; // 如果已经是绝对路径，直接用
    return `http://localhost:8000${path}`; // 如果是相对路径，拼上 Django 的地址
  };

  useEffect(() => {
    fetchCourseAndModules();
  }, [id]);

  const fetchCourseAndModules = async () => {
    try {
      const courseRes = await api.get(`courses/teacher/${id}/`);
      setCourse(courseRes.data);

      setCourseForm({
        title: courseRes.data.title || '',
        course_code: courseRes.data.course_code || '',
        overview: courseRes.data.overview || ''
      });

      const modulesRes = await api.get(`courses/teacher/${id}/modules/`);
      const fetchedModules = modulesRes.data.results ? modulesRes.data.results : modulesRes.data;
      setModules(Array.isArray(fetchedModules) ? fetchedModules : []);
    } catch (err) {
      setError('Could not load course details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    setIsUpdatingCourse(true);
    try {
      const formData = new FormData();
      formData.append('title', courseForm.title);
      formData.append('course_code', courseForm.course_code);
      formData.append('overview', courseForm.overview);
      
      // 只有当老师真的选了新图片时，才传 file
      if (courseImageFile) {
        formData.append('image', courseImageFile);
      }

      // 注意这里用 PATCH 而不是 PUT，因为我们可能只更新部分字段
      const res = await api.patch(`courses/teacher/${id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setCourse(res.data); // 瞬间刷新页面上的课程标题
      setShowSettingsModal(false);
      setCourseImageFile(null);
      alert("Course updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update course.");
    } finally {
      setIsUpdatingCourse(false);
    }
  };

  // 🌟 新增：彻底删除课程
  const handleDeleteCourse = async () => {
    const confirmName = window.prompt(`🚨 DANGER ZONE 🚨\n\nThis will permanently delete ALL modules, contents, and student records for this course.\n\nType the course name "${course.title}" to confirm:`);
    
    if (confirmName !== course.title) {
      if (confirmName !== null) alert("Course name did not match. Deletion cancelled.");
      return;
    }

    try {
      await api.delete(`courses/teacher/${id}/`);
      alert("Course permanently deleted.");
      navigate('/dashboard'); // 删完立刻逃离案发现场，回到 Dashboard
    } catch (err) {
      alert("Failed to delete course.");
    }
  };

  const handleDeleteModule = async (moduleId, moduleTitle) => {
    if (!window.confirm(`🚨 DANGER ZONE 🚨\n\nAre you sure you want to delete "${moduleTitle}"?\nAll contents inside this module will be permanently lost.`)) return;

    try {
      // 调用后端删除接口
      await api.delete(`courses/teacher/modules/${moduleId}/`);
      
      // 🌟 核心修复：直接过滤独立的 modules 状态数组
      setModules(prevModules => prevModules.filter(m => m.id !== moduleId));
      
    } catch (err) {
      console.error("Failed to delete module:", err);
      alert("Failed to delete module. Please try again.");
    }
  };

  const handleAddModule = async (e) => {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;
    setIsAddingModule(true);
    try {
      const response = await api.post(`courses/teacher/${id}/modules/`, {
        title: newModuleTitle,
        description: newModuleDesc
      });
      setModules([...modules, { ...response.data, contents: [] }]);
      setNewModuleTitle('');
      setNewModuleDesc('');
    } catch (err) {
      alert('Failed to create module.');
    } finally {
      setIsAddingModule(false);
    }
  };

  const handleAddContent = async (e) => {
    e.preventDefault();
    setIsAddingContent(true);
    try {
      let payload;
      let config = {};
      if (contentType === 'text') {
        payload = { title: contentForm.title, content: contentForm.content };
      } else if (contentType === 'video') {
        payload = { title: contentForm.title, url: contentForm.url };
      } else if (contentType === 'image' || contentType === 'file') {
        payload = new FormData();
        payload.append('title', contentForm.title);
        payload.append('file', contentFile);
        config = { headers: { 'Content-Type': 'multipart/form-data' } };
      }
      await api.post(`courses/teacher/modules/${activeModuleId}/content/${contentType}/`, payload, config);
      fetchCourseAndModules();
      closeModal();
    } catch (err) {
      alert('Failed to add content.');
    } finally {
      setIsAddingContent(false);
    }
  };

  const handleDeleteContent = async (contentId) => {
    if (!window.confirm("Are you sure you want to delete this content?")) return;
    try {
      await api.delete(`courses/teacher/content/${contentId}/`);
      setModules(prev => prev.map(mod => ({
        ...mod,
        contents: mod.contents.filter(c => c.id !== contentId)
      })));
    } catch (err) {
      alert("Delete failed.");
    }
  };

  const closeModal = () => {
    setActiveModuleId(null);
    setContentType('text');
    setContentForm({ title: '', content: '', url: '' });
    setContentFile(null);
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center animate-pulse text-indigo-600 font-bold text-xl">Loading Builder...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Link to="/dashboard" className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1 mb-2">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            {course.title}
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">Builder Mode</span>
          </h1>
          
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-2">Curriculum</h2>
            {modules.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-10 text-center text-slate-500">
                Start building your course by adding your first module.
              </div>
            ) : (
              <div className="space-y-4">
                {modules.map((module, index) => (
                  <div key={module.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    
                    {/* 🌟 修复点 1: 修改了 items-center 为 items-start，并加上 gap-4 防粘连 */}
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-start gap-4">
                      
                      {/* 🌟 修复点 2: 最重要的一步，加上 flex-1 和 min-w-0，防止文字撑爆屏幕 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          {/* 加了 flex-shrink-0 防止数字序号变扁 */}
                          <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                            {index + 1}
                          </span>
                          <h3 className="text-lg font-bold text-slate-800 truncate">{module.title}</h3>
                        </div>
                        {module.description && (
                          <p className="text-sm text-slate-500 ml-11 line-clamp-2 break-words">
                            {module.description}
                          </p>
                        )}
                      </div>

                      {/* 🌟 修复点 3: 确保按钮区域绝对不被挤压 (你原来写了 flex-shrink-0，这很好，保持不变) */}
                      <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                        <button 
                          onClick={() => handleDeleteModule(module.id, module.title)}
                          className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Module"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>

                        <button 
                          onClick={() => setActiveModuleId(module.id) }
                          className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-sm transition-colors cursor-pointer"
                        >
                          + Add Content
                        </button>
                      </div>
                    </div>
                    
                    {/* 👇 下方的课件列表渲染部分保持你原来的代码不变 👇 */}
                    <div className="p-4 bg-white">
                      {(!module.contents || module.contents.length === 0) ? (
                        <p className="text-center text-sm text-slate-400 italic py-2">No content uploaded yet.</p>
                      ) : (
                        <ul className="space-y-3">
                          {[...module.contents].sort((a, b) => a.order - b.order).map((item, i) => (
                            <li key={item.id} className="group flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-all">
                              <span className="text-2xl">{item.item.type === 'video' ? '📺' : item.item.type === 'text' ? '📝' : item.item.type === 'file' ? '📁' : '🖼️'}</span>
                              <div className="flex-1 min-w-0"> {/* 这里也加上 min-w-0 防止文件名过长撑爆 */}
                                <h4 className="text-sm font-bold text-slate-800 truncate">{item.item.title}</h4>
                                <span className="text-[10px] uppercase font-bold text-slate-400">{item.item.type}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button onClick={() => setPreviewItem(item)} className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg cursor-pointer" title="Preview">
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </button>
                                <button onClick={() => handleDeleteContent(item.id)} className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-lg cursor-pointer" title="Delete">
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <button 
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 mb-8 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            ⚙️ Course Settings
          </button>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Add New Module</h3>
              <form onSubmit={handleAddModule} className="space-y-4">
                <input type="text" required placeholder="Module Title" value={newModuleTitle} onChange={(e) => setNewModuleTitle(e.target.value)} className="block w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm" />
                <textarea rows="3" placeholder="Description (Optional)" value={newModuleDesc} onChange={(e) => setNewModuleDesc(e.target.value)} className="block w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm resize-none"></textarea>
                <button type="submit" disabled={isAddingModule} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer">{isAddingModule ? 'Adding...' : 'Add Module'}</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 沉浸式预览模态框 (包含图片和文件的终极修复) */}
      {previewItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-black text-slate-900">{previewItem.item.title} <span className="text-xs font-normal text-slate-400 uppercase">({previewItem.item.type} Preview)</span></h3>
              <button onClick={() => setPreviewItem(null)} className="p-2 hover:bg-slate-200 rounded-full cursor-pointer"><svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-white">
              
              {/* 视频 */}
              {previewItem.item.type === 'video' && (
                <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-inner">
                  <iframe width="100%" height="100%" src={previewItem.item.url.includes('youtube.com') ? `https://www.youtube.com/embed/${previewItem.item.url.split('v=')[1]}` : previewItem.item.url} frameBorder="0" allowFullScreen></iframe>
                </div>
              )}
              
              {/* 文本 */}
              {previewItem.item.type === 'text' && (
                <div className="prose prose-indigo max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">{previewItem.item.content}</div>
              )}
              
              {/* 🌟 图片 (强力修复绝对路径) */}
              {previewItem.item.type === 'image' && (
                <div className="flex justify-center">
                  <img src={getMediaUrl(previewItem.item.file)} alt="preview" className="max-h-[60vh] h-auto rounded-lg shadow-md border border-slate-100" />
                </div>
              )}
              
              {/* 🌟 文件直接内嵌预览 (支持 PDF 等浏览器原生格式) */}
              {previewItem.item.type === 'file' && (
                <div className="flex flex-col h-[70vh]">
                  <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
                    <iframe 
                      src={getMediaUrl(previewItem.item.file)} 
                      width="100%" 
                      height="100%" 
                      title="File Preview"
                      className="bg-white"
                    ></iframe>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {activeModuleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 transform transition-all">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-xl font-bold text-slate-900">Add Content to Module</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleAddContent} className="space-y-5">
              {/* 1. 类型选择器 (Type Selector) */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Content Type</label>
                <select 
                  value={contentType} onChange={(e) => setContentType(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-700"
                >
                  <option value="text">📝 Text / Article</option>
                  <option value="video">📺 Video URL</option>
                  <option value="image">🖼️ Image</option>
                  <option value="file">📁 Document / File</option>
                </select>
              </div>

              {/* 2. 通用字段：标题 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Content Title</label>
                <input 
                  type="text" required placeholder="e.g. Introduction to Variables" value={contentForm.title} onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              {/* 3. 动态表单区域 (Dynamic Fields) */}
              {contentType === 'text' && (
                <div className="animate-fade-in">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Article Content</label>
                  <textarea 
                    required rows="5" placeholder="Write your lesson here..." value={contentForm.content} onChange={(e) => setContentForm({ ...contentForm, content: e.target.value })}
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm resize-y"
                  ></textarea>
                </div>
              )}

              {contentType === 'video' && (
                <div className="animate-fade-in">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Video URL (YouTube/Vimeo)</label>
                  <input 
                    type="url" required placeholder="https://..." value={contentForm.url} onChange={(e) => setContentForm({ ...contentForm, url: e.target.value })}
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
              )}

              {(contentType === 'image' || contentType === 'file') && (
                <div className="animate-fade-in">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Upload File</label>
                  <input 
                    type="file" required onChange={(e) => setContentFile(e.target.files[0])}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors"
                  />
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isAddingContent} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm disabled:bg-indigo-400 transition-colors cursor-pointer">
                  {isAddingContent ? 'Saving...' : 'Save Content'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="text-xl font-black text-slate-900">Course Settings</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="course-settings-form" onSubmit={handleUpdateCourse} className="space-y-5">
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Course Title</label>
                    <input type="text" required value={courseForm.title} onChange={(e) => setCourseForm({...courseForm, title: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium outline-none" />
                  </div>
                  <div className="w-1/3">
                    <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Code</label>
                    <input type="text" value={courseForm.course_code} onChange={(e) => setCourseForm({...courseForm, course_code: e.target.value})} placeholder="e.g. CS101" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Course Overview</label>
                  <textarea rows="4" value={courseForm.overview} onChange={(e) => setCourseForm({...courseForm, overview: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 outline-none resize-none"></textarea>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Cover Image</label>
                  <input type="file" accept="image/*" onChange={(e) => setCourseImageFile(e.target.files[0])} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors" />
                  {course.image && !courseImageFile && (
                    <p className="mt-2 text-xs text-emerald-600 font-medium">✓ Current image active. Uploading a new one will replace it.</p>
                  )}
                </div>
              </form>

              {/* 危险区 */}
              <div className="mt-8 pt-6 border-t border-rose-100">
                <h4 className="text-sm font-bold text-rose-600 mb-2">Danger Zone</h4>
                <p className="text-xs text-slate-500 mb-3">Once you delete a course, there is no going back. Please be certain.</p>
                <button type="button" onClick={handleDeleteCourse} className="w-full py-3 bg-white border-2 border-rose-100 hover:border-rose-500 hover:bg-rose-50 text-rose-600 font-bold rounded-xl transition-all cursor-pointer">
                  Delete This Course
                </button>
              </div>
            </div>

            {/* 底部保存按钮 */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex justify-end gap-3">
              <button type="button" onClick={() => setShowSettingsModal(false)} className="px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer">Cancel</button>
              <button type="submit" form="course-settings-form" disabled={isUpdatingCourse} className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer">
                {isUpdatingCourse ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}