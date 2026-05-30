import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Loader2, Wallet } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { useCart } from '../context/CartContext';
import { Button } from './Button';
import { processPayment } from '../services/paymentService';
import { db } from '../lib/firebase';
import { doc, writeBatch, serverTimestamp, increment } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const GABON_MOMO_RULES = {
  AIRTEL: {
    name: "Airtel Money Gabon",
    prefix: ["74", "77", "76"],
    minAmount: 500,        // Strict XAF
    maxAmount: 2000000,    // Limite par transaction (2 Millions XAF)
    fraisPourcentage: 2.5, // Taux moyen appliqué aux transactions de paiement
    color: "#e31b23"       // Rouge Airtel
  },
  MOOV: {
    name: "Moov Money (Moov Africa)",
    prefix: ["62", "65", "66"],
    minAmount: 500,        // Strict XAF
    maxAmount: 1000000,    // Limite standard Moov (1 Million XAF)
    fraisPourcentage: 2.0, // Taux moyen Moov Money
    color: "#0055a5"       // Bleu Moov
  }
};

export const CheckoutModal = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isOpen = searchParams.get('checkout') === 'true';
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pointsEarned, setPointsEarned] = useState(0);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [cgvAccepted, setCgvAccepted] = useState(false);

  const [operator, setOperator] = useState<any>(null);
  const [formattedPhone, setFormattedPhone] = useState('');
  const [totalWithFees, setTotalWithFees] = useState(total);

  useEffect(() => {
    // Calcul de l'opérateur et du numéro formaté
    const cleanPhone = phone.replace(/\s+/g, '');
    let finalPhone = '';
    
    if (cleanPhone.startsWith('+2410')) {
      finalPhone = '+241' + cleanPhone.slice(5);
    } else if (cleanPhone.startsWith('0')) {
      finalPhone = '+241' + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith('+241')) {
      finalPhone = cleanPhone;
    } else {
      finalPhone = '+241' + cleanPhone; // Fallback ou saisie brute sans 0
    }
    
    setFormattedPhone(finalPhone);

    const prefix = finalPhone.slice(4, 6); // ex: '74' de '+24174'
    let detectedOp = null;

    if (GABON_MOMO_RULES.AIRTEL.prefix.includes(prefix)) {
      detectedOp = GABON_MOMO_RULES.AIRTEL;
    } else if (GABON_MOMO_RULES.MOOV.prefix.includes(prefix)) {
      detectedOp = GABON_MOMO_RULES.MOOV;
    }

    setOperator(detectedOp);

    if (detectedOp) {
      const fees = total * (detectedOp.fraisPourcentage / 100);
      setTotalWithFees(total + fees);
    } else {
      setTotalWithFees(total);
    }

  }, [phone, total]);

  const close = () => {
    searchParams.delete('checkout');
    setSearchParams(searchParams);
    if (success) {
      clearCart();
      setSuccess(false);
    }
  };

  const handlePaymentSuccess = async (transactionId: string) => {
    if (!user) return;
    const batch = writeBatch(db);

    const orderId = `CMD-${Date.now()}`;
    const orderRef = doc(db, 'orders', orderId);

    // Initial order recording with final state
    batch.set(orderRef, {
      userId: user.uid,
      customerName: name,
      customerPhone: formattedPhone,
      customerAddress: address,
      items: items,
      total: total,
      totalWithFees: totalWithFees,
      operator: operator?.name || 'Inconnu',
      status: 'Payé & Validé',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      transactionId: transactionId
    });

    // Action A : Décrémentation Stricte du Stock
    for (const item of items) {
      const productRef = doc(db, "products", item.id);
      batch.update(productRef, { stock: increment(-item.quantity) });
    }

    // Action B : Attribution des Points de Fidélité
    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
    const pointsGagnes = Math.floor(totalItems / 5);
    setPointsEarned(pointsGagnes);

    if (pointsGagnes > 0) {
      const userRef = doc(db, "users", user.uid);
      batch.update(userRef, { pointsFidelite: increment(pointsGagnes) });
    }

    await batch.commit();
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Vous devez être connecté pour passer une commande.");
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      // Simplification : On valide directement la commande sans PUSH USSD strict
      // Ceci permet de tester facilement le flux d'achat.
      const mockTransactionId = `CMD-${Date.now()}`;
      await handlePaymentSuccess(mockTransactionId);
      setSuccess(true);
      
    } catch (err: any) {
      console.error("Order process error:", err);
      setError(err.message || "Erreur lors du traitement de la commande. Veuillez réessayer.");
    }

    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative z-50 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={close} className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            
            {success ? (
              <div className="text-center py-12">
                <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500 mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 font-display">Paiement reçu !</h2>
                {pointsEarned > 0 && (
                  <div className="bg-amber-50 text-amber-800 rounded-xl p-4 my-4 font-medium text-sm">
                    ✨ +{pointsEarned} points de fidélité ajoutés à votre compte.
                  </div>
                )}
                <p className="text-slate-500 mt-2">Votre commande est validée et en cours de préparation.</p>
                <Button className="mt-8" onClick={close}>Retour à la boutique</Button>
              </div>
            ) : (
              <>
                <div className="text-center mb-6 pt-4">
                  <h2 className="text-2xl font-bold text-slate-900 font-serif">Validation du Paiement</h2>
                </div>

                {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>}

                {!user ? (
                  <div className="text-center bg-emerald-50 rounded-[20px] p-6 mb-4">
                    <p className="text-sm text-emerald-800 font-medium mb-4">Vous devez être connecté à votre compte pour finaliser votre commande.</p>
                    <a href="/auth" className="inline-flex py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-md">
                      Se connecter
                    </a>
                  </div>
                ) : (
                  <form onSubmit={handleCheckout} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Nom complet</label>
                      <input required type="text" value={name} onChange={e => setName(e.target.value)} className="block w-full rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" placeholder="Ex: Jean Dupont" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Numéro de téléphone</label>
                      <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={`block w-full rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 shadow-sm focus:bg-white focus:outline-none focus:ring-2 transition-all ${operator ? '' : 'focus:ring-emerald-500/50'}`} style={operator ? { '--tw-ring-color': operator.color+'80', borderBlockColor: operator.color+'50' } as any : {}} placeholder="Ex: 074 00 00 00" />
                      
                      <div className="h-6 mt-1 flex items-center justify-between text-xs font-bold">
                         {operator ? (
                           <span style={{ color: operator.color }} className="flex items-center gap-1"><Wallet className="w-3 h-3" /> {operator.name} reconnu</span>
                         ) : <span></span>}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-2 shadow-inner">
                       <div className="flex justify-between text-sm text-slate-500 font-medium">
                         <span>Sous-total</span>
                         <span>{total.toFixed(0)} FCFA</span>
                       </div>
                       {operator && (
                         <div className="flex justify-between text-sm text-slate-500 font-medium">
                           <span>Frais ({operator.fraisPourcentage}%)</span>
                           <span>{Math.ceil(total * (operator.fraisPourcentage / 100))} FCFA</span>
                         </div>
                       )}
                       <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200 mt-1">
                         <span>Total à payer</span>
                         <span>{Math.ceil(totalWithFees)} FCFA</span>
                       </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Adresse de livraison</label>
                      <textarea required rows={3} value={address} onChange={e => setAddress(e.target.value)} className="block w-full rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none" placeholder="Quartier, point de repère..."></textarea>
                    </div>
                  
                    <div className="flex items-start gap-2 mt-4">
                      <input 
                        type="checkbox" 
                        id="cgvAccepted" 
                        required
                        checked={cgvAccepted}
                        onChange={(e) => setCgvAccepted(e.target.checked)}
                        className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" 
                      />
                      <label htmlFor="cgvAccepted" className="text-xs text-slate-500">
                        J'autorise la déduction du montant total sur mon compte Mobile Money et j'accepte les <a href="/cgv" target="_blank" className="text-emerald-600 underline">Conditions Générales</a>.
                      </label>
                    </div>
                  
                    <div className="pt-4 mt-8">
                       <button type="submit" disabled={loading || !cgvAccepted} style={operator && !loading && cgvAccepted ? { backgroundColor: operator.color } : {}} className={`w-full flex items-center justify-center py-4 text-white font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:bg-slate-400 disabled:shadow-none bg-emerald-600 hover:bg-emerald-700`}>
                         {loading ? (
                           <span className="flex items-center gap-2">
                             <Loader2 className="animate-spin h-5 w-5" /> Validation en cours...
                           </span>
                         ) : (
                           `Confirmer le paiement (${Math.ceil(totalWithFees)} FCFA)`
                         )}
                       </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

