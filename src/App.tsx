import React, { Suspense, useLayoutEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartPanel } from './components/CartPanel';
import { CookieBanner } from './components/CookieBanner';
import { CheckoutModal } from './components/CheckoutModal';
import { LoginModal } from './components/Auth/LoginModal';
import { ChatWidget } from './components/chat/ChatWidget';
import { FeedbackWidget } from './components/chat/FeedbackWidget';

// Lazy loading pages
const Home = React.lazy(() => import('./pages/Home'));
const Shop = React.lazy(() => import('./pages/Shop'));
const Planning = React.lazy(() => import('./pages/Planning'));
const Contact = React.lazy(() => import('./pages/Contact'));
const Admin = React.lazy(() => import('./pages/Admin'));
const Profile = React.lazy(() => import('./pages/Profile'));
const CGV = React.lazy(() => import('./pages/Legal/CGV'));
const Mentions = React.lazy(() => import('./pages/Legal/Mentions'));
const Privacy = React.lazy(() => import('./pages/Legal/Privacy'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex-1 w-full flex flex-col"
    >
      {children}
    </motion.div>
  );
}

function PageLoader() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#f8f4ed]" role="status" aria-label="Chargement de la page">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#2d5a27]/20 border-t-[#2d5a27] rounded-full animate-spin"></div>
        <p className="text-sm text-[#0d1b2a] font-medium tracking-wider uppercase">Chargement...</p>
      </div>
    </div>
  );
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <PageLoader />;
  if (!user || !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

function AppContent() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f4ed] text-[#0d1b2a] font-sans transition-colors duration-300">
      <Navbar />
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          {/* @ts-expect-error React Router v7 typings omit key but it is required for Framer Motion */}
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
              <Route path="/shop" element={<PageWrapper><Shop /></PageWrapper>} />
              <Route path="/planning" element={<PageWrapper><Planning /></PageWrapper>} />
              <Route path="/contact" element={<PageWrapper><Contact /></PageWrapper>} />
              <Route path="/profile" element={<PageWrapper><Profile /></PageWrapper>} />
              <Route path="/admin/*" element={<ProtectedRoute><PageWrapper><Admin /></PageWrapper></ProtectedRoute>} />
              <Route path="/cgv" element={<PageWrapper><CGV /></PageWrapper>} />
              <Route path="/mentions-legales" element={<PageWrapper><Mentions /></PageWrapper>} />
              <Route path="/privacy" element={<PageWrapper><Privacy /></PageWrapper>} />
            </Routes>
        </AnimatePresence>
      </Suspense>
      <Footer />
      <CartPanel />
      <CookieBanner />
      <LoginModal />
      <CheckoutModal />
      <FeedbackWidget />
      <ChatWidget />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}
