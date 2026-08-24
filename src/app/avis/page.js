"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { ArrowLeft, Star, Send, CheckCircle, MessageSquare, Mail, User, Loader2 } from 'lucide-react';

export default function AvisPage() {
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
    <main className="min-h-screen bg-gradient-to-b from-[#2d104d] via-[#210a3b] to-[#140427] text-white p-6 md:p-12 relative overflow-x-hidden font-sans pb-16">
      
      {/* VAGUES LUMINEUSES EN ARRIÈRE-PLAN */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <svg className="absolute -top-12 left-0 w-full h-[500px] text-orange-500/30 blur-xl opacity-80" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,160L60,176C120,192,240,224,360,213.3C480,203,600,149,720,154.7C840,160,960,224,1080,229.3C1200,235,1320,181,1380,154.7L1440,128L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,0,0Z"></path>
        </svg>

        <svg className="absolute top-[35%] -left-20 w-[130%] h-[550px] text-amber-500/25 blur-2xl transform rotate-3" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,96L80,122.7C160,149,320,203,480,208C640,213,800,171,960,149.3C1120,128,1280,128,1360,128L1440,128L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
        </svg>

        <svg className="absolute bottom-0 right-0 w-full h-[500px] text-orange-600/30 blur-xl opacity-80" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,224L60,213.3C120,203,240,181,360,186.7C480,192,600,224,720,218.7C840,213,960,171,1080,160C1200,149,1320,171,1380,181.3L1440,192L1440,320L1380,320C1280,320,1120,320,1080,320C960,320,840,320,720,320C600,320,160,320,0,320Z"></path>
        </svg>

        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-r from-orange-500/30 via-amber-400/20 to-pink-500/20 rounded-full blur-[140px]"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        
        {/* EN-TÊTE AVEC BOUTON RETOUR */}
        <header className="flex flex-col items-center mb-12 relative">
          <div className="w-full flex justify-start mb-6">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 px-4 py-3 rounded-2xl border border-white/20 transition-all text-[11px] font-black uppercase tracking-wider backdrop-blur-xl shadow-md active:scale-95"
            >
              <ArrowLeft size={16} /> Accueil
            </Link>
          </div>

          <img src="/logo-partylens.png" alt="Logo PartyLens" className="w-48 mb-6 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
          
          <h1 className="text-3xl md:text-5xl font-black uppercase italic text-center tracking-tight">
            Votre avis nous <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]">intéresse</span>
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* FORMULAIRE DE DÉPÔT D'AVIS */}
          <div className="bg-white/[0.07] backdrop-blur-2xl p-8 rounded-[36px] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            {status === "success" ? (
              <div className="text-center py-12 space-y-4">
                <CheckCircle size={64} className="text-emerald-400 mx-auto animate-bounce drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                <h2 className="text-2xl font-black uppercase tracking-wider text-white">Merci pour votre retour !</h2>
                <p className="text-xs text-white/70 uppercase tracking-widest font-semibold">Votre message est désormais visible par la communauté.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* SÉLECTION NOTE (ÉTOILES) */}
                <div className="flex flex-col items-center gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-200/80">Votre note globale</span>
                  <div className="flex justify-center gap-2 p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star 
                        key={s} 
                        size={32} 
                        onClick={() => setRating(s)} 
                        fill={s <= rating ? "#f97316" : "none"} 
                        className={`cursor-pointer transition-all hover:scale-110 ${s <= rating ? "text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.6)]" : "text-white/30"}`} 
                      />
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <Mail className="absolute left-4 top-4 text-white/40" size={18} />
                  <input 
                    required 
                    type="email" 
                    placeholder="Votre Email (Obligatoire)" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="w-full bg-white/5 border border-white/15 pl-12 pr-4 py-4 rounded-2xl outline-none focus:border-orange-400 transition-all text-sm text-white placeholder-white/40" 
                  />
                </div>

                <div className="relative">
                  <User className="absolute left-4 top-4 text-white/40" size={18} />
                  <input 
                    type="text" 
                    placeholder="Votre Nom ou Pseudonyme" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className="w-full bg-white/5 border border-white/15 pl-12 pr-4 py-4 rounded-2xl outline-none focus:border-orange-400 transition-all text-sm text-white placeholder-white/40" 
                  />
                </div>

                <textarea 
                  required 
                  placeholder="Partagez votre expérience PartyLens..." 
                  rows={4} 
                  value={message} 
                  onChange={e => setMessage(e.target.value)} 
                  className="w-full bg-white/5 border border-white/15 p-4 rounded-2xl outline-none focus:border-orange-400 transition-all resize-none text-sm text-white placeholder-white/40" 
                />

                <button 
                  type="submit" 
                  disabled={status === "loading"}
                  className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:scale-[1.02] active:scale-95 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-[0_0_25px_rgba(249,115,22,0.4)] border border-orange-300/40 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send size={18} /> Envoyer mon avis
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* LISTE DES DERNIERS AVIS */}
          <div className="space-y-4">
            <h2 className="text-lg font-black uppercase italic tracking-wider flex items-center gap-2 text-orange-200">
              <MessageSquare className="text-orange-400" size={20} /> Les derniers retours
            </h2>
            
            <div className="max-h-[550px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {feedbacks.length === 0 ? (
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl text-center backdrop-blur-md">
                  <p className="text-sm text-white/50 italic">Aucun avis publié pour le moment. Soyez le premier !</p>
                </div>
              ) : (
                feedbacks.map(f => (
                  <div key={f.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl shadow-lg transition-all hover:border-white/20">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-full flex items-center justify-center text-orange-300">
                          <User size={16}/>
                        </div>
                        <span className="font-bold text-sm uppercase tracking-wide text-white">{f.name}</span>
                      </div>
                      <div className="flex gap-1 text-orange-400">
                        {[...Array(f.rating || 5)].map((_, i) => (
                          <Star key={i} size={14} fill="currentColor" className="drop-shadow-[0_0_5px_rgba(249,115,22,0.4)]" />
                        ))}
                      </div>
                    </div>
                    <p className="text-white/80 text-sm italic font-light leading-relaxed">"{f.message}"</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* FOOTER */}
      <footer className="mt-16 relative z-10 w-full text-center max-w-6xl mx-auto">
        <div className="h-[1px] w-full bg-white/15 mb-6"></div>
        <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.5em]">
          Powered by PartyLens
        </p>
      </footer>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; } 
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(249, 115, 22, 0.6); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(249, 115, 22, 0.9); }
      `}</style>
    </main>
  );
}