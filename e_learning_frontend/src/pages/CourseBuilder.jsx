import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getMediaUrl } from '../components/utils';

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
      
      if (courseImageFile) {
        formData.append('image', courseImageFile);
      }

      const res = await api.patch(`courses/teacher/${id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setCourse(res.data); 
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

  const handleDeleteCourse = async () => {
    const confirmName = window.prompt(`DANGER ZONE \n\nThis will permanently delete ALL modules, contents, and student records for this course.\n\nType the course name "${course.title}" to confirm:`);
    
    if (confirmName !== course.title) {
      if (confirmName !== null) alert("Course name did not match. Deletion cancelled.");
      return;
    }

    try {
      await api.delete(`courses/teacher/${id}/`);
      alert("Course permanently deleted.");
      navigate('/dashboard');
    } catch (err) {
      alert("Failed to delete course.");
    }
  };

  const handleDeleteModule = async (moduleId, moduleTitle) => {
    if (!window.confirm(`DANGER ZONE \n\nAre you sure you want to delete "${moduleTitle}"?\nAll contents inside this module will be permanently lost.`)) return;

    try {
      await api.delete(`courses/teacher/modules/${moduleId}/`);
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
    <div className="min-h-screen bg-slate-50 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-5xl mx-auto">
        
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex-1 min-w-0">
            <Link to="/dashboard" className="text-xs sm:text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1 mb-2">
              &larr; Back to Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className="truncate max-w-full">{course.title}</span>
            </h1>
          </div>
          
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-sm transition-all cursor-pointer w-full sm:w-auto flex-shrink-0"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="text-sm sm:text-base">Course Settings</span>
          </button>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 border-b border-slate-200 pb-2">Curriculum</h2>
            {modules.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-6 sm:p-10 text-center text-sm sm:text-base text-slate-500">
                Start building your course by adding your first module.
              </div>
            ) : (
              <div className="space-y-4">
                {modules.map((module, index) => (
                  <div key={module.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    
                    <div className="bg-slate-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-start gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex items-center gap-2 sm:gap-3 mb-1">
                          <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs sm:text-sm">
                            {index + 1}
                          </span>
                          <h3 className="text-base sm:text-lg font-bold text-slate-800 truncate">{module.title}</h3>
                        </div>
                        {module.description && (
                          <p className="text-xs sm:text-sm text-slate-500 ml-8 sm:ml-11 line-clamp-2 break-words">
                            {module.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2 flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-1">
                        <button 
                          onClick={() => handleDeleteModule(module.id, module.title)}
                          className="p-1.5 sm:p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Module"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>

                        <button 
                          onClick={() => setActiveModuleId(module.id) }
                          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs sm:text-sm transition-colors cursor-pointer"
                        >
                          + Add Content
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-3 sm:p-4 bg-white">
                      {(!module.contents || module.contents.length === 0) ? (
                        <p className="text-center text-xs sm:text-sm text-slate-400 italic py-2">No content uploaded yet.</p>
                      ) : (
                        <ul className="space-y-2 sm:space-y-3">
                          {[...module.contents].sort((a, b) => a.order - b.order).map((item, i) => (
                            <li key={item.id} className="group flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-all">
                              <div className="flex-1 min-w-0"> 
                                <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">{item.item.title}</h4>
                                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400">{item.item.type}</span>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                <button onClick={() => setPreviewItem(item)} className="p-1.5 sm:p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg cursor-pointer" title="Preview">
                                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </button>
                                <button onClick={() => handleDeleteContent(item.id)} className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-lg cursor-pointer" title="Delete">
                                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
            <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm sticky top-20">
              <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-3 sm:mb-4">Add New Module</h3>
              <form onSubmit={handleAddModule} className="space-y-3 sm:space-y-4">
                <input type="text" required placeholder="Module Title" value={newModuleTitle} onChange={(e) => setNewModuleTitle(e.target.value)} className="block w-full px-3 sm:px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm" />
                <textarea rows="3" placeholder="Description (Optional)" value={newModuleDesc} onChange={(e) => setNewModuleDesc(e.target.value)} className="block w-full px-3 sm:px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm resize-none"></textarea>
                <button type="submit" disabled={isAddingModule} className="w-full py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer text-sm sm:text-base">{isAddingModule ? 'Adding...' : 'Add Module'}</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 truncate pr-2">{previewItem.item.title} <span className="text-[10px] sm:text-xs font-normal text-slate-400 uppercase hidden sm:inline">({previewItem.item.type} Preview)</span></h3>
              <button onClick={() => setPreviewItem(null)} className="p-1.5 sm:p-2 hover:bg-slate-200 rounded-full cursor-pointer flex-shrink-0"><svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white">
              {previewItem.item.type === 'video' && (
                <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-inner">
                  <iframe width="100%" height="100%" src={previewItem.item.url.includes('youtube.com') ? `https://www.youtube.com/embed/${previewItem.item.url.split('v=')[1]}` : previewItem.item.url} frameBorder="0" allowFullScreen></iframe>
                </div>
              )}
              {previewItem.item.type === 'text' && (
                <div className="prose prose-sm sm:prose prose-indigo max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">{previewItem.item.content}</div>
              )}
              {previewItem.item.type === 'image' && (
                <div className="flex justify-center">
                  <img src={getMediaUrl(previewItem.item.file)} alt="preview" className="max-h-[50vh] sm:max-h-[60vh] h-auto rounded-lg shadow-md border border-slate-100" />
                </div>
              )}
              {previewItem.item.type === 'file' && (
                <div className="flex flex-col h-[60vh] sm:h-[70vh]">
                  <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
                    <iframe src={getMediaUrl(previewItem.item.file)} width="100%" height="100%" title="File Preview" className="bg-white"></iframe>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Content Modal */}
      {activeModuleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 sm:p-6 transform transition-all max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 sm:pb-4 mb-3 sm:mb-4 flex-shrink-0">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Add Content</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="overflow-y-auto pr-1">
              <form id="add-content-form" onSubmit={handleAddContent} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">Content Type</label>
                  <select 
                    value={contentType} onChange={(e) => setContentType(e.target.value)}
                    className="block w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-700"
                  >
                    <option value="text">Text / Article</option>
                    <option value="video">Video URL</option>
                    <option value="image">Image</option>
                    <option value="file">Document / File</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">Content Title</label>
                  <input 
                    type="text" required placeholder="e.g. Introduction to Variables" value={contentForm.title} onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                    className="block w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                {contentType === 'text' && (
                  <div className="animate-fade-in">
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">Article Content</label>
                    <textarea 
                      required rows="4" placeholder="Write your lesson here..." value={contentForm.content} onChange={(e) => setContentForm({ ...contentForm, content: e.target.value })}
                      className="block w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm resize-y"
                    ></textarea>
                  </div>
                )}

                {contentType === 'video' && (
                  <div className="animate-fade-in">
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">Video URL (YouTube/Vimeo)</label>
                    <input 
                      type="url" required placeholder="https://..." value={contentForm.url} onChange={(e) => setContentForm({ ...contentForm, url: e.target.value })}
                      className="block w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                )}

                {(contentType === 'image' || contentType === 'file') && (
                  <div className="animate-fade-in">
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">Upload File</label>
                    <input 
                      type="file" required onChange={(e) => setContentFile(e.target.files[0])}
                      className="block w-full text-xs sm:text-sm text-slate-500 file:mr-3 sm:file:mr-4 file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors"
                    />
                  </div>
                )}
              </form>
            </div>

            <div className="pt-4 mt-auto flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
              <button type="button" onClick={closeModal} className="w-full sm:flex-1 py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer text-sm sm:text-base">
                Cancel
              </button>
              <button type="submit" form="add-content-form" disabled={isAddingContent} className="w-full sm:flex-1 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm disabled:bg-indigo-400 transition-colors cursor-pointer text-sm sm:text-base">
                {isAddingContent ? 'Saving...' : 'Save Content'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all flex flex-col max-h-[95vh] sm:max-h-[90vh]">
            
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl flex-shrink-0">
              <h3 className="text-lg sm:text-xl font-black text-slate-900">Course Settings</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"><svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <form id="course-settings-form" onSubmit={handleUpdateCourse} className="space-y-4 sm:space-y-5">
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-[10px] sm:text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Course Title</label>
                    <input type="text" required value={courseForm.title} onChange={(e) => setCourseForm({...courseForm, title: e.target.value})} className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm sm:text-base font-medium outline-none" />
                  </div>
                  <div className="w-full sm:w-1/3">
                    <label className="block text-[10px] sm:text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Code</label>
                    <input type="text" value={courseForm.course_code} onChange={(e) => setCourseForm({...courseForm, course_code: e.target.value})} placeholder="e.g. CS101" className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm sm:text-base font-medium outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] sm:text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Course Overview</label>
                  <textarea rows="4" value={courseForm.overview} onChange={(e) => setCourseForm({...courseForm, overview: e.target.value})} className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm sm:text-base outline-none resize-y"></textarea>
                </div>

                <div>
                  <label className="block text-[10px] sm:text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Cover Image</label>
                  <input type="file" accept="image/*" onChange={(e) => setCourseImageFile(e.target.files[0])} className="block w-full text-xs sm:text-sm text-slate-500 file:mr-3 sm:file:mr-4 file:py-2 sm:file:py-2.5 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors" />
                  {course.image && !courseImageFile && (
                    <p className="mt-2 text-[10px] sm:text-xs text-emerald-600 font-medium">Uploading a new one will replace the current cover.</p>
                  )}
                </div>
              </form>

              {/* Danger Zone */}
              <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-rose-100">
                <h4 className="text-xs sm:text-sm font-bold text-rose-600 mb-1 sm:mb-2">Danger Zone</h4>
                <p className="text-[10px] sm:text-xs text-slate-500 mb-3">Once you delete a course, there is no going back. Please be certain.</p>
                <button type="button" onClick={handleDeleteCourse} className="w-full py-2.5 sm:py-3 bg-white border-2 border-rose-100 hover:border-rose-500 hover:bg-rose-50 text-rose-600 text-sm sm:text-base font-bold rounded-xl transition-all cursor-pointer">
                  Delete This Course
                </button>
              </div>
            </div>

            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 flex-shrink-0">
              <button type="button" onClick={() => setShowSettingsModal(false)} className="w-full sm:w-auto px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer text-sm sm:text-base">Cancel</button>
              <button type="submit" form="course-settings-form" disabled={isUpdatingCourse} className="w-full sm:w-auto px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer text-sm sm:text-base">
                {isUpdatingCourse ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}