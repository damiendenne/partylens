"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Phone, Lock, Mail, User, Music, Hash, ArrowRight, Sun, Moon } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("organisateur");
  const [darkMode, setDarkMode] = useState(true);

  // Formulaire base
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [djCodeInput, setDjCodeInput] = useState("");

  // Adresse auto
  const [addressSearch, setAddressSearch] = useState("");
  const [street, setStreet] = useState("");
  const [zip, setZip] = useState("");
  const [city, setCity] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  // Gestion du mode jour/nuit avec localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('partylens_dark_mode');
    if (savedMode !== null) {
      setDarkMode(JSON.parse(savedMode));
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('partylens_dark_mode', JSON.stringify(newMode));
  };

  useEffect(() => {
    if (isRegister && addressSearch.length > 5 && street === "") {
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(
            `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(addressSearch)}&limit=5`
          );
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
  }, [addressSearch, street, isRegister]);

  const handleSelectAddress = (s) => {
    setStreet(s.properties.name);
    setZip(s.properties.postcode);
    setCity(s.properties.city);
    setAddressSearch(s.properties.label);
    setSuggestions([]);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        if (password !== confirmPassword) {
          throw new Error("Les mots de passe ne correspondent pas");
        }
        if (!city) {
          throw new Error("Veuillez sélectionner une adresse valide dans la liste");
        }

        const isStandalone = role === "dj" || (role === "organisateur" && !djCodeInput);

        const res = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", res.user.uid), {
          email,
          phone,
          address: { street, zip, city },
          role,
          isStandalone,
          linkedDjCode: djCodeInput || null,
          plan: "",
          createdAt: new Date(),
        });

        window.location.href = isStandalone ? "/admin/plan-selection" : "/admin";
      } else {
        const res = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, "users", res.user.uid));

        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.isStandalone && !data.plan) {
            window.location.href = "/admin/plan-selection";
          } else {
            window.location.href = "/admin";
          }
        }
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`relative min-h-screen w-full flex items-center justify-center p-6 font-sans overflow-hidden transition-colors duration-300 ${
      darkMode ? 'bg-[#0f071e] text-white' : 'bg-[#f4f4f6] text-slate-900'
    }`}>
      {/* Halos de lumière décoratifs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/25 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-500/20 blur-[130px] rounded-full pointer-events-none" />

      {/* BOUTON TOGGLE MODE EN HAUT À DROITE */}
      <div className="absolute top-8 right-8 z-50">
        <button 
          onClick={toggleDarkMode}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-lg border backdrop-blur-xl cursor-pointer ${
            darkMode 
              ? 'bg-white/10 text-amber-300 border-white/20 hover:bg-white/20' 
              : 'bg-[#eaeaea] text-slate-700 border-slate-300 hover:bg-[#dedede]'
          }`}
          aria-label="Changer le mode d'affichage"
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          <span className="text-[10px] uppercase tracking-wider">{darkMode ? "Clair" : "Sombre"}</span>
        </button>
      </div>

      {/* Card principale avec Glassmorphism */}
      <div className={`relative z-10 w-full max-w-xl p-8 sm:p-10 rounded-[40px] border backdrop-blur-2xl transition-colors duration-300 ${
        darkMode 
          ? 'border-white/10 bg-white/[0.05] shadow-[0_25px_60px_rgba(0,0,0,0.6)] text-white' 
          : 'border-slate-300/80 bg-white/80 shadow-xl text-slate-900'
      }`}>
        <div className="text-center mb-8">
          <img src="/logo-partylens.png" className="w-32 mx-auto mb-4 drop-shadow-md" alt="PartyLens" />
          <h1 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tight bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
            {isRegister ? "Inscription" : "Connexion"}
          </h1>
          <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${darkMode ? 'text-orange-200/70' : 'text-orange-600'}`}>
            {isRegister ? "Rejoignez l'expérience PartyLens" : "Accédez à vos événements"}
          </p>
        </div>

        {/* Sélecteur de Rôle */}
        {isRegister && (
          <div className="flex justify-center gap-3 mb-6 animate-in slide-in-from-top-4">
            <button
              type="button"
              onClick={() => setRole("organisateur")}
              className={`flex-1 py-4 px-3 rounded-2xl font-black uppercase text-[10px] tracking-widest border transition-all flex flex-col items-center gap-2 cursor-pointer active:scale-95 ${
                role === "organisateur"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400/40 shadow-lg"
                  : darkMode 
                    ? "bg-white/5 text-white/50 border-white/10 hover:border-white/20 hover:text-white"
                    : "bg-[#eaeaea] text-slate-600 border-slate-300 hover:bg-[#dedede] hover:text-slate-900"
              }`}
            >
              <User size={18} className={role === "organisateur" ? "text-white" : darkMode ? "text-white/50" : "text-slate-500"} />
              ORGANISATEUR
            </button>
            <button
              type="button"
              onClick={() => setRole("dj")}
              className={`flex-1 py-4 px-3 rounded-2xl font-black uppercase text-[10px] tracking-widest border transition-all flex flex-col items-center gap-2 cursor-pointer active:scale-95 ${
                role === "dj"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400/40 shadow-lg"
                  : darkMode 
                    ? "bg-white/5 text-white/50 border-white/10 hover:border-white/20 hover:text-white"
                    : "bg-[#eaeaea] text-slate-600 border-slate-300 hover:bg-[#dedede] hover:text-slate-900"
              }`}
            >
              <Music size={18} className={role === "dj" ? "text-white" : darkMode ? "text-white/50" : "text-slate-500"} />
              PRESTATAIRE / DJ
            </button>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-400" size={18} />
            <input
              type="email"
              placeholder="EMAIL"
              required
              className={`w-full pl-13 pr-5 py-4 border rounded-2xl text-xs font-bold uppercase outline-none transition-all ${
                darkMode 
                  ? 'bg-white/10 border-white/15 text-white placeholder-white/40 focus:border-orange-500' 
                  : 'bg-[#eaeaea]/60 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-orange-500'
              }`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Passwords */}
          <div className={`grid ${isRegister ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"} gap-4`}>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-400" size={18} />
              <input
                type="password"
                placeholder="MOT DE PASSE"
                required
                className={`w-full pl-13 pr-5 py-4 border rounded-2xl text-xs font-bold uppercase outline-none transition-all ${
                  darkMode 
                    ? 'bg-white/10 border-white/15 text-white placeholder-white/40 focus:border-orange-500' 
                    : 'bg-[#eaeaea]/60 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-orange-500'
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {isRegister && (
              <div className="relative animate-in zoom-in">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-400" size={18} />
                <input
                  type="password"
                  placeholder="CONFIRMATION"
                  required
                  className={`w-full pl-13 pr-5 py-4 border rounded-2xl text-xs font-bold uppercase outline-none transition-all ${
                    darkMode 
                      ? 'bg-white/10 border-white/15 text-white placeholder-white/40 focus:border-orange-500' 
                      : 'bg-[#eaeaea]/60 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-orange-500'
                  }`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Informations complémentaires à l'inscription */}
          {isRegister && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
              {/* Téléphone */}
              <div className="relative">
                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-400" size={18} />
                <input
                  type="tel"
                  placeholder="TÉLÉPHONE"
                  required
                  className={`w-full pl-13 pr-5 py-4 border rounded-2xl text-xs font-bold uppercase outline-none transition-all ${
                    darkMode 
                      ? 'bg-white/10 border-white/15 text-white placeholder-white/40 focus:border-orange-500' 
                      : 'bg-[#eaeaea]/60 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-orange-500'
                  }`}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {/* Code DJ Optionnel */}
              {role === "organisateur" && (
                <div className="relative animate-in slide-in-from-top-2">
                  <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-400" size={18} />
                  <input
                    type="text"
                    placeholder="CODE DJ (OPTIONNEL - POUR COMPTE GRATUIT)"
                    className={`w-full pl-13 pr-5 py-4 border rounded-2xl text-xs font-bold uppercase outline-none transition-all ${
                      darkMode 
                        ? 'bg-amber-500/10 border-amber-400/30 text-amber-100 placeholder-amber-300/40 focus:border-amber-400' 
                        : 'bg-amber-500/10 border-amber-400/40 text-amber-900 placeholder-amber-700/60 focus:border-amber-500'
                    }`}
                    value={djCodeInput}
                    onChange={(e) => setDjCodeInput(e.target.value)}
                  />
                </div>
              )}

              {/* Adresse API */}
              <div className="relative">
                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-400" size={18} />
                <input
                  type="text"
                  placeholder="RECHERCHE TON ADRESSE"
                  required
                  className={`w-full pl-13 pr-5 py-4 border rounded-2xl text-xs font-bold uppercase outline-none transition-all ${
                    darkMode 
                      ? 'bg-white/10 border-white/15 text-white placeholder-white/40 focus:border-orange-500' 
                      : 'bg-[#eaeaea]/60 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-orange-500'
                  }`}
                  value={addressSearch}
                  onChange={(e) => {
                    setAddressSearch(e.target.value);
                    setStreet("");
                  }}
                />
                {suggestions.length > 0 && (
                  <div className={`absolute z-50 w-full mt-2 border rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl ${
                    darkMode ? 'bg-[#140427]/95 border-white/15 text-orange-100' : 'bg-white/95 border-slate-300 text-slate-800'
                  }`}>
                    {suggestions.map((s, i) => (
                      <div
                        key={i}
                        onClick={() => handleSelectAddress(s)}
                        className={`p-4 cursor-pointer text-[10px] font-bold uppercase border-b transition-colors ${
                          darkMode ? 'hover:bg-orange-500/20 border-white/5' : 'hover:bg-orange-500/10 border-slate-200'
                        }`}
                      >
                        {s.properties.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Code Postal et Ville */}
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="CP"
                  required
                  className={`w-full px-5 py-4 border rounded-2xl text-xs font-bold uppercase outline-none cursor-not-allowed ${
                    darkMode ? 'bg-white/5 border-white/10 text-white/70 placeholder-white/30' : 'bg-slate-200/50 border-slate-300 text-slate-700 placeholder-slate-400'
                  }`}
                  value={zip}
                  readOnly
                />
                <input
                  type="text"
                  placeholder="VILLE"
                  required
                  className={`w-full px-5 py-4 border rounded-2xl text-xs font-bold uppercase outline-none cursor-not-allowed ${
                    darkMode ? 'bg-white/5 border-white/10 text-white/70 placeholder-white/30' : 'bg-slate-200/50 border-slate-300 text-slate-700 placeholder-slate-400'
                  }`}
                  value={city}
                  readOnly
                />
              </div>
            </div>
          )}

          {/* Bouton de Soumission */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-6 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 rounded-2xl font-black uppercase text-xs tracking-widest text-white cursor-pointer active:scale-95 transition-all flex justify-center items-center gap-2 shadow-lg border border-orange-400/30 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                {isRegister ? "CRÉER MON COMPTE" : "SE CONNECTER"}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode Auth */}
        <button
          onClick={() => setIsRegister(!isRegister)}
          className={`w-full mt-6 text-[10px] uppercase font-black tracking-widest bg-transparent border-none cursor-pointer transition-colors text-center ${
            darkMode ? 'text-orange-200/70 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {isRegister
            ? "J'ai déjà un compte ? → Connexion"
            : "Pas encore de compte ? → Inscription"}
        </button>
      </div>
    </main>
  );
}