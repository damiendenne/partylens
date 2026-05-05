"use client";
import Link from 'next/link';
import { Camera, Music, MonitorPlay, Check } from 'lucide-react';

export default function HomePage() {
  const plans = [
    {
      name: "BRONZE",
      price: "9.99€",
      period: "/ MOIS",
      features: [
        "ACCÈS RÉGIE",
        "PHOTOS ILLIMITÉES",
        "SUPPORT 10H-2H 7J/7",
      ],
      color: "text-[#EAB308]",
      highlight: false
    },
    {
      name: "SILVER",
      price: "12.99€",
      period: "/ MOIS",
      features: [
        "TOUT LE BRONZE",
        "DIAPORAMA VIA VIDÉOPROJECTEUR",
        "SUPPORT 10H-2H 7J/7",
      ],
      color: "text-white",
      highlight: false
    },
    {
      name: "VIP GOLD",
      price: "299€",
      period: "/ AN",
      isGold: true,
      features: [
        "TOUT LE SILVER",
        "12 CLÉS USB INCLUSES",
        "ACCÈS PRIORITAIRE",
        "SUPPORT 10H-2H 7J/7",
      ],
      color: "text-[#EAB308]",
      highlight: true
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#4c0d82] to-black text-white flex flex-col items-center p-6 text-center font-sans overflow-hidden relative">
      
      {/* EFFET DE FOND (Blobs) */}
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

        {/* BOUTON PRINCIPAL */}
        <div className="w-full max-w-sm mb-16">
          <Link href="/login" className="block w-full bg-white text-[#4c0d82] py-4 rounded-2xl font-black uppercase tracking-tighter no-underline shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all">
            Accès Organisateur / DJ
          </Link>
        </div>

        {/* SECTION PRÉSENTATION (3 Cartes) */}
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          <div className="bg-white/5 border border-white/10 p-8 rounded-[30px] backdrop-blur-md hover:bg-white/10 hover:border-[#ff0080]/50 transition-all text-center md:text-left flex flex-col items-center md:items-start group">
            <div className="bg-black/40 p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <Camera size={32} className="text-[#ff0080]" />
            </div>
            <h3 className="text-2xl font-black uppercase italic mb-3 tracking-tighter">Photos en direct</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Vos invités partagent leurs photos instantanément. Fini d'attendre le lendemain pour récupérer les souvenirs !
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 rounded-[30px] backdrop-blur-md hover:bg-white/10 hover:border-[#0072ff]/50 transition-all text-center md:text-left flex flex-col items-center md:items-start group">
            <div className="bg-black/40 p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <Music size={32} className="text-[#0072ff]" />
            </div>
            <h3 className="text-2xl font-black uppercase italic mb-3 tracking-tighter">Demandes DJ</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Vos invités envoient leurs envies musicales directement sur votre régie DJ via le QR code.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 rounded-[30px] backdrop-blur-md hover:bg-white/10 hover:border-[#7928ca]/50 transition-all text-center md:text-left flex flex-col items-center md:items-start group">
            <div className="bg-black/40 p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <MonitorPlay size={32} className="text-[#7928ca]" />
            </div>
            <h3 className="text-2xl font-black uppercase italic mb-3 tracking-tighter">Live Diaporama</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Diffusez les photos capturées en temps réel sur grand écran avec des designs premium et cadres personnalisés.
            </p>
          </div>
        </div>

        {/* SECTION FORFAITS (MISE À JOUR SELON IMAGE_2CA73F.PNG) */}
        <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-8 px-4 mb-24">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`relative p-10 rounded-[40px] border border-white/10 bg-gradient-to-b from-white/5 to-transparent flex flex-col text-left transition-all duration-500 ${plan.isGold ? 'ring-1 ring-[#EAB308]/30 shadow-[0_0_50px_rgba(234,179,8,0.05)]' : ''}`}
            >
              {/* Badge Populaire */}
              {plan.isGold && (
                <div className="absolute -top-4 right-10 bg-[#EAB308] text-black text-[10px] font-black px-6 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                  Populaire
                </div>
              )}

              <h3 className={`text-4xl font-black italic tracking-tighter mb-8 ${plan.color}`}>
                {plan.name}
              </h3>

              {/* Sélecteur factice pour le Gold */}
              {plan.isGold && (
                <div className="flex gap-2 mb-8 bg-black/40 p-1.5 rounded-full w-fit border border-white/5">
                  <div className="px-4 py-1 text-[9px] font-bold text-gray-500 uppercase">Mensuel</div>
                  <div className="px-4 py-1 bg-[#EAB308] text-black rounded-full text-[9px] font-black uppercase">Annuel</div>
                </div>
              )}

              <div className="flex items-baseline gap-1 mb-10">
                <span className="text-7xl font-black tracking-tighter text-white">{plan.price.split('€')[0]}</span>
                <span className="text-4xl font-black tracking-tighter text-white">€</span>
                <span className="text-gray-500 text-[10px] font-bold ml-2">{plan.period}</span>
              </div>

              <ul className="space-y-5 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-gray-200">
                    <Check size={16} className="text-[#EAB308] shrink-0" strokeWidth={4} />
                    {feature}
                  </li>
                ))}
              </ul>
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