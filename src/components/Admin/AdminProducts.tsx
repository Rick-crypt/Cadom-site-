import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { Product } from '../../types';
import { Plus, Edit2, Trash2, Image as ImageIcon, X, RefreshCw } from 'lucide-react';

const PRODUCT_DICT: Record<string, { emoji: string, category: string }> = {
  'banane': { emoji: '🍌', category: 'Fruits' },
  'carotte': { emoji: '🥕', category: 'Légumes' },
  'tomate': { emoji: '🍅', category: 'Légumes' },
  'pomme de terre': { emoji: '🥔', category: 'Tubercules' },
  'igname': { emoji: '🍠', category: 'Tubercules' },
  'oignon': { emoji: '🧅', category: 'Légumes' },
  'ail': { emoji: '🧄', category: 'Épices' },
  'piment': { emoji: '🌶️', category: 'Épices' },
  'arachide': { emoji: '🥜', category: 'Céréales' },
  'manioc': { emoji: '🥔', category: 'Tubercules' },
  'avocat': { emoji: '🥑', category: 'Fruits' },
  'salade': { emoji: '🥬', category: 'Légumes' },
  'chou': { emoji: '🥬', category: 'Légumes' },
  'citron': { emoji: '🍋', category: 'Fruits' },
  'mangue': { emoji: '🥭', category: 'Fruits' },
  'fraise': { emoji: '🍓', category: 'Fruits' },
  'ananas': { emoji: '🍍', category: 'Fruits' },
  'fève': { emoji: '🫘', category: 'Céréales' },
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Légumes');
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [available, setAvailable] = useState(true);
  
  // Image / Emoji handling
  const [emoji, setEmoji] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setIsRefreshing(true);
    const unsub = onSnapshot(collection(db, 'products'), (snapshot) => {
      const data: Product[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(data);
      setLoading(false);
      setIsRefreshing(false);
    }, (err) => {
      console.error("Error fetching products:", err);
      setLoading(false);
      setIsRefreshing(false);
    });
    return () => unsub();
  }, [refreshKey]);

  const handleNameBlur = async () => {
    if (!name || name.length < 2) return;
    
    // Auto-suggest logic checks locals first
    const lowerVal = name.toLowerCase().trim();
    for (const [key, details] of Object.entries(PRODUCT_DICT)) {
      if (lowerVal.includes(key) || (key.includes(lowerVal) && lowerVal.length > 2)) {
        return; // Handled by handleNameChange
      }
    }

    // Attempt smart classification
    try {
      const res = await fetch('/api/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: name })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.category) {
          if (!imageFile && !editingProduct?.image?.startsWith('http') && data.emoji) {
            setEmoji(data.emoji);
          }
          // Set if user hasn't actively changed it from default 'Légumes' or empty
          setCategory(data.category);
        }
      }
    } catch(err) {
      console.error("AI Categorization Error:", err);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    
    // Auto-suggest emoji and category if no image is uploaded (Local sync)
    const lowerVal = val.toLowerCase().trim();
    for (const [key, details] of Object.entries(PRODUCT_DICT)) {
      if (lowerVal.includes(key) || (key.includes(lowerVal) && lowerVal.length > 2)) {
        if (!imageFile && !editingProduct?.image?.startsWith('http')) {
          setEmoji(details.emoji);
        }
        setCategory(details.category);
        return;
      }
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setName(product.name);
      setCategory(product.category);
      setPrice(product.price);
      setStock(product.stock || 0);
      setDescription(product.description || '');
      setAvailable(product.available !== undefined ? product.available : true);
      
      if (product.image && (product.image.startsWith('http') || product.image.startsWith('/'))) {
        setImagePreview(product.image);
        setEmoji('');
      } else {
        setEmoji(product.image || '📦');
        setImagePreview('');
      }
    } else {
      setEditingProduct(null);
      setName('');
      setCategory('Légumes');
      setPrice(0);
      setStock(0);
      setDescription('');
      setAvailable(true);
      setEmoji('');
      setImagePreview('');
      setImageFile(null);
    }
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setEmoji(''); // Clear emoji when an image is selected
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let finalImageUrl = emoji || '📦'; // Default fallback

      if (imageFile) {
        const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
        const uploadTask = await uploadBytesResumable(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(storageRef);
      } else if (imagePreview) {
        finalImageUrl = imagePreview; // kept existing image
      }

      const productData = {
        name,
        category,
        price: Number(price),
        stock: Number(stock),
        description,
        available,
        image: finalImageUrl
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), productData);
      }

      setShowModal(false);
    } catch (err) {
      console.error("Erreur save product:", err);
      alert("Erreur lors de l'enregistrement du produit.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (err) {
        console.error("Erreur delete product:", err);
        alert("Erreur lors de la suppression du produit.");
      }
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Chargement...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-display">Catalogue Produits</h1>
          <p className="text-slate-500 text-sm">Gérez les disponibilités et les prix de vos récoltes.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setRefreshKey(prev => prev + 1)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Actualiser
          </button>
          <button 
            onClick={() => handleOpenModal()} 
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-sm active:scale-95"
          >
            <Plus className="w-5 h-5" /> Nouveau Produit
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-[0_10px_30px_-10px_rgba(13,27,42,0.05)] border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Produit & Image</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Catégorie</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Prix / kg</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Aucun produit dans le catalogue. Cliquez sur "Nouveau Produit" pour commencer.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                          {product.image && (product.image.startsWith('http') || product.image.startsWith('/')) ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl">{product.image || '📦'}</span>
                          )}
                        </div>
                        <div className="font-bold text-slate-800">{product.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-emerald-600">
                      {product.price} FCFA
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-bold ${product.stock <= 5 ? 'text-red-500' : 'text-slate-700'}`}>
                        {product.stock || 0} kg
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-4 font-bold rounded-full ${
                        (product.available !== false) && (product.stock || 0) > 0 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {(product.available !== false) && (product.stock || 0) > 0 ? 'En vente' : 'Indisponible'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(product)} 
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-800 font-display">
                {editingProduct ? 'Modifier le Produit' : 'Ajouter un Produit'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              
              {/* Image / Emoji Upload Section */}
              <div className="flex gap-6 items-start bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="w-24 h-24 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex flex-col items-center justify-center overflow-hidden relative group">
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <label className="cursor-pointer text-white text-xs font-bold text-center">
                          Changer
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                        </label>
                      </div>
                    </>
                  ) : emoji ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center group">
                      <span className="text-5xl">{emoji}</span>
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                        <label className="cursor-pointer text-white text-xs font-bold text-center leading-tight p-1">
                          Upload<br/>Image
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-slate-400 hover:text-emerald-500 hover:border-emerald-500 transition-colors">
                      <ImageIcon className="w-6 h-6 mb-1" />
                      <span className="text-[10px] uppercase font-bold">Image</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className="text-sm font-bold text-slate-700">Image du produit (Optionnel)</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Téléversez une vraie photo du produit pour un meilleur rendu. Si vous n'avez pas de photo, le système essaiera d'assigner automatiquement un <strong>Émoji</strong> en fonction du nom saisi !
                  </p>
                  
                  {/* Emoji override / input */}
                  {!imagePreview && (
                    <div className="mt-2 flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-600">Ou changez l'Émoji manuellement :</label>
                      <input 
                        type="text" 
                        maxLength={2} 
                        value={emoji} 
                        onChange={(e) => setEmoji(e.target.value)} 
                        className="w-12 h-10 text-center text-xl border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                        placeholder="🍎"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Nom du produit</label>
                  <input 
                    type="text" 
                    required 
                    value={name} 
                    onChange={handleNameChange} 
                    onBlur={handleNameBlur}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium" 
                    placeholder="Ex: Bananes Douces" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Catégorie</label>
                  <input 
                    type="text"
                    list="categories-list"
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                    placeholder="Ex: Fruits, Légumes..."
                  />
                  <datalist id="categories-list">
                    <option value="Fruits" />
                    <option value="Légumes" />
                    <option value="Tubercules" />
                    <option value="Épices" />
                    <option value="Céréales" />
                    {Array.from(new Set<string>(products.map(p => p.category).filter((c): c is string => !!c))).map(cat => (
                      !['Fruits', 'Légumes', 'Tubercules', 'Épices', 'Céréales'].includes(cat) && (
                        <option key={cat} value={cat} />
                      )
                    ))}
                  </datalist>
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Prix au kilo (FCFA)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      required 
                      min="0"
                      value={price || ''} 
                      onChange={(e) => setPrice(Number(e.target.value))} 
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-6 text-slate-900 shadow-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold" 
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Stock disponible (kg)</label>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    value={stock || ''} 
                    onChange={(e) => setStock(Number(e.target.value))} 
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-6 text-slate-900 shadow-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Description</label>
                <textarea 
                  rows={3} 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all resize-none font-medium"
                  placeholder="Décrivez l'origine, la qualité, etc."
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center h-5">
                  <input
                    id="available"
                    type="checkbox"
                    checked={available}
                    onChange={(e) => setAvailable(e.target.checked)}
                    className="w-5 h-5 text-emerald-600 bg-white border-slate-300 rounded focus:ring-emerald-500 focus:ring-2"
                  />
                </div>
                <div className="ml-2 flex flex-col">
                  <label htmlFor="available" className="text-sm font-bold text-slate-800">
                    Produit disponible à la vente
                  </label>
                  <p className="text-xs text-slate-500">
                    Décochez cette case pour masquer temporairement ce produit de la boutique, même s'il reste du stock.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={uploading}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Enregistrement...</>
                  ) : (
                    'Enregistrer le produit'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
