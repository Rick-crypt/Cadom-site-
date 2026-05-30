import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { MessageCircle, Send, User, ChevronRight } from 'lucide-react';

export function AdminChat() {
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'chats'), orderBy('lastMessageAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!activeChat) return;
    const q = query(
      collection(db, 'chats', activeChat.id, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTimeout(() => scrollToBottom(), 100);
    });

    // Clear unread flag
    if (activeChat.hasUnreadAdmin) {
      setDoc(doc(db, 'chats', activeChat.id), { hasUnreadAdmin: false }, { merge: true });
    }

    return () => unsubscribe();
  }, [activeChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const tmpText = newMessage;
    setNewMessage('');

    try {
      await addDoc(collection(db, 'chats', activeChat.id, 'messages'), {
        text: tmpText,
        senderId: 'admin',
        senderRole: 'admin',
        createdAt: serverTimestamp()
      });
      await setDoc(doc(db, 'chats', activeChat.id), {
        lastMessage: "Admin: " + tmpText,
        lastMessageAt: serverTimestamp(),
        hasUnreadClient: true
      }, { merge: true });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_10px_40px_-10px_rgba(13,27,42,0.08)] overflow-hidden flex h-[600px]">
      
      {/* Sidebar: Conversations List */}
      <div className="w-1/3 border-r border-slate-100 flex flex-col bg-slate-50/50">
        <div className="p-6 border-b border-slate-100 bg-white">
          <h2 className="text-xl font-bold text-slate-800 font-serif flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-500" />
            Conversations
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Aucune conversation
            </div>
          ) : (
            chats.map(chat => (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-100 transition-colors flex items-center gap-3 group ${activeChat?.id === chat.id ? 'bg-emerald-50/50 border-l-4 border-l-emerald-500' : 'border-l-4 border-l-transparent'} ${chat.hasUnreadAdmin ? 'bg-amber-50/50' : ''}`}
              >
                {chat.userPhotoURL ? (
                  <img src={chat.userPhotoURL} alt="Client" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-slate-500" />
                  </div>
                )}
                <div className="overflow-hidden relative flex-1 pr-2">
                  <div className="font-bold text-slate-800 text-sm truncate flex items-center gap-2">
                    {chat.userEmail}
                  </div>
                  <div className={`text-xs truncate mt-1 ${chat.hasUnreadAdmin ? 'text-amber-700 font-bold' : 'text-slate-500'}`}>
                    {chat.lastMessage || 'Nouveau...'}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {chat.hasUnreadAdmin && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-sm uppercase tracking-wide animate-pulse">
                      Nouveau
                    </span>
                  )}
                  <ChevronRight className={`w-4 h-4 ${chat.hasUnreadAdmin ? 'text-amber-500' : 'text-slate-400 group-hover:text-emerald-500'}`} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Area: Chat Room */}
      <div className="flex-1 flex flex-col bg-slate-50/30 relative">
        {activeChat ? (
          <>
            {/* Chat header */}
            <div className="p-4 bg-white border-b border-slate-100 flex items-center gap-3">
              {activeChat.userPhotoURL ? (
                <img src={activeChat.userPhotoURL} alt="Client" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-slate-500" />
                </div>
              )}
              <div className="flex flex-col justify-center">
                <h3 className="font-bold text-slate-800">{activeChat.userEmail}</h3>
                <p className="text-xs text-slate-500">Client inscrit</p>
              </div>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  {msg.senderRole === 'client' && (
                    activeChat.userPhotoURL ? (
                      <img src={activeChat.userPhotoURL} alt="Client" className="w-8 h-8 rounded-full object-cover mr-2 flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center mr-2 flex-shrink-0">
                        <User className="w-4 h-4 text-slate-500" />
                      </div>
                    )
                  )}
                  <div className={`px-4 py-2 rounded-2xl max-w-[70%] text-sm ${msg.senderRole === 'admin' ? 'bg-emerald-600 text-white rounded-br-none shadow-md shadow-emerald-600/20' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Répondre au client..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm font-medium transition-all"
                  required
                />
                <button type="submit" disabled={!newMessage.trim()} className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-md shadow-emerald-600/20">
                  <Send className="w-5 h-5 translate-x-[1px]" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <MessageCircle className="w-12 h-12 text-slate-200 mb-4" />
            <p>Sélectionnez une conversation pour échanger avec le client.</p>
          </div>
        )}
      </div>
    </div>
  );
}
