import React from 'react';
import { Link } from 'react-router';

export const Footer = () => {
  return (
    <footer className="mt-auto border-t border-slate-800 bg-slate-900 pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full flex flex-col md:flex-row justify-between gap-12 border-b border-slate-800 pb-12 mb-8">
        
        <div className="max-w-xs flex flex-col items-center md:items-start text-center md:text-left">
          <div className="bg-white p-2 rounded-xl mb-6 shadow-md inline-block">
            <img src="/image/imagelogo.webp" alt="CADOM Logo" className="h-16 w-auto object-contain" />
          </div>
          <p className="text-slate-400 leading-relaxed">
            <strong>Coopérative Agricole des Délices de l'Ogooué Maritime (CADOM)</strong><br />
            Offrir une alternative saine et locale à la grande distribution, en proposant des produits certifiés 100% biologiques, cultivés sans pesticides, dans le respect des cycles naturels et du commerce équitable.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-12 md:gap-24 text-center md:text-left">
          <div className="flex flex-col gap-3 w-full sm:w-auto">
            <h4 className="text-white font-bold mb-2">Navigation</h4>
            <Link to="/" onClick={() => window.scrollTo(0, 0)} className="text-slate-400 hover:text-emerald-400 transition-colors text-left sm:text-center md:text-left">Accueil</Link>
            <Link to="/shop" onClick={() => window.scrollTo(0, 0)} className="text-slate-400 hover:text-emerald-400 transition-colors text-left sm:text-center md:text-left">Boutique</Link>
            <Link to="/about" onClick={() => window.scrollTo(0, 0)} className="text-slate-400 hover:text-emerald-400 transition-colors text-left sm:text-center md:text-left">Notre Histoire</Link>
            <button onClick={() => window.dispatchEvent(new Event('open-feedback'))} className="text-slate-400 hover:text-emerald-400 transition-colors text-left sm:text-center md:text-left">Laissez un avis</button>
          </div>
          <div className="flex flex-col gap-3 w-full sm:w-auto">
            <h4 className="text-white font-bold mb-2">Légal & Sécurité</h4>
            <Link to="/cgv" onClick={() => window.scrollTo(0, 0)} className="text-slate-400 hover:text-emerald-400 transition-colors">CGV</Link>
            <Link to="/mentions-legales" onClick={() => window.scrollTo(0, 0)} className="text-slate-400 hover:text-emerald-400 transition-colors">Mentions Légales</Link>
            <Link to="/privacy" onClick={() => window.scrollTo(0, 0)} className="text-slate-400 hover:text-emerald-400 transition-colors">Confidentialité</Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:block">Statut du Système</span>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-semibold text-slate-400">En ligne</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-semibold text-slate-400">Sécurisé</span>
          </div>
        </div>
        <div className="text-xs text-slate-500">
          © {new Date().getFullYear()} CADOM. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
};
