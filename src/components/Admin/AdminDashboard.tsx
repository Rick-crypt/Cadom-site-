import React, { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { RefreshCw, Users, ShoppingCart, TrendingUp, Package, Star, Trash2, Settings, ChevronDown } from 'lucide-react';
import { subDays, isAfter, startOfDay, format } from 'date-fns';
import { fr } from 'date-fns/locale';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler);

import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const { user, isSuperAdmin } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [usersCount, setUsersCount] = useState(0);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Forced refresh to simulate reset
  const [refreshKey, setRefreshKey] = useState(0);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showResetMenu, setShowResetMenu] = useState(false);
  const resetMenuRef = useRef<HTMLDivElement>(null);

  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; collectionName: string; label: string }>({ isOpen: false, collectionName: '', label: '' });
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resetMenuRef.current && !resetMenuRef.current.contains(event.target as Node)) {
        setShowResetMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsRefreshing(true);
    const qOrders = query(collection(db, 'orders'));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map(doc => doc.data()));
    });

    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      setUsersCount(snapshot.docs.length);
    });

    const qFeedbacks = query(collection(db, 'feedbacks'));
    const unsubFeedbacks = onSnapshot(qFeedbacks, (snapshot) => {
       setFeedbacks(snapshot.docs.map(doc => doc.data()));
       setLoading(false);
       setIsRefreshing(false);
    });

    return () => {
      unsubOrders();
      unsubUsers();
      unsubFeedbacks();
    };
  }, [refreshKey]);

  const triggerReset = (collectionName: string, label: string) => {
    if (!isSuperAdmin) {
      setNotification({ message: "Action non autorisée. Seul le super admin peut réinitialiser les données.", type: 'error' });
      return;
    }
    setConfirmModal({ isOpen: true, collectionName, label });
    setShowResetMenu(false);
  };

  const handleConfirmReset = async () => {
    const { collectionName, label } = confirmModal;
    setConfirmModal({ isOpen: false, collectionName: '', label: '' });
    
    try {
      setIsRefreshing(true);
      const { deleteDoc } = await import('firebase/firestore');
      const snap = await getDocs(collection(db, collectionName));
      
      if (collectionName === 'chats') {
        for (const d of snap.docs) {
          const msgsSnap = await getDocs(collection(db, 'chats', d.id, 'messages'));
          for (const msgDoc of msgsSnap.docs) {
            await deleteDoc(msgDoc.ref);
          }
          await deleteDoc(d.ref);
        }
      } else if (collectionName === 'users') {
        for (const d of snap.docs) {
          if (d.id !== user?.uid && d.data().email !== 'andymbourou45@gmail.com') {
            await deleteDoc(d.ref);
          }
        }
      } else {
        for (const d of snap.docs) {
          await deleteDoc(d.ref);
        }
      }
      
      setNotification({ message: `Les données de "${label}" ont été réinitialisées avec succès.`, type: 'success' });
      setTimeout(() => setNotification({ message: '', type: null }), 4000);
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      console.error(err);
      setNotification({ message: `Erreur lors de la réinitialisation : ${err.message}`, type: 'error' });
      setTimeout(() => setNotification({ message: '', type: null }), 4000);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;
  }

  // --- Statistics ---
  const totalRevenue = orders.reduce((acc, order) => acc + (order.total || 0), 0);
  const totalOrders = orders.length;

  const totalReviews = feedbacks.length;
  const averageRating = totalReviews > 0 
    ? (feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0) / totalReviews).toFixed(1)
    : '0.0';

  // --- Line Chart: Last 7 days ---
  const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(new Date(), 6 - i));
  const lineChartLabels = last7Days.map(date => format(date, 'dd MMM', { locale: fr }));
  
  const lineChartDataValues = last7Days.map(date => {
    const start = startOfDay(date);
    const end = startOfDay(subDays(date, -1)); // start of next day
    return orders.filter(o => {
      if (!o.createdAt) return false;
      const orderDate = typeof o.createdAt.toDate === 'function' ? o.createdAt.toDate() : new Date(o.createdAt);
      return isAfter(orderDate, start) && !isAfter(orderDate, end);
    }).length;
  });

  const lineChartData = {
    labels: lineChartLabels,
    datasets: [
      {
        label: 'Commandes',
        data: lineChartDataValues,
        borderColor: 'rgb(16, 185, 129)', // Emerald 500
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } }
    }
  };

  // --- Donut Chart: Order Status ---
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const acceptedOrders = orders.filter(o => o.status === 'accepted').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const refusedOrders = orders.filter(o => o.status === 'refused').length;

  const donutChartData = {
    labels: ['En attente', 'À livrer', 'Livré', 'Refusé'],
    datasets: [
      {
        data: [pendingOrders, acceptedOrders, deliveredOrders, refusedOrders],
        backgroundColor: [
          'rgb(245, 158, 11)', // Amber 500
          'rgb(59, 130, 246)', // Blue 500
          'rgb(16, 185, 129)', // Emerald 500
          'rgb(239, 68, 68)',  // Red 500
        ],
        borderWidth: 0,
      }
    ]
  };

  const donutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const }
    },
    cutout: '70%'
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-display">Vue d'ensemble</h1>
          <p className="text-slate-500 text-sm">Statistiques en temps réel de votre coopérative.</p>
        </div>
        <div className="flex gap-2 relative" ref={resetMenuRef}>
          {isSuperAdmin && (
            <div className="relative">
              <button 
                onClick={() => setShowResetMenu(!showResetMenu)}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
                title="Super Admin Uniquement"
              >
                <Settings className="w-4 h-4" /> Gérer les Données <ChevronDown className="w-4 h-4" />
              </button>
              
              {showResetMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                  <div className="p-2 border-b border-slate-100 bg-red-50">
                    <p className="text-xs font-bold text-red-600 text-center uppercase tracking-wider">Zone de danger</p>
                  </div>
                  <button onClick={() => triggerReset('orders', 'Commandes')} className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center justify-between">
                    <span>Vider Commandes</span> <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => triggerReset('feedbacks', 'Avis')} className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors border-t border-slate-50 flex items-center justify-between">
                    <span>Vider Avis</span> <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => triggerReset('users', 'Utilisateurs')} className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors border-t border-slate-50 flex items-center justify-between">
                    <span>Vider Utilisateurs</span> <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => triggerReset('chats', 'Messages de Chat')} className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors border-t border-slate-50 flex items-center justify-between">
                    <span>Vider Chats</span> <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => triggerReset('products', 'Produits')} className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors border-t border-slate-50 flex items-center justify-between">
                    <span>Vider Produits</span> <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
          <button 
            onClick={() => setRefreshKey(prev => prev + 1)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Actualiser
          </button>
        </div>
      </div>

      {notification.message && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
          {notification.message}
        </div>
      )}

      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Confirmation requise</h3>
            <p className="text-slate-600 text-sm mb-6">Êtes-vous sûr de vouloir vider les données de <strong>{confirmModal.label}</strong> ? Cette action est irréversible.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmModal({ isOpen: false, collectionName: '', label: '' })} className="px-5 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                Annuler
              </button>
              <button onClick={handleConfirmReset} className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors">
                Oui, supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <div className="xl:col-span-2 bg-white rounded-[32px] shadow-[0_4px_20px_-4px_rgba(13,27,42,0.05)] border border-slate-100 p-6 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-2xl"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Chiffre d'Affaires</h3>
          </div>
          <span className="text-3xl font-black text-emerald-600">{totalRevenue.toLocaleString()} FCFA</span>
        </div>
        
        <div className="bg-white rounded-[32px] shadow-[0_4px_20px_-4px_rgba(13,27,42,0.05)] border border-slate-100 p-6 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-2xl"><ShoppingCart className="w-5 h-5 text-blue-600" /></div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Commandes</h3>
          </div>
          <span className="text-3xl font-black text-slate-800">{totalOrders}</span>
        </div>

        <div className="bg-white rounded-[32px] shadow-[0_4px_20px_-4px_rgba(13,27,42,0.05)] border border-slate-100 p-6 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cadom-accent/10 rounded-2xl"><Package className="w-5 h-5 text-cadom-accent" /></div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">En attente</h3>
          </div>
          <span className="text-3xl font-black text-slate-800">{pendingOrders}</span>
        </div>

        <div className="bg-white rounded-[32px] shadow-[0_4px_20px_-4px_rgba(13,27,42,0.05)] border border-slate-100 p-6 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-2xl"><Users className="w-5 h-5 text-purple-600" /></div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Clients</h3>
          </div>
          <span className="text-3xl font-black text-slate-800">{usersCount}</span>
        </div>

        <div className="bg-white rounded-[32px] shadow-[0_4px_20px_-4px_rgba(13,27,42,0.05)] border border-slate-100 p-6 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-2xl"><Star className="w-5 h-5 text-amber-500 fill-amber-500" /></div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Note Moyenne</h3>
          </div>
          <span className="text-3xl font-black text-slate-800">{averageRating}<span className="text-lg text-slate-400 font-medium ml-1">/ 5</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[32px] shadow-[0_4px_20px_-4px_rgba(13,27,42,0.05)] border border-slate-100 p-6">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">Activité 7 derniers jours</h3>
          <div className="h-64 w-full">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        <div className="bg-white rounded-[32px] shadow-[0_4px_20px_-4px_rgba(13,27,42,0.05)] border border-slate-100 p-6 flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">Répartition</h3>
          <div className="h-64 w-full flex-grow">
            <Doughnut data={donutChartData} options={donutChartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
