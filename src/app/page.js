"use client";
import Link from 'next/link';
import { Camera, Music, Check, ArrowRight, Sparkles, MessageSquareText, LayoutGrid } from 'lucide-react';

export default function HomePage() {
  const plans = [
    {
      name: "FORFAIT UNIQUE",
      price: "9.99€",
      period: "/ SOIRÉE UNIQUE",
      desc: "Idéal pour profiter pleinement de votre événement.",
      features: [
        "ACCÈS COMPTE RÉGIE",
        "PHOTOS ILLIMITÉES",
        "ALBUM DISPO EN TÉLÉCHARGEMENT",
        "LIVE PHOTO VIA VIDÉOPROJECTEUR AVEC FOND GRATUIT (VIDÉOPROJECTEUR NON INCLUS)",
        "LIVRE D'OR NUMÉRIQUE TÉLÉCHARGEABLE",
        "PHOTOBOOTH VIA SMARTPHONE OU TABLETTE AVEC CADRE GRATUIT AU CHOIX (SMARTPHONE ET TABLETTE NON INCLUS)",
        "DÉFI PHOTO CHALLENGE (MODE DÉFIS DÉCALÉS)",
        "ENVOI DE CHOIX DE MUSIQUE POUR LE DJ",
      ],
      color: "text-white",
      isUsb: false,
      href: "/register?plan=unique"
    },
    {
      name: "FORFAIT CLÉ USB",
      price: "24.99€",
      period: "/ ÉVÉNEMENT",
      desc: "L'expérience complète avec souvenir physique.",
      features: [
        "TOUT LE FORFAIT À 9.99€ INCLUS",
        "UNE CLÉ USB AVEC TOUS LES SOUVENIRS PHOTO ET LIVRE D'OR, ENVOYÉE À DOMICILE OU EN POINT RELAIS LE PLUS PROCHE (FRAIS DE LIVRAISON OFFERTS)",
      ],
      color: "text-amber-300",
      isUsb: true,
      href: "/register?plan=pro"
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#2d104d] via-[#210a3b] to-[#140427] text-white flex flex-col items-center p-6 text-center font-sans overflow-hidden relative">
      
      {/* EFFET DE VAGUES LUMINEUSES ORANGE EN ARRIÈRE-PLAN */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Vague Orange Haute */}
        <svg className="absolute -top-12 left-0 w-full h-[500px] text-orange-500/35 blur-xl opacity-90" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,160L60,176C120,192,240,224,360,213.3C480,203,600,149,720,154.7C840,160,960,224,1080,229.3C1200,235,1320,181,1380,154.7L1440,128L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,0,0Z"></path>
        </svg>

        {/* Vague Orange / Ambre Centrale */}
        <svg className="absolute top-[30%] -left-20 w-[130%] h-[550px] text-amber-500/30 blur-2xl transform rotate-3" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,96L80,122.7C160,149,320,203,480,208C640,213,800,171,960,149.3C1120,128,1280,128,1360,128L1440,128L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
        </svg>

        {/* Vague Orange Basse */}
        <svg className="absolute bottom-0 right-0 w-full h-[500px] text-orange-600/35 blur-xl opacity-90" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,224L60,213.3C120,203,240,181,360,186.7C480,192,600,224,720,218.7C840,213,960,171,1080,160C1200,149,1320,171,1380,181.3L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
        </svg>

        {/* Halo lumineux orange intense */}
        <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-r from-orange-500/40 via-amber-400/30 to-pink-500/20 rounded-full blur-[130px]"></div>
      </div>

      <div className="relative z-10 w-full flex flex-col items-center">
        {/* LOGO */}
        <img 
          src="/logo-partylens.png" 
          alt="PartyLens" 
          className="w-[600px] max-w-[95vw] h-auto mb-2 drop-shadow-[0_0_40px_rgba(249,115,22,0.5)] mt-4" 
        />
        
        <p className="text-orange-100/90 italic mb-10 max-w-md text-sm font-medium drop-shadow">
          L'interactivité ultime pour vos soirées.
        </p>

        {/* DOUBLE APPEL À L'ACTION (CTA) */}
        <div className="w-full max-w-xl flex flex-col sm:flex-row gap-4 mb-24">
          <Link href="/register?demo=true" className="flex-1 bg-gradient-to-r from-orange-500 via-amber-500 to-pink-500 text-white py-4 px-6 rounded-2xl font-black uppercase tracking-tight shadow-[0_0_30px_rgba(249,115,22,0.6)] border border-orange-300/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
            <Sparkles size={18} /> Créer un test gratuit
          </Link>
          <Link href="/login" className="flex-1 bg-white/15 backdrop-blur-xl text-white border border-white/30 py-4 px-6 rounded-2xl font-black uppercase tracking-tight shadow-lg hover:bg-white hover:text-purple-950 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
            Espace Organisateur / DJ <ArrowRight size={18} />
          </Link>
        </div>

        {/* SECTION COMMENT ÇA MARCHE */}
        <div className="w-full max-w-5xl mb-24 bg-white/[0.08] border border-white/20 rounded-[40px] p-10 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2 bg-gradient-to-r from-amber-300 via-orange-400 to-amber-200 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(251,146,60,0.5)]">Aucune application à télécharger !</h2>
          <p className="text-orange-200/70 text-xs font-semibold uppercase tracking-widest mb-12">Simple comme un coup d'œil, magique pour l'ambiance</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-orange-500/25 text-orange-300 flex items-center justify-center font-black text-xl mb-4 border border-orange-400/50 shadow-[0_0_15px_rgba(249,115,22,0.5)]">1</div>
              <h4 className="font-black uppercase tracking-tight mb-2">Générez votre QR Code</h4>
              <p className="text-gray-200 text-xs leading-relaxed max-w-xs">Sélectionnez votre formule et récupérez le QR Code unique de votre soirée dans votre espace.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/25 text-amber-300 flex items-center justify-center font-black text-xl mb-4 border border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.5)]">2</div>
              <h4 className="font-black uppercase tracking-tight mb-2">Les invités participent</h4>
              <p className="text-gray-200 text-xs leading-relaxed max-w-xs">Flash du code pour accéder aux photos, au photobooth, au livre d'or et aux demandes DJ.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-orange-600/25 text-orange-300 flex items-center justify-center font-black text-xl mb-4 border border-orange-500/50 shadow-[0_0_15px_rgba(234,88,12,0.5)]">3</div>
              <h4 className="font-black uppercase tracking-tight mb-2">Souvenirs instantanés</h4>
              <p className="text-gray-200 text-xs leading-relaxed max-w-xs">Diffusion live sur écran, album en ligne et récupération simplifiée de tous vos souvenirs.</p>
            </div>
          </div>
        </div>

        {/* SECTION CARACTÉRISTIQUES PRINCIPALES STYLÉES */}
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          <div className="bg-white/[0.08] border border-white/20 p-8 rounded-[30px] flex flex-col items-center text-center group hover:border-orange-400/90 hover:shadow-[0_0_30px_rgba(249,115,22,0.45)] transition-all backdrop-blur-xl">
            <div className="bg-black/40 p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform shadow-inner border border-white/10">
              <Camera size={32} className="text-orange-400" />
            </div>
            <h3 className="text-xl font-black uppercase italic mb-3 tracking-tighter">Photos & Photobooth</h3>
            <p className="text-gray-200 text-xs leading-relaxed">Photos illimitées, cadres personnalisables, photobooth via smartphone ou tablette.</p>
          </div>

          <div className="bg-white/[0.08] border border-white/20 p-8 rounded-[30px] flex flex-col items-center text-center group hover:border-amber-400/90 hover:shadow-[0_0_30px_rgba(251,191,36,0.45)] transition-all backdrop-blur-xl">
            <div className="bg-black/40 p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform shadow-inner border border-white/10">
              <MessageSquareText size={32} className="text-amber-400" />
            </div>
            <h3 className="text-xl font-black uppercase italic mb-3 tracking-tighter">Livre d'Or</h3>
            <p className="text-gray-200 text-xs leading-relaxed">Numérique téléchargeable pour tous les messages écrits de vos invités.</p>
          </div>

          <div className="bg-white/[0.08] border border-white/20 p-8 rounded-[30px] flex flex-col items-center text-center group hover:border-orange-500/90 hover:shadow-[0_0_30px_rgba(249,115,22,0.45)] transition-all backdrop-blur-xl">
            <div className="bg-black/40 p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform shadow-inner border border-white/10">
              <Music size={32} className="text-orange-400" />
            </div>
            <h3 className="text-xl font-black uppercase italic mb-3 tracking-tighter">Ambiance DJ</h3>
            <p className="text-gray-200 text-xs leading-relaxed">Interface dédiée pour que vos invités proposent leurs titres favoris en direct.</p>
          </div>

          <div className="bg-white/[0.08] border border-white/20 p-8 rounded-[30px] flex flex-col items-center text-center group hover:border-amber-300/90 hover:shadow-[0_0_30px_rgba(252,211,77,0.45)] transition-all backdrop-blur-xl">
            <div className="bg-black/40 p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform shadow-inner border border-white/10">
              <LayoutGrid size={32} className="text-amber-300" />
            </div>
            <h3 className="text-xl font-black uppercase italic mb-3 tracking-tighter">Live Diaporama</h3>
            <p className="text-gray-200 text-xs leading-relaxed">Diffusion automatique sur écran géant ou vidéoprojecteur de tous les contenus.</p>
          </div>
        </div>

        {/* SECTION FORFAITS */}
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 px-4 mb-24">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`relative p-10 rounded-[40px] flex flex-col text-left transition-all duration-500 backdrop-blur-2xl ${
                plan.isUsb 
                  ? 'border-2 border-orange-500/90 bg-white/[0.1] shadow-[0_0_45px_rgba(249,115,22,0.45)]' 
                  : 'border border-white/20 bg-white/[0.07] hover:border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.5)]'
              }`}
            >
              {plan.isUsb && (
                <div className="absolute -top-4 right-10 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black px-6 py-1.5 rounded-full uppercase tracking-widest shadow-[0_0_20px_rgba(249,115,22,0.6)] border border-orange-300/40">
                  CLÉ USB INCLUSE
                </div>
              )}

              <h3 className={`text-4xl font-black italic tracking-tighter ${plan.color}`}>
                {plan.name}
              </h3>
              <p className="text-gray-300 text-[11px] font-bold uppercase mt-1 mb-6 tracking-wide">{plan.desc}</p>

              <div className="flex items-baseline gap-1 mb-10">
                <span className="text-7xl font-black tracking-tighter text-white">{plan.price.split('€')[0]}</span>
                <span className="text-4xl font-black tracking-tighter text-white">€</span>
                <span className="text-gray-200 text-[10px] font-black uppercase tracking-wider ml-2 bg-white/10 px-3 py-1 rounded-md border border-white/10">{plan.period}</span>
              </div>

              <ul className="space-y-5 flex-1 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-gray-100">
                    <Check size={16} className="text-amber-400 shrink-0" strokeWidth={4} />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href={plan.href} className={`w-full py-5 text-center rounded-2xl font-black uppercase tracking-wider text-xs transition-all ${
                plan.isUsb 
                  ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white shadow-[0_0_25px_rgba(249,115,22,0.6)] hover:scale-105 border border-orange-300/40' 
                  : 'bg-white/15 text-white border border-white/25 hover:bg-white hover:text-purple-950 shadow-md'
              }`}>
                {plan.isUsb ? 'Souscrire Forfait Clé USB' : 'Choisir ce forfait'}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="mt-auto pt-6 relative z-10 w-full text-center">
        <div className="h-[1px] w-full max-w-sm mx-auto bg-white/20 mb-6"></div>
        <div className="flex flex-col items-center gap-4 pb-6">
          <Link href="/avis" className="text-xs text-orange-200/80 hover:text-orange-400 transition-colors underline underline-offset-4">
            Votre avis nous intéresse
          </Link>
          <p className="text-[10px] text-white/50 uppercase font-black tracking-[0.5em]">Powered by PartyLens</p>
        </div>
      </footer>
    </main>
  );
}