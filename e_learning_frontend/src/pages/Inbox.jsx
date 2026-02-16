import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { getMediaUrl } from '../components/utils';


export default function Inbox() {
  const { userId } = useParams(); // Extract target_user_id from URL if starting a new chat
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  
  // chat state
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  // web socket state
  const ws = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef(null);

  // fetch me and recent conversations
  useEffect(() => {
    const initInbox = async () => {
      try {
        const meRes = await api.get('users/me/');
        setCurrentUser(meRes.data);

        const convRes = await api.get('chat/conversations/');
        setConversations(convRes.data.conversations || []);
        
        // If there no userId in URL but we have conversations, auto-select the first one
        if (!userId && convRes.data.conversations?.length > 0) {
          navigate(`/inbox/${convRes.data.conversations[0].partner_id}`, { replace: true });
        }
      } catch (err) {
        console.error("Failed to load inbox:", err);
      }
    };
    initInbox();
  }, []); // Only run once on mount

  // When userId changes, load chat history & get room_name
  useEffect(() => {
    if (!userId) {
      setActivePartner(null);
      setMessages([]);
      setRoomName('');
      return;
    }

    const loadActiveChat = async () => {
      try {
        // Fetch target user info (to display in header)
        // Note: Assuming you have an endpoint to get a user by ID or we just rely on history data.
        // For robustness, we extract partner info from the first message or let the UI handle it.
        const historyRes = await api.get(`chat/private/${userId}/history/`);
        
        // Backend returns: { room_name: "private_1_2", messages: [...] }
        setRoomName(historyRes.data.room_name);
        
        // Reverse array to chronologically sort messages
        const historyMsgs = historyRes.data.messages || [];
        setMessages(historyMsgs);
        
        // Find partner info from conversations list to populate header
        const partnerInfo = conversations.find(c => c.partner_id === parseInt(userId));
        setActivePartner(partnerInfo || { id: userId, username: "Chat Partner" });

      } catch (err) {
        console.error("Failed to load private chat history:", err);
      }
    };

    loadActiveChat();
  }, [userId, conversations]);

  // create websocket connection when roomName is acquired
  useEffect(() => {
    if (!roomName) return;

    const token = localStorage.getItem('access_token');
    const wsUrl = `ws://localhost:8000/ws/chat/${roomName}/?token=${token}`;
    
    // Close existing connection if switching chats
    if (ws.current) ws.current.close();

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log(`Connected to Private Chat: ${roomName}`);
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.error) {
        alert("Chat Error: " + data.error);
        return;
      }

      const incomingMsg = {
        id: Date.now(),
        sender_info: { username: data.user },
        content: data.message,
        file: data.file_url,
        formatted_timestamp: data.timestamp
      };
      
      setMessages((prev) => [...prev, incomingMsg]);
      api.get('chat/conversations/').then(res => setConversations(res.data.conversations || []));
    };

    ws.current.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [roomName]);


  // handle send message
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
      // Send payload matching PrivateChatConsumer requirements
      const payload = {
        message: newMessage,
        file_url: uploadedFileUrl,
        target_user_id: parseInt(userId)
      };
      ws.current.send(JSON.stringify(payload));
      setNewMessage('');
      setFile(null);
    } else {
      alert("Chat connection lost. Please refresh.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full mx-auto flex bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden h-[85vh]">
        
        {/* chat list */}
        <div className="w-1/3 border-r border-slate-200 flex flex-col bg-slate-50">
          <div className="p-6 border-b border-slate-200 bg-white">
            <h2 className="text-2xl font-extrabold text-slate-900">Inbox</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No recent conversations. Go to the Community tab to find people!
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {conversations.map((conv) => (
                  <li key={conv.partner_id}>
                    <Link 
                      to={`/inbox/${conv.partner_id}`}
                      className={`flex items-center gap-4 p-4 transition-colors cursor-pointer ${
                        parseInt(userId) === conv.partner_id 
                          ? 'bg-indigo-50 border-l-4 border-indigo-600' 
                          : 'hover:bg-slate-100 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 border border-slate-300 flex-shrink-0">
                        {conv.photo_url && conv.photo_url !== "/static/images/default_avatar.png" ? (
                          <img src={getMediaUrl(conv.photo_url)} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-indigo-600 font-bold">
                            {conv.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h4 className="text-sm font-bold text-slate-900 truncate">{conv.username}</h4>
                          <span className="text-[10px] text-slate-400 font-medium">{conv.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{conv.last_message}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* right side - chat window */}
        <div className="w-2/3 flex flex-col bg-white">
          {!userId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <svg className="w-16 h-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              <p className="text-lg font-medium">Select a conversation to start messaging</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-slate-900">{activePartner?.username}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{isConnected ? 'Connected' : 'Connecting'}</span>
                </div>
              </div>

              {/* messages */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-6">
                {messages.length === 0 ? (
                  <div className="text-center text-slate-400 mt-10 text-sm font-medium">
                    This is the beginning of your conversation with {activePartner?.username}.
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMe = msg.sender_info.username === currentUser?.username;
                    return (
                      <div key={msg.id || index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`relative max-w-[70%] px-5 py-3 rounded-2xl shadow-sm ${
                          isMe 
                            ? 'bg-indigo-600 text-white rounded-br-none' 
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                        }`}>
                          {msg.content && <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>}
                          {msg.file && (
                            <div className={`mt-2 ${msg.content ? 'pt-2 border-t border-white/20' : ''}`}>
                              {msg.file.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                <img src={getMediaUrl(msg.file)} alt="attachment" className="rounded-lg max-h-48 object-cover cursor-pointer hover:opacity-90" onClick={() => window.open(getMediaUrl(msg.file), '_blank')} />
                              ) : (
                                <a href={getMediaUrl(msg.file)} target="_blank" rel="noreferrer" className={`text-sm font-bold underline ${isMe ? 'text-indigo-100' : 'text-indigo-600'}`}>
                                  📁 Download Attachment
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1">{msg.formatted_timestamp}</span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* chat input */}
              <div className="bg-white border-t border-slate-200 p-4">
                {file && (
                  <div className="mb-2 flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg max-w-max">
                    <span className="text-sm font-semibold text-slate-700 truncate">{file.name}</span>
                    <button onClick={() => setFile(null)} className="text-slate-400 hover:text-rose-600 font-bold">&times;</button>
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <label className="p-3 bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-xl cursor-pointer transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                  </label>
                  <input
                    type="text"
                    placeholder="Message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700"
                  />
                  <button 
                    type="submit" 
                    disabled={isUploading || (!newMessage.trim() && !file) || !isConnected}
                    className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl disabled:bg-indigo-300 cursor-pointer"
                  >
                    {isUploading ? '...' : 'Send'}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}