import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export function useAdminNotifications() {
  const { user, isAdmin } = useAuth();
  
  const [unreadOrders, setUnreadOrders] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0); // chats
  const [unreadFeedbacks, setUnreadFeedbacks] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;

    // Unread orders
    const qOrders = query(collection(db, 'orders'), where('status', '==', 'pending'));
    const unsubOrders = onSnapshot(qOrders, snap => setUnreadOrders(snap.size));

    // Unread chats
    const qChats = query(collection(db, 'chats'), where('hasUnreadAdmin', '==', true));
    const unsubChats = onSnapshot(qChats, snap => setUnreadMessages(snap.size));
    
    // Unread feedbacks
    let unsubFeedbacks = () => {};
    try {
      const qFeedbacks = query(collection(db, 'feedbacks'), where('status', '==', 'new'));
      unsubFeedbacks = onSnapshot(qFeedbacks, snap => setUnreadFeedbacks(snap.size));
    } catch (e) {
      console.warn("Could not query feedbacks");
    }

    return () => {
      unsubOrders();
      unsubChats();
      unsubFeedbacks();
    };
  }, [isAdmin]);

  const totalUnread = unreadOrders + unreadMessages + unreadFeedbacks;

  return {
    unreadOrders,
    unreadMessages,
    unreadFeedbacks,
    totalUnread
  };
}
