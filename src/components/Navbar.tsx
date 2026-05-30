import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { ShoppingCart, LogIn, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useAdminNotifications } from '../hooks/useAdminNotifications';

export const Navbar = () => {
  const { user, isAdmin } = useAuth();
  const { items, setIsOpen } = useCart();
  const { totalUnread } = useAdminNotifications();
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false); // fermer rmenu au changement de page
  }, [location.pathname]);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 border-b ${scrolled ? 'bg-white/90 backdrop-blur-md border-slate-200 shadow-sm py-3' : 'bg-transparent border-transparent py-5 pointer-events-none'}`}>
        <div className={`mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 ${!scrolled ? 'pointer-events-auto' : ''}`}>
          <div className="flex items-center gap-8">
            <Link to="/" onClick={() => window.scrollTo(0, 0)} className="flex items-center group">
              <img src="/image/imagelogo.webp" alt="CADOM" className="h-[42px] w-auto object-contain group-hover:scale-105 transition-transform" />
              <span className={`ml-2 text-2xl font-black tracking-tighter hidden sm:block ${!scrolled ? 'drop-shadow-[0_2px_4px_rgba(255,255,255,0.7)]' : ''}`}>
                <span className="text-[#009A44]">C</span>
                <span className="text-[#009A44]">A</span>
                <span className="text-[#FCD116]">D</span>
                <span className="text-[#3A75C4]">O</span>
                <span className="text-[#3A75C4]">M</span>
              </span>
            </Link>
            <div className={`hidden md:flex gap-6 text-sm font-bold ${scrolled ? 'text-slate-600' : 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'}`}>
              <Link to="/" onClick={() => window.scrollTo(0, 0)} className={`hover:text-emerald-400 transition-colors ${!scrolled && 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'}`}>Accueil</Link>
              <Link to="/shop" onClick={() => window.scrollTo(0, 0)} className={`hover:text-emerald-400 transition-colors ${!scrolled && 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'}`}>Boutique</Link>
              <Link to="/planning" onClick={() => window.scrollTo(0, 0)} className={`hover:text-emerald-400 transition-colors ${!scrolled && 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'}`}>Planning</Link>
              <Link to="/contact" onClick={() => window.scrollTo(0, 0)} className={`hover:text-emerald-400 transition-colors ${!scrolled && 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'}`}>Contact</Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => window.scrollTo(0, 0)} className={`relative px-3 py-1 rounded-full transition-colors ${scrolled ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-emerald-500 text-white hover:bg-emerald-400 border border-emerald-400 shadow-md drop-shadow-none'}`}>
                  Administration
                  {totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
                  )}
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsOpen(true)} className={`relative flex items-center justify-center p-2 rounded-full transition-colors group ${scrolled ? 'hover:bg-slate-100/50 text-slate-700' : 'bg-black/20 hover:bg-black/40 text-white backdrop-blur-md shadow-lg border border-white/10'}`}>
              <ShoppingCart className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute 0 top-0 right-0 h-4 w-4 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse">
                  {cartItemCount}
                </span>
              )}
            </button>
            {!user ? (
              <Link to="/?login=true" className={`relative p-2 rounded-full cursor-pointer transition-colors flex items-center justify-center ${scrolled ? 'hover:bg-slate-100/50 text-slate-700' : 'bg-black/20 hover:bg-black/40 text-white backdrop-blur-md shadow-lg border border-white/10'}`}>
                <LogIn className="h-5 w-5" />
              </Link>
            ) : (
              <Link to="/profile" className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold uppercase transition-all ${scrolled ? 'bg-emerald-600 hover:bg-emerald-700 shadow-md ring-2 ring-emerald-500/30' : 'bg-black/40 hover:bg-black/60 backdrop-blur-md shadow-lg border-2 border-emerald-400'}`} title="Mon Profil">
                {user.email ? user.email.charAt(0) : 'U'}
              </Link>
            )}
            <button onClick={() => setIsMobileMenuOpen(true)} className={`md:hidden p-2 rounded-full transition-colors ${scrolled ? 'hover:bg-slate-100/50 text-slate-700' : 'bg-black/20 hover:bg-black/40 text-white backdrop-blur-md shadow-lg border border-white/10'}`}>
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] flex md:hidden">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col pt-16">
            <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-4 right-4 p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <X className="h-6 w-6" />
            </button>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center">
              <img src="/image/imagelogo.webp" alt="CADOM" className="h-8 w-auto object-contain mb-2 mr-2" />
              <span className="text-xl font-black tracking-tighter">
                <span className="text-[#009A44]">C</span>
                <span className="text-[#009A44]">A</span>
                <span className="text-[#FCD116]">D</span>
                <span className="text-[#3A75C4]">O</span>
                <span className="text-[#3A75C4]">M</span>
              </span>
            </div>
            <nav className="flex flex-col gap-2 p-6 overflow-y-auto">
              <Link to="/" onClick={() => { window.scrollTo(0, 0); setIsMobileMenuOpen(false); }} className="text-lg font-bold text-slate-700 py-3 border-b border-slate-50 hover:text-emerald-600">Accueil</Link>
              <Link to="/shop" onClick={() => window.scrollTo(0, 0)} className="text-lg font-bold text-slate-700 py-3 border-b border-slate-50 hover:text-emerald-600">Boutique</Link>
              <Link to="/planning" onClick={() => window.scrollTo(0, 0)} className="text-lg font-bold text-slate-700 py-3 border-b border-slate-50 hover:text-emerald-600">Planning</Link>
              <Link to="/contact" onClick={() => window.scrollTo(0, 0)} className="text-lg font-bold text-slate-700 py-3 border-b border-slate-50 hover:text-emerald-600">Contact</Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => window.scrollTo(0, 0)} className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 rounded-lg px-4 font-bold text-lg py-3 mt-2 hover:bg-emerald-100 transition-colors w-fit">
                  Administration
                  {totalUnread > 0 && (
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block"></span>
                  )}
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};
