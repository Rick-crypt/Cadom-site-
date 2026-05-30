import React from 'react';

export default function CGV() {
  return (
    <div className="overflow-x-hidden w-full flex flex-col flex-1">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 w-full flex-1 bg-white my-8 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight font-display mb-8">Conditions Générales de Vente</h1>
        <div className="prose prose-emerald max-w-none text-gray-600">
          <p>En vigueur au {new Date().toLocaleDateString()}</p>
          <h2 className="text-xl font-bold text-gray-900 mt-6 mb-4">1. Objet</h2>
          <p>Les présentes conditions générales de vente s'appliquent à tous les achats effectués sur notre boutique en ligne.</p>
          <h2 className="text-xl font-bold text-gray-900 mt-6 mb-4">2. Produits</h2>
          <p>Nos produits sont décrits avec la plus grande précision possible.</p>
          <h2 className="text-xl font-bold text-gray-900 mt-6 mb-4">3. Prix</h2>
          <p>Les prix de nos produits sont indiqués en Francs CFA (XAF) toutes taxes comprises (TTC).</p>
        </div>
      </div>
    </div>
  );
}
