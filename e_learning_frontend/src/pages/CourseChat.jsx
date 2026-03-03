import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { getMediaUrl } from '../components/utils';

export default function CourseChat() {
  const { id } = useParams(); // course_id
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [course, setCourse] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // WebSocket and connection state
  const ws = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // File upload state
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Auto-scroll ref
  const messagesEndRef = useRef(null);

  // Fetch data
  useEffect(() => {
    const initChat = async () => {
      try {
        const [meRes, courseRes, historyRes] = await Promise.all([
          api.get('users/me/'),
          api.get(`courses/teacher/${id}/`).catch(() => api.get(`courses/${id}/`)),
          api.get(`chat/courses/${id}/history/`)
        ]);
        
        setCurrentUser(meRes.data);
        setCourse(courseRes.data);
        
        const rawHistory = historyRes.data.results || historyRes.data;
        setMessages(Array.isArray(rawHistory) ? rawHistory.reverse() : []);
      } catch (err) {
        console.error("Failed to initialize chat:", err);
      }
    };
    initChat();
  }, [id]);

  // WebSocket
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const WS_BASE = isLocal ? 'ws://localhost:8000' : `ws://${window.location.hostname}:8000`;
    if (!token) return;

    const wsUrl = `${WS_BASE}/ws/chat/${id}/?token=${token}`;
    ws.current = new WebSocket(wsUrl);
    
    ws.current.onopen = () => {
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.error) {
        console.error("WebSocket Error:", data.error);
        return;
      }
      const incomingMsg = {
        id: data.id || Date.now(),
        sender_info: { username: data.user },
        content: data.message,
        file: data.file_url,
        formatted_timestamp: data.timestamp || new Date().toLocaleTimeString()
      };
      
      setMessages((prev) => [...prev, incomingMsg]);
    };

    ws.current.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [id]);

  // Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !file) return;

    let uploadedFileUrl = null;

    if (file) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const uploadRes = await api.post('chat/upload/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedFileUrl = uploadRes.data.url;
      } catch (err) {
        alert("File upload failed.");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const payload = {
        message: newMessage,
        file_url: uploadedFileUrl
      };
      
      ws.current.send(JSON.stringify(payload));
      
      setNewMessage('');
      setFile(null);
    } else {
      alert("Chat connection lost. Please refresh.");
    }
  };

  // Delete Message
  const handleDeleteMessage = async (messageId) => {
    try {
      await api.delete(`chat/messages/${messageId}/`);
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error("Failed to delete message", error);
      alert("Failed to delete message. It might have already been removed.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-6 pb-0">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col bg-white shadow-xl border border-slate-200 sm:rounded-2xl overflow-hidden my-4">
        
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white">
          <div>
            <Link to="/dashboard" className="text-indigo-200 hover:text-white text-sm font-medium mb-1 block">
              &larr; Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {course?.title || "Course Chat"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </span>
            <span className="text-sm font-medium">{isConnected ? 'Live' : 'Connecting...'}</span>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
              <p className="text-lg font-medium">Welcome to the Course Discussion.</p>
              <p className="text-sm">Be the first to say hello!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const msgUsername = msg?.sender_info?.username || msg?.sender?.username || '';
              const currentUsername = currentUser?.username || '';
              
              const isMe = msgUsername && currentUsername && msgUsername === currentUsername;
              
              return (
                <div 
                  key={msg?.id || index} 
                  className={`group flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[11px] font-bold text-slate-400 mb-1 ml-1 mr-1 uppercase tracking-wider">
                    {msgUsername || 'Unknown User'}
                  </span>
                  
                  <div className={`flex items-center gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    {/* Message Bubble */}
                    <div className={`relative max-w-[280px] sm:max-w-md px-5 py-3 rounded-2xl shadow-sm ${
                      isMe 
                        ? 'bg-indigo-600 text-white rounded-br-none' 
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                    }`}>
                      {msg?.content && <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>}
                      
                      {msg?.file && (
                        <div className={`mt-2 ${msg.content ? 'pt-2 border-t border-white/20' : ''}`}>
                          {msg.file.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                            <img src={getMediaUrl(msg.file)} alt="attachment" className="rounded-lg max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(getMediaUrl(msg.file), '_blank')} />
                          ) : (
                            <a href={getMediaUrl(msg.file)} target="_blank" rel="noreferrer" className={`flex items-center gap-2 text-sm font-bold underline ${isMe ? 'text-indigo-100 hover:text-white' : 'text-indigo-600 hover:text-indigo-800'}`}>
                              <span>Download Attachment</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {isMe && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all cursor-pointer flex-shrink-0"
                        title="Delete message"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  <span className="text-[10px] text-slate-400 mt-1">{msg?.formatted_timestamp || 'Just now'}</span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-slate-200 p-4">
          {file && (
            <div className="mb-3 flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-lg max-w-max">
              <span className="text-xl">📎</span>
              <span className="text-sm font-semibold text-slate-700 truncate max-w-[200px]">{file.name}</span>
              <button onClick={() => setFile(null)} className="text-slate-400 hover:text-rose-600 ml-2 font-bold cursor-pointer">&times;</button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
            <label className="p-3 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-indigo-600 rounded-xl cursor-pointer transition-colors shadow-sm">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            </label>
            
            <input
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 px-5 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none text-slate-700"
            />
            
            <button 
              type="submit" 
              disabled={isUploading || (!newMessage.trim() && !file) || !isConnected}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm disabled:bg-indigo-400 transition-colors flex items-center gap-2 cursor-pointer"
            >
              {isUploading ? 'Sending...' : 'Send'}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}