"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Mail, MessageSquare, User, Send, Loader2, Phone, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const router = useRouter();
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
    <main className="min-h-screen bg-gradient-to-b from-[#2d104d] via-[#210a3b] to-[#140427] flex items-center justify-center p-6 md:p-12 font-sans relative overflow-hidden text-white">
      
      {/* VAGUES LUMINEUSES ET DÉGRADÉS D'ARRIÈRE-PLAN */}
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

        <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-r from-orange-500/25 via-amber-400/20 to-orange-600/20 rounded-full blur-[140px]"></div>
      </div>

      <div className="w-full max-w-5xl relative z-10">
        
        {/* HEADER */}
        <header className="mb-10 flex justify-between items-center">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-white/80 hover:text-white transition-all bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-2xl border border-white/20 backdrop-blur-xl shadow-md active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={16} /> RETOUR
          </button>
          
          <img src="/logo-partylens.png" alt="Logo PartyLens" className="w-36 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
          
          <div className="w-20"></div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          {/* TEXTE ET INFOS DE CONTACT */}
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8">
            <div>
              <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tight mb-4">
                NOUS <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]">CONTACTER</span>
              </h1>
              <p className="text-orange-200/80 text-[11px] font-black uppercase tracking-[0.25em] leading-relaxed">
                Une question sur nos packs ? Un problème technique ?<br />
                Notre équipe est là pour vous répondre rapidement.
              </p>
            </div>

            <div className="space-y-4 mt-8">
              <div className="flex items-center gap-4 bg-white/10 border border-white/15 p-4 rounded-2xl w-fit backdrop-blur-md shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                  <Mail className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-orange-200/70 uppercase tracking-widest">Email</p>
                  <p className="text-sm font-black italic tracking-wider text-white">contact@partylens.fr</p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white/10 border border-white/15 p-4 rounded-2xl w-fit backdrop-blur-md shadow-lg">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                  <Phone className="text-amber-300" size={20} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-orange-200/70 uppercase tracking-widest">Support (10h-2h 7j/7)</p>
                  <p className="text-sm font-black italic tracking-wider text-white">07 87 01 60 77</p>
                </div>
              </div>
            </div>
          </div>

          {/* FORMULAIRE DE CONTACT */}
          <div className="bg-white/[0.07] backdrop-blur-2xl p-8 md:p-10 rounded-[36px] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="relative">
                <User className="absolute left-5 top-5 text-orange-300/60" size={18} />
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
                <Mail className="absolute left-5 top-5 text-orange-300/60" size={18} />
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
                <MessageSquare className="absolute left-5 top-5 text-orange-300/60" size={18} />
                <textarea 
                  placeholder="VOTRE MESSAGE..." 
                  required 
                  rows={5}
                  className="input-style resize-none" 
                  value={formData.message} 
                  onChange={(e) => setFormData({...formData, message: e.target.value})} 
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-2xl font-black uppercase text-[11px] tracking-[0.25em] shadow-[0_0_25px_rgba(249,115,22,0.4)] border border-orange-400/30 text-white cursor-pointer active:scale-95 hover:scale-[1.02] transition-all flex justify-center items-center gap-3"
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
          <div className="flex items-center gap-3 px-8 py-4 rounded-full border border-green-500/50 bg-[#140427]/90 text-green-400 backdrop-blur-xl shadow-2xl">
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
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
          font-weight: 800;
          text-transform: uppercase;
          font-size: 0.75rem;
          outline: none;
          transition: border-color 0.3s, background-color 0.3s;
        }
        .input-style::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }
        .input-style:focus {
          border-color: rgba(249, 115, 22, 0.8);
          background: rgba(0, 0, 0, 0.45);
        }
      `}</style>
    </main>
  );
}