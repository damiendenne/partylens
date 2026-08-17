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
      color: "text-[#EAB308]",
      isUsb: true,
      href: "/register?plan=pro"
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#4c0d82] to-black text-white flex flex-col items-center p-6 text-center font-sans overflow-hidden relative">
      
      {/* EFFET DE FOND */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#ff0080] rounded-full blur-[120px] opacity-20"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-[#0072ff] rounded-full blur-[120px] opacity-20"></div>
      </div>

      <div className="relative z-10 w-full flex flex-col items-center">
        {/* LOGO */}
        <img 
          src="/logo-partylens.png" 
          alt="PartyLens" 
          className="w-[600px] max-w-[95vw] h-auto mb-2 drop-shadow-2xl mt-4" 
        />
        
        <p className="text-gray-300 italic mb-10 max-w-md text-sm">
          L'interactivité ultime pour vos soirées.
        </p>

        {/* DOUBLE APPEL À L'ACTION (CTA) */}
        <div className="w-full max-w-xl flex flex-col sm:flex-row gap-4 mb-24">
          <Link href="/register?demo=true" className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 px-6 rounded-2xl font-black uppercase tracking-tight shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
            <Sparkles size={18} /> Créer un test gratuit
          </Link>
          <Link href="/login" className="flex-1 bg-white text-[#4c0d82] py-4 px-6 rounded-2xl font-black uppercase tracking-tight shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
            Espace Organisateur / DJ <ArrowRight size={18} />
          </Link>
        </div>

        {/* SECTION COMMENT ÇA MARCHE */}
        <div className="w-full max-w-5xl mb-24 bg-white/[0.02] border border-white/5 rounded-[40px] p-10 backdrop-blur-xl">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Aucune application à télécharger !</h2>
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-12">Simple comme un coup d'œil, magique pour l'ambiance</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center font-black text-xl mb-4 border border-pink-500/20">1</div>
              <h4 className="font-black uppercase tracking-tight mb-2">Générez votre QR Code</h4>
              <p className="text-gray-400 text-xs leading-relaxed max-w-xs">Sélectionnez votre formule et récupérez le QR Code unique de votre soirée dans votre espace.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 text-[#0072ff] flex items-center justify-center font-black text-xl mb-4 border border-blue-500/20">2</div>
              <h4 className="font-black uppercase tracking-tight mb-2">Les invités participent</h4>
              <p className="text-gray-400 text-xs leading-relaxed max-w-xs">Flash du code pour accéder aux photos, au photobooth, au livre d'or et aux demandes DJ.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 text-[#7928ca] flex items-center justify-center font-black text-xl mb-4 border border-purple-500/20">3</div>
              <h4 className="font-black uppercase tracking-tight mb-2">Souvenirs instantanés</h4>
              <p className="text-gray-400 text-xs leading-relaxed max-w-xs">Diffusion live sur écran, album en ligne et récupération simplifiée de tous vos souvenirs.</p>
            </div>
          </div>
        </div>

        {/* SECTION CARACTÉRISTIQUES PRINCIPALES STYLÉES */}
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          <div className="bg-white/5 border border-white/10 p-8 rounded-[30px] flex flex-col items-center text-center group hover:border-pink-500/50 transition-all">
            <div className="bg-black/40 p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <Camera size={32} className="text-[#ff0080]" />
            </div>
            <h3 className="text-xl font-black uppercase italic mb-3 tracking-tighter">Photos & Photobooth</h3>
            <p className="text-gray-400 text-xs leading-relaxed">Photos illimitées, cadres personnalisables, photobooth via smartphone ou tablette.</p>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 rounded-[30px] flex flex-col items-center text-center group hover:border-yellow-500/50 transition-all">
            <div className="bg-black/40 p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <MessageSquareText size={32} className="text-[#EAB308]" />
            </div>
            <h3 className="text-xl font-black uppercase italic mb-3 tracking-tighter">Livre d'Or</h3>
            <p className="text-gray-400 text-xs leading-relaxed">Numérique téléchargeable pour tous les messages écrits de vos invités.</p>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 rounded-[30px] flex flex-col items-center text-center group hover:border-blue-500/50 transition-all">
            <div className="bg-black/40 p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <Music size={32} className="text-[#0072ff]" />
            </div>
            <h3 className="text-xl font-black uppercase italic mb-3 tracking-tighter">Ambiance DJ</h3>
            <p className="text-gray-400 text-xs leading-relaxed">Interface dédiée pour que vos invités proposent leurs titres favoris en direct.</p>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 rounded-[30px] flex flex-col items-center text-center group hover:border-purple-500/50 transition-all">
            <div className="bg-black/40 p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <LayoutGrid size={32} className="text-[#7928ca]" />
            </div>
            <h3 className="text-xl font-black uppercase italic mb-3 tracking-tighter">Live Diaporama</h3>
            <p className="text-gray-400 text-xs leading-relaxed">Diffusion automatique sur écran géant ou vidéoprojecteur de tous les contenus.</p>
          </div>
        </div>

        {/* SECTION FORFAITS */}
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 px-4 mb-24">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`relative p-10 rounded-[40px] border border-white/10 bg-gradient-to-b from-white/5 to-transparent flex flex-col text-left transition-all duration-500 ${plan.isUsb ? 'ring-2 ring-[#EAB308]/50 shadow-[0_0_50px_rgba(234,179,8,0.15)] bg-black/40' : ''}`}
            >
              {plan.isUsb && (
                <div className="absolute -top-4 right-10 bg-[#EAB308] text-black text-[10px] font-black px-6 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                  CLÉ USB INCLUSE
                </div>
              )}

              <h3 className={`text-4xl font-black italic tracking-tighter ${plan.color}`}>
                {plan.name}
              </h3>
              <p className="text-gray-400 text-[11px] font-bold uppercase mt-1 mb-6 tracking-wide">{plan.desc}</p>

              <div className="flex items-baseline gap-1 mb-10">
                <span className="text-7xl font-black tracking-tighter text-white">{plan.price.split('€')[0]}</span>
                <span className="text-4xl font-black tracking-tighter text-white">€</span>
                <span className="text-gray-400 text-[10px] font-black uppercase tracking-wider ml-2 bg-white/5 px-3 py-1 rounded-md">{plan.period}</span>
              </div>

              <ul className="space-y-5 flex-1 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-gray-200">
                    <Check size={16} className="text-[#EAB308] shrink-0" strokeWidth={4} />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href={plan.href} className={`w-full py-5 text-center rounded-2xl font-black uppercase tracking-wider text-xs transition-all ${plan.isUsb ? 'bg-[#EAB308] text-black hover:bg-white' : 'bg-white/10 text-white hover:bg-white hover:text-black'}`}>
                {plan.isUsb ? 'Souscrire Forfait Clé USB' : 'Choisir ce forfait'}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="mt-auto pt-6 relative z-10 w-full text-center">
        <div className="h-[1px] w-full max-w-sm mx-auto bg-white/10 mb-6"></div>
        <div className="flex flex-col items-center gap-4 pb-6">
          <Link href="/avis" className="text-xs text-gray-400 hover:text-[#ff0080] transition-colors underline underline-offset-4">
            Votre avis nous intéresse
          </Link>
          <p className="text-[10px] text-white/30 uppercase font-black tracking-[0.5em]">Powered by PartyLens</p>
        </div>
      </footer>
    </main>
  );
}