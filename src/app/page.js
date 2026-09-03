"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Camera, Music, Check, ArrowRight, Sparkles, MessageSquareText, LayoutGrid, ShieldCheck, Zap, Sun, Moon, Mic, QrCode, Download, Smartphone, Disc, Image as ImageIcon, UserPlus, Sliders } from 'lucide-react';

export default function HomePage() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeStep, setActiveStep] = useState(0);

  // Auto-défilement du tutoriel toutes les 6 secondes (sur 8 étapes)
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 8);
    }, 6000);
    return () => clearInterval(interval);
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

  // Tutoriel détaillé en 8 étapes (de la découverte à la clé USB)
  const tutorialSteps = [
    {
      step: "01",
      title: "1. Découverte de la plateforme",
      subtitle: "Page d'accueil & Exploration",
      desc: "Arrivez sur la page d'accueil de PartyLens, découvrez les fonctionnalités clés, consultez les tarifs transparents et testez le mode clair/sombre selon vos préférences, vous pouvez vous connecté ou vous inscrire simplement en choisissant votre forfait avec ou sans clé usb.",
      icon: <Sparkles className="w-5 h-5 text-orange-500" />,
      image: "/tuto-etape1.png",
      badge: "Étape 1 : Découverte"
    },
    {
      step: "02",
      title: "2. Inscription & Choix du forfait",
      subtitle: "Création de compte sécurisée",
      desc: "Sélectionnez votre formule (Forfait Unique à 9.99€ ou Forfait Clé USB à 24.99€) puis créez votre compte organisateur en quelques secondes.",
      icon: <UserPlus className="w-5 h-5 text-amber-500" />,
      image: "/tuto-etape2.png",
      badge: "Étape 2 : Inscription"
    },
    {
      step: "03",
      title: "3. Création de votre événement",
      subtitle: "Tableau de bord régie",
      desc: "Nommez votre soirée, indiquez la date, le lieu et configurez votre espace événementiel depuis votre tableau de bord régie dédié.",
      icon: <Sliders className="w-5 h-5 text-orange-500" />,
      image: "/tuto-etape3.png",
      badge: "Étape 3 : Configuration"
    },
    {
      step: "04",
      title: "4. Personnalisation des cadres & thèmes",
      subtitle: "Design unique pour vos photos",
      desc: "Choisissez parmi nos cadres de photobooth ou/et fond de diaporama aux couleurs de votre mariage ou anniversaire.",
      icon: <LayoutGrid className="w-5 h-5 text-amber-500" />,
      image: "/tuto-etape4.png",
      badge: "Étape 4 : Personnalisation"
    },
    {
      step: "05",
      title: "5. Génération du QR Code & lien",
      subtitle: "Prêt à être imprimé",
      desc: "Téléchargez votre QR code unique et votre lien d'accès sécurisé à disposer sur les tables, les menus ou le bar de la salle.",
      icon: <QrCode className="w-5 h-5 text-orange-500" />,
      image: "/tuto-etape5.png",
      badge: "Étape 5 : Diffusion"
    },
    {
      step: "06",
      title: "6. Connexion instantanée des invités",
      subtitle: "Zéro application à télécharger",
      desc: "Vos invités flashent simplement le QR code avec l'appareil photo de leur smartphone pour entrer directement dans l'album de la soirée.",
      icon: <Smartphone className="w-5 h-5 text-amber-500" />,
      image: "/tuto-etape6.png",
      badge: "Étape 6 : Connexion invités"
    },
    {
      step: "07",
      title: "7. Animation live de la soirée",
      subtitle: "Photos, Voix, Défis & Musique",
      desc: "Partagez des photos illimitées, laissez des messages vocaux sur le livre d'or retranscrit, relevez des défis et suggérez des titres au DJ en direct.",
      icon: <Mic className="w-5 h-5 text-orange-500" />,
      image: "/tuto-etape7.png",
      badge: "Étape 7 : Soirée en direct"
    },
    {
      step: "08",
      title: "8. Récupération des souvenirs",
      subtitle: "Galerie HD & Clé USB souvenir",
      desc: "Diffusez le diaporama live sur vidéoprojecteur, téléchargez l'intégralité des fichiers en HD ou recevez votre clé USB à la maison si tu l'a acheté sur ton.",
      icon: <Download className="w-5 h-5 text-amber-500" />,
      image: "/tuto-etape8.png",
      badge: "Étape 8 : Souvenirs finaux"
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
        
        {/* SLOGAN */}
        <p className={`text-lg md:text-xl mb-10 max-w-xl text-center font-semibold leading-relaxed ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
          L'interactivité ultime de votre événement. Zéro application à télécharger pour vos invités.
        </p>

        {/* DOUBLE APPEL À L'ACTION (CTA) */}
        <div className="w-full max-w-2xl flex flex-col sm:flex-row gap-4 mb-8">
          <Link href="/register?demo=true" className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white py-5 px-6 rounded-xl font-bold tracking-wide text-base shadow-lg shadow-orange-500/20 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <Sparkles size={20} /> Créer un test gratuit
          </Link>
          <Link href="/register" className={`flex-1 py-5 px-6 rounded-xl font-bold tracking-wide text-base transition-all flex items-center justify-center gap-2 shadow-sm ${
            darkMode
              ? 'bg-pink-500/15 text-pink-200 border border-pink-400/30 hover:bg-pink-500/25'
              : 'bg-pink-100 text-pink-700 border border-pink-300 hover:bg-pink-200'
          }`}>
            Inscription <ArrowRight size={20} />
          </Link>
          <Link href="/login" className={`flex-1 py-5 px-6 rounded-xl font-bold tracking-wide text-base transition-all flex items-center justify-center gap-2 shadow-sm ${
            darkMode 
              ? 'bg-white/[0.04] text-white border border-white/10 hover:bg-white/[0.08]' 
              : 'bg-[#eaeaea] text-slate-700 border border-slate-300 hover:bg-[#dedede]'
          }`}>
            Espace Organisateur / DJ <ArrowRight size={20} />
          </Link>
        </div>

        {/* BADGE */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-20 shadow-sm ${
          darkMode 
            ? 'bg-white/5 border border-white/10 text-orange-400' 
            : 'bg-[#eaeaea] border border-slate-300 text-slate-700'
        }`}>
          <Zap size={14} className="text-orange-500" /> Plateforme interactive pour mariages, anniversaires & soirées
        </div>

        {/* SECTION TUTORIEL DÉTAILLÉ EN 8 ÉTAPES AVEC VISUELS */}
        <div className="w-full mb-24">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className={`text-2xl md:text-3xl font-extrabold tracking-tight mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Guide complet : De l'inscription aux souvenirs
            </h2>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Suivez les 8 étapes du parcours organisateur et invité pour comprendre l'expérience de bout en bout.
            </p>
          </div>

          {/* SÉLECTEUR DES 8 ÉTAPES (GRID DE NAVIGATION) */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 mb-6">
            {tutorialSteps.map((item, index) => (
              <button
                key={index}
                onClick={() => setActiveStep(index)}
                className={`p-2.5 rounded-xl text-left transition-all flex flex-col justify-between border ${
                  activeStep === index
                    ? darkMode
                      ? 'bg-gradient-to-br from-orange-500/20 to-purple-600/20 border-orange-500/60 shadow-md shadow-orange-950/30'
                      : 'bg-orange-50 border-orange-300 shadow-sm'
                    : darkMode
                      ? 'bg-[#170c2c]/40 border-white/10 hover:border-white/20'
                      : 'bg-[#eaeaea]/60 border-slate-300 hover:bg-[#eaeaea]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                    activeStep === index 
                      ? 'bg-orange-500 text-white' 
                      : darkMode ? 'bg-white/10 text-slate-400' : 'bg-slate-300 text-slate-700'
                  }`}>
                    {item.step}
                  </span>
                  {item.icon}
                </div>
                <h4 className={`text-[10px] font-bold tracking-tight line-clamp-1 ${activeStep === index ? (darkMode ? 'text-white' : 'text-slate-900') : (darkMode ? 'text-slate-400' : 'text-slate-600')}`}>
                  {item.title.replace(/^[0-9]+\.\s*/, '')}
                </h4>
              </button>
            ))}
          </div>

          {/* CONTENEUR DE L'ÉTAPE ACTIVE AVEC VISUEL ET DESCRIPTIF */}
          <div className={`rounded-3xl p-6 md:p-10 border backdrop-blur-xl transition-all shadow-2xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center ${
            darkMode ? 'bg-[#170c2c]/90 border-white/10' : 'bg-[#eaeaea]/90 border-slate-300/80'
          }`}>
            {/* Colonne Texte */}
            <div className="md:col-span-6 space-y-4 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Sparkles size={12} /> {tutorialSteps[activeStep].badge}
              </div>
              <h3 className={`text-xl md:text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {tutorialSteps[activeStep].title}
              </h3>
              <p className={`text-xs font-bold uppercase tracking-wide ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                {tutorialSteps[activeStep].subtitle}
              </p>
              <p className={`text-xs md:text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                {tutorialSteps[activeStep].desc}
              </p>

              <div className="pt-4 flex items-center gap-3">
                <button 
                  onClick={() => setActiveStep((prev) => (prev + 1) % 8)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                    darkMode 
                      ? 'bg-white/10 text-white border-white/10 hover:bg-white/20' 
                      : 'bg-[#dedede] text-slate-800 border-slate-300 hover:bg-[#d4d4d4]'
                  }`}
                >
                  <span>Étape suivante ({activeStep + 1}/8)</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Colonne Visuel (Intégration des photos du site) */}
            <div className={`md:col-span-6 rounded-2xl border flex flex-col items-center justify-center relative overflow-hidden min-h-[280px] group ${
              darkMode ? 'bg-black/50 border-white/10' : 'bg-white border-slate-300 shadow-inner'
            }`}>
              {/* Simulation d'une fenêtre de navigateur */}
              <div className="absolute top-0 inset-x-0 h-8 bg-black/20 backdrop-blur-md px-4 flex items-center justify-between border-b border-white/5 z-10">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider">partylens.fr</span>
                <span className="text-[10px] text-orange-400 font-bold px-2 py-0.5 rounded bg-orange-500/10">Étape {activeStep + 1}/8</span>
              </div>

              {/* CONTENEUR DE L'IMAGE DU SITE */}
              <div className="w-full h-full pt-8 flex items-center justify-center p-4">
                <img 
                  src={tutorialSteps[activeStep].image} 
                  alt="Aperçu PartyLens" 
                  className="w-full h-full object-cover rounded-xl shadow-lg border border-white/10" 
                />
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
          darkMode ? 'bg-white/[0.02] border border-white/10' : 'bg-eaeaea border border-slate-300'
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
