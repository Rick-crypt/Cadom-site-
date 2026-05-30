import React from 'react';

export default function Mentions() {
  return (
    <div className="overflow-x-hidden w-full flex flex-col flex-1">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 w-full flex-1 bg-white my-8 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight font-display mb-8">Mentions Légales</h1>
      <div className="prose prose-emerald max-w-none text-gray-600">
        <h2 className="text-xl font-bold text-gray-900 mt-6 mb-4">Éditeur du site</h2>
        <p>
          <strong>Sigle usuel :</strong> CADOM<br/>
          <strong>Nom complet :</strong> Coopérative Agricole des Délices de l'Ogooué Maritime<br/>
          <strong>Statut :</strong> Coopérative agricole regroupant environ 50 adhérents/familles d'agriculteurs.<br/>
          <strong>Direction :</strong> Représentée légalement par le Président de la coopérative CADOM (Directeur de la publication).<br/>
          <strong>Adresse :</strong> Quartier Sud (vers Boule Noire, rue de Tchibanga), Port-Gentil, Province de l'Ogooué-Maritime, Gabon 🇬🇦<br/>
          <strong>Téléphone principal (Appels et WhatsApp) :</strong> +241 76 47 67 53<br/>
          <strong>Téléphones secondaires :</strong> +241 74 57 37 25 / +241 77 92 46 79<br/>
          <strong>Email officiel :</strong> cadom5101@gmail.com
        </p>
        <h2 className="text-xl font-bold text-gray-900 mt-6 mb-4">Hébergement</h2>
        <p>Site hébergé par Google Cloud Run.</p>
      </div>
    </div>
    </div>
  );
}
