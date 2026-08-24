"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Check, Plus, Minus, Loader2, X, ArrowRight, ShieldCheck } from "lucide-react";

export default function PlanSelection() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const [usbQtys, setUsbQtys] = useState({ unique: 0, pro: 0 });
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    planId: null,
    planName: "",
    basePrice: 0,
    billingCycle: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setUser(currentUser);
      else router.push("/login");
    });
    return () => unsub();
  }, [router]);

  const updateQty = (id, delta) => {
    setUsbQtys((prev) => ({ ...prev, [id]: Math.max(0, prev[id] + delta) }));
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

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: planId,
          billingCycle: billingCycle,
          usbQty: extraUsb,
          userId: user.uid,
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

  return (
    <main className="relative min-h-screen w-full bg-gradient-to-b from-[#2d104d] via-[#210a3b] to-[#140427] p-6 md:p-12 font-sans text-white overflow-hidden flex flex-col items-center justify-center">
      {/* Halos de lumière d'ambiance */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-orange-500/15 blur-[130px] rounded-full pointer-events-none" />

      <div className="w-full max-w-6xl relative z-10 my-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 uppercase italic">
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tight mb-3 bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
            FORFAIT UNIQUE OU ACCÈS PRO
          </h1>
          <p className="text-orange-200/60 font-black text-[10px] tracking-[0.4em]">
            AUCUN ABONNEMENT CACHÉ POUR LES PARTICULIERS
          </p>
        </div>

        {/* Grille de cartes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
          {/* FORFAIT UNIQUE */}
          <div className="p-8 sm:p-10 rounded-[40px] border border-white/10 bg-white/[0.04] backdrop-blur-2xl flex flex-col justify-between relative shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
            <div>
              <h3 className="text-2xl font-black italic mb-4 text-orange-400 uppercase tracking-tight">
                FORFAIT UNIQUE
              </h3>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-6xl font-black tracking-tighter">9.99€</span>
                <span className="text-orange-200/50 text-[10px] font-black uppercase">
                  / SOIRÉE UNIQUE
                </span>
              </div>

              <div className="space-y-3 mb-10">
                <div className="flex items-start gap-3 text-[11px] font-black uppercase tracking-tight text-white/90">
                  <Check size={16} className="text-orange-400 shrink-0 mt-0.5" strokeWidth={3} /> ACCÈS COMPTE RÉGIE
                </div>
                <div className="flex items-start gap-3 text-[11px] font-black uppercase tracking-tight text-white/90">
                  <Check size={16} className="text-orange-400 shrink-0 mt-0.5" strokeWidth={3} /> PHOTOS ILLIMITÉES
                </div>
                <div className="flex items-start gap-3 text-[11px] font-black uppercase tracking-tight text-white/90">
                  <Check size={16} className="text-orange-400 shrink-0 mt-0.5" strokeWidth={3} /> ALBUM DISPO EN TÉLÉCHARGEMENT
                </div>
                <div className="flex items-start gap-3 text-[11px] font-black uppercase tracking-tight text-white/90">
                  <Check size={16} className="text-orange-400 shrink-0 mt-0.5" strokeWidth={3} /> LIVE PHOTO VIA VIDÉOPROJECTEUR (FOND INCLUS)
                </div>
                <div className="flex items-start gap-3 text-[11px] font-black uppercase tracking-tight text-white/90">
                  <Check size={16} className="text-orange-400 shrink-0 mt-0.5" strokeWidth={3} /> LIVRE D&apos;OR NUMÉRIQUE TÉLÉCHARGEABLE
                </div>
                <div className="flex items-start gap-3 text-[11px] font-black uppercase tracking-tight text-white/90">
                  <Check size={16} className="text-orange-400 shrink-0 mt-0.5" strokeWidth={3} /> PHOTOBOOTH SMARTPHONE/TABLETTE (CADRE GRATUIT)
                </div>
                <div className="flex items-start gap-3 text-[11px] font-black uppercase tracking-tight text-white/90">
                  <Check size={16} className="text-orange-400 shrink-0 mt-0.5" strokeWidth={3} /> DÉFI PHOTO CHALLENGE INCLUS
                </div>
                <div className="flex items-start gap-3 text-[11px] font-black uppercase tracking-tight text-white/90">
                  <Check size={16} className="text-orange-400 shrink-0 mt-0.5" strokeWidth={3} /> ENVOI DE CHOIX DE MUSIQUE POUR LE DJ
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black uppercase text-orange-200/60 italic tracking-widest">
                  SOUVENIR CLÉ USB (+15€)
                </span>
                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/10">
                  <button onClick={() => updateQty("unique", -1)} className="bg-transparent border-none text-white/70 hover:text-white cursor-pointer active:scale-95 transition-all">
                    <Minus size={14} />
                  </button>
                  <span className="text-xs font-black">{usbQtys.unique}</span>
                  <button onClick={() => updateQty("unique", 1)} className="bg-transparent border-none text-white/70 hover:text-white cursor-pointer active:scale-95 transition-all">
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <button
                onClick={() => openConfirmModal("unique", "FORFAIT UNIQUE", 9.99, "Unique")}
                className="w-full py-4 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-2xl font-black uppercase text-xs tracking-widest transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                CHOISIR CE FORFAIT
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* FORFAIT PRO */}
          <div className="p-8 sm:p-10 rounded-[40px] border border-orange-500/40 bg-gradient-to-b from-orange-500/10 via-amber-500/[0.05] to-transparent backdrop-blur-2xl flex flex-col justify-between relative shadow-[0_0_50px_rgba(249,115,22,0.15)]">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-black px-5 py-1 rounded-full uppercase tracking-widest shadow-lg border border-orange-300/30">
              TOUT INCLUS + LIVRAISON
            </div>

            <div>
              <h3 className="text-2xl font-black italic mb-4 text-amber-300 uppercase tracking-tight mt-2">
                FORFAIT PRO
              </h3>

              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-6xl font-black tracking-tighter">24.99€</span>
                <span className="text-orange-200/50 text-[10px] font-black uppercase">
                  / ÉVÉNEMENT
                </span>
              </div>

              <div className="space-y-4 mb-10">
                <div className="flex items-start gap-3 text-[11px] font-black uppercase tracking-tight text-white/90">
                  <Check size={16} className="text-amber-400 shrink-0 mt-0.5" strokeWidth={3} /> TOUT LE FORFAIT À 9.99€ INCLUS
                </div>
                <div className="flex items-start gap-3 text-[11px] font-black uppercase tracking-tight text-white/90">
                  <Check size={16} className="text-amber-400 shrink-0 mt-0.5" strokeWidth={3} /> UNE CLÉ USB AVEC TOUS LES SOUVENIRS PHOTO ET LIVRE D&apos;OR
                </div>
                <div className="flex items-start gap-3 text-[11px] font-black uppercase tracking-tight text-white/90">
                  <Check size={16} className="text-amber-400 shrink-0 mt-0.5" strokeWidth={3} /> ENVOYÉE PAR COURRIER À DOMICILE
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black uppercase text-orange-200/60 italic tracking-widest">
                  CLÉ USB SUPPLÉMENTAIRE (+15€)
                </span>
                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/10">
                  <button onClick={() => updateQty("pro", -1)} className="bg-transparent border-none text-white/70 hover:text-white cursor-pointer active:scale-95 transition-all">
                    <Minus size={14} />
                  </button>
                  <span className="text-xs font-black">{usbQtys.pro}</span>
                  <button onClick={() => updateQty("pro", 1)} className="bg-transparent border-none text-white/70 hover:text-white cursor-pointer active:scale-95 transition-all">
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <button
                onClick={() => openConfirmModal("pro", "FORFAIT PRO", 24.99, "Événement")}
                className="w-full py-4 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-[0_0_25px_rgba(249,115,22,0.4)] border border-orange-400/30 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                SOUSCRIRE FORFAIT PRO
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMATION */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a0831] border border-white/15 p-8 sm:p-10 rounded-[35px] max-w-md w-full relative shadow-[0_25px_70px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setConfirmModal({ show: false, planId: null, planName: "", basePrice: 0, billingCycle: "" })}
              className="absolute top-6 right-6 text-white/50 hover:text-white bg-transparent border-none cursor-pointer transition-colors"
            >
              <X size={20} />
            </button>

            <div className="inline-flex p-3 bg-orange-500/10 border border-orange-400/30 rounded-2xl mb-4 text-orange-400">
              <ShieldCheck size={28} />
            </div>

            <h4 className="text-2xl font-black uppercase italic tracking-tight mb-2">
              Confirmer la commande
            </h4>
            <p className="text-orange-200/70 text-xs mb-6 leading-relaxed">
              Vous vous apprêtez à activer le pack <span className="text-amber-300 font-bold">{confirmModal.planName}</span> ({confirmModal.billingCycle}).
            </p>

            <label className="flex gap-3 items-start text-[11px] text-white/70 font-bold uppercase tracking-wide mb-8 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 accent-orange-500 rounded cursor-pointer"
              />
              J&apos;accepte les conditions générales de vente de PartyLens.
            </label>

            <button
              onClick={handleConfirmSubscription}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-[0_0_25px_rgba(249,115,22,0.4)] border border-orange-400/30 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  PASSER AU PAIEMENT SÉCURISÉ
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}