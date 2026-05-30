import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Users, ShieldAlert, MoreVertical, Crown, Medal, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../Button';

interface UserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: 'client' | 'admin' | 'super-admin';
  isAdmin?: boolean; // legacy
  loyaltyCredits?: number;
  createdAt?: any;
}

export default function AdminUsers() {
  const { user, isSuperAdmin } = useAuth();
  const [usersList, setUsersList] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [targetRole, setTargetRole] = useState<'client' | 'admin'>('client');
  const [actionLoading, setActionLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setIsRefreshing(true);
    const q = query(collection(db, 'users')); // might need orderBy if index exists
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: UserData[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserData[];
      // sort manually to avoid needing composite index immediately
      data.sort((a, b) => {
        const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const db = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return db.getTime() - da.getTime();
      });
      setUsersList(data);
      setLoading(false);
      setIsRefreshing(false);
    });
    return () => unsubscribe();
  }, [refreshKey]);

  const handleRoleChangeConfirm = async () => {
    if (!selectedUser || !isSuperAdmin) return;
    
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'users', selectedUser.id), {
        role: targetRole,
        isAdmin: targetRole === 'admin' // for legacy compatibility
      });
      setShowRoleModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error("Error updating role:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (role?: string, isAdminLegacy?: boolean) => {
    const actualRole = role || (isAdminLegacy ? 'admin' : 'client');
    if (actualRole === 'super-admin') {
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800"><Crown className="w-3 h-3" /> Super-Admin</span>;
    }
    if (actualRole === 'admin') {
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">Administrateur</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">Client</span>;
  };

  const getLoyaltyBadge = (credits: number = 0) => {
    if (credits >= 1000) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700 shadow-sm"><Medal className="w-3 h-3" /> Gold</span>;
    if (credits >= 500) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-slate-200 text-slate-700 shadow-sm"><Medal className="w-3 h-3" /> Silver</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700">Nouveau</span>;
  };

  const openRoleMenu = (u: UserData, role: 'client' | 'admin') => {
    if (!isSuperAdmin || u.role === 'super-admin') return;
    setSelectedUser(u);
    setTargetRole(role);
    setShowRoleModal(true);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Chargement des utilisateurs...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-display">Utilisateurs inscrits</h1>
          <p className="text-slate-500 text-sm">Gestion des droits d'accès et de la fidélité.</p>
        </div>
        <button 
          onClick={() => setRefreshKey(prev => prev + 1)}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Actualiser
        </button>
      </div>

      {!isSuperAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800">
          <ShieldAlert className="w-6 h-6 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-bold">Alerte de sécurité</p>
            <p>Seul le super-admin peut promouvoir d'autres utilisateurs ou modifier les rôles.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[32px] shadow-[0_10px_30px_-10px_rgba(13,27,42,0.05)] border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Utilisateur</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Rôle</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Fidélité</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {usersList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    Aucun compte trouvé.
                  </td>
                </tr>
              ) : (
                usersList.map((u) => {
                  const actualRole = u.role || (u.isAdmin ? 'admin' : 'client');
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold uppercase">
                            {u.firstName?.[0] || u.email[0]}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{u.firstName} {u.lastName}</div>
                            <div className="text-xs text-slate-500 font-mono">UID: {u.id.substring(0,6)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-700">{u.email}</div>
                        <div className="text-xs text-slate-500">{u.phone || 'Non renseigné'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(u.role, u.isAdmin)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          {getLoyaltyBadge(u.loyaltyCredits)}
                          <span className="text-xs font-medium text-slate-500">{u.loyaltyCredits || 0} pts</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {isSuperAdmin && actualRole !== 'super-admin' && (
                          <div className="relative group inline-block">
                            <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            {/* Dropdown Menu (Hover for simplicity without full state logic) */}
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 overflow-hidden">
                              <div className="p-1">
                                {actualRole === 'client' ? (
                                  <button onClick={() => openRoleMenu(u, 'admin')} className="w-full text-left px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg">
                                    Promouvoir Admin
                                  </button>
                                ) : (
                                  <button onClick={() => openRoleMenu(u, 'client')} className="w-full text-left px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg">
                                    Rétrograder Client
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        {!isSuperAdmin && actualRole !== 'super-admin' && (
                          <span className="text-xs text-slate-400">Restreint</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">Confirmer l'action</h3>
            </div>
            <div className="p-6">
              <p className="text-slate-600 text-sm mb-4">
                Êtes-vous sûr de vouloir {targetRole === 'admin' ? "promouvoir" : "rétrograder"}{" "}
                <span className="font-bold text-slate-900">{selectedUser.firstName || selectedUser.email}</span> au rôle de{" "}
                <span className="font-bold text-slate-900">{targetRole === 'admin' ? 'Administrateur' : 'Client'}</span> ?
              </p>
              {targetRole === 'admin' && (
                <p className="text-xs bg-emerald-50 text-emerald-700 p-3 rounded-lg border border-emerald-100">
                  Cette personne aura instamment accès au panneau d'administration pour gérer les commandes et les produits.
                </p>
              )}
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowRoleModal(false)} 
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                disabled={actionLoading}
              >
                Annuler
              </button>
              <Button onClick={handleRoleChangeConfirm} disabled={actionLoading}>
                {actionLoading ? "Modification..." : "Confirmer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
