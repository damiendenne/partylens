"use client";
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation'; // Ajout de useSearchParams
import { Loader2, MapPin, Phone, Lock, Mail, User, Music, Hash, Edit3 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Initialisation des paramètres de recherche
  const isDemo = searchParams.get('demo') === 'true'; // Détection du mode Démo

  const [isRegister, setIsRegister] = useState(false); 
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('organisateur');

  // Formulaire base
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [djCodeInput, setDjCodeInput] = useState('');
  
  // Adresse auto & Manuel
  const [isManualAddress, setIsManualAddress] = useState(false);
  const [addressSearch, setAddressSearch] = useState('');
  const [street, setStreet] = useState('');
  const [zip, setZip] = useState('');
  const [city, setCity] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (isRegister && !isManualAddress && addressSearch.length > 5 && street === '') {
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(addressSearch)}&limit=5`);
          const data = await res.json();
          setSuggestions(data.features || []);
        } catch (e) { console.error(e); }
      }, 300);
      return () => clearTimeout(timer);
    } else { setSuggestions([]); }
  }, [addressSearch, street, isRegister, isManualAddress]);

  const handleSelectAddress = (s) => {
    setStreet(s.properties.name);
    setZip(s.properties.postcode);
    setCity(s.properties.city);
    setAddressSearch(s.properties.label);
    setSuggestions([]);
  };

  const toggleManualAddress = () => {
    setIsManualAddress(!isManualAddress);
    setStreet('');
    setZip('');
    setCity('');
    setAddressSearch('');
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        if (password !== confirmPassword) throw new Error("Les mots de passe ne correspondent pas");
        
        const finalStreet = isManualAddress ? addressSearch : street;
        if (!finalStreet || !city || !zip) throw new Error("Veuillez renseigner une adresse complète");

        const isStandalone = role === 'dj' || (role === 'organisateur' && !djCodeInput);

        const res = await createUserWithEmailAndPassword(auth, email, password);
        
        // Si c'est une démo, on lui attribue directement le plan "DEMO"
        const finalPlan = isDemo ? "DEMO" : "";

        await setDoc(doc(db, "users", res.user.uid), {
          email, 
          phone, 
          address: { street: finalStreet, zip, city }, 
          role: role, 
          isStandalone: isStandalone,
          linkedDjCode: djCodeInput || null,
          plan: finalPlan, 
          createdAt: new Date()
        });

        if (role === 'dj') {
          window.location.href = '/admin';
        } else {
          // Si c'est un test gratuit (Démo), on court-circuite le choix du forfait !
          if (isDemo) {
            window.location.href = '/admin';
          } else {
            window.location.href = isStandalone ? '/admin/plan-selection' : '/admin';
          }
        }
      } else {
        const res = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, "users", res.user.uid));
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.role === 'dj') {
            window.location.href = '/admin';
          } else {
            // Au login, si le compte est marqué "DEMO", on le laisse aussi passer vers l'admin
            if (data.isStandalone && !data.plan) {
              window.location.href = '/admin/plan-selection';
            } else {
              window.location.href = '/admin';
            }
          }
        }
      }
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-6 font-sans relative overflow-hidden text-white">
      <div className="bg-blobs fixed inset-0 z-0">
        <div className="blob-pink absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#ff0080] opacity-20 blur-[100px] rounded-full"></div>
        <div className="blob-blue absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#0072ff] opacity-20 blur-[100px] rounded-full"></div>
      </div>

      <div className="glass-card w-full max-w-xl p-10 rounded-[40px] border border-white/5 relative z-10 bg-white/[0.02] backdrop-blur-3xl shadow-2xl">
        <div className="text-center mb-10">
          <img src="/logo-partylens.png" className="w-32 mx-auto mb-6" alt="Logo" />
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">
            {isRegister ? 'Inscription' : 'Connexion'}
          </h1>
          {isDemo && isRegister && (
            <p className="text-[#ff0080] text-xs font-black uppercase tracking-widest mt-2 animate-pulse">
              ✨ Mode Test Gratuit Activé ✨
            </p>
          )}
        </div>

        {isRegister && (
          <div className="flex justify-center gap-4 mb-8 animate-in slide-in-from-top-4">
            <button 
              type="button" 
              onClick={() => setRole('organisateur')} 
              className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2 transition-all flex flex-col items-center gap-2 cursor-pointer ${role === 'organisateur' ? 'bg-white text-black border-white shadow-xl' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20'}`}
            >
              <User size={18} /> ORGANISATEUR
            </button>
            <button 
              type="button" 
              onClick={() => setRole('dj')} 
              className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2 transition-all flex flex-col items-center gap-2 cursor-pointer ${role === 'dj' ? 'bg-[#ff0080] text-white border-[#ff0080] shadow-xl' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20'}`}
            >
              <Music size={18} /> PRESTATAIRE / DJ
            </button>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-5 top-5 text-gray-500" size={18} />
            <input type="email" placeholder="EMAIL" required className="input-style" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className={`grid ${isRegister ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
            <div className="relative">
              <Lock className="absolute left-5 top-5 text-gray-500" size={18} />
              <input type="password" placeholder="MOT DE PASSE" required className="input-style" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {isRegister && (
              <div className="relative animate-in zoom-in">
                <Lock className="absolute left-5 top-5 text-gray-500" size={18} />
                <input type="password" placeholder="CONFIRMATION" required className="input-style" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
            )}
          </div>

          {isRegister && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
              <div className="relative">
                <Phone className="absolute left-5 top-5 text-gray-500" size={18} />
                <input type="tel" placeholder="TÉLÉPHONE" required className="input-style" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              {role === 'organisateur' && (
                <div className="relative animate-in slide-in-from-top-2">
                  <Hash className="absolute left-5 top-5 text-[#ff0080]" size={18} />
                  <input 
                    type="text" 
                    placeholder="CODE DJ (OPTIONNEL)" 
                    className="input-style border-[#ff0080]/30" 
                    value={djCodeInput} 
                    onChange={(e) => setDjCodeInput(e.target.value)} 
                  />
                </div>
              )}

              {/* --- SECTION ADRESSE --- */}
              <div className="space-y-3">
                <div className="relative">
                  {isManualAddress ? <Edit3 className="absolute left-5 top-5 text-[#ff0080]" size={18} /> : <MapPin className="absolute left-5 top-