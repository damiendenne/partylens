"use client";
import Link from 'next/link';
import { Camera, Music, MonitorPlay } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#4c0d82] to-black text-white flex flex-col items-center p-6 text-center font-sans overflow-hidden relative">
      
      {/* EFFET DE FOND (Blobs) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#ff0080] rounded-full blur-[120px] opacity-20"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-[#0072ff] rounded-full blur-[120px] opacity-20"></div>
      </div>

      <div className="relative z-10 w-full flex flex-col items-center">
        {/* LOGO TRÈS GROS ET COLLÉ EN HAUT */}
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
            Je suis Organisateur / DJ
          </Link>
        </div>

        {/* SECTION PRÉSENTATION (3 Cartes) */}
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          
          <div className="bg-white/5 border border-white/10 p-8 rounded-[30px] backdrop-blur-md hover:bg-white/10 hover:border-[#ff0080]/50 transition-all text-center md:text-left flex flex-col items-center md:items-start group">
            <div className="bg-black/40 p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <Camera size={32} className="text-[#ff0080]" />
            </div>
            <h3 className="text-2xl font-black uppercase italic mb-3 tracking-tighter">Photos en direct</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Vos invités scannent un QR code et partagent leurs photos instantanément. Fini d'attendre le lendemain pour récupérer les souvenirs !
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 rounded-[30px] backdrop-blur-md hover:bg-white/10 hover:border-[#0072ff]/50 transition-all text-center md:text-left flex flex-col items-center md:items-start group">
            <div className="bg-black/40 p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <Music size={32} className="text-[#0072ff]" />
            </div>
            <h3 className="text-2xl font-black uppercase italic mb-3 tracking-tighter">Demandes DJ</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Vos invités envoient leurs envies musicales directement sur votre régie DJ. Une interaction parfaite sans être dérangé.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 rounded-[30px] backdrop-blur-md hover:bg-white/10 hover:border-[#7928ca]/50 transition-all text-center md:text-left flex flex-col items-center md:items-start group">
            <div className="bg-black/40 p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <MonitorPlay size={32} className="text-[#7928ca]" />
            </div>
            <h3 className="text-2xl font-black uppercase italic mb-3 tracking-tighter">Live Diaporama</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Diffusez les photos capturées en temps réel sur grand écran avec des cadres et des designs premium.
            </p>
          </div>

        </div>
      </div>

      {/* FOOTER MIS À JOUR AVEC LE LIEN AVIS */}
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