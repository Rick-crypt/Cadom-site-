import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, CheckCircle2, ChevronLeft, ChevronRight, Package, UserCircle, RefreshCw } from 'lucide-react';
import { Button } from '../components/Button';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSearchParams } from 'react-router';

interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerAddress: string;
  items: any[];
  total: number;
  status: 'pending' | 'accepted' | 'delivered' | 'refused';
  deliveryDate?: string;
  createdAt: any;
}

export default function Planning() {
  const { user, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user) return;

    let q;
    if (isAdmin) {
      q = query(collection(db, 'orders'), where('status', 'in', ['accepted', 'delivered']));
    } else {
      q = query(collection(db, 'orders'), where('userId', '==', user.uid), where('status', 'in', ['accepted', 'delivered']));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isAdmin, refreshKey]);

  const confirmReception = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'delivered'
      });
    } catch (err) {
      console.error("Erreur de confirmation:", err);
    }
  };

  const getDayOrders = (date: Date) => {
    return orders.filter(order => {
      if (!order.deliveryDate) return false;
      const deliveryDate = parseISO(order.deliveryDate);
      return isSameDay(date, deliveryDate);
    });
  };

  const getPendingOrders = () => {
    return orders.filter(order => order.status === 'pending');
  };

  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));

  const prevWeek = () => setCurrentWeekStart(addDays(currentWeekStart, -7));
  const nextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7));

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  if (!user) {
    return (
      <div className="overflow-x-hidden w-full flex flex-col flex-1">
        <div className="flex-1 flex flex-col items-center justify-center p-8 mt-20">
          <UserCircle className="w-16 h-16 text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-700">Connexion requise</h2>
          <p className="text-slate-500 mt-2 mb-6">Connectez-vous pour voir votre planning de livraison.</p>
          <button
            onClick={() => {
              searchParams.set('login', 'true');
              setSearchParams(searchParams);
            }}
            className="bg-cadom-accent hover:bg-cadom-accent-hover text-cadom-primary px-8 py-3 rounded-xl font-bold transition-all shadow-sm active:scale-95"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;
  }

  const selectedDayOrders = getDayOrders(selectedDate);
  const pendingOrders = getPendingOrders();

  return (
    <div className="overflow-x-hidden w-full flex flex-col flex-1">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-[#0d1b2a] to-[#1a3a2a] py-16 px-[5%] text-center relative overflow-hidden">
        {/* Texture de fond */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/leaf.png')]"></div>
        </div>
        
        {/* Surtitre (Badge) */}
        <span className="text-[#c9a84c] text-[0.75rem] font-semibold tracking-[0.2em] uppercase mb-4 block animate-in fade-in slide-in-from-bottom duration-700">
          Suivi des commandes
        </span>
        
        {/* Titre principal */}
        <h1 className="font-serif text-4xl md:text-5xl text-white font-light mt-2">
          Mon Calendrier <em className="text-[#e8c97a] italic not-italic">de Livraisons</em>
        </h1>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 w-full flex-1 flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex-1 flex flex-col sm:flex-row sm:items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-serif mb-2">
              {isAdmin ? "Planning Général des Livraisons" : "Mon Calendrier de Livraisons"}
            </h1>
            <p className="text-slate-500">
              {isAdmin 
                ? "Vue d'ensemble des commandes prévues pour la coopérative." 
                : "Suivez l'état de vos commandes et confirmez leur réception."}
            </p>
          </div>
          <button 
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="flex items-center gap-2 px-4 py-2 mt-4 sm:mt-0 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
        </div>
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 w-fit">
          <button onClick={prevWeek} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <span className="font-bold text-slate-700 w-32 text-center capitalize">
            {format(currentWeekStart, 'MMMM yyyy', { locale: fr })}
          </span>
          <button onClick={nextWeek} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {pendingOrders.length > 0 && !isAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <h3 className="font-bold text-amber-800 flex items-center gap-2">
            <Clock className="w-5 h-5" /> En attente de validation ({pendingOrders.length})
          </h3>
          <p className="text-sm text-amber-700 mt-2">Vos commandes sont en cours de validation par notre équipe. La date de livraison vous sera confirmée très bientôt.</p>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
        {weekDays.map((day, idx) => {
          const dayOrders = getDayOrders(day);
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDate);
          
          return (
            <div 
              key={idx} 
              onClick={() => setSelectedDate(day)}
              className={`cursor-pointer rounded-[24px] border transition-all duration-300 p-4 flex flex-col h-[130px] shadow-[0_4px_14px_-4px_rgba(13,27,42,0.05)] ${
                isSelected 
                  ? 'border-cadom-green ring-4 ring-cadom-green/20 bg-cadom-green/10' 
                  : isToday 
                    ? 'border-slate-300 bg-white shadow-sm'
                    : 'border-slate-100 bg-white hover:border-cadom-green/50 hover:bg-cadom-bg'
              }`}
            >
              <div className="flex justify-between items-center mb-auto">
                <span className={`text-xs font-bold uppercase tracking-wider ${isSelected || isToday ? 'text-cadom-green' : 'text-slate-500'}`}>
                  {format(day, 'EEEE', { locale: fr }).substring(0, 3)}
                </span>
                <span className={`text-xl font-black font-serif ${isSelected || isToday ? 'text-cadom-green' : 'text-cadom-primary'}`}>
                  {format(day, 'dd')}
                </span>
              </div>
              
              <div className="flex flex-col gap-1 mt-2">
                {dayOrders.slice(0, 2).map((order) => (
                  <span key={order.id} className="inline-block px-2 py-1 bg-cadom-accent/10 text-cadom-accent hover:bg-cadom-accent hover:text-cadom-primary transition-colors text-[10px] font-bold rounded-full truncate">
                    {isAdmin ? order.customerName : 'Livraison prévue'}
                  </span>
                ))}
                {dayOrders.length > 2 && (
                  <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full text-center">
                    +{dayOrders.length - 2} autre(s)
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Panel */}
      <div className="bg-cadom-bg rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-[0_10px_30px_-10px_rgba(13,27,42,0.05)]">
        <h2 className="text-2xl font-serif font-bold text-cadom-primary mb-6 flex items-center gap-2">
          Livraisons du {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
        </h2>
        
        {selectedDayOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[32px] border border-slate-100 shadow-[0_4px_14px_-4px_rgba(13,27,42,0.05)]">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Aucune livraison prévue à cette date.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedDayOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-[24px] border border-slate-100 overflow-hidden shadow-[0_4px_14px_-4px_rgba(13,27,42,0.05)] flex flex-col hover:shadow-md transition-shadow">
                <div className={`px-5 py-4 border-b flex justify-between items-center ${order.status === 'delivered' ? 'bg-cadom-green/10 border-cadom-green/20' : 'bg-slate-50 border-slate-100'}`}>
                  <span className="text-xs font-mono font-bold text-slate-500">#{order.id.slice(0, 8)}</span>
                  {order.status === 'delivered' ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" /> Livrée
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-blue-700">
                      <Clock className="w-4 h-4" /> En cours
                    </span>
                  )}
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  {isAdmin && (
                    <div className="mb-4">
                      <h3 className="font-bold text-slate-900 text-lg mb-1">{order.customerName}</h3>
                      <p className="text-sm text-slate-500 flex items-start gap-1">
                        <span className="font-sans">📍</span> {order.customerAddress}
                      </p>
                    </div>
                  )}

                  <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-2 flex-1">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contenu :</h4>
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm font-medium text-slate-700">
                        <span>{item.name} <span className="text-slate-400">x{item.quantity}</span></span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-end mb-5">
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Total à payer</span>
                      <span className="text-2xl font-black text-emerald-600">{order.total} FCFA</span>
                    </div>
                  </div>

                  {!isAdmin && order.status === 'accepted' && (
                    <button 
                      onClick={() => confirmReception(order.id)}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" /> Confirmer la réception
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
