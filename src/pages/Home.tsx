import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import { db } from '../lib/firebase';
import { collection, query, limit, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';

const HERO_IMAGES = [
  '/image/image0.webp',
  '/image/image1.webp',
  '/image/image2.webp',
  '/image/image3.webp',
  '/image/image4.webp',
  '/image/image5.webp',
  '/image/image6.webp',
  '/image/image7.webp',
  '/image/image8.webp',
  '/image/image9.webp'
];

const ENTRY_VARIANTS = [
  { opacity: 0, y: -40, x: 0, scale: 1 },
  { opacity: 0, y: 40, x: 0, scale: 1 },
  { opacity: 0, x: -40, y: 0, scale: 1 },
  { opacity: 0, x: 40, y: 0, scale: 1 },
  { opacity: 0, scale: 0.8, x: 0, y: 0 },
  { opacity: 0, scale: 1.1, x: 0, y: 0 },
];
const getRandomEntry = () => {
  return { ...ENTRY_VARIANTS[Math.floor(Math.random() * ENTRY_VARIANTS.length)] };
};

const itemVariants = {
  hidden: { x: -30, opacity: 0 },
  visible: { x: 0, scale: 1, opacity: 1, transition: { duration: 0.8, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.3 } }
};

const parentVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  exit: { opacity: 0, transition: { staggerChildren: 0.1, duration: 0.4 } }
};

