"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Mail, User, Send, Loader2, Phone, ArrowLeft, CheckCircle, Sun, Moon } from 'lucide-react';

export default function ContactPage() {
  useEffect(() => {
    document.title = 'PartyLens France - Nous contacter';
  }, []);
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return alert("Remplissez tous les champs");
    
    setLoading(true);
    try {
      await addDoc(collection(db, "messages"), {
        ...formData,
        createdAt: serverTimestamp(),
        status: "nouveau"
      });

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: "e5f974d9-1984-4afc-902c-65e08ddd774b",
          subject: `Nouveau message de ${formData.name} - PartyLens`,
          from_name: "PartyLens - Formulaire Contact",
          name: formData.name,
          email: formData.email,
          message: formData.message,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({ name: '', email: '', message: '' }); 
        setTimeout(() => setSuccess(false), 5000); 
      } else {
        throw new Error("Le service d'envoi d'email a échoué.");
      }
      
    } catch (error) {
      alert("Erreur lors de l'envoi du message : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`min-h-screen flex flex-col items-center px-6 py-16 font-sans relative transition-colors duration-300 ${
      darkMode 
        ? 'bg-[#0f071e] text-slate-100 selection:bg-orange-500 selection:text-white' 
        : 'bg-[#f4f4f6] text-slate-900 selection:bg-orange-500 selection:text-white'
    }`}>
      
      {/* BOUTON SWITCH MODE CLAIR / SOMBRE (FIXÉ EN HAUT À DROITE) */}
      <button 
        onClick={() => setDarkMode(!darkMode)}
        className={`absolute top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md border ${
          darkMode 
            ? 'bg-white/10 text-amber-300 border-white/20 hover:bg-white/20' 
            : 'bg-[#eaeaea] text-slate-700 border-slate-300 hover:bg-[#dedede]'
        }`}
        aria-label="Changer le mode d'affichage"
      >
        {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        <span>{darkMode ? "Mode Clair" : "Mode Sombre"}</span>
      </button>

      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {darkMode ? (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-purple-600/15 via-orange-600/10 to-transparent rounded-full blur-[120px]"></div>
        ) : (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-purple-200/30 via-orange-100/20 to-transparent rounded-full blur-[100px]"></div>
        )}
      </div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
        
        {/* EN-TÊTE AVEC BOUTON RETOUR ET LOGO */}
        <div className="w-full flex justify-start mb-6">
          <button 
            onClick={() => router.back()} 
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm border cursor-pointer ${
              darkMode 
                ? 'bg-white/[0.04] text-white border-white/10 hover:bg-white/[0.08]' 
                : 'bg-[#eaeaea] text-slate-700 border-slate-300 hover:bg-[#dedede]'
            }`}
          >
            <ArrowLeft size={16} /> Retour
          </button>
        </div>

        <img 
          src="/logo-partylens.png" 
          alt="PartyLens" 
          className="w-[420px] max-w-[90vw] h-auto mb-6 drop-shadow-md" 
        />
        
        <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight text-center mb-10 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Contactez notre équipe
        </h1>

        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* INFORMATIONS DE CONTACT */}
          <div className="space-y-6">
            <div className={`p-6 rounded-2xl transition-all shadow-sm border ${
              darkMode ? 'bg-white/[0.02] border-white/5' : 'bg-[#eaeaea] border-slate-300/60'
            }`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>Une question ? Un besoin ?</p>
              <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Notre équipe est à votre écoute pour toute question concernant nos packs, un problème technique ou un accompagnement personnalisé pour vos événements.
              </p>
            </div>

            <div className="space-y-4">
              <div className={`p-6 rounded-2xl transition-all shadow-sm border flex items-center gap-4 ${
                darkMode ? 'bg-white/[0.02] border-white/5' : 'bg-[#eaeaea] border-slate-300/60'
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  darkMode ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400' : 'bg-orange-50 border border-orange-200/60 text-orange-600'
                }`}>
                  <Mail size={18} />
                </div>
                <div>
                  <span className={`block text-[10px] uppercase font-bold tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Email direct</span>
                  <span className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>contact@partylens.fr</span>
                </div>
              </div>

              <div className={`p-6 rounded-2xl transition-all shadow-sm border flex items-center gap-4 ${
                darkMode ? 'bg-white/[0.02] border-white/5' : 'bg-[#eaeaea] border-slate-300/60'
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  darkMode ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400' : 'bg-orange-50 border border-orange-200/60 text-orange-600'
                }`}>
                  <Phone size={18} />
                </div>
                <div>
                  <span className={`block text-[10px] uppercase font-bold tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Support téléphonique (10h-2h 7j/7)</span>
                  <span className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>07 87 01 60 77</span>
                </div>
              </div>
            </div>
          </div>

          {/* FORMULAIRE DE CONTACT */}
          <div className={`w-full rounded-3xl p-8 md:p-10 backdrop-blur-xl shadow-xl ${
            darkMode 
              ? 'bg-[#170c2c]/80 border border-white/10 shadow-2xl' 
              : 'bg-[#eaeaea]/80 border border-slate-300/80 shadow-slate-300/30'
          }`}>
            {success ? (
              <div className="text-center py-12 space-y-4">
                <CheckCircle size={56} className="text-emerald-400 mx-auto animate-bounce drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Message envoyé !</h3>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Nous vous répondrons dans les plus brefs délais.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                
                <div className="relative">
                  <User className={`absolute left-4 top-3.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} size={18} />
                  <input 
                    required 
                    type="text" 
                    placeholder="Votre Nom complet" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className={`w-full pl-12 pr-4 py-3.5 rounded-xl outline-none transition-all text-xs font-medium border ${
                      darkMode 
                        ? 'bg-white/[0.02] border-white/10 text-white placeholder-slate-400 focus:border-orange-500' 
                        : 'bg-[#f4f4f6] border-slate-300 text-slate-900 placeholder-slate-500 focus:border-orange-500'
                    }`} 
                  />
                </div>

                <div className="relative">
                  <Mail className={`absolute left-4 top-3.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} size={18} />
                  <input 
                    required 
                    type="email" 
                    placeholder="Votre Email" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    className={`w-full pl-12 pr-4 py-3.5 rounded-xl outline-none transition-all text-xs font-medium border ${
                      darkMode 
                        ? 'bg-white/[0.02] border-white/10 text-white placeholder-slate-400 focus:border-orange-500' 
                        : 'bg-[#f4f4f6] border-slate-300 text-slate-900 placeholder-slate-500 focus:border-orange-500'
                    }`} 
                  />
                </div>

                <div className="relative">
                  <textarea 
                    required 
                    placeholder="Votre message..." 
                    rows={5} 
                    value={formData.message} 
                    onChange={e => setFormData({...formData, message: e.target.value})} 
                    className={`w-full p-4 rounded-xl outline-none transition-all resize-none text-xs font-medium border ${
                      darkMode 
                        ? 'bg-white/[0.02] border-white/10 text-white placeholder-slate-400 focus:border-orange-500' 
                        : 'bg-[#f4f4f6] border-slate-300 text-slate-900 placeholder-slate-500 focus:border-orange-500'
                    }`} 
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3.5 px-6 rounded-xl font-bold tracking-wide text-xs shadow-lg shadow-orange-500/20 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Envoyer mon message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>

      {/* FOOTER */}
      <footer className={`mt-20 pt-8 relative z-10 w-full text-center border-t max-w-5xl ${darkMode ? 'border-white/10 text-slate-500' : 'border-slate-300 text-slate-500'}`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6">
          <p className="text-xs">© 2026 PartyLens. Tous droits réservés.</p>
          <div className={`flex items-center gap-6 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            <a href="/mentions-legales" className="hover:underline">Mentions légales</a>
            <a href="/cgv" className="hover:underline">CGV</a>
            <a href="/avis" className="hover:underline">Avis clients</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
