import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { Button } from '../components/Button';
import { UserCircle, LogOut, Save, Mail, Loader2, Phone, MapPin, Lock, Key, Shield, Info, Star } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');
  const [loading, setLoading] = useState(true);
  
  // Profile state
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    address: '',
    photoURL: '',
    pointsFidelite: 0
  });

  const hasPasswordProvider = auth.currentUser?.providerData.some(p => p.providerId === 'password');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        setProfileData(prev => ({ ...prev, photoURL: dataUrl }));
        setMessage({ type: 'success', text: 'Photo de profil modifiée, n\'oubliez pas d\'enregistrer' });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Security state
  const [secLoading, setSecLoading] = useState(false);
  const [secMessage, setSecMessage] = useState({ type: '', text: '' });
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newEmail: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!user) return;
    
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfileData({
            name: data.name || '',
            phone: data.phone || '',
            address: data.address || '',
            photoURL: data.photoURL || auth.currentUser?.photoURL || '',
            pointsFidelite: data.pointsFidelite || 0
          });
        }
      } catch (err) {
        console.error("Erreur lors de la récupération du profil", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSecurityData({ ...securityData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, {
        name: profileData.name,
        phone: profileData.phone,
        address: profileData.address,
        photoURL: profileData.photoURL
      }, { merge: true });
      
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès.' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du profil.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !user?.email) return;
    
    // Check if anything needs to be updated
    if (!securityData.newEmail && !securityData.newPassword) {
      setSecMessage({ type: 'error', text: 'Veuillez remplir les champs à modifier.' });
      return;
    }

    if (securityData.newPassword && securityData.newPassword !== securityData.confirmPassword) {
      setSecMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas.' });
      return;
    }

    if (hasPasswordProvider && !securityData.currentPassword) {
      setSecMessage({ type: 'error', text: 'Le mot de passe actuel est requis pour toute modification de sécurité.' });
      return;
    }
    
    setSecLoading(true);
    setSecMessage({ type: '', text: '' });
    
    try {
      // Reauthenticate first if they have a password
      if (hasPasswordProvider) {
        const credential = EmailAuthProvider.credential(user.email, securityData.currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
      }

      // Variables to track what was updated
      let emailUpdated = false;
      let passwordUpdated = false;

      if (securityData.newEmail && securityData.newEmail !== user.email) {
        await updateEmail(auth.currentUser, securityData.newEmail);
        
        // Also update the email in the firestore database
        const docRef = doc(db, 'users', user.uid);
        await setDoc(docRef, { email: securityData.newEmail }, { merge: true });
        emailUpdated = true;
      }

      if (securityData.newPassword) {
        await updatePassword(auth.currentUser, securityData.newPassword);
        passwordUpdated = true;
      }
      
      let successMsg = '';
      if (emailUpdated && passwordUpdated) successMsg = 'E-mail et mot de passe mis à jour avec succès.';
      else if (emailUpdated) successMsg = 'Adresse e-mail mise à jour avec succès.';
      else if (passwordUpdated) successMsg = 'Mot de passe mis à jour avec succès.';

      setSecMessage({ type: 'success', text: successMsg });
      
      // Clear sensitive fields
      setSecurityData({
        currentPassword: '',
        newEmail: '',
        newPassword: '',
        confirmPassword: ''
      });

    } catch (err: any) {
      console.error(err);
      let errorMsg = 'Erreur lors de la mise à jour des paramètres de sécurité.';
      if (err.code === 'auth/wrong-password') {
        errorMsg = 'Le mot de passe actuel est incorrect.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'La nouvelle adresse e-mail est invalide.';
      } else if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'Cette adresse e-mail est déjà utilisée par un autre compte.';
      } else if (err.code === 'auth/weak-password') {
        errorMsg = 'Le nouveau mot de passe est trop faible (6 caractères minimum).';
      }
      setSecMessage({ type: 'error', text: errorMsg });
    } finally {
      setSecLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="overflow-x-hidden w-full flex flex-col flex-1">
        <div className="flex grow items-center justify-center p-8 mt-20">
          <div className="flex flex-col items-center justify-center text-center">
            <UserCircle className="w-16 h-16 text-slate-300 mb-4" />
            <h2 className="text-xl font-bold text-slate-700">Connexion requise</h2>
            <p className="text-slate-500 mt-2 mb-6">Veuillez vous connecter pour voir votre profil.</p>
            <button
              onClick={() => {
                searchParams.set('login', 'true');
                setSearchParams(searchParams);
              }}
              className="bg-cadom-accent hover:bg-cadom-accent-hover text-cadom-primary px-8 py-3 rounded-xl font-bold transition-all shadow-sm active:scale-95"
            >
              Se connecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden w-full flex flex-col flex-1">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-[#0d1b2a] to-[#1a3a2a] py-16 px-[5%] text-center relative overflow-hidden">
        {/* Texture de fond */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/leaf.png')]"></div>
        </div>
        
        {/* Surtitre (Badge) */}
        <span className="text-[#c9a84c] text-[0.75rem] font-semibold tracking-[0.2em] uppercase mb-4 block animate-in fade-in slide-in-from-bottom duration-700">
          Espace membre
        </span>
        
        {/* Titre principal */}
        <h1 className="font-serif text-4xl md:text-5xl text-white font-light mt-2">
          Mon Compte <em className="text-[#e8c97a] italic not-italic">Client</em>
        </h1>
      </div>

      <div className="flex-1 w-full flex flex-col items-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden">
        
        {/* Header section */}
        <div className="bg-emerald-600 px-8 py-10 text-white flex flex-col items-center text-center">
          <div className="relative group">
            <div className="bg-white/20 p-1 rounded-full mb-4 backdrop-blur-sm overflow-hidden w-24 h-24 flex items-center justify-center">
              {user.role === 'super-admin' || user.role === 'admin' ? (
                <img src="/image/imagelogo.webp" alt="Logo Entreprise" className="w-full h-full object-cover rounded-full" />
              ) : profileData.photoURL ? (
                <img src={profileData.photoURL} alt="Profil" className="w-full h-full object-cover rounded-full" />
              ) : (
                <UserCircle className="w-16 h-16" />
              )}
            </div>
            {user.role !== 'super-admin' && user.role !== 'admin' && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-xs font-bold w-24 h-24 mx-auto mb-4 border-2 border-white/50">
                Modifier
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            )}
          </div>
          <h1 className="text-3xl font-display font-bold">Mon Compte</h1>
          <p className="opacity-90 mt-2 font-medium">{user.email}</p>
          <div className="mt-4 inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest">
            {user.role === 'client' ? 'Client' : 'Administrateur'}
          </div>
        </div>

        {/* Content section */}
        <div className="px-8 py-8">
          
          {/* Tabs */}
          <div className="flex border-b border-slate-200 mb-8">
            <button
              className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'info' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
              onClick={() => setActiveTab('info')}
            >
              Informations
            </button>
            <button
              className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'security' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
              onClick={() => setActiveTab('security')}
            >
              Sécurité du compte
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : activeTab === 'info' ? (
            <div className="space-y-6">
              {/* Carte Fidélité */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100 shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10">
                  <Star className="w-48 h-48 translate-x-12 -translate-y-12" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-emerald-800 font-bold mb-1 flex items-center gap-2">
                    <Star className="w-5 h-5 fill-emerald-500 text-emerald-500" />
                    Programme Fidélité
                  </h3>
                  <div className="flex items-end gap-2 mb-4">
                    <span className="text-4xl font-display font-bold text-emerald-900">{profileData.pointsFidelite}</span>
                    <span className="text-emerald-700 font-medium pb-1">Points</span>
                  </div>
                  
                  <div className="w-full bg-emerald-200/50 rounded-full h-3 mb-2 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-3 rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${Math.min((profileData.pointsFidelite / 100) * 100, 100)}%` }}
                    ></div>
                  </div>
                  
                  {profileData.pointsFidelite >= 100 ? (
                    <div className="bg-amber-100 text-amber-800 p-3 rounded-xl text-sm font-bold animate-pulse mt-4 flex items-start gap-2">
                      <span className="text-xl">🎡</span>
                      <p>Félicitations ! Vous avez atteint 100 points. Venez en boutique tourner notre <strong>Grande Roue</strong> pour gagner une récompense surprise !</p>
                    </div>
                  ) : (
                    <p className="text-sm text-emerald-700/80 font-medium">
                      Encore {100 - profileData.pointsFidelite} points avant de pouvoir tourner la Grande Roue en boutique !<br/>
                      <span className="text-xs opacity-75">(1 point gagné pour chaque 5 produits achetés)</span>
                    </p>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {message.text && (
                <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {message.text}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <UserCircle className="w-4 h-4 text-emerald-600" />
                    Nom complet
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleChange}
                    placeholder="Jean Dupont"
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    Téléphone
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-500 text-sm font-bold">
                      +241
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleChange}
                      placeholder="00 00 00 00"
                      className="w-full rounded-r-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Adresse de livraison habituelle
                </label>
                <textarea
                  name="address"
                  value={profileData.address}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Quartier, point de repère..."
                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all resize-none font-medium"
                ></textarea>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <Button type="submit" disabled={saving} className="w-full sm:w-auto flex items-center justify-center gap-2">
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Enregistrer
                    </>
                  )}
                </Button>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => { window.dispatchEvent(new Event('open-feedback')); }}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl border-2 border-amber-100/50 bg-amber-50 text-amber-600 font-bold hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    Laisser un avis
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(new Event('open-feedback'));
                      // Add a small delay so they see it, or maybe don't automatically logout yet?
                      // Wait, if we logout immediately, the widget stays but user becomes null. That might be fine!
                      handleSignOut();
                    }}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl border-2 border-red-100 text-red-600 font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              </div>

            </form>
            </div>
          ) : (
            <form onSubmit={handleSecuritySubmit} className="space-y-6">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm mb-6 flex gap-3 font-medium">
                <Info className="w-5 h-5 flex-shrink-0 text-blue-600" />
                <p>
                  {hasPasswordProvider 
                    ? "Pour des raisons de sécurité, vous devez saisir votre mot de passe actuel afin de modifier votre adresse e-mail ou votre mot de passe."
                    : "Vous vous êtes connecté via Google. Vous pouvez définir un mot de passe ici pour accéder à votre compte par e-mail à l'avenir."}
                </p>
              </div>

              {secMessage.text && (
                <div className={`p-4 rounded-xl text-sm font-medium ${secMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {secMessage.text}
                </div>
              )}

              {hasPasswordProvider && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    Mot de passe actuel
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    required
                    value={securityData.currentPassword}
                    onChange={handleSecurityChange}
                    placeholder="Obligatoire pour valider les changements"
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                  />
                </div>
              )}

              <div className={`space-y-6 ${hasPasswordProvider ? 'pt-6 border-t border-slate-100' : ''}`}>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    Nouvelle adresse e-mail
                  </label>
                  <input
                    type="email"
                    name="newEmail"
                    value={securityData.newEmail}
                    onChange={handleSecurityChange}
                    placeholder={hasPasswordProvider ? "Laisser vide pour ne pas modifier" : "Laisser vide si inchangée"}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Key className="w-4 h-4 text-emerald-600" />
                        {hasPasswordProvider ? "Nouveau mot de passe" : "Définir un mot de passe"}
                      </label>
                      {!hasPasswordProvider && (
                        <button 
                          type="button" 
                          onClick={() => {
                            const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
                            const pswd = Array.from({length: 12}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
                            setSecurityData({ ...securityData, newPassword: pswd, confirmPassword: pswd });
                            setSecMessage({ type: 'success', text: `Mot de passe généré : ${pswd} (Assurez-vous de le copier avant d'enregistrer)` });
                          }}
                          className="text-xs text-emerald-600 font-bold hover:text-emerald-700 underline"
                        >
                          Générer
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      name="newPassword"
                      value={securityData.newPassword}
                      onChange={handleSecurityChange}
                      placeholder={hasPasswordProvider ? "Laisser vide pour ne pas modifier" : "Votre nouveau mot de passe"}
                      className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-600" />
                      Confirmer le mot de passe
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={securityData.confirmPassword}
                      onChange={handleSecurityChange}
                      placeholder="Confirmer le nouveau mot de passe"
                      className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <Button type="submit" disabled={secLoading || (!securityData.newEmail && !securityData.newPassword)} className="w-full sm:w-auto flex items-center justify-center gap-2">
                  {secLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Validation...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Appliquer les changements
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
