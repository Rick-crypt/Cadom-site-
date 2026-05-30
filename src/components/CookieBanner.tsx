import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './Button';

export const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed bottom-0 inset-x-0 z-50 bg-gray-900 text-white p-4 shadow-2xl border-t border-gray-800">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm">
              <p>Nous utilisons des cookies pour améliorer votre expérience. En continuant, vous acceptez notre politique de confidentialité.</p>
            </div>
            <div className="flex shrink-0 gap-3">
              <Button size="sm" variant="outline" className="border-gray-600 text-gray-200 hover:bg-gray-800 hover:text-white" onClick={() => setIsVisible(false)}>Refuser</Button>
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 border-none shadow-none text-white" onClick={accept}>Accepter</Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
