"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { ArrowLeft, Star, Send, CheckCircle, MessageSquare, Mail, User } from 'lucide-react';

export default function AvisPage() {
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");
  const [feedbacks, setFeedbacks] = useState([]);

  // Lecture des avis en temps réel (limité aux 10 derniers pour la page publique)
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
    <main className="min-h-screen bg-black text-white p-6 md:p-12 relative overflow-hidden">
      {/* EFFET DE FOND */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#ff0080] rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#7928ca] rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <header className="flex flex-col items-center mb-12">
          <img src="/logo-partylens.png" alt="Logo" className="w-48 mb-6" />
          <h1 className="text-4xl md:text-6xl font-black uppercase italic italic text-center">
            Votre avis nous <span className="text-[#ff0080]">intéresse</span>
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* FORMULAIRE */}
          <div className="glass-card p-8 rounded-[40px] border border-white/10 h-fit">
            {status === "success" ? (
              <div className="text-center py-10 animate-bounce">
                <CheckCircle size={60} className="text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-black uppercase">Merci !</h2>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex justify-center gap-2 mb-6">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={32} onClick={() => setRating(s)} fill={s <= rating ? "#ff0080" : "none"} className="cursor-pointer text-[#ff0080]" />
                  ))}
                </div>
                <input required type="email" placeholder="Votre Email (Obligatoire)" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-[#ff0080]" />
                <input type="text" placeholder="Votre Nom" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none" />
                <textarea required placeholder="Votre message..." rows="4" value={message} onChange={e => setMessage(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none resize-none" />
                <button type="submit" className="w-full bg-[#ff0080] py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all">Envoyer mon avis</button>
              </form>
            )}
          </div>

          {/* LISTE DES AVIS PUBLICS */}
          <div className="space-y-4">
            <h2 className="text-xl font-black uppercase italic mb-6 flex items-center gap-2">
              <MessageSquare className="text-[#ff0080]" /> Les derniers retours
            </h2>
            <div className="max-h-[600px] overflow-y-auto pr-4 space-y-4 custom-scrollbar">
              {feedbacks.map(f => (
                <div key={f.id} className="bg-white/5 border border-white/5 p-6 rounded-3xl backdrop-blur-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center"><User size={14}/></div>
                      <span className="font-bold text-sm uppercase">{f.name}</span>
                    </div>
                    <div className="flex gap-0.5 text-[#ff0080]">
                      {[...Array(f.rating)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm italic">"{f.message}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`.custom-scrollbar::-webkit-scrollbar { width: 5px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #ff0080; border-radius: 10px; }`}</style>
    </main>
  );
}