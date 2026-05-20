"use client";
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Check, Plus, Minus, Loader2, X } from 'lucide-react';

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
    setUsbQtys(prev => ({ ...prev, [id]: Math.max(0, prev[id] + delta) }));
  };

  const openConfirmModal = (planId, planName, basePrice, billingCycle) => {
    setAcceptedTerms(false);
    setConfirmModal({ show: true, planId, planName, basePrice, billingCycle });
  };

  const handleConfirmSubscription = async () => {
    if (!user) return alert("Erreur : Utilisateur non détecté.");
    if (!acceptedTerms) return alert("Veuillez accepter les conditions de vente.");
    setLoading(true);
    
    try {
      const { planId, billingCycle } = confirmModal;
      const extraUsb = usbQtys[planId] || 0;

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: planId,
          billingCycle: billingCycle, // Enverra 'Unique' pour Bronze/Silver, 'Annuel' ou 'Mensuel' pour Gold
          usbQty: extraUsb,
          userId: user.uid
        }),
      });

      const data = await response.json();
      if (data.url) window.location.href = data.url;
      else throw new Error(data.error || "Erreur Stripe");
    } catch (e) {
      alert("Erreur : " + e.message);
      setLoading(false);
    } 
  };

  const goldPrice = goldBilling === 'annual' ? 299 : 24.99;
  const goldLabel = goldBilling === 'annual' ? '/ AN' : '/ MOIS';

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-12 font-sans relative overflow-hidden flex flex-col items-center justify-center">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#ff0080] opacity-5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#0072ff] opacity-5 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-7xl relative z-10">
        <div className="text-center mb-16 uppercase italic">
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter mb-4">FORFAIT UNIQUE OU ACCÈS PRO</h1>
          <p className="text-gray-500 font-bold text-[10px] tracking-[0.5em]">AUCUN ABONNEMENT CACHÉ POUR LES PARTICULIERS</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* BRONZE */}
          <div className="p-10 rounded-[50px] border border-[#ff9100]/20 bg-white/[0.02] flex flex-col relative overflow-hidden">
            <h3 className="text-3xl font-black italic mb-6 text-[#ff9100]">BRONZE</h3>
            <div className="flex items-baseline gap-2 mb-10">
              <span className="text-7xl font-black tracking-tighter">9.99€</span>
              <span className="text-gray-500 text-[10px] font-black uppercase">/ SOIRÉE UNIQUE</span>
            </div>
            <div className="space-y-5 mb-12 flex-1">
              <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-tight"><Check size={16} className="text-[#ff9100]" strokeWidth={4} /> ACCÈS COMPTE RÉGIE</div>
              <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-tight"><Check size={16} className="text-[#ff9100]" strokeWidth={4} /> PHOTOS ILLIMITÉES</div>
              <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-tight"><Check size={16} className="text-[#ff9100]" strokeWidth={4} /> ALBUM DISPO EN TÉLÉCHARGEMENT</div>
            </div>
            <div className="pt-8 border-t border-white/5">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black uppercase text-gray-500 italic tracking-widest">SOUVENIR CLÉ USB (+15€)</span>
                <div className="flex items-center gap-4 bg-black/40 p-2 rounded-xl border border-white/5">
                  <button onClick={() => updateQty('bronze', -1)} className="bg-transparent border-none text-white cursor-pointer"><Minus size={14}/></button>
                  <span className="text-sm font-black">{usbQtys.bronze}</span>
                  <button onClick={() => updateQty('bronze', 1)} className="bg-transparent border-none text-white cursor-pointer"><Plus size={14}/></button>
                </div>
              </div>
              <button onClick={() => openConfirmModal('bronze', 'BRONZE', 9.99, 'Unique')} className="w-full py-5 bg-white text-black rounded-[25px] font-black uppercase text-xs tracking-wider hover:bg-[#ff0080] hover:text-white transition-all">
                CHOISIR CE FORFAIT SOIRÉE
              </button>
            </div>
          </div>

          {/* SILVER */}
          <div className="p-10 rounded-[50px] border border-gray-300/20 bg-white/[0.02] flex flex-col relative overflow-hidden">
            <h3 className="text-3xl font-black italic mb-6 text-gray-300">SILVER</h3>
            <div className="flex items-baseline gap-2 mb-10">
              <span className="text-7xl font-black tracking-tighter">12.99€</span>
              <span className="text-gray-500 text-[10px] font-black uppercase">/ SOIRÉE UNIQUE</span>
            </div>
            <div className="space-y-5 mb-12 flex-1">
              <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-tight"><Check size={16} className="text-gray-300" strokeWidth={4} /> TOUT LE BRONZE</div>
              <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-tight"><Check size={16} className="text-gray-300" strokeWidth={4} /> DIAPORAMA VIDÉOPROJECTEUR LIVE</div>
              <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-tight"><Check size={16} className="text-gray-300" strokeWidth={4} /> MODULE DEMANDE DJ EN DIRECT</div>
            </div>
            <div className="pt-8 border-t border-white/5">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black uppercase text-gray-500 italic tracking-widest">SOUVENIR CLÉ USB (+15€)</span>
                <div className="flex items-center gap-4 bg-black/40 p-2 rounded-xl border border-white/5">
                  <button onClick={() => updateQty('silver', -1)} className="bg-transparent border-none text-white cursor-pointer"><Minus size={14}/></button>
                  <span className="text-sm font-black">{usbQtys.silver}</span>
                  <button onClick={() => updateQty('silver', 1)} className="bg-transparent border-none text-white cursor-pointer"><Plus size={14}/></button>
                </div>
              </div>
              <button onClick={() => openConfirmModal('silver', 'SILVER', 12.99, 'Unique')} className="w-full py-5 bg-white text-black rounded-[25px] font-black uppercase text-xs tracking-wider hover:bg-[#ff0080] hover:text-white transition-all">
                CHOISIR CE FORFAIT MARIAGE/FÊTE
              </button>
            </div>
          </div>

          {/* VIP PRO GOLD */}
          <div className="p-10 rounded-[50px] border border-[#ffcc00]/30 bg-black/40 flex flex-col relative overflow-hidden">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#ffcc00] text-black text-[9px] font-black px-5 py-1.5 rounded-full uppercase tracking-widest">PARTENAIRES DJ</div>
            <h3 className="text-3xl font-black italic mb-4 text-[#ffcc00] mt-4">VIP GOLD</h3>
            
            <div className="flex gap-1 mb-6 bg-black p-1 rounded-full border border-white/10 w-fit">
              <button onClick={() => setGoldBilling('monthly')} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border-none cursor-pointer ${goldBilling === 'monthly' ? 'bg-[#ffcc00] text-black' : 'bg-transparent text-gray-500'}`}>Mensuel</button>
              <button onClick={() => setGoldBilling('annual')} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border-none cursor-pointer ${goldBilling === 'annual' ? 'bg-[#ffcc00] text-black' : 'bg-transparent text-gray-500'}`}>Annuel</button>
            </div>

            <div className="flex items-baseline gap-2 mb-10">
              <span className="text-7xl font-black tracking-tighter">{goldPrice}€</span>
              <span className="text-gray-500 text-[10px] font-black uppercase">{goldLabel}</span>
            </div>

            <div className="space-y-5 flex-1 mb-8">
              <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-tight"><Check size={16} className="text-[#ffcc00]" strokeWidth={4} /> UTILISATION EN ILLIMITÉ</div>
              <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-tight"><Check size={16} className="text-[#ffcc00]" strokeWidth={4} /> 12 CLÉS USB COMPRISES</div>
            </div>

            <button onClick={() => openConfirmModal('gold', 'VIP GOLD', goldPrice, goldBilling === 'annual' ? 'Annuel' : 'Mensuel')} className="w-full py-5 bg-[#ffcc00] text-black rounded-[25px] font-black uppercase text-xs tracking-wider hover:bg-white transition-all">
              SOUSCRIRE ACCÈS PRO
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMATION */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1115] border border-white/10 p-8 rounded-[35px] max-w-md w-full relative">
            <button onClick={() => setConfirmModal({ show: false, planId: null, planName: '', basePrice: 0, billingCycle: '' })} className="absolute top-6 right-6 text-gray-500 hover:text-white bg-transparent border-none cursor-pointer"><X size={20}/></button>
            <h4 className="text-xl font-black uppercase italic tracking-tight mb-4">Confirmer la commande</h4>
            <p className="text-gray-400 text-xs mb-6 leading-relaxed">Vous vous apprêtez à activer le pack <span className="text-white font-bold">{confirmModal.planName}</span> ({confirmModal.billingCycle}).</p>
            <label className="flex gap-3 items-start text-[11px] text-gray-400 font-bold uppercase tracking-wide mb-8 select-none cursor-pointer">
              <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-0.5" />
              J'accepte les conditions générales de vente de PartyLens.
            </label>
            <button onClick={handleConfirmSubscription} disabled={loading} className="w-full py-5 bg-white text-black rounded-xl font-black uppercase tracking-widest text-xs hover:bg-pink-500 hover:text-white disabled:opacity-50 transition-all">
              {loading ? <Loader2 className="animate-spin mx-auto" size={16}/> : "PASSER AU PAIEMENT SÉCURISÉ"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}