const HeroContent: React.FC<{ siteConfig: any }> = ({ siteConfig }) => {
  return (
    <motion.div 
      variants={parentVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="relative z-10 flex flex-col items-start justify-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full h-full pt-32 pb-20 mt-12"
    >
      {/* Badge */}
      <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-amber-500/30 bg-black/40 backdrop-blur-sm mb-8">
        <span className="text-amber-500 text-sm">🌱</span>
        <span className="text-amber-500 text-xs font-bold tracking-wider uppercase">Agriculture 100% Biologique</span>
      </motion.div>

      <motion.h1 
        variants={itemVariants}
        className="text-5xl md:text-6xl lg:text-7xl font-serif text-white mb-6 leading-[1.1] max-w-3xl"
      >
        Des saveurs naturelles<br />au cœur de l'Ogooué
      </motion.h1>

      <motion.p 
        variants={itemVariants}
        className="text-lg md:text-xl text-slate-200 max-w-2xl mb-12 font-sans leading-relaxed"
      >
        La Coopérative CADOM réunit des passionnés pour offrir<br className="hidden md:block" />
        des produits frais et durables — de la terre à votre table.
      </motion.p>

      <motion.div 
        variants={itemVariants}
        className="flex flex-col sm:flex-row gap-4 mb-20"
      >
        <Link to="/shop" onClick={() => window.scrollTo(0, 0)} className="bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-full px-8 py-4 text-sm font-bold tracking-wider uppercase transition-colors flex items-center justify-center gap-2">
          Découvrir la boutique <span className="text-lg leading-none">→</span>
        </Link>
        <Link to="/about" onClick={() => window.scrollTo(0, 0)} className="bg-transparent hover:bg-white/10 border border-white/30 text-white rounded-full px-8 py-4 text-sm font-bold tracking-wider uppercase transition-colors flex items-center justify-center">
          Notre histoire
        </Link>
      </motion.div>

      <motion.div 
        variants={itemVariants}
        className="flex gap-12 sm:gap-16 lg:gap-24"
      >
        <div className="flex flex-col gap-2">
          <span className="text-5xl md:text-6xl font-serif text-amber-500 tracking-tight">100%</span>
          <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Bio Certifié</span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-5xl md:text-6xl font-serif text-amber-500 tracking-tight">50+</span>
          <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Producteurs</span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-5xl md:text-6xl font-serif text-amber-500 tracking-tight">0</span>
          <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Pesticides</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function Home() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [shuffledImages, setShuffledImages] = useState<string[]>([]);
  
  const [siteConfig, setSiteConfig] = useState({
    title: 'CADOM',
    subtitle: "Des saveurs naturelles au cœur de l'Ogooué",
    aboutImage: ''
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Fisher-Yates shuffle
  useEffect(() => {
    const images = [...HERO_IMAGES];
    for (let i = images.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [images[i], images[j]] = [images[j], images[i]];
    }
    setShuffledImages(images);
  }, []);

  // Carousel logic
  useEffect(() => {
    if (shuffledImages.length === 0) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % shuffledImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [shuffledImages]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch config
        const configDoc = await getDoc(doc(db, 'settings', 'site_config'));
        if (configDoc.exists()) {
          const data = configDoc.data();
          if (data.title || data.subtitle) {
            setSiteConfig({
              title: data.title || siteConfig.title,
              subtitle: data.subtitle || siteConfig.subtitle,
              aboutImage: data.aboutImage || siteConfig.aboutImage
            });
          }
        }

        // Fetch products
        const q = query(collection(db, 'products'), limit(4));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const fetchedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
          setProducts(fetchedProducts);
        } else {
             // Fallback
             import('../data/products').then(data => {
               setProducts(data.MOCK_PRODUCTS.slice(0, 4));
             });
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        // Fallback
        import('../data/products').then(data => {
          setProducts(data.MOCK_PRODUCTS.slice(0, 4));
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="overflow-x-hidden w-full flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-cadom-primary">
        <AnimatePresence mode="popLayout">
          {shuffledImages.length > 0 && (
            <motion.img
              key={currentImageIndex}
              src={shuffledImages[currentImageIndex]}
              initial={{ opacity: 0, scale: 1 }}
              animate={{ opacity: 0.8, scale: 1.05 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="absolute inset-0 w-full h-full object-cover"
              alt="CADOM Background"
            />
          )}
        </AnimatePresence>
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-slate-900/40 z-10 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-cadom-primary/95 via-cadom-primary/50 to-transparent z-10 pointer-events-none"></div>

        <AnimatePresence mode="wait">
          <HeroContent key={currentImageIndex} siteConfig={siteConfig} />
        </AnimatePresence>
      </section>

      {/* Pourquoi choisir CADOM */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-center mb-16 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">Pourquoi choisir CADOM</h2>
          <div className="w-16 h-1 bg-cadom-accent rounded-full mb-4"></div>
          <p className="text-slate-500 max-w-2xl">L'excellence de notre terroir, au service de votre bien-être.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-[0_10px_30px_-10px_rgba(13,27,42,0.05)] hover:shadow-[0_20px_40px_-15px_rgba(13,27,42,0.12)] hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-cadom-green flex items-center justify-center mb-6 shadow-[0_4px_14px_0_rgba(45,90,39,0.25)] group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-xl font-bold font-serif text-cadom-primary mb-3">Qualité Premium</h3>
            <p className="text-slate-500 leading-relaxed text-sm">Une sélection rigoureuse des meilleurs produits de notre terroir gabonais pour vous offrir une qualité irréprochable.</p>
          </div>
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-[0_10px_30px_-10px_rgba(13,27,42,0.05)] hover:shadow-[0_20px_40px_-15px_rgba(13,27,42,0.12)] hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-cadom-green flex items-center justify-center mb-6 shadow-[0_4px_14px_0_rgba(45,90,39,0.25)] group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-bold font-serif text-cadom-primary mb-3">Fraîcheur Garantie</h3>
            <p className="text-slate-500 leading-relaxed text-sm">De la récolte à votre assiette en un temps record, préservant ainsi toutes les saveurs et les nutriments.</p>
          </div>
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-[0_10px_30px_-10px_rgba(13,27,42,0.05)] hover:shadow-[0_20px_40px_-15px_rgba(13,27,42,0.12)] hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-cadom-green flex items-center justify-center mb-6 shadow-[0_4px_14px_0_rgba(45,90,39,0.25)] group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-bold font-serif text-cadom-primary mb-3">Agriculture Durable</h3>
            <p className="text-slate-500 leading-relaxed text-sm">Notre coopérative soutient des méthodes respectueuses de l'environnement, favorisant la biodiversité.</p>
          </div>
        </div>
      </section>

      {/* Notre Histoire */}
      <section className="py-20 bg-cadom-bg-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col lg:flex-row items-center gap-16">
          <div className="w-full lg:w-1/2">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-600 rounded-[2rem] transform translate-x-4 translate-y-4 opacity-20"></div>
              <img src={siteConfig?.aboutImage || shuffledImages[1] || '/image/image0.webp'} alt="Notre histoire CADOM" className="relative z-10 w-full h-[500px] object-cover rounded-[2rem] shadow-xl" />
            </div>
          </div>
          <div className="w-full lg:w-1/2">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-6">Notre Histoire & Nos Valeurs</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              CADOM est née d'une vision simple : valoriser le travail des agriculteurs du Gabon. Notre mission est d'offrir une alternative saine et locale à la grande distribution, en proposant des produits certifiés 100% biologiques, cultivés sans pesticides, dans le respect des cycles naturels et du commerce équitable.
            </p>
            <ul className="space-y-4">
              {[
                "Soutien direct aux agriculteurs locaux",
                "Certifications d'agriculture biologique en cours",
                "Processus de qualité rigoureux à la source",
                "Une chaîne d'approvisionnement équitable et transparente"
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-slate-700 font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Récolte du jour */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-center mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">La Récolte du Jour</h2>
          <div className="w-16 h-1 bg-cadom-accent rounded-full mb-4"></div>
          <p className="text-slate-500 max-w-2xl">Découvrez les derniers produits frais et artisanaux ajoutés par notre coopérative.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-cadom-green">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent mb-4" />
            <p className="font-medium animate-pulse">Chargement des produits...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        
        <div className="mt-12 flex justify-center">
          <Link to="/shop" className="text-cadom-green hover:text-cadom-green-hover font-bold flex items-center gap-2 group transition-colors">
            Voir tout le catalogue 
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
