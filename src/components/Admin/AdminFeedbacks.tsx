import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Star, MessageSquare, Check } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function AdminFeedbacks() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setFeedbacks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, 'feedbacks', id), { status: 'approved' });
  };

  const totalReviews = feedbacks.length;
  const averageRating = totalReviews > 0 
    ? (feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0) / totalReviews).toFixed(1)
    : 0;

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-display flex items-center gap-2">
            <Star className="w-6 h-6 text-emerald-500" /> Avis & Retours
          </h1>
          <p className="text-slate-500 text-sm">Gérez et consultez les avis laissés par vos clients.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-[0_4px_20px_-4px_rgba(13,27,42,0.05)] flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
            <Star className="w-8 h-8 fill-amber-400 text-amber-500" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Note moyenne</span>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-slate-800">{averageRating}</span>
              <span className="text-slate-500 mb-1">/ 5</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-[0_4px_20px_-4px_rgba(13,27,42,0.05)] flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Avis totaux</span>
            <div className="text-4xl font-black text-slate-800">{totalReviews}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_4px_20px_-4px_rgba(13,27,42,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-500">
            <thead className="bg-slate-50 text-xs uppercase text-slate-700">
              <tr>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold">Note</th>
                <th className="px-6 py-4 font-bold">Commentaire</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {feedbacks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">
                    Aucun avis n'a encore été déposé.
                  </td>
                </tr>
              ) : (
                feedbacks.map((f) => (
                  <tr key={f.id} className={`transition-colors ${f.status === 'new' ? 'bg-emerald-50/50' : 'hover:bg-slate-50/50'}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {f.createdAt ? format(f.createdAt.toDate(), 'dd MMM yyyy à HH:mm', { locale: fr }) : '-'}
                      {f.status === 'new' && <span className="ml-2 inline-block px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full uppercase">Nouveau</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`w-4 h-4 ${star <= f.rating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`} />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 w-full">
                      <p className="text-slate-700 whitespace-pre-wrap font-medium">{f.comment}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {f.status === 'new' && (
                        <button onClick={() => markAsRead(f.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-bold rounded-lg transition-colors text-xs">
                          <Check className="w-3.5 h-3.5" /> Marquer lu
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
