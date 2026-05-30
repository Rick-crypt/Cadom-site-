import React from 'react';

export default function Privacy() {
  return (
    <div className="overflow-x-hidden w-full flex flex-col flex-1">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 w-full flex-1 bg-white my-8 rounded-xl shadow-sm border border-gray-100">
      <h1 className="text-3xl font-bold text-gray-900 tracking-tight font-display mb-8">Politique de Confidentialité</h1>
      <div className="prose prose-emerald max-w-none text-gray-600">
        <p>Votre vie privée est au cœur de nos préoccupations. Nous nous engageons à protéger vos données personnelles.</p>
        <h2 className="text-xl font-bold text-gray-900 mt-6 mb-4">Collecte des données</h2>
        <p>Nous collectons uniquement les informations nécessaires au traitement de vos commandes et à l'amélioration de notre service.</p>
        <h2 className="text-xl font-bold text-gray-900 mt-6 mb-4">Droits (RGPD)</h2>
        <p>Vous disposez d'un droit d'accès, de rectification, et de suppression de vos données personnelles.</p>
      </div>
    </div>
    </div>
  );
}
