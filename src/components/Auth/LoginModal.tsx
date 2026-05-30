import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useNavigate, useSearchParams } from 'react-router';

export const LoginModal = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isOpen = searchParams.get('login') === 'true';
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const close = () => {
    searchParams.delete('login');
    setSearchParams(searchParams);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      close();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative z-50 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <button onClick={close} className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            <div className="text-center mb-8 flex flex-col items-center">
              <img src="/image/imagelogo.webp" alt="CADOM Logo" className="h-16 w-auto object-contain mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 font-display">Connexion</h2>
              <p className="text-gray-500 mt-2">Accédez à votre espace personnel CADOM</p>
            </div>
            
            {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}

            <div className="space-y-4">
              <button 
                onClick={handleGoogleLogin} 
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5" />
                Continuer avec Google
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
