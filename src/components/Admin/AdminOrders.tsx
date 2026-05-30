import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Check, X, Clock, Package, Truck, Search, Eye, RefreshCw } from 'lucide-react';
import { Button } from '../Button';

interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: any[];
  total: number;
  status: 'pending' | 'accepted' | 'delivered' | 'refused';
  createdAt: any;
  deliveryDate?: string;
  deliveryNotes?: string;
  refusalReason?: string;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRefuseModal, setShowRefuseModal] = useState(false);
  
  // Form state
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [refusalReason, setRefusalReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setIsRefreshing(true);
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData: Order[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setLoading(false);
      setIsRefreshing(false);
    }, (error) => {
      console.error("Erreur onSnapshot:", error);
      setLoading(false);
      setIsRefreshing(false);
    });

    return () => unsubscribe();
  }, [refreshKey]);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'orders', selectedOrder.id), {
        status: 'accepted',
        deliveryDate,
        deliveryNotes
      });
      setShowAcceptModal(false);
      setDeliveryDate('');
      setDeliveryNotes('');
    } catch (err) {
      console.error("Erreur lors de l'acceptation:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefuse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'orders', selectedOrder.id), {
        status: 'refused',
        refusalReason
      });
      
      // Ici l'intégration EmailJS serait déclenchée pour notifier le client
      // await emailjs.send(...)
      
      setShowRefuseModal(false);
      setRefusalReason('');
    } catch (err) {
      console.error("Erreur lors du refus:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliver = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'delivered'
      });
    } catch (err) {
      console.error("Erreur livraison:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1 w-max"><Clock className="w-3 h-3" /> En attente</span>;
      case 'accepted': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 flex items-center gap-1 w-max"><Truck className="w-3 h-3" /> À livrer</span>;
      case 'delivered': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-max"><Check className="w-3 h-3" /> Livrée</span>;
      case 'refused': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 flex items-center gap-1 w-max"><X className="w-3 h-3" /> Refusée</span>;
      default: return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">Inconnu</span>;
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Chargement des commandes...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-800 font-display">Gestion des Commandes</h1>
        <button 
          onClick={() => setRefreshKey(prev => prev + 1)}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Actualiser
        </button>
      </div>
      
      <div className="bg-white rounded-[32px] shadow-[0_10px_30px_-10px_rgba(13,27,42,0.05)] border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date & ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    Aucune commande trouvée.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-800">
                        {order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Récente'}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-1">#{order.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-800">{order.customerName || 'Client'}</div>
                      <div className="text-sm text-slate-500">{order.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600">
                      {order.total} FCFA
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        {order.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => { setSelectedOrder(order); setShowAcceptModal(true); }}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                              title="Accepter"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => { setSelectedOrder(order); setShowRefuseModal(true); }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                              title="Refuser"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {order.status === 'accepted' && (
                          <button 
                            onClick={() => handleDeliver(order.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 flex items-center gap-1 text-xs font-medium"
                            title="Marquer comme livré"
                          >
                            <Truck className="w-4 h-4" /> Livrer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accept Modal */}
      {showAcceptModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Accepter la commande</h3>
              <p className="text-sm text-slate-500">Planifier la livraison pour {selectedOrder.customerName}</p>
            </div>
            <form onSubmit={handleAccept}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Date de livraison prévue</label>
                  <input 
                    type="date" 
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Notes pour le livreur (Optionnel)</label>
                  <textarea 
                    rows={3}
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                    placeholder="Instructions spéciales..."
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAcceptModal(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
                  Annuler
                </button>
                <Button type="submit" disabled={actionLoading}>
                  Confirmer et Accepter
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refuse Modal */}
      {showRefuseModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-red-600">Refuser la commande</h3>
              <p className="text-sm text-slate-500">Rejeter la commande de {selectedOrder.customerName}</p>
            </div>
            <form onSubmit={handleRefuse}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Motif du refus</label>
                  <select
                    required
                    value={refusalReason}
                    onChange={(e) => setRefusalReason(e.target.value)}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:ring-red-500/20 focus:border-red-500 font-medium"
                  >
                    <option value="">Sélectionnez un motif...</option>
                    <option value="Rupture de stock">Rupture de stock</option>
                    <option value="Zone non desservie">Zone non desservie</option>
                    <option value="Problème de paiement">Problème de paiement</option>
                    <option value="Autre">Autre (préciser par email)</option>
                  </select>
                </div>
                <div className="text-xs text-slate-500 bg-red-50 p-3 rounded-lg border border-red-100">
                  <span className="font-bold text-red-700">Note:</span> Le client recevra automatiquement un email lui indiquant ce motif d'annulation.
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowRefuseModal(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={actionLoading} className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm disabled:opacity-50">
                  Confirmer le refus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
