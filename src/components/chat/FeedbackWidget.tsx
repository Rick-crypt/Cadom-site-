import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Star, MessageSquarePlus, X, Send, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router';

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user && !sessionStorage.getItem('feedback_opened_once')) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        sessionStorage.setItem('feedback_opened_once', 'true');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-feedback', handleOpen);
    return () => window.removeEventListener('open-feedback', handleOpen);
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'), limit(5));
    const unsub = onSnapshot(q, (snapshot) => {
      setTestimonials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !comment.trim()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'feedbacks'), {
        rating,
        comment,
        userId: user ? user.uid : 'guest',
        userName: user ? (user.displayName || 'Anonyme') : 'Anonyme',
        createdAt: serverTimestamp(),
        status: 'new'
      });
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setRating(0);
        setComment('');
      }, 3000);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi de votre avis.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 left-6 z-50 w-[90vw] max-w-sm bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="bg-emerald-600 p-5 flex justify-between items-center text-white relative overflow-hidden shrink-0">
               <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-800 opacity-90 z-0"></div>
               <div className="relative z-10 flex items-center gap-3">
                 <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                   <Star className="w-5 h-5 fill-white text-white" />
                 </div>
                 <div>
                   <h3 className="font-bold font-serif text-lg leading-tight">Votre avis compte</h3>
                   <p className="text-[11px] opacity-80">Évaluation & Témoignages</p>
                 </div>
               </div>
               <button onClick={() => setIsOpen(false)} className="relative z-10 bg-black/10 hover:bg-black/20 p-2 rounded-full text-white transition-colors">
                 <X className="w-5 h-5" />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto w-full">
               <div className="p-6 bg-emerald-50/50">
                {success ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Star className="w-8 h-8 fill-emerald-500 text-emerald-500" />
                    </div>
                    <h4 className="font-bold text-slate-800 mb-2">Merci pour votre retour !</h4>
                    <p className="text-sm text-slate-500">Votre évaluation nous aide à nous améliorer chaque jour.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <p className="text-sm font-bold text-slate-700 text-center mb-3">Notez notre coopérative :</p>
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 transform hover:scale-110 transition-transform focus:outline-none"
                          >
                            <Star className={`w-8 h-8 ${star <= (hoverRating || rating) ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="relative">
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Laissez votre témoignage..."
                        className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm min-h-[100px]"
                        required
                      />
                    </div>
                    {!user ? (
                      <div className="text-center">
                        <p className="text-xs text-amber-600 mb-2 font-medium">Vous devez être connecté pour laisser un avis.</p>
                        <Link to="/auth" onClick={() => setIsOpen(false)} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-md flex items-center justify-center">
                          Se connecter
                        </Link>
                      </div>
                    ) : (
                      <button type="submit" disabled={rating === 0 || !comment.trim() || loading} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-md flex items-center justify-center gap-2">
                        {loading ? 'Envoi...' : (
                          <>Envoyer <Send className="w-4 h-4" /></>
                        )}
                      </button>
                    )}
                  </form>
                )}
               </div>

               {testimonials.length > 0 && (
                 <div className="p-6 border-t border-slate-100 bg-white">
                   <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-4 flex items-center gap-2">
                     <MessageSquarePlus className="w-4 h-4" /> Derniers avis
                   </h4>
                   <div className="space-y-4">
                     {testimonials.map(t => (
                       <div key={t.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                         <div className="flex justify-between items-start mb-2">
                           <div className="flex items-center gap-2">
                             <UserCircle className="w-6 h-6 text-slate-400" />
                             <span className="text-xs font-bold text-slate-600">{t.userName || 'Client'}</span>
                           </div>
                           <div className="flex">
                             {[1,2,3,4,5].map(s => (
                               <Star key={s} className={`w-3 h-3 ${s <= t.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                             ))}
                           </div>
                         </div>
                         <p className="text-sm text-slate-600 italic">"{t.comment}"</p>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
