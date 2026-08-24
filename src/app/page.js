"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Camera, Music, Check, ArrowRight, Sparkles, MessageSquareText, LayoutGrid, ShieldCheck, Zap, Sun, Moon, Mic } from 'lucide-react';

export default function HomePage() {
  const [darkMode, setDarkMode] = useState(true);

  // Optionnel : Récupérer la préférence ou garder sombre par défaut
  useEffect(() => {
    // Tu peux aussi lier ça au localStorage si tu veux
  }, []);

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
        "LIVRE D'OR NUMÉRIQUE VOCAL ET RETRANSCRIT TÉLÉCHARGEABLE",
        "PHOTOBOOTH VIA SMARTPHONE OU TABLETTE AVEC CADRE GRATUIT AU CHOIX (SMARTPHONE ET TABLETTE NON INCLUS)",
        "DÉFI PHOTO CHALLENGE (MODE DÉFIS DÉCALÉS)",
        "ENVOI DE CHOIX DE MUSIQUE POUR LE DJ",
      ],
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
      isUsb: true,
      href: "/register?plan=pro"
    }
  ];

  return (
    <main className={`min-h-screen flex flex-col items-center px-6 py-16 font-sans relative transition-colors duration-300 ${
      darkMode 
        ? 'bg-[#0f071e] text-slate-100 selection:bg-orange-500 selection:text-white' 
        : 'bg-[#f4f4f6] text-slate-900 selection:bg-orange-500 selection:text-white'
    }`}>
      
      {/* BOUTON SWITCH MODE CLAIR / SOMBRE (FIXÉ EN HAUT À DROITE) */}
      <button 
        onClick={() => setDarkMode(!darkMode)}
        className={`absolute top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md border ${
          darkMode 
            ? 'bg-white/10 text-amber-300 border-white/20 hover:bg-white/20' 
            : 'bg-[#eaeaea] text-slate-700 border-slate-300 hover:bg-[#dedede]'
        }`}
        aria-label="Changer le mode d'affichage"
      >
        {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        <span>{darkMode ? "Mode Clair" : "Mode Sombre"}</span>
      </button>

      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {darkMode ? (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-purple-600/15 via-orange-600/10 to-transparent rounded-full blur-[120px]"></div>
        ) : (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-purple-200/30 via-orange-100/20 to-transparent rounded-full blur-[100px]"></div>
        )}
      </div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
        
        {/* LOGO */}
        <img 
          src="/logo-partylens.png" 
          alt="PartyLens" 
          className="w-[420px] max-w-[90vw] h-auto mb-6 drop-shadow-md" 
        />
        
        {/* SLOGAN (PLUS GROS) */}
        <p className={`text-lg md:text-xl mb-10 max-w-xl text-center font-semibold leading-relaxed ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
          L'interactivité ultime de votre événement. Zéro application à télécharger pour vos invités.
        </p>

        {/* DOUBLE APPEL À L'ACTION (CTA) */}
        <div className="w-full max-w-md flex flex-col sm:flex-row gap-4 mb-8">
          <Link href="/register?demo=true" className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3.5 px-6 rounded-xl font-bold tracking-wide text-xs shadow-lg shadow-orange-500/20 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <Sparkles size={16} /> Créer un test gratuit
          </Link>
          <Link href="/login" className={`flex-1 py-3.5 px-6 rounded-xl font-bold tracking-wide text-xs transition-all flex items-center justify-center gap-2 shadow-sm ${
            darkMode 
              ? 'bg-white/[0.04] text-white border border-white/10 hover:bg-white/[0.08]' 
              : 'bg-[#eaeaea] text-slate-700 border border-slate-300 hover:bg-[#dedede]'
          }`}>
            Espace Organisateur / DJ <ArrowRight size={16} />
          </Link>
        </div>

        {/* BADGE DÉPLACÉ EN DESSOUS DES BOUTONS */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-24 shadow-sm ${
          darkMode 
            ? 'bg-white/5 border border-white/10 text-orange-400' 
            : 'bg-[#eaeaea] border border-slate-300 text-slate-700'
        }`}>
          <Zap size={14} className="text-orange-500" /> Plateforme interactive pour mariages, anniversaires & soirées
        </div>

        {/* SECTION COMMENT ÇA MARCHE */}
        <div className={`w-full mb-24 rounded-3xl p-8 md:p-12 backdrop-blur-xl shadow-xl ${
          darkMode 
            ? 'bg-[#170c2c]/80 border border-white/10 shadow-2xl' 
            : 'bg-[#eaeaea]/80 border border-slate-300/80 shadow-slate-300/30'
        }`}>
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className={`text-2xl md:text-3xl font-extrabold tracking-tight mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Comment ça fonctionne ?</h2>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Un parcours fluide, pensé pour vos invités comme pour vous.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className={`p-6 rounded-2xl flex flex-col justify-between shadow-sm ${darkMode ? 'bg-white/[0.02] border border-white/5' : 'bg-[#f4f4f6] border border-slate-300/60'}`}>
              <div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm mb-5 ${darkMode ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-orange-50 text-orange-600 border border-orange-200/60'}`}>01</div>
                <h4 className={`font-bold text-sm mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Générez votre QR Code</h4>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Choisissez votre formule et récupérez instantanément le QR Code unique de votre événement dans votre espace.</p>
              </div>
            </div>
            
            <div className={`p-6 rounded-2xl flex flex-col justify-between shadow-sm ${darkMode ? 'bg-white/[0.02] border border-white/5' : 'bg-[#f4f4f6] border border-slate-300/60'}`}>
              <div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm mb-5 ${darkMode ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-600 border border-amber-200/60'}`}>02</div>
                <h4 className={`font-bold text-sm mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Les invités participent</h4>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Ils flashent le code avec leur smartphone pour accéder aux photos, photobooth, livre d'or et demandes DJ.</p>
              </div>
            </div>

            <div className={`p-6 rounded-2xl flex flex-col justify-between shadow-sm ${darkMode ? 'bg-white/[0.02] border border-white/5' : 'bg-[#f4f4f6] border border-slate-300/60'}`}>
              <div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm mb-5 ${darkMode ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-purple-50 text-purple-700 border border-purple-200/60'}`}>03</div>
                <h4 className={`font-bold text-sm mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Profitez des souvenirs</h4>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Diffusion live automatique sur écran géant ou vidéoprojecteur, et téléchargement intégral de l'album.</p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION FONCTIONNALITÉS */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-24 text-left">
          <div className={`p-6 rounded-2xl transition-all shadow-sm ${darkMode ? 'bg-[#170c2c]/60 border border-white/10 hover:border-orange-500/30' : 'bg-[#eaeaea]/70 border border-slate-300/80 hover:shadow-md'}`}>
            <div className={`w-fit p-3 rounded-xl mb-4 ${darkMode ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400' : 'bg-orange-50 border border-orange-100 text-orange-600'}`}>
              <Camera size={20} />
            </div>
            <h3 className={`text-sm font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Photos & Photobooth</h3>
            <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Illimitées, avec cadres personnalisables intégrés pour smartphone ou tablette.</p>
          </div>

          <div className={`p-6 rounded-2xl transition-all shadow-sm ${darkMode ? 'bg-[#170c2c]/60 border border-white/10 hover:border-orange-500/30' : 'bg-[#eaeaea]/70 border border-slate-300/80 hover:shadow-md'}`}>
            <div className={`w-fit p-3 rounded-xl mb-4 flex items-center gap-2 ${darkMode ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' : 'bg-amber-50 border border-amber-100 text-amber-600'}`}>
              <MessageSquareText size={18} />
              <Mic size={18} />
            </div>
            <h3 className={`text-sm font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Livre d'Or Vocal & Numérique</h3>
            <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Recueillez les messages vocaux de vos invités, automatiquement retranscrits et disponibles en ligne.</p>
          </div>

          <div className={`p-6 rounded-2xl transition-all shadow-sm ${darkMode ? 'bg-[#170c2c]/60 border border-white/10 hover:border-orange-500/30' : 'bg-[#eaeaea]/70 border border-slate-300/80 hover:shadow-md'}`}>
            <div className={`w-fit p-3 rounded-xl mb-4 ${darkMode ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400' : 'bg-purple-50 border border-purple-100 text-purple-700'}`}>
              <Music size={20} />
            </div>
            <h3 className={`text-sm font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Ambiance DJ</h3>
            <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Interface dédiée pour permettre à vos invités de suggérer leurs titres favoris.</p>
          </div>

          <div className={`p-6 rounded-2xl transition-all shadow-sm ${darkMode ? 'bg-[#170c2c]/60 border border-white/10 hover:border-orange-500/30' : 'bg-[#eaeaea]/70 border border-slate-300/80 hover:shadow-md'}`}>
            <div className={`w-fit p-3 rounded-xl mb-4 ${darkMode ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' : 'bg-indigo-50 border border-indigo-100 text-indigo-700'}`}>
              <LayoutGrid size={20} />
            </div>
            <h3 className={`text-sm font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Diaporama Live</h3>
            <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Projection en temps réel des photos de la soirée sur grand écran.</p>
          </div>
        </div>

        {/* SECTION TARIFS */}
        <div className="w-full text-center mb-10">
          <h2 className={`text-2xl md:text-3xl font-extrabold tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Des tarifs simples et transparents</h2>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Pas d'abonnement caché, payez uniquement pour votre événement.</p>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 mb-20 text-left">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`relative p-8 md:p-10 rounded-3xl flex flex-col transition-all duration-300 backdrop-blur-2xl ${
                plan.isUsb 
                  ? darkMode 
                    ? 'border-2 border-orange-500/60 bg-[#1b0d36] shadow-2xl shadow-orange-950/40' 
                    : 'border-2 border-orange-500 bg-[#eaeaea] shadow-xl shadow-orange-500/10'
                  : darkMode 
                    ? 'border border-white/10 bg-[#150a28]/80' 
                    : 'border border-slate-300/90 bg-[#eaeaea]/80 shadow-sm hover:shadow-md'
              }`}
            >
              {plan.isUsb && (
                <div className="absolute -top-3.5 right-8 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1.5">
                  <Sparkles size={12} /> Le plus populaire
                </div>
              )}

              <h3 className={`text-2xl font-extrabold tracking-tight mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {plan.name}
              </h3>
              <p className={`text-xs font-medium mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{plan.desc}</p>

              <div className={`flex items-baseline gap-1.5 mb-8 pb-6 border-b ${darkMode ? 'border-white/10' : 'border-slate-300/70'}`}>
                <span className={`text-5xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{plan.price.split('€')[0]}</span>
                <span className="text-3xl font-black text-orange-500">€</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ml-2 px-3 py-1 rounded-md border ${
                  darkMode ? 'bg-white/5 text-slate-400 border-white/10' : 'bg-[#dedede] text-slate-800 border-slate-300'
                }`}>{plan.period}</span>
              </div>

              <ul className="space-y-3.5 flex-1 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className={`flex items-start gap-3 text-[11px] font-semibold tracking-wider leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    <Check size={16} className="text-orange-500 shrink-0 mt-0.5" strokeWidth={3} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={plan.href} className={`w-full py-4 text-center rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 ${
                plan.isUsb 
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25 hover:brightness-110 active:scale-[0.98]' 
                  : darkMode 
                    ? 'bg-white/10 text-white border border-white/10 hover:bg-white hover:text-slate-950 active:scale-[0.98]' 
                    : 'bg-[#dedede] text-slate-900 border border-slate-300 hover:bg-slate-900 hover:text-white active:scale-[0.98]'
              }`}>
                {plan.isUsb ? 'Commander le Forfait Clé USB' : 'Choisir ce forfait'}
              </Link>
            </div>
          ))}
        </div>

        {/* TRUST BANNER */}
        <div className={`w-full rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left shadow-sm ${
          darkMode ? 'bg-white/[0.02] border border-white/10' : 'bg-[#eaeaea]/80 border border-slate-300/80'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              darkMode ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400' : 'bg-orange-50 border border-orange-100 text-orange-600'
            }`}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>Paiement 100% sécurisé & Support réactif</h4>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Une question sur votre installation ? Notre équipe vous accompagne avant et pendant votre événement.</p>
            </div>
          </div>
          <Link href="/contact" className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
            darkMode ? 'bg-white/10 hover:bg-white/15 text-white border-white/10' : 'bg-[#dedede] hover:bg-[#d4d4d4] text-slate-800 border-slate-300'
          }`}>
            Nous contacter
          </Link>
        </div>

      </div>

      {/* FOOTER */}
      <footer className={`mt-20 pt-8 relative z-10 w-full text-center border-t max-w-5xl ${darkMode ? 'border-white/10 text-slate-500' : 'border-slate-300 text-slate-500'}`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6">
          <p className="text-xs">© 2026 PartyLens. Tous droits réservés.</p>
          <div className={`flex items-center gap-6 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            <Link href="/mentions-legales" className="hover:underline">Mentions légales</Link>
            <Link href="/cgv" className="hover:underline">CGV</Link>
            <Link href="/avis" className="hover:underline">Avis clients</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}