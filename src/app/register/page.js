"use client";

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Loader2, MapPin, Phone, Lock, Mail, User, Music, Hash, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('organisateur'); 

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [djCodeInput, setDjCodeInput] = useState('');
  
  const [addressSearch, setAddressSearch] = useState('');
  const [street, setStreet] = useState('');
  const [zip, setZip] = useState('');
  const [city, setCity] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (addressSearch.length > 5 && street === '') {
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(addressSearch)}&limit=5`);
          const data = await res.json();
          setSuggestions(data.features || []);
        } catch (e) { 
          console.error(e); 
        }
      }, 300);
      return () => clearTimeout(timer);
    } else { 
      setSuggestions([]); 
    }
  }, [addressSearch, street]);

  const handleSelectAddress = (s) => {
    setStreet(s.properties.name);
    setZip(s.properties.postcode);
    setCity(s.properties.city);
    setAddressSearch(s.properties.label);
    setSuggestions([]);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return alert("Les mots de passe ne sont pas identiques !");
    if (!city) return alert("Veuillez choisir une adresse valide dans la liste déroulante !");

    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      
      const isStandalone = role === 'dj' || (role === 'organisateur' && !djCodeInput);

      await setDoc(doc(db, "users", res.user.uid), {
        email,
        phone,
        address: { street, zip, city },
        role: role,
        isStandalone: isStandalone,
        linkedDjCode: djCodeInput || null,
        plan: "", 
        createdAt: new Date()
      });

      window.location.href = isStandalone ? '/admin/plan-selection' : '/admin';
    } catch (err) {
      alert("Erreur lors de l'inscription : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full bg-gradient-to-b from-[#2d104d] via-[#210a3b] to-[#140427] flex items-center justify-center p-6 font-sans text-white overflow-hidden">
      {/* Halos de lumière en arrière-plan */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-orange-500/15 blur-[130px] rounded-full pointer-events-none" />

      <div className="w-full max-w-xl p-8 sm:p-10 rounded-[40px] border border-white/10 bg-white/[0.04] backdrop-blur-2xl relative z-10 shadow-[0_25px_60px_rgba(0,0,0,0.6)] my-8">
        
        {/* En-tête */}
        <div className="text-center mb-8">
          <img src="/logo-partylens.png" className="w-32 mx-auto mb-4 drop-shadow-md" alt="PartyLens" />
          <h1 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tight bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
            Inscription
          </h1>
          <p className="text-orange-200/60 text-[10px] font-black uppercase tracking-[0.3em] mt-1">
            Rejoignez l&apos;expérience PartyLens
          </p>
        </div>

        {/* Sélecteur de rôle */}
        <div className="flex justify-center gap-4 mb-8">
          <button 
            type="button" 
            onClick={() => setRole('organisateur')} 
            className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border transition-all flex flex-col items-center gap-2 cursor-pointer ${
              role === 'organisateur' 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400/50 shadow-[0_0_20px_rgba(249,115,22,0.3)] scale-[1.02]' 
                : 'bg-white/5 text-white/50 border-white/10 hover:border-white/20 hover:text-white'
            }`}
          >
            <User size={18} /> ORGANISATEUR
          </button>

          <button 
            type="button" 
            onClick={() => setRole('dj')} 
            className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border transition-all flex flex-col items-center gap-2 cursor-pointer ${
              role === 'dj' 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400/50 shadow-[0_0_20px_rgba(249,115,22,0.3)] scale-[1.02]' 
                : 'bg-white/5 text-white/50 border-white/10 hover:border-white/20 hover:text-white'
            }`}
          >
            <Music size={18} /> PRESTATAIRE / DJ
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleRegister} className="space-y-4">
          
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-200/50" size={18} />
            <input 
              type="email" 
              placeholder="EMAIL" 
              required 
              className="input-style" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>

          {/* Mots de passe */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-200/50" size={18} />
              <input 
                type="password" 
                placeholder="MOT DE PASSE" 
                required 
                className="input-style" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-200/50" size={18} />
              <input 
                type="password" 
                placeholder="CONFIRMATION" 
                required 
                className="input-style" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
              />
            </div>
          </div>

          {/* Téléphone */}
          <div className="relative">
            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-200/50" size={18} />
            <input 
              type="tel" 
              placeholder="TÉLÉPHONE" 
              required 
              className="input-style" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
            />
          </div>

          {/* Code DJ (Organisateur uniquement) */}
          {role === 'organisateur' && (
            <div className="relative transition-all animate-in fade-in duration-200">
              <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-400" size={18} />
              <input 
                type="text" 
                placeholder="CODE DJ (OPTIONNEL - POUR COMPTE GRATUIT)" 
                className="input-style border-amber-500/40 focus:border-amber-400 placeholder:text-amber-200/40" 
                value={djCodeInput} 
                onChange={(e) => setDjCodeInput(e.target.value)} 
              />
            </div>
          )}

          {/* Adresse */}
          <div className="relative">
            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-200/50" size={18} />
            <input 
              type="text" 
              placeholder="RECHERCHE TON ADRESSE" 
              required 
              className="input-style" 
              value={addressSearch} 
              onChange={(e) => { setAddressSearch(e.target.value); setStreet(''); }} 
            />
            
            {/* Menu suggestions adresse */}
            {suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-[#1a0831] border border-white/15 rounded-2xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.8)]">
                {suggestions.map((s, i) => (
                  <div 
                    key={i} 
                    onClick={() => handleSelectAddress(s)} 
                    className="p-4 hover:bg-orange-500/20 cursor-pointer text-[10px] font-bold uppercase border-b border-white/5 tracking-widest text-white/90 transition-colors"
                  >
                    {s.properties.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Code postal et Ville */}
          <div className="grid grid-cols-2 gap-4">
            <input 
              type="text" 
              placeholder="CODE POSTAL" 
              required 
              className="input-style bg-white/[0.02]" 
              value={zip} 
              readOnly 
            />
            <input 
              type="text" 
              placeholder="VILLE" 
              required 
              className="input-style bg-white/[0.02]" 
              value={city} 
              readOnly 
            />
          </div>

          {/* Bouton de validation */}
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 rounded-2xl font-black uppercase text-xs tracking-[0.25em] shadow-[0_0_25px_rgba(249,115,22,0.4)] border border-orange-400/30 text-white cursor-pointer active:scale-95 transition-all flex justify-center items-center gap-2 mt-6 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                CRÉER MON COMPTE
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Lien de redirection connexion */}
        <Link 
          href="/login" 
          className="block text-center mt-6 text-orange-200/50 text-[10px] uppercase font-black tracking-widest no-underline italic hover:text-white transition-colors"
        >
          Vous avez déjà un compte ? → Connexion
        </Link>
      </div>

      <style jsx>{`
        .input-style {
          width: 100%;
          padding: 1.1rem 1.25rem 1.1rem 3.25rem;
          border-radius: 1rem;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: white;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.75rem;
          outline: none;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        .input-style::placeholder {
          color: rgba(254, 215, 170, 0.4);
        }
        .input-style:focus {
          border-color: #f97316;
          background: rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </main>
  );
}