"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Mail, MessageSquare, User, Send, Loader2, Phone, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const router = useRouter(); // Permet de gérer le retour en arrière intelligemment
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
      // 1. Sauvegarde dans ta base de données Firebase
      await addDoc(collection(db, "messages"), {
        ...formData,
        createdAt: serverTimestamp(),
        status: "nouveau"
      });

      // 2. ENVOI DU MAIL VIA WEB3FORMS AVEC TA CLÉ
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
        setTimeout(() => setSuccess(false), 4000); 
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
    <main className="min-h-screen bg-black flex items-center justify-center p-6 md:p-12 font-sans relative overflow-hidden text-white">
      {/* BACKGROUND BLOBS */}
      <div className="bg-blobs fixed inset-0 z-0 pointer-events-none">
        <div className="blob blob-pink absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#ff0080] opacity-20 blur-[120px] rounded-full"></div>
        <div className="blob blob-blue absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#0072ff] opacity-20 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-5xl relative z-10">
        <header className="mb-12 flex justify-between items-center">
          {/* LE BOUTON RETOUR CORRIGÉ */}
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
          >
            <ArrowLeft size={14} /> RETOUR
          </button>
          
          <img src="/logo-partylens.png" alt="Logo" className="w-32" />
          <div className="w-14"></div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          {/* TEXTE ET INFOS DE CONTACT */}
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8">
            <div>
              <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mb-4">
                NOUS <span className="text-[#ff0080]">CONTACTER</span>
              </h1>
              <p className="text-gray-400 text-[11px] font-black uppercase tracking-[0.3em] leading-relaxed">
                Une question sur nos packs ? Un problème technique ?<br />
                Notre équipe est là pour vous répondre rapidement.
              </p>
            </div>

            <div className="space-y-6 mt-12">
              <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl w-fit">
                <div className="w-12 h-12 bg-[#ff0080]/20 rounded-xl flex items-center justify-center border border-[#ff0080]/30">
                  <Mail className="text-[#ff0080]" size={20} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Email</p>
                  <p className="text-sm font-black italic tracking-wider">contact@partylens.fr</p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl w-fit">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                  <Phone className="text-blue-500" size={20} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Support (10h-2h 7j/7)</p>
                  <p className="text-sm font-black italic tracking-wider">07 87 01 60 77</p>
                </div>
              </div>
            </div>
          </div>

          {/* FORMULAIRE DE CONTACT */}
          <div className="glass-card p-10 rounded-[40px] border border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-2xl animate-in fade-in zoom-in">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="relative">
                <User className="absolute left-5 top-5 text-gray-500" size={18} />
                <input 
                  type="text" 
                  placeholder="NOM COMPLET" 
                  required 
                  className="input-style" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-5 top-5 text-gray-500" size={18} />
                <input 
                  type="email" 
                  placeholder="ADRESSE EMAIL" 
                  required 
                  className="input-style" 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                />
              </div>

              <div className="relative">
                <MessageSquare className="absolute left-5 top-5 text-gray-500" size={18} />
                <textarea 
                  placeholder="VOTRE MESSAGE..." 
                  required 
                  rows="5"
                  className="input-style resize-none" 
                  value={formData.message} 
                  onChange={(e) => setFormData({...formData, message: e.target.value})} 
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-6 bg-[#ff0080] rounded-[25px] font-black uppercase text-[11px] tracking-[0.3em] shadow-[0_0_20px_rgba(255,0,128,0.4)] border-none text-white cursor-pointer active:scale-95 transition-all flex justify-center items-center gap-3 hover:bg-[#e60073]"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> ENVOYER LE MESSAGE</>}
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* NOTIFICATION FLOTTANTE DE SUCCÈS */}
      {success && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3 px-8 py-4 rounded-full border border-green-500/50 bg-black/90 text-green-500 backdrop-blur-xl shadow-2xl">
            <CheckCircle2 size={18}/>
            <span className="text-[10px] font-black uppercase italic tracking-widest">Message envoyé avec succès !</span>
          </div>
        </div>
      )}

      <style jsx>{`
        .input-style {
          width: 100%;
          padding: 1.25rem 1.25rem 1.25rem 3.5rem;
          border-radius: 1.2rem;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: white;
          font-weight: 800;
          text-transform: uppercase;
          font-size: 0.75rem;
          outline: none;
          transition: border 0.3s;
        }
        .input-style:focus {
          border-color: #ff0080;
        }
        .glass-card { background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%); }
      `}</style>
    </main>
  );
}