"use client";
import { useState, useEffect, Suspense } from 'react';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, MapPin, Phone, Lock, Mail, User, Music, Hash, Edit3, Sun, Moon } from 'lucide-react';

// 1. Contenu du formulaire recevant l'état darkMode
function LoginContent({ darkMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';

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

        // Send the branded welcome email without blocking account creation.
        const idToken = await auth.currentUser?.getIdToken();
        fetch('/api/send-welcome-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ email, name: '' })
        }).catch(() => {});

        if (role === 'dj') {
          window.location.href = '/admin';
        } else {
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
    <div className={`w-full max-w-xl p-8 md:p-12 rounded-3xl backdrop-blur-xl shadow-xl relative z-10 transition-all ${
      darkMode 
        ? 'bg-[#170c2c]/80 border border-white/10 shadow-2xl text-slate-100' 
        : 'bg-[#eaeaea]/80 border border-slate-300/80 shadow-slate-300/30 text-slate-900'
    }`}>
      <div className="text-center mb-8">
        <img src="/logo-partylens.png" className="w-[280px] max-w-[80vw] mx-auto mb-6 drop-shadow-md" alt="Logo" />
        <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          {isRegister ? 'Créer votre compte' : 'Espace Organisateur & DJ'}
        </h1>
        {isDemo && isRegister && (
          <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mt-2">
            ✨ Mode Test Gratuit Activé ✨
          </p>
        )}
      </div>

      {isRegister && (
        <div className="flex justify-center gap-4 mb-6">
          <button 
            type="button" 
            onClick={() => setRole('organisateur')} 
            className={`flex-1 py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border ${
              role === 'organisateur' 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400 shadow-md' 
                : darkMode 
                  ? 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10' 
                  : 'bg-[#dedede] text-slate-700 border-slate-300 hover:bg-[#d4d4d4]'
            }`}
          >
            <User size={16} /> ORGANISATEUR
          </button>
          <button 
            type="button" 
            onClick={() => setRole('dj')} 
            className={`flex-1 py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border ${
              role === 'dj' 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400 shadow-md' 
                : darkMode 
                  ? 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10' 
                  : 'bg-[#dedede] text-slate-700 border-slate-300 hover:bg-[#d4d4d4]'
            }`}
          >
            <Music size={16} /> PRESTATAIRE / DJ
          </button>
        </div>
      )}

      <form onSubmit={handleAuth} className="space-y-4">
        <div className="relative">
          <Mail className={`absolute left-4 top-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} size={18} />
          <input 
            type="email" 
            placeholder="EMAIL" 
            required 
            className={`input-style ${darkMode ? 'bg-white/[0.02] border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-sm'}`} 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>

        <div className={`grid ${isRegister ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-4`}>
          <div className="relative">
            <Lock className={`absolute left-4 top-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} size={18} />
            <input 
              type="password" 
              placeholder="MOT DE PASSE" 
              required 
              className={`input-style ${darkMode ? 'bg-white/[0.02] border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-sm'}`} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>
          {isRegister && (
            <div className="relative">
              <Lock className={`absolute left-4 top-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} size={18} />
              <input 
                type="password" 
                placeholder="CONFIRMATION" 
                required 
                className={`input-style ${darkMode ? 'bg-white/[0.02] border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-sm'}`} 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
              />
            </div>
          )}
        </div>

        {isRegister && (
          <div className="space-y-4">
            <div className="relative">
              <Phone className={`absolute left-4 top-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} size={18} />
              <input 
                type="tel" 
                placeholder="TÉLÉPHONE" 
                required 
                className={`input-style ${darkMode ? 'bg-white/[0.02] border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-sm'}`} 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
              />
            </div>

            {role === 'organisateur' && (
              <div className="relative">
                <Hash className="absolute left-4 top-4 text-orange-500" size={18} />
                <input 
                  type="text" 
                  placeholder="CODE DJ (OPTIONNEL)" 
                  className={`input-style ${darkMode ? 'bg-white/[0.02] border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-sm'}`} 
                  value={djCodeInput} 
                  onChange={(e) => setDjCodeInput(e.target.value)} 
                />
              </div>
            )}

            {/* --- SECTION ADRESSE --- */}
            <div className="space-y-3">
              <div className="relative">
                {isManualAddress ? <Edit3 className="absolute left-4 top-4 text-orange-500" size={18} /> : <MapPin className={`absolute left-4 top-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} size={18} />}
                <input 
                  type="text" 
                  placeholder={isManualAddress ? "NUMÉRO ET NOM DE RUE" : "RECHERCHE TON ADRESSE"} 
                  required 
                  className={`input-style ${darkMode ? 'bg-white/[0.02] border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-sm'}`} 
                  value={addressSearch} 
                  onChange={(e) => { setAddressSearch(e.target.value); if(!isManualAddress) setStreet(''); }} 
                />
                
                {!isManualAddress && suggestions.length > 0 && (
                  <div className={`absolute z-50 w-full mt-2 border rounded-xl overflow-hidden shadow-xl backdrop-blur-xl ${
                    darkMode ? 'bg-[#170c2c] border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}>
                    {suggestions.map((s, i) => (
                      <div 
                        key={i} 
                        onClick={() => handleSelectAddress(s)} 
                        className={`p-3 cursor-pointer text-xs font-semibold border-b transition-colors ${
                          darkMode ? 'hover:bg-white/10 border-white/5' : 'hover:bg-orange-50 border-slate-100'
                        }`}
                      >
                        {s.properties.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button 
                type="button" 
                onClick={toggleManualAddress}
                className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isManualAddress 
                    ? 'border-orange-500 text-orange-400 bg-orange-500/10' 
                    : darkMode 
                      ? 'border-white/10 text-slate-300 hover:text-white hover:bg-white/5 bg-white/[0.02]' 
                      : 'border-slate-300 text-slate-700 hover:text-slate-900 bg-[#dedede]'
                }`}
              >
                {isManualAddress ? "← Revenir à la recherche automatique" : "📍 Adresse introuvable ? Saisir manuellement"}
              </button>

              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="CODE POSTAL" 
                  required 
                  className={`input-style !pl-4 ${
                    !isManualAddress 
                      ? (darkMode ? 'opacity-50 cursor-not-allowed bg-white/5 text-slate-500' : 'opacity-50 cursor-not-allowed bg-slate-200 text-slate-400') 
                      : (darkMode ? 'bg-white/[0.02] border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-sm')
                  }`} 
                  value={zip} 
                  readOnly={!isManualAddress}
                  onChange={(e) => setZip(e.target.value)}
                />
                <input 
                  type="text" 
                  placeholder="VILLE" 
                  required 
                  className={`input-style !pl-4 ${
                    !isManualAddress 
                      ? (darkMode ? 'opacity-50 cursor-not-allowed bg-white/5 text-slate-500' : 'opacity-50 cursor-not-allowed bg-slate-200 text-slate-400') 
                      : (darkMode ? 'bg-white/[0.02] border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-sm')
                  }`} 
                  value={city} 
                  readOnly={!isManualAddress}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl font-bold uppercase text-xs tracking-wider shadow-lg shadow-orange-500/20 text-white cursor-pointer hover:brightness-105 active:scale-[0.98] transition-all flex justify-center items-center mt-6"
        >
          {loading ? <Loader2 className="animate-spin text-white" size={18} /> : (isRegister ? "Créer mon compte" : "Se connecter")}
        </button>
      </form>

      <button 
        type="button" 
        onClick={() => setIsRegister(!isRegister)} 
        className={`w-full mt-6 text-xs font-semibold bg-transparent border-none cursor-pointer transition-colors text-center ${
          darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        {isRegister ? "J'déjà un compte ? → Connexion" : "Pas encore de compte ? → Inscription"}
      </button>
    </div>
  );
}

// 2. Page principale gérant l'état global du mode clair / sombre
export default function LoginPage() {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <main className={`min-h-screen flex flex-col items-center justify-center px-6 py-16 font-sans relative transition-colors duration-300 ${
      darkMode 
        ? 'bg-[#0f071e] text-slate-100 selection:bg-orange-500 selection:text-white' 
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

      {/* BACKGROUND EFFECTS IDENTIQUES ACCUEIL */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {darkMode ? (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-purple-600/15 via-orange-600/10 to-transparent rounded-full blur-[120px]"></div>
        ) : (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-purple-200/30 via-orange-100/20 to-transparent rounded-full blur-[100px]"></div>
        )}
      </div>

      <Suspense fallback={<Loader2 className="animate-spin text-orange-500 w-8 h-8" />}>
        <LoginContent darkMode={darkMode} />
      </Suspense>

      <style jsx global>{`
        .input-style { 
          width: 100%; 
          padding: 0.875rem 1rem 0.875rem 2.75rem; 
          border-radius: 0.75rem; 
          font-weight: 600; 
          font-size: 0.75rem; 
          outline: none; 
          transition: all 0.2s; 
          border-width: 1px;
        }
        .input-style:focus { 
          border-color: #f97316 !important; 
          box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2); 
        }
      `}</style>
    </main>
  );
}
