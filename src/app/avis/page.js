"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { ArrowLeft, Star, Send, CheckCircle, MessageSquare, Mail, User, Loader2, Sun, Moon } from 'lucide-react';

export default function AvisPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");
  const [feedbacks, setFeedbacks] = useState([]);

  // Lecture des avis en temps réel (limité aux 10 derniers)
  useEffect(() => {
    const q = query(collection(db, "feedbacks"), orderBy("createdAt", "desc"), limit(10));
    const unsub = onSnapshot(q, (snap) => {
      setFeedbacks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !email.trim()) return;
    setStatus("loading");
    try {
      await addDoc(collection(db, "feedbacks"), {
        name: name || "Anonyme",
        email: email.trim().toLowerCase(),
        message: message,
        rating: rating,
        createdAt: serverTimestamp()
      });
      setStatus("success");
      setName(""); setEmail(""); setMessage("");
      setTimeout(() => setStatus("idle"), 5000);
    } catch (error) {
      setStatus("idle");
      alert("Erreur lors de l'envoi.");
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
          <Link 
            href="/" 
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm border ${
              darkMode 
                ? 'bg-white/[0.04] text-white border-white/10 hover:bg-white/[0.08]' 
                : 'bg-[#eaeaea] text-slate-700 border-slate-300 hover:bg-[#dedede]'
            }`}
          >
            <ArrowLeft size={16} /> Accueil
          </Link>
        </div>

        <img 
          src="/logo-partylens.png" 
          alt="PartyLens" 
          className="w-[420px] max-w-[90vw] h-auto mb-6 drop-shadow-md" 
        />
        
        <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight text-center mb-10 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Votre avis nous intéresse
        </h1>

        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* FORMULAIRE DE DÉPÔT D'AVIS */}
          <div className={`w-full rounded-3xl p-8 md:p-10 backdrop-blur-xl shadow-xl ${
            darkMode 
              ? 'bg-[#170c2c]/80 border border-white/10 shadow-2xl' 
              : 'bg-[#eaeaea]/80 border border-slate-300/80 shadow-slate-300/30'
          }`}>
            {status === "success" ? (
              <div className="text-center py-12 space-y-4">
                <CheckCircle size={56} className="text-emerald-400 mx-auto animate-bounce drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Merci pour votre retour !</h3>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Votre message est désormais visible par la communauté.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* SÉLECTION NOTE (ÉTOILES) */}
                <div className="flex flex-col items-center gap-2 mb-4">
                  <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Votre note globale</span>
                  <div className={`flex justify-center gap-2 p-3 rounded-xl border ${
                    darkMode ? 'bg-white/[0.02] border-white/5' : 'bg-[#f4f4f6] border-slate-300/60'
                  }`}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star 
                        key={s} 
                        size={28} 
                        onClick={() => setRating(s)} 
                        fill={s <= rating ? "#f97316" : "none"} 
                        className={`cursor-pointer transition-all hover:scale-110 ${s <= rating ? "text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" : darkMode ? "text-white/30" : "text-slate-300"}`} 
                      />
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <Mail className={`absolute left-4 top-3.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} size={18} />
                  <input 
                    required 
                    type="email" 
                    placeholder="Votre Email (Obligatoire)" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className={`w-full pl-12 pr-4 py-3.5 rounded-xl outline-none transition-all text-xs font-medium border ${
                      darkMode 
                        ? 'bg-white/[0.02] border-white/10 text-white placeholder-slate-400 focus:border-orange-500' 
                        : 'bg-[#f4f4f6] border-slate-300 text-slate-900 placeholder-slate-500 focus:border-orange-500'
                    }`} 
                  />
                </div>

                <div className="relative">
                  <User className={`absolute left-4 top-3.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} size={18} />
                  <input 
                    type="text" 
                    placeholder="Votre Nom ou Pseudonyme" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className={`w-full pl-12 pr-4 py-3.5 rounded-xl outline-none transition-all text-xs font-medium border ${
                      darkMode 
                        ? 'bg-white/[0.02] border-white/10 text-white placeholder-slate-400 focus:border-orange-500' 
                        : 'bg-[#f4f4f6] border-slate-300 text-slate-900 placeholder-slate-500 focus:border-orange-500'
                    }`} 
                  />
                </div>

                <textarea 
                  required 
                  placeholder="Partagez votre expérience PartyLens..." 
                  rows={4} 
                  value={message} 
                  onChange={e => setMessage(e.target.value)} 
                  className={`w-full p-4 rounded-xl outline-none transition-all resize-none text-xs font-medium border ${
                    darkMode 
                      ? 'bg-white/[0.02] border-white/10 text-white placeholder-slate-400 focus:border-orange-500' 
                      : 'bg-[#f4f4f6] border-slate-300 text-slate-900 placeholder-slate-500 focus:border-orange-500'
                  }`} 
                />

                <button 
                  type="submit" 
                  disabled={status === "loading"}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3.5 px-6 rounded-xl font-bold tracking-wide text-xs shadow-lg shadow-orange-500/20 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Envoyer mon avis
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* LISTE DES DERNIERS AVIS */}
          <div className="space-y-4">
            <h2 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              <MessageSquare className="text-orange-500" size={18} /> Les derniers retours
            </h2>
            
            <div className="max-h-[520px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {feedbacks.length === 0 ? (
                <div className={`p-6 rounded-2xl text-center border shadow-sm ${
                  darkMode ? 'bg-white/[0.02] border-white/5 text-slate-400' : 'bg-[#eaeaea] border-slate-300/60 text-slate-600'
                }`}>
                  <p className="text-xs italic">Aucun avis publié pour le moment. Soyez le premier !</p>
                </div>
              ) : (
                feedbacks.map(f => (
                  <div key={f.id} className={`p-6 rounded-2xl transition-all shadow-sm ${
                    darkMode 
                      ? 'bg-white/[0.02] border border-white/5' 
                      : 'bg-[#eaeaea] border border-slate-300/60'
                  }`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          darkMode 
                            ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400' 
                            : 'bg-orange-50 border border-orange-200/60 text-orange-600'
                        }`}>
                          <User size={14} />
                        </div>
                        <span className={`font-bold text-xs ${darkMode ? 'text-white' : 'text-slate-900'}`}>{f.name}</span>
                      </div>
                      <div className="flex gap-1 text-orange-500">
                        {[...Array(f.rating || 5)].map((_, i) => (
                          <Star key={i} size={13} fill="currentColor" />
                        ))}
                      </div>
                    </div>
                    <p className={`text-xs leading-relaxed italic ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>"{f.message}"</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* FOOTER */}
      <footer className={`mt-20 pt-8 relative z-10 w-full text-center border-t max-w-5xl ${darkMode ? 'border-white/10 text-slate-500' : 'border-slate-300 text-slate-500'}`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6">
          <p className="text-xs">© 2026 PartyLens. Tous droits réservés.</p>
          <div className={`flex items-center gap-6 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            <Link href="/mentions-legales" className="hover:underline">Mentions légales</Link>
            <Link href="/cgv" className="hover:underline">CGV</Link>
            <Link href="/avis" className="hover:underline">Avis clients</Link>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; } 
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(249, 115, 22, 0.4); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(249, 115, 22, 0.7); }
      `}</style>
    </main>
  );
}