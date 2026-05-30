import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ShoppingBag, Users, FolderKanban, Menu, X, LogOut, ChevronRight, MessageCircle, Star, Mail } from 'lucide-react';
import { useAdminNotifications } from '../hooks/useAdminNotifications';

const AdminDashboard = React.lazy(() => import('../components/Admin/AdminDashboard'));
const AdminOrders = React.lazy(() => import('../components/Admin/AdminOrders'));
const AdminProducts = React.lazy(() => import('../components/Admin/AdminProducts'));
const AdminUsers = React.lazy(() => import('../components/Admin/AdminUsers'));
const AdminCMS = React.lazy(() => import('../components/Admin/AdminCMS'));
const AdminChat = React.lazy(() => import('../components/Admin/AdminChat').then(module => ({ default: module.AdminChat })));
const AdminFeedbacks = React.lazy(() => import('../components/Admin/AdminFeedbacks').then(module => ({ default: module.AdminFeedbacks })));

export default function Admin() {
  const { signOut } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const notifications = useAdminNotifications();

  // Fermer le volet sur mobile lorsqu'on change de page
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false); // Sur lg, on n'utilise pas le state pour masquer/afficher, css le gère
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  const links = [
    { to: '/admin', icon: LayoutDashboard, label: 'Tableau de bord', exact: true },
    { to: '/admin/orders', icon: ShoppingBag, label: 'Commandes', badge: notifications.unreadOrders },
    { to: '/admin/products', icon: FolderKanban, label: 'Produits' },
    { to: '/admin/users', icon: Users, label: 'Utilisateurs' },
    { to: '/admin/chat', icon: MessageCircle, label: 'Messagerie', badge: notifications.unreadMessages },
    { to: '/admin/feedbacks', icon: Star, label: 'Avis & Retours', badge: notifications.unreadFeedbacks },
    { to: '/admin/cms', icon: LayoutDashboard, label: 'CMS' },
  ];

  return (
    <div className="overflow-x-hidden w-full h-full flex flex-col flex-1">
      <div className="flex pt-[82px] h-screen w-full overflow-hidden flex-1 relative bg-slate-50/50">
      
      {/* Overlay mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[105] lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Volet latéral (Sidebar) */}
      <aside 
        className={`fixed lg:static top-0 left-0 h-full w-[280px] bg-white border-r border-slate-200 flex flex-col z-[110] lg:z-40 transform transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none flex-shrink-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6 flex items-center justify-between lg:hidden border-b border-slate-100">
          <span className="font-display font-bold text-slate-800 text-lg">Espace Admin</span>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 -mr-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold mb-5 px-3">Menu Principal</h3>
          <nav className="space-y-1.5">
            {links.map((link) => {
              const isActive = link.exact ? location.pathname === link.to : location.pathname.startsWith(link.to);
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`group flex items-center justify-between px-3 py-3 rounded-xl font-bold text-sm transition-all ${
                    isActive 
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-500 transition-colors'}`} />
                      {link.badge !== undefined && link.badge > 0 && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                      )}
                    </div>
                    {link.label}
                  </div>
                  <div className="flex items-center gap-2">
                    {link.badge !== undefined && link.badge > 0 && (
                      <span className={`px-2 py-0.5 text-xs rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'}`}>
                        {link.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight className="w-4 h-4 opacity-70" />}
                  </div>
                </Link>
              )
            })}
          </nav>
        </div>
        
        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              Connecté en tant qu'<strong className="text-emerald-700">Administrateur</strong>
            </p>
          </div>
          <button 
            onClick={signOut} 
            className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-slate-200 text-slate-700 text-sm font-bold rounded-xl shadow-sm hover:bg-slate-800 hover:border-slate-800 hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>
      
      {/* Contenu Principal */}
      <main className="flex-1 flex flex-col min-w-0 overflow-auto bg-slate-50">
        
        {/* En-tête Mobile */}
        <div className="lg:hidden p-4 bg-white border-b border-slate-200 flex items-center gap-4 sticky top-0 z-30 shadow-sm">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 hover:text-emerald-600 rounded-xl transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h2 className="font-bold text-slate-800 text-lg uppercase font-display leading-tight">Administration</h2>
            <p className="text-xs text-slate-500 font-medium tracking-wide">Interface de gestion</p>
          </div>
        </div>

        {/* Content Box */}
        <div className="flex-1 p-4 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
          <React.Suspense fallback={<div className="flex h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent shadow-lg" /></div>}>
            <Routes>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/orders" element={<AdminOrders />} />
              <Route path="/products" element={<AdminProducts />} />
              <Route path="/users" element={<AdminUsers />} />
              <Route path="/chat" element={<AdminChat />} />
              <Route path="/feedbacks" element={<AdminFeedbacks />} />
              <Route path="/cms" element={<AdminCMS />} />
            </Routes>
          </React.Suspense>
        </div>
      </main>
    </div>
    </div>
  );
}
