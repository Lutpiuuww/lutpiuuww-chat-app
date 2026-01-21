import { useState, useEffect, useRef } from 'react'

function App() {
  // --- STATE USER & LOGIN ---
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // --- STATE SYSTEM ---
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [socket, setSocket] = useState(null)
  
  // State Room
  const [currentRoom, setCurrentRoom] = useState("Lobi Utama")
  const [publicRooms] = useState(["Lobi Utama", "Project Coding", "Ghibah Squad"])
  const [isPrivate, setIsPrivate] = useState(false)
  
  // State Tampilan Mobile
  const [isSidebarOpen, setSidebarOpen] = useState(false); 
  
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null);

  // --- WEBSOCKET LOGIC ---
  useEffect(() => {
    if (!isLoggedIn) return;
    setMessages([]); 

    const safeRoomId = encodeURIComponent(currentRoom);
    const safeUsername = encodeURIComponent(username);
    
    // LINK WEBSOCKET (Pastikan pakai wss:// dan alamat ngrok backend kamu)
    const ws = new WebSocket(`wss://lutpiuuww-lutpiuuww-backend.hf.space/ws/${safeRoomId}/${safeUsername}`);

    ws.onopen = () => console.log(`Joined room: ${currentRoom}`);
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((prev) => [...prev, message]);
    };

    setSocket(ws);
    return () => ws.close();
  }, [currentRoom, isLoggedIn]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- FUNGSI-FUNGSI ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim()) setIsLoggedIn(true);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    const payload = { sender: username, content: input, type: "text" };
    socket.send(JSON.stringify(payload));
    setInput("");
  };

  // --- FUNGSI UPLOAD YANG SUDAH DIPERBAIKI ---
  // Perhatikan kata 'async' di bawah ini yang sebelumnya hilang
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Fetch ke alamat ngrok backend (https)
      const response = await fetch("https://lutpiuuww-lutpiuuww-backend.hf.space/upload", {
// ... sisanya sama 
        method: "POST", 
        body: formData,
      });
      
      const data = await response.json();
      
      if (socket) {
        socket.send(JSON.stringify({ 
            sender: username, 
            content: "Mengirim gambar...", 
            type: "image", 
            file_url: data.url 
        }));
      }
    } catch (error) { 
        console.error("Error upload:", error);
        alert("Gagal upload! Cek koneksi ngrok."); 
    }
  };

  const joinPrivateRoom = () => {
    const secretCode = prompt("Masukkan KODE RAHASIA room:");
    if (secretCode && secretCode.trim() !== "") {
      setCurrentRoom(secretCode);
      setIsPrivate(true);
      setSidebarOpen(false); 
    }
  };

  const joinPublicRoom = (roomName) => {
    setCurrentRoom(roomName);
    setIsPrivate(false);
    setSidebarOpen(false); 
  }

  // --- HALAMAN LOGIN ---
  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-slate-900 text-white font-sans px-4">
        <div className="w-full max-w-sm p-6 bg-slate-800/80 backdrop-blur rounded-2xl shadow-2xl border border-slate-700 text-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl shadow-lg">👋</div>
          <h1 className="text-2xl font-bold mb-2">Lutpiuuww Chat</h1>
          <p className="text-slate-400 text-sm mb-6">Mobile Version</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="text" placeholder="Nama Kamu" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl focus:outline-none focus:border-cyan-500 text-center"
              autoFocus
            />
            <button type="submit" disabled={!username.trim()} className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold shadow-lg transition-all disabled:opacity-50">Masuk</button>
          </form>
        </div>
      </div>
    );
  }

  // --- HALAMAN UTAMA (Responsive) ---
  return (
    <div className="flex h-screen w-screen bg-slate-900 text-slate-200 font-sans overflow-hidden relative">
      
      {/* OVERLAY GELAP */}
      {isSidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm transition-opacity"
        ></div>
      )}

      {/* SIDEBAR */}
      <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-800 border-r border-slate-700 flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:relative md:translate-x-0`}>
        
        <div className="p-5 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h1 className="font-bold text-xl text-cyan-400 tracking-wider">Lutpiuuww</h1>
            <p className="text-[10px] text-slate-500">User: <span className="text-white">{username}</span></p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          <div>
            <p className="text-xs font-bold text-slate-500 px-2 mb-3 uppercase">Public Rooms</p>
            <div className="space-y-1">
              {publicRooms.map((room) => (
                <button
                  key={room}
                  onClick={() => joinPublicRoom(room)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3
                    ${currentRoom === room && !isPrivate ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30' : 'hover:bg-slate-700/50 text-slate-400'}`}
                >
                  <span className="text-lg opacity-50">#</span> {room}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-rose-500 px-2 mb-3 uppercase">Private Access</p>
            <button onClick={joinPrivateRoom} className={`w-full text-left px-4 py-4 rounded-xl flex items-center gap-3 border border-dashed ${isPrivate ? 'bg-rose-500/20 text-rose-400 border-rose-500' : 'border-slate-600 text-slate-400'}`}>
              <span className="text-lg">🔒</span> {isPrivate ? "Secret Mode" : "Join Secret Room"}
            </button>
          </div>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col relative w-full bg-slate-900">
        
        <div className="h-16 border-b border-slate-700 flex items-center px-4 bg-slate-900/95 backdrop-blur z-20 justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
            </button>
            <span className={`text-xl flex-shrink-0 ${isPrivate ? 'text-rose-500' : 'text-slate-400'}`}>{isPrivate ? '🔒' : '#'}</span>
            <h2 className="font-bold text-white truncate">{currentRoom}</h2>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2 px-2 py-1 bg-green-500/10 rounded-full border border-green-500/20">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> 
            <span className="hidden sm:inline text-xs text-green-400 font-medium">Online</span>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-hide">
          {messages.map((msg, index) => {
            const isMe = msg.sender === username;
            return (
              <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                {!isMe && (
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0 border border-slate-600 flex items-center justify-center text-xs font-bold text-slate-300 mr-2 mt-1">
                    {msg.sender.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm text-sm break-words
                  ${isMe ? 'bg-cyan-600 text-white rounded-br-sm' : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-sm'}`}>
                  {!isMe && <p className="text-[10px] font-bold text-cyan-500 mb-1 uppercase">{msg.sender}</p>}
                  {msg.type === 'image' ? (
                    <img src={msg.file_url} className="rounded-lg max-h-60 border border-white/10 mt-1" />
                  ) : (
                    <p className="leading-relaxed">{msg.content}</p>
                  )}
                  <p className="text-[9px] text-right mt-1 opacity-60">{new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 bg-slate-900 border-t border-slate-700">
          <form onSubmit={sendMessage} className="flex gap-2 items-center bg-slate-800 p-2 rounded-full border border-slate-700">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
            <button type="button" onClick={() => fileInputRef.current.click()} className="p-2 text-slate-400 bg-slate-700 rounded-full hover:text-cyan-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 6.187l-5.132 5.132" /></svg>
            </button>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ketik pesan..." className="flex-1 bg-transparent text-white text-sm focus:outline-none px-2" />
            <button type="submit" disabled={!input.trim()} className="p-2 bg-cyan-600 text-white rounded-full shadow-lg disabled:opacity-50">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}

export default App