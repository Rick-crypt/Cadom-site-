import React from 'react';
import { useCart, CartItem } from '../context/CartContext';
import { Button } from './Button';
import { ShoppingCart } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 p-5 flex flex-col h-full shadow-[0_10px_30px_-10px_rgba(13,27,42,0.05)] hover:shadow-[0_20px_40px_-15px_rgba(13,27,42,0.12)] hover:-translate-y-1 transition-all duration-300 group">
      <div className="w-full aspect-[4/3] bg-cadom-bg-alt rounded-[24px] mb-4 relative overflow-hidden">
        {product.image && (product.image.startsWith('http') || product.image.startsWith('/')) ? (
          <img src={product.image} alt={product.name} className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-in-out" />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-cadom-bg-alt group-hover:scale-105 transition-transform duration-700 ease-in-out">
            <span className="text-6xl">{product.image || '📦'}</span>
          </div>
        )}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {product.available ? (
            <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-bold text-emerald-700 uppercase tracking-tighter shadow-sm">
              Frais
            </div>
          ) : (
             <div className="bg-red-500/90 text-white backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tighter shadow-sm">
              Rupture
            </div>
          )}
          {product.stock > 0 && product.stock <= 5 && (
             <div className="bg-cadom-accent/90 text-white backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tighter shadow-sm">
              Peu de stock
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1 flex-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{product.category}</span>
        <h4 className="text-xl font-bold text-cadom-primary font-serif line-clamp-1" title={product.name}>{product.name}</h4>
        <p className="text-sm text-slate-500 mb-4 flex-1 line-clamp-2 leading-relaxed">{product.description}</p>
        <div className="flex justify-between items-center mt-2 pt-4 border-t border-slate-50">
          <span className="text-lg font-bold text-emerald-700">{product.price} FCFA</span>
          <button 
            onClick={() => addToCart({ ...product, quantity: 1 })} 
            disabled={!product.available || product.stock <= 0}
            className="p-3 bg-cadom-green text-white rounded-full hover:bg-cadom-green-hover disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none transition-all shadow-[0_4px_14px_0_rgba(45,90,39,0.25)] hover:shadow-[0_6px_20px_rgba(45,90,39,0.35)] active:scale-[0.98]"
            title={(!product.available || product.stock <= 0) ? 'Indisponible' : 'Ajouter au panier'}
          >
            <ShoppingCart className="w-5 h-5 ml-[-1px] mb-[-1px]" />
          </button>
        </div>
      </div>
    </div>
  );
};
