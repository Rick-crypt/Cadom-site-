import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../context/CartContext';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from './Button';
import { Link } from 'react-router';

export const CartPanel = () => {
  const { items, isOpen, setIsOpen, updateQuantity, removeFromCart, total } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-40 bg-cadom-primary/40 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)} 
          />
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-cadom-bg flex flex-col shadow-2xl"
          >
            <div className="p-6 bg-cadom-primary text-white flex justify-between items-center">
              <span className="font-serif text-xl font-bold">Votre Panier</span>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">{items.reduce((acc, item) => acc + item.quantity, 0)}</span>
                <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors p-1">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
              {items.length === 0 ? (
                <div className="py-12 text-center text-slate-500 font-medium">
                  Votre panier est vide.
                </div>
              ) : (
                <>
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 items-center bg-white p-3 rounded-[20px] shadow-[0_4px_14px_-4px_rgba(13,27,42,0.05)] border border-slate-100 group">
                      <div className="h-16 w-16 bg-cadom-bg-alt rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {item.image && (item.image.startsWith('http') || item.image.startsWith('/')) ? (
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-3xl">{item.image || '📦'}</span>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col">
                        <span className="text-sm font-bold text-cadom-primary font-serif line-clamp-1">{item.name}</span>
                        <span className="text-xs text-emerald-700 font-bold">{item.price} FCFA</span>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 bg-cadom-bg rounded-full p-1 border border-slate-100">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 text-slate-500 hover:text-slate-900 transition-colors bg-white rounded-full"><Minus className="h-3 w-3" /></button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                              disabled={item.quantity >= item.stock}
                              className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-white rounded-full shadow-sm"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors ml-auto shadow-sm"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
            
            {items.length > 0 && (
              <div className="p-6 bg-white border-t border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-500 font-medium">Total</span>
                  <span className="text-2xl font-bold font-serif text-cadom-primary">{total.toFixed(2)} FCFA</span>
                </div>
                
                <Link to="/?checkout=true" onClick={() => setIsOpen(false)} className="block">
                  <button className="w-full py-4 bg-cadom-green hover:bg-cadom-green-hover text-white font-bold rounded-full transition-all shadow-[0_4px_14px_0_rgba(45,90,39,0.25)] hover:shadow-[0_6px_20px_rgba(45,90,39,0.35)] hover:-translate-y-0.5 active:translate-y-0">
                    Valider la commande
                  </button>
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
