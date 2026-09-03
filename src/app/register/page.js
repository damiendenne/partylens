"use client";
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Loader2, MapPin, Phone, Lock, Mail, User, Music, Hash, ArrowRight, Sun, Moon } from 'lucide-react';
import Link from 'next/link';

// 1. Contenu du formulaire recevant l'état darkMode
function RegisterContent({ darkMode }) {
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
      const idToken = await auth.currentUser?.getIdToken();
      fetch('/api/send-welcome-email', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ email, name: '' }) }).catch(() => {});

      window.location.href = isStandalone ? '/admin/plan-selection' : '/admin';
    } catch (err) {
      alert("Erreur lors de l'inscription : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`glass-card w-full max-w-xl p-8 sm:p-10 rounded-[40px] border relative z-10 backdrop-blur-2xl transition-all my-8 ${
      darkMode 
        ? 'bg-[#170c2c]/80 border-white/20 text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.5)]' 
        : 'bg-[#eaeaea]/90 border-slate-300 text-slate-900 shadow-slate-300/40'
    }`}>
      
      {/* En-tête */}
      <div className="text-center mb-8">
        <img src="/logo-partylens.png" className="w-32 mx-auto mb-4 drop-shadow-md" alt="PartyLens" />
        <h1 className={`text-3xl sm:text-4xl font-black italic uppercase tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Inscription
        </h1>
        <p className={`text-[10px] font-black uppercase tracking-[0.3em] mt-1 ${darkMode ? 'text-orange-200/60' : 'text-orange-600/80'}`}>
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
              : darkMode 
                ? 'bg-white/5 text-gray-300 border-white/10 hover:border-white/30 hover:text-white' 
                : 'bg-[#dedede] text-slate-700 border-slate-300 hover:border-slate-400 hover:text-slate-900'
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
              : darkMode 
                ? 'bg-white/5 text-gray-300 border-white/10 hover:border-white/30 hover:text-white' 
                : 'bg-[#dedede] text-slate-700 border-slate-300 hover:border-slate-400 hover:text-slate-900'
          }`}
        >
          <Music size={18} /> PRESTATAIRE / DJ
        </button>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleRegister} className="space-y-4">
        
        {/* Email */}
        <div className="relative">
          <Mail className={`absolute left-5 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`} size={18} />
          <input 
            type="email" 
            placeholder="EMAIL" 
            required 
            className={`input-style ${darkMode ? 'bg-black/40 border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-sm'}`} 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>

        {/* Mots de passe */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <Lock className={`absolute left-5 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`} size={18} />
            <input 
              type="password" 
              placeholder="MOT DE PASSE" 
              required 
              className={`input-style ${darkMode ? 'bg-black/40 border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-sm'}`} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>
          <div className="relative">
            <Lock className={`absolute left-5 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`} size={18} />
            <input 
              type="password" 
              placeholder="CONFIRMATION" 
              required 
              className={`input-style ${darkMode ? 'bg-black/40 border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-sm'}`} 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
            />
          </div>
        </div>

        {/* Téléphone */}
        <div className="relative">
          <Phone className={`absolute left-5 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`} size={18} />
          <input 
            type="tel" 
            placeholder="TÉLÉPHONE" 
            required 
            className={`input-style ${darkMode ? 'bg-black/40 border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-sm'}`} 
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
              className={`input-style border-amber-500/40 focus:border-amber-400 ${darkMode ? 'bg-black/40 text-white placeholder:text-amber-200/40' : 'bg-white text-slate-900 placeholder:text-amber-700/50 shadow-sm'}`} 
              value={djCodeInput} 
              onChange={(e) => setDjCodeInput(e.target.value)} 
            />
          </div>
        )}

        {/* Adresse */}
        <div className="relative">
          <MapPin className={`absolute left-5 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`} size={18} />
          <input 
            type="text" 
            placeholder="RECHERCHE TON ADRESSE" 
            required 
            className={`input-style ${darkMode ? 'bg-black/40 border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-sm'}`} 
            value={addressSearch} 
            onChange={(e) => { setAddressSearch(e.target.value); setStreet(''); }} 
          />
          
          {/* Menu suggestions adresse */}
          {suggestions.length > 0 && (
            <div className={`absolute z-50 w-full mt-2 border rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl ${
              darkMode ? 'bg-[#18082e] border-white/20 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}>
              {suggestions.map((s, i) => (
                <div 
                  key={i} 
                  onClick={() => handleSelectAddress(s)} 
                  className={`p-4 cursor-pointer text-[10px] font-bold uppercase border-b transition-colors ${
                    darkMode ? 'hover:bg-orange-500/20 border-white/10' : 'hover:bg-orange-500/10 border-slate-200'
                  }`}
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
            className={`input-style !pl-5 ${darkMode ? 'bg-white/[0.02] border-white/15 text-white/70' : 'bg-slate-200 border-slate-300 text-slate-700'}`} 
            value={zip} 
            readOnly 
          />
          <input 
            type="text" 
            placeholder="VILLE" 
            required 
            className={`input-style !pl-5 ${darkMode ? 'bg-white/[0.02] border-white/15 text-white/70' : 'bg-slate-200 border-slate-300 text-slate-700'}`} 
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
        className={`block text-center mt-6 text-[10px] uppercase font-black tracking-widest no-underline italic transition-colors ${
          darkMode ? 'text-orange-200/50 hover:text-white' : 'text-orange-600 hover:text-slate-900'
        }`}
      >
        Vous avez déjà un compte ? → Connexion
      </Link>
    </div>
  );
}

// 2. Page principale gérant l'état global du mode clair / sombre
export default function RegisterPage() {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <main className={`min-h-screen flex items-center justify-center p-6 font-sans relative overflow-hidden transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-b from-[#2d104d] via-[#210a3b] to-[#140427] text-white selection:bg-orange-500 selection:text-white' 
        : 'bg-[#f4f4f6] text-slate-900 selection:bg-orange-500 selection:text-white'
    }`}>
      
      {/* BOUTON SWITCH MODE CLAIR / SOMBRE (FIXÉ EN HAUT À DROITE) */}
      <button 
        onClick={() => setDarkMode(!darkMode)}
        className={`absolute top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md border cursor-pointer ${
          darkMode 
            ? 'bg-white/10 text-amber-300 border-white/20 hover:bg-white/20' 
            : 'bg-[#eaeaea] text-slate-700 border-slate-300 hover:bg-[#dedede]'
        }`}
        aria-label="Changer le mode d'affichage"
      >
        {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        <span>{darkMode ? "Mode Clair" : "Mode Sombre"}</span>
      </button>

      {/* VAGUES LUMINEUSES ET EFFETS ADAPTÉS */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {darkMode ? (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 blur-[130px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-orange-500/15 blur-[130px] rounded-full pointer-events-none" />
          </>
        ) : (
          <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-r from-purple-200/30 via-orange-100/30 to-transparent rounded-full blur-[100px]"></div>
        )}
      </div>

      <RegisterContent darkMode={darkMode} />

      <style jsx global>{`
        .input-style {
          width: 100%;
          padding: 1.1rem 1.25rem 1.1rem 3.25rem;
          border-radius: 1rem;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.75rem;
          outline: none;
          transition: all 0.3s;
        }
        .input-style:focus {
          border-color: #f97316 !important;
          box-shadow: 0 0 15px rgba(249, 115, 22, 0.3);
        }
      `}</style>
    </main>
  );
}
