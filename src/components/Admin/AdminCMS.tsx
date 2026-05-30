import React from 'react';
import { Button } from '../Button';

export default function AdminCMS() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-4">Gestion de Contenu (CMS)</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Bannière promotionnelle</h3>
          <input type="text" className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Ex: Livraison gratuite avec le code PRINTEMPS" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Message d'accueil</h3>
          <textarea rows={3} className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Texte de la page d'accueil" />
        </div>
        <Button>Enregistrer les modifications</Button>
      </div>
    </div>
  );
}
