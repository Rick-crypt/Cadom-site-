import React, { useState, useEffect } from 'react';
import { ProductCard } from '../components/ProductCard';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Product } from '../types';
import { Search } from 'lucide-react';

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Tous');
  const [search, setSearch] = useState('');

  const predefinedCategoriesList = ['Fruits', 'Légumes', 'Tubercules', 'Épices', 'Céréales'];
  const predefinedCategoryLabels: Record<string, string> = {
    'Fruits': 'Fruits 🍊',
    'Légumes': 'Légumes 🥬',
    'Tubercules': 'Tubercules 🍠',
    'Épices': 'Épices 🌶️',
    'Céréales': 'Céréales 🌾'
  };

  const productCategories = Array.from(new Set<string>(products.map(p => p.category).filter((c): c is string => !!c)));
  const allCategories = Array.from(new Set([...predefinedCategoriesList, ...productCategories])).sort();

  const categories = [
    { id: 'Tous', label: 'Tous' },
    ...allCategories.map(cat => ({
      id: cat,
      label: predefinedCategoryLabels[cat] || cat
    }))
  ];

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snapshot) => {
      const fetchedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(fetchedProducts);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching products:", err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredProducts = products.filter(p => {
    // Check available flag, but admins might want to see it? Actually, customers shouldn't see unavailable ones unless specified.
    // Assuming this shop is the public view, we can filter out unavailable items.
    if (p.available === false) return false;

    if (filter !== 'Tous' && p.category !== filter) {
      return false;
    }
    if (search.trim() !== '') {
      if (!p.name.toLowerCase().includes(search.toLowerCase()) && !(p.description || '').toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

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
          Notre Catalogue
        </span>
        
        {/* Titre principal */}
        <h1 className="font-serif text-4xl md:text-5xl text-white font-light mt-2">
          Boutique <em className="text-[#e8c97a] italic not-italic">Coopérative</em>
        </h1>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col">
      {/* Page Header */}
      <div className="flex flex-col mb-8 gap-6 border-b border-transparent">
        <div>
          <p className="text-slate-500 mt-1">Découvrez l'ensemble de notre sélection direct producteur.</p>
        </div>
        
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          <div className="flex-1 max-w-full overflow-x-auto pb-2 -mb-2">
            <div className="flex inline-flex gap-2 bg-white border border-slate-100 p-1.5 rounded-full shadow-[0_4px_14px_-4px_rgba(13,27,42,0.05)] w-max">
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setFilter(cat.id)}
                  className={`px-4 py-2 flex-none rounded-full text-xs font-bold transition-all ${filter === cat.id ? 'bg-cadom-bg text-cadom-primary shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {(filter !== 'Tous' || search.trim() !== '') && (
              <button
                onClick={() => {
                  setFilter('Tous');
                  setSearch('');
                }}
                className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-wider flex-none"
              >
                × Réinitialiser
              </button>
            )}
            <div className="relative max-w-sm w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input 
                type="text" 
                placeholder="Rechercher (ex: Banane...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-full border border-slate-100 bg-white text-sm font-medium text-cadom-primary shadow-[0_4px_14px_-4px_rgba(13,27,42,0.05)] focus:ring-4 focus:ring-cadom-green/10 focus:border-cadom-green transition-all placeholder:font-normal"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Product Grid */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-cadom-green">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent mb-4" />
          <p className="font-medium animate-pulse">Chargement de la boutique...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 flex-1">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-500 font-medium">
              Aucun produit trouvé dans cette catégorie.
            </div>
          )}
        </div>
      )}
    </div>
    </div>
  );
}
