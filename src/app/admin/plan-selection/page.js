"use client";
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'; 
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Check, Plus, Minus, Loader2, X, FileSignature, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function PlanSelection() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  
  const [usbQtys, setUsbQtys] = useState({ bronze: 0, silver: 0, gold: 0 });
  const USB_PRICE = 15;

  const [goldBilling, setGoldBilling] = useState('annual');

  const [confirmModal, setConfirmModal] = useState({ show: false, planId: null, planName: '', basePrice: 0, billingCycle: '' });
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setUser(currentUser);
      else router.push('/login');
    });
    return () => unsub();
  }, [router]);

  const updateQty = (id, delta) => {
    setUsbQtys(prev => ({
      ...prev,
      [id]: Math.max(0, prev[id] + delta)
    }));
  };

  const openConfirmModal = (planId, planName, basePrice, billingCycle) => {
    setAcceptedTerms(false); // Décoche la case à chaque ouverture
    setConfirmModal({ show: true, planId, planName, basePrice, billingCycle });
  };

  // --- CHANGEMENT ICI : Envoi vers Stripe au lieu de Firebase ---
  const handleConfirmSubscription = async () => {
    if (!user) {
      alert("Erreur : Utilisateur non détecté.");
      return;
    }
    if (!acceptedTerms) {
      alert("Veuillez accepter les conditions générales.");
      return;
    }

    setLoading(true);
    
    try {
      const { planId, billingCycle } = confirmModal;
      const extraUsb = usbQtys[planId] || 0;

      // Appel à notre API Stripe (le pont)
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: planId,
          billingCycle: billingCycle,
          usbQty: extraUsb,
          userId: user.uid
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Redirection vers la page de paiement sécurisée Stripe
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Erreur de création de la session Stripe");
      }
      
    } catch (e) {
      console.error("Erreur Stripe :", e);
      alert("Aïe, erreur de connexion au paiement : " + e.message);
      setLoading(false);
    } 
  };
  // --------------------------------------------------------------

  const goldPrice = goldBilling === 'annual' ? 299 : 24.99;
  const goldLabel = goldBilling === 'annual' ? '/ AN' : '/ MOIS';

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-12 font-sans relative overflow-hidden flex flex-col items-center justify-center">
      
      {/* BACKGROUND BLOBS */}
      <div className="bg-blobs fixed inset-0 z-0 pointer-events-none">
        <div className="blob blob-pink absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#ff0080] opacity-10 blur-[120px] rounded-full"></div>
        <div className="blob blob-blue absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#0072ff] opacity-10 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-7xl relative z-10">
        <div className="text-center mb-16 uppercase italic">
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter mb-4">CHOISISSEZ VOTRE PACK</h1>
          <p className="text-gray-500 font-bold text-[10px] tracking-[0.5em]">PRÊT POUR L'EXPÉRIENCE PARTYLENS ?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* --- PACK BRONZE --- */}
          <div className="glass-card p-10 rounded-[50px] border border-[#ff9100]/20 bg-white/[0.02] backdrop-blur-3xl flex flex-col relative transition-all hover:border-white/20">
            <h3 className="text-3xl font-black italic mb-6 text-[#ff9100]">BRONZE</h3>
            <div className="flex items-baseline gap-2 mb-10">
              <span className="text-7xl font-black tracking-tighter">9.99€</span>
              <span className="text-gray-500 text-[10px] font-black uppercase">/ MOIS</span>
            </div>
            <div className="space-y-5 mb-12">
              <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-tight"><Check size={16} className="text-[#ff9100]" strokeWidth={4} /> ACCÈS RÉGIE</div>
              <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-tight"><Check size={16} className="text-[#ff9100]" strokeWidth={4} /> PHOTOS ILLIMITÉES</div>
              <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-tight"><Check size={16} className="text-[#ff9100]" strokeWidth={4} /> SUPPORT 10H-2H 7J/7</div>
            </div>
            <div className="mt-auto pt-8 border-t border-white/5">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black uppercase text-gray-500 italic tracking-widest">CLÉS USB SUPP. (+15€/U)</span>
                <div className="flex items-center gap-4 bg-black/40 p-2 rounded-xl border border-white/5">
                  <button onClick={() => updateQty('bronze', -1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors border-none bg-transparent text-white cursor-pointer"><Minus size={14}/></button>
                  <span className="text-sm font-black w-4 text-center">{usbQtys.bronze}</span>
                  <button onClick={() => updateQty('bronze', 1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors border-none bg-transparent text-white cursor-pointer"><Plus size={14}/></button>
                </div>
              </div>
              <div className="flex justify-between items-center bg-black/60 p-6 rounded-[25px] mb-8 border border-white/5">
                <span className="text-[11px] font-black uppercase italic text-gray-400">TOTAL</span>
                <span className="text-3xl font-black tracking-tighter">{(9.99 + (usbQtys.bronze * USB_PRICE)).toFixed(2)}€</span>
              </div>
              <button 
                onClick={() => openConfirmModal('bronze', 'BRONZE', 9.99, 'Mensuel')}
                className="w-full py-6 bg-white text-black rounded-[25px] font-black uppercase text-[12px] tracking-[0.2em] hover:bg-[#ff0080] hover:text-white transition-all active:scale-95 flex justify-center items-center shadow-2xl border-none cursor-pointer"
              >
                SÉLECTIONNER
              </button>
            </div>
          </div>

          {/* --- PACK SILVER --- */}
          <div className="glass-card p-10 rounded-[50px] border border-gray-300/20 bg-white/[0.02] backdrop-blur-3xl flex flex-col relative transition-all hover:border-white/20">
            <h3 className="text-3xl font-black italic mb-6 text-gray-300">SILVER</h3>
            <div className="flex items-baseline gap-2 mb-10">
              <span className="text-7xl font-black tracking-tighter">12.99€</span>
              <span className="text-gray-500 text-[10px] font-black uppercase">/ MOIS</span>
            </div>
            <div className="space-y-5 mb-12">
              <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-tight"><Check size={16} className="text-gray-300" strokeWidth={4} /> TOUT LE BRONZE</div>
              <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-tight"><Check size={16} className="text-gray-300" strokeWidth={4} /> DIAPORAMA VIA VIDÉOPROJECTEUR</div>
              <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-tight"><Check size={16} className="text-gray-300" strokeWidth={4} /> SUPPORT 10H-2H 7J/7</div>
            </div>
            <div className="mt-auto pt-8 border-t border-white/5">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black uppercase text-gray-500 italic tracking-widest">CLÉS USB SUPP. (+15€/U)</span>
                <div className="flex items-center gap-4 bg-black/40 p-2 rounded-xl border border-white/5">
                  <button onClick={() => updateQty('silver', -1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors border-none bg-transparent text-white cursor-pointer"><Minus size={14}/></button>
                  <span className="text-sm font-black w-4 text-center">{usbQtys.silver}</span>
                  <button onClick={() => updateQty('silver', 1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors border-none bg-transparent text-white cursor-pointer"><Plus size={14}/></button>
                </div>
              </div>
              <div className="flex justify-between items-center bg-black/60 p-6 rounded-[25px] mb-8 border border-white/5">
                <span className="text-[11px] font-black uppercase italic text-gray-400">TOTAL</span>
                <span className="text-3xl font-black tracking-tighter">{(12.99 + (usbQtys.silver * USB_PRICE)).toFixed(2)}€</span>
              </div>
              <button 
                onClick={() => openConfirmModal('silver', 'SILVER', 12.99, 'Mensuel')}
                className="w-full py-6 bg-white text-black rounded-[25px] font-black uppercase text-[12px] tracking-[0.2em] hover:bg-[#ff0080] hover:text-white transition-all active:scale-95 flex justify-center items-center shadow-2xl border-none cursor-pointer"
              >
                SÉLECTIONNER
              </button>
            </div>
          </div>

          {/* --- PACK VIP GOLD --- */}
          <div className="glass-card p-10 rounded-[50px] border border-[#ffcc00]/30 bg-white/[0.02] backdrop-blur-3xl flex flex-col relative transition-all hover:border-white/20">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#ffcc00] text-black text-[9px] font-black px-5 py-1.5 rounded-full uppercase tracking-widest shadow-xl">
              POPULAIRE
            </div>
            
            <h3 className="text-3xl font-black italic mb-4 text-[#ffcc00]">VIP GOLD</h3>

            <div className="flex justify-center gap-1 mb-6 bg-black/40 p-1 rounded-full border border-white/10 w-fit">
              <button 
                onClick={() => setGoldBilling('monthly')} 
                className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border-none cursor-pointer ${goldBilling === 'monthly' ? 'bg-[#ffcc00] text-black' : 'bg-transparent text-gray-500 hover:text-white'}`}
              >
                Mensuel
              </button>
              <button 
                onClick={() => setGoldBilling('annual')} 
                className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border-none cursor-pointer ${goldBilling === 'annual' ? 'bg-[#ffcc00] text-black' : 'bg-transparent text-gray-500 hover:text-white'}`}
              >
                Annuel
              </button>
            </div>

            <div className="flex flex-col mb-10">
              <div className="flex items-baseline gap-2">
                <span className="text-7xl font-black tracking-tighter">{goldPrice}€</span>
                <span className="text-gray-500 text-[10px] font-black uppercase">{goldLabel}</span>
              </div>
              {goldBilling === 'monthly' && <span className="text-[#ffcc00] text-[9px] font-black uppercase tracking-widest mt-1">Engagement 1 an</span>}
            </div>

            <div className="space-y-5 mb-12">
              <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-tight"><Check size={16} className="text-[#ffcc00]" strokeWidth={4} /> TOUT LE SILVER</div>
              <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-tight"><Check size={16} className="text-[#ffcc00]" strokeWidth={4} /> 12 CLÉS USB INCLUSES</div>
              <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-tight"><Check size={16} className="text-[#ffcc00]" strokeWidth={4} /> ACCÈS PRIORITAIRE</div>
              <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-tight"><Check size={16} className="text-[#ffcc00]" strokeWidth={4} /> SUPPORT 10H-2H 7J/7</div>
            </div>

            <div className="mt-auto pt-8 border-t border-white/5">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black uppercase text-gray-500 italic tracking-widest">CLÉS USB SUPP. (+15€/U)</span>
                <div className="flex items-center gap-4 bg-black/40 p-2 rounded-xl border border-white/5">
                  <button onClick={() => updateQty('gold', -1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors border-none bg-transparent text-white cursor-pointer"><Minus size={14}/></button>
                  <span className="text-sm font-black w-4 text-center">{usbQtys.gold}</span>
                  <button onClick={() => updateQty('gold', 1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors border-none bg-transparent text-white cursor-pointer"><Plus size={14}/></button>
                </div>
              </div>
              <div className="flex justify-between items-center bg-black/60 p-6 rounded-[25px] mb-8 border border-white/5">
                <span className="text-[11px] font-black uppercase italic text-gray-400">TOTAL</span>
                <span className="text-3xl font-black tracking-tighter">{(goldPrice + (usbQtys.gold * USB_PRICE)).toFixed(2)}€</span>
              </div>
              <button 
                onClick={() => openConfirmModal('gold', 'VIP GOLD', goldPrice, goldBilling === 'annual' ? 'Annuel' : 'Mensuel')}
                className="w-full py-6 bg-white text-black rounded-[25px] font-black uppercase text-[12px] tracking-[0.2em] hover:bg-[#ff0080] hover:text-white transition-all active:scale-95 flex justify-center items-center shadow-2xl border-none cursor-pointer"
              >
                SÉLECTIONNER
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* MODALE DE CONFIRMATION ET ACCEPTATION DES CGV */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="glass-card w-full max-w-md p-10 rounded-[40px] border border-white/10 relative shadow-2xl bg-[#0a0000]">
            <button 
              onClick={() => setConfirmModal({ ...confirmModal, show: false })} 
              className="absolute top-6 right-6 text-gray-500 hover:text-white bg-transparent border-none cursor-pointer"
            >
              <X size={20}/>
            </button>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#ff0080]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#ff0080]/30">
                <FileSignature size={24} className="text-[#ff0080]" />
              </div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter">Récapitulatif</h3>
            </div>

            <div className="bg-white/5 p-6 rounded-2xl mb-8 border border-white/5 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-bold">Abonnement</span>
                <span className="font-black uppercase text-[#ff0080]">PACK {confirmModal.planName}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-bold">Facturation</span>
                <span className="font-black uppercase">{confirmModal.billingCycle}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-bold">Clés USB</span>
                <span className="font-black uppercase">{confirmModal.planId === 'gold' ? (12 + usbQtys.gold) : usbQtys[confirmModal.planId]}</span>
              </div>
              <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                <span className="text-xs font-black uppercase text-gray-500 tracking-widest">Total à payer</span>
                <span className="text-2xl font-black tracking-tighter">
                  {(confirmModal.basePrice + (usbQtys[confirmModal.planId] * USB_PRICE)).toFixed(2)}€
                </span>
              </div>
            </div>

            {/* CHECKBOX LÉGALE */}
            <label className="flex items-start gap-4 p-4 mb-8 bg-[#ff0080]/5 border border-[#ff0080]/20 rounded-2xl cursor-pointer hover:bg-[#ff0080]/10 transition-colors">
              <div className="relative flex items-center justify-center mt-1">
                <input 
                  type="checkbox" 
                  className="appearance-none w-5 h-5 border-2 border-[#ff0080] rounded cursor-pointer checked:bg-[#ff0080]"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                />
                {acceptedTerms && <Check size={14} strokeWidth={4} className="absolute text-white pointer-events-none" />}
              </div>
              <span className="text-xs text-gray-300 leading-relaxed font-bold">
                J'ai lu et j'accepte sans réserve les <Link href="/legal" target="_blank" className="text-[#ff0080] underline">Conditions Générales de Vente</Link> et les <Link href="/legal" target="_blank" className="text-[#ff0080] underline">Conditions d'Utilisation</Link>. Je renonce expressément à mon droit de rétractation concernant le contenu numérique.
              </span>
            </label>

            <button 
              onClick={handleConfirmSubscription}
              disabled={!acceptedTerms || loading}
              className="w-full py-5 bg-[#ff0080] text-white rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all border-none cursor-pointer flex items-center justify-center gap-2 hover:bg-[#e60073] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : "CONFIRMER L'ABONNEMENT"}
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .glass-card { background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%); }
        .bg-blobs { background: #000; }
      `}</style>
    </main>
  );
}