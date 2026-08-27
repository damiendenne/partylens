"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Check, Plus, Minus, Loader2, X, ArrowRight, ShieldCheck, Sun, Moon, Mic } from "lucide-react";

export default function PlanSelection() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(true);

  const [usbQtys, setUsbQtys] = useState({ unique: 0, pro: 0 });
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    planId: null,
    planName: "",
    basePrice: 0,
    billingCycle: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);

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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
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

  const cardBg = darkMode 
    ? 'bg-[#170c2c] border border-white/10 text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)]' 
    : 'bg-[#eaeaea] border border-slate-300 text-slate-900 shadow-lg';

  return (
    <main className={`relative min-h-screen w-full p-6 md:p-12 font-sans overflow-hidden flex flex-col items-center justify-center transition-colors duration-300 ${
      darkMode ? 'bg-[#0f071e] text-white selection:bg-orange-500 selection:text-white' : 'bg-[#f4f4f6] text-slate-900 selection:bg-orange-500 selection:text-white'
    }`}>
      {/* Halos de lumière d'ambiance */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {darkMode && (
          <>
            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-r from-orange-500/20 via-amber-500/10 to-purple-600/20 rounded-full blur-[140px]"></div>
            <div className="absolute bottom-10 right-10 w-[500px] h-[300px] bg-gradient-to-tr from-purple-600/15 to-orange-500/10 rounded-full blur-[120px]"></div>
          </>
        )}
      </div>

      {/* BOUTON TOGGLE MODE EN HAUT À DROITE */}
      <button 
        onClick={toggleDarkMode}
        className={`absolute top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md border cursor-pointer ${
          darkMode 
            ? 'bg-white/15 text-amber-300 border-white/20 hover:bg-white/25' 
            : 'bg-[#eaeaea] text-slate-700 border-slate-300 hover:bg-[#dedede]'
        }`}
        aria-label="Changer le mode d'affichage"
      >
        {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        <span>{darkMode ? "Mode Clair" : "Mode Sombre"}</span>
      </button>

      <div className="w-full max-w-6xl relative z-10 my-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 uppercase italic">
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tight mb-3 bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
            FORFAIT UNIQUE OU ACCÈS PRO
          </h1>
          <p className={`font-black text-[10px] tracking-[0.4em] ${darkMode ? 'text-orange-200/75' : 'text-orange-600'}`}>
            AUCUN ABONNEMENT CACHÉ POUR LES PARTICULIERS
          </p>
        </div>

        {/* Grille de cartes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
          
          {/* FORFAIT UNIQUE */}
          <div className={`p-8 sm:p-10 rounded-[45px] flex flex-col justify-between relative transition-all duration-300 ${cardBg}`}>
            <div>
              <h3 className="text-2xl font-black italic mb-4 text-orange-500 uppercase tracking-tight">
                FORFAIT UNIQUE
              </h3>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-6xl font-black tracking-tighter">9.99€</span>
                <span className={`text-[10px] font-black uppercase ${darkMode ? 'text-orange-200/50' : 'text-orange-600'}`}>
                  / SOIRÉE UNIQUE
                </span>
              </div>

              <div className="space-y-3 mb-10">
                {[
                  "ACCÈS COMPTE RÉGIE",
                  "PHOTOS ILLIMITÉES",
                  "ALBUM DISPO EN TÉLÉCHARGEMENT",
                  "LIVE PHOTO VIA VIDÉOPROJECTEUR AVEC FOND GRATUIT (VIDÉOPROJECTEUR NON INCLUS)",
                  "LIVRE D'OR NUMÉRIQUE VOCAL ET RETRANSCRIT TÉLÉCHARGEABLE",
                  "PHOTOBOOTH VIA SMARTPHONE OU TABLETTE AVEC CADRE GRATUIT AU CHOIX (SMARTPHONE ET TABLETTE NON INCLUS)",
                  "DÉFI PHOTO CHALLENGE (MODE DÉFIS DÉCALÉS)",
                  "ENVOI DE CHOIX DE MUSIQUE POUR LE DJ"
                ].map((item, idx) => (
                  <div key={idx} className={`flex items-start gap-3 text-[11px] font-black uppercase tracking-tight ${darkMode ? 'text-white/90' : 'text-slate-800'}`}>
                    <Check size={16} className="text-orange-500 shrink-0 mt-0.5" strokeWidth={3} /> {item}
                  </div>
                ))}
              </div>
            </div>

            <div className={`pt-6 border-t ${darkMode ? 'border-white/10' : 'border-slate-300'}`}>
              <div className="flex justify-between items-center mb-6">
                <span className={`text-[10px] font-black uppercase italic tracking-widest ${darkMode ? 'text-orange-200/70' : 'text-orange-600'}`}>
                  SOUVENIR CLÉ USB (+15€)
                </span>
                <div className={`flex items-center gap-4 p-2 rounded-xl border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-300'}`}>
                  <button onClick={() => updateQty("unique", -1)} className="bg-transparent border-none cursor-pointer active:scale-95 transition-all">
                    <Minus size={14} className={darkMode ? 'text-white/70 hover:text-white' : 'text-slate-600 hover:text-slate-900'} />
                  </button>
                  <span className="text-xs font-black">{usbQtys.unique}</span>
                  <button onClick={() => updateQty("unique", 1)} className="bg-transparent border-none cursor-pointer active:scale-95 transition-all">
                    <Plus size={14} className={darkMode ? 'text-white/70 hover:text-white' : 'text-slate-600 hover:text-slate-900'} />
                  </button>
                </div>
              </div>

              <button
                onClick={() => openConfirmModal("unique", "FORFAIT UNIQUE", 9.99, "Unique")}
                className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 ${
                  darkMode 
                    ? 'bg-white/10 hover:bg-white/25 text-white border border-white/15' 
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-300'
                }`}
              >
                CHOISIR CE FORFAIT
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* FORFAIT PRO */}
          <div className={`p-8 sm:p-10 rounded-[45px] flex flex-col justify-between relative transition-all duration-300 ${cardBg}`}>
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-black px-5 py-1 rounded-full uppercase tracking-widest shadow-lg border border-orange-300/30">
              TOUT INCLUS + LIVRAISON
            </div>

            <div>
              <h3 className="text-2xl font-black italic mb-4 text-amber-500 uppercase tracking-tight mt-2">
                FORFAIT CLÉ USB
              </h3>

              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-6xl font-black tracking-tighter">24.99€</span>
                <span className={`text-[10px] font-black uppercase ${darkMode ? 'text-orange-200/50' : 'text-orange-600'}`}>
                  / ÉVÉNEMENT
                </span>
              </div>

              <div className="space-y-4 mb-10">
                {[
                  "TOUT LE FORFAIT À 9.99€ INCLUS",
                  "UNE CLÉ USB AVEC TOUS LES SOUVENIRS PHOTO ET LIVRE D'OR, ENVOYÉE À DOMICILE OU EN POINT RELAIS LE PLUS PROCHE (FRAIS DE LIVRAISON OFFERTS)"
                ].map((item, idx) => (
                  <div key={idx} className={`flex items-start gap-3 text-[11px] font-black uppercase tracking-tight ${darkMode ? 'text-white/90' : 'text-slate-800'}`}>
                    <Check size={16} className="text-amber-500 shrink-0 mt-0.5" strokeWidth={3} /> {item}
                  </div>
                ))}
              </div>
            </div>

            <div className={`pt-6 border-t ${darkMode ? 'border-white/10' : 'border-slate-300'}`}>
              <div className="flex justify-between items-center mb-6">
                <span className={`text-[10px] font-black uppercase italic tracking-widest ${darkMode ? 'text-orange-200/70' : 'text-orange-600'}`}>
                  CLÉ USB SUPPLÉMENTAIRE (+15€)
                </span>
                <div className={`flex items-center gap-4 p-2 rounded-xl border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-300'}`}>
                  <button onClick={() => updateQty("pro", -1)} className="bg-transparent border-none cursor-pointer active:scale-95 transition-all">
                    <Minus size={14} className={darkMode ? 'text-white/70 hover:text-white' : 'text-slate-600 hover:text-slate-900'} />
                  </button>
                  <span className="text-xs font-black">{usbQtys.pro}</span>
                  <button onClick={() => updateQty("pro", 1)} className="bg-transparent border-none cursor-pointer active:scale-95 transition-all">
                    <Plus size={14} className={darkMode ? 'text-white/70 hover:text-white' : 'text-slate-600 hover:text-slate-900'} />
                  </button>
                </div>
              </div>

              <button
                onClick={() => openConfirmModal("pro", "FORFAIT CLÉ USB", 24.99, "Événement")}
                className="w-full py-4 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg border border-orange-400/30 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                SOUSCRIRE FORFAIT CLÉ USB
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMATION */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className={`p-8 sm:p-10 rounded-[45px] max-w-md w-full relative shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${cardBg}`}>
            <button
              onClick={() => setConfirmModal({ show: false, planId: null, planName: "", basePrice: 0, billingCycle: "" })}
              className={`absolute top-6 right-6 bg-transparent border-none cursor-pointer transition-colors ${darkMode ? 'text-white/50 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
            >
              <X size={20} />
            </button>

            <div className="inline-flex p-3 bg-orange-500/10 border border-orange-400/30 rounded-2xl mb-4 text-orange-500">
              <ShieldCheck size={28} />
            </div>

            <h4 className="text-2xl font-black uppercase italic tracking-tight mb-2">
              Confirmer la commande
            </h4>
            <p className={`text-xs mb-6 leading-relaxed ${darkMode ? 'text-orange-200/70' : 'text-slate-600'}`}>
              Vous vous apprêtez à activer le pack <span className="text-amber-500 font-bold">{confirmModal.planName}</span> ({confirmModal.billingCycle}).
            </p>

            <label className={`flex gap-3 items-start text-[11px] font-bold uppercase tracking-wide mb-8 select-none cursor-pointer ${darkMode ? 'text-white/70' : 'text-slate-700'}`}>
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
              className="w-full py-4 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg border border-orange-400/30 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
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
