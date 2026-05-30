import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { MessageCircle, X, Send, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('open-chat', handleOpenChat);
    return () => window.removeEventListener('open-chat', handleOpenChat);
  }, []);

  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!user || user.role === 'admin') return;
    
    // Subscribe to chat doc for unread status
    const chatRef = doc(db, 'chats', user.uid);
    const unsubscribeChat = onSnapshot(chatRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().hasUnreadClient) {
        setHasUnread(true);
      } else {
        setHasUnread(false);
      }
    });

    return () => unsubscribeChat();
  }, [user]);

  useEffect(() => {
    if (!user || user.role === 'admin' || !isOpen) return;

    const chatRef = doc(db, 'chats', user.uid);
    // Ensure chat document exists
    setDoc(chatRef, {
      userId: user.uid,
      userEmail: user.email,
      userPhotoURL: user.photoURL || '',
      lastMessageAt: serverTimestamp(),
      hasUnreadClient: false // clear unread when opened
    }, { merge: true });

    const q = query(
      collection(db, 'chats', user.uid, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTimeout(() => scrollToBottom(), 100);
    });

    return () => unsubscribe();
  }, [user, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const tmpText = newMessage;
    setNewMessage('');

    try {
      await addDoc(collection(db, 'chats', user.uid, 'messages'), {
        text: tmpText,
        senderId: user.uid,
        senderRole: 'client',
        createdAt: serverTimestamp()
      });
      await setDoc(doc(db, 'chats', user.uid), {
        lastMessage: tmpText,
        lastMessageAt: serverTimestamp(),
        hasUnreadAdmin: true
      }, { merge: true });
    } catch (err) {
      console.error(err);
    }
  };

  // Only show widget for logged-in clients
  if (!user || user.role === 'admin') return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-4 bg-emerald-600 text-white rounded-full shadow-xl hover:bg-emerald-700 transition-transform ${isOpen ? 'scale-0' : 'scale-100 hover:scale-110'}`}
      >
        <MessageCircle className="w-6 h-6" />
        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[90vw] max-w-sm bg-white rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden" style={{ height: '500px', maxHeight: '80vh' }}>
          {/* Header */}
          <div className="bg-emerald-600 p-4 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-3">
              <img src="/image/imagelogo.webp" alt="CADOM" className="w-8 h-8 rounded-full object-cover bg-white" />
              <div>
                <h3 className="font-bold leading-tight">Support CADOM</h3>
                <p className="text-[10px] text-emerald-100 opacity-90 leading-tight">En ligne</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-emerald-700 p-1.5 rounded-full text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto relative bg-slate-50 flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {messages.length === 0 && (
                  <div className="text-center text-slate-500 text-sm mt-10">
                    Avez-vous une question sur votre commande ? Envoyez-nous un message.
                  </div>
                )}
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.senderRole === 'client' ? 'justify-end' : 'justify-start'}`}>
                    {msg.senderRole !== 'client' && (
                      <img src="/image/imagelogo.webp" alt="Admin" className="w-8 h-8 rounded-full object-cover mr-2 flex-shrink-0 bg-white" />
                    )}
                    <div className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm ${msg.senderRole === 'client' ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Votre message..."
              className="flex-1 bg-slate-100 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
              required
            />
            <button type="submit" disabled={!newMessage.trim()} className="p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50">
              <Send className="w-4 h-4 translate-x-[-1px] translate-y-[1px]" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
