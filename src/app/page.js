"use client";
import Link from 'next/link';

export default function HomePage() {
  const handleScanQR = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; 
    input.onchange = (e) => {
      console.log("Scan QR déclenché");
    };
    input.click();
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#4c0d82] to-black text-white flex flex-col items-center p-6 text-center font-sans">
      
      {/* LOGO TRÈS GROS ET COLLÉ EN HAUT */}
      <img 
        src="/logo-partylens.png" 
        alt="PartyLens" 
        className="w-[600px] max-w-[95vw] h-auto mb-2 drop-shadow-2xl" 
      />
      
      <p className="text-gray-300 italic mb-8 max-w-md text-sm">
        L'interactivité ultime pour vos soirées. Musique en direct et partage de photos instantané.
      </p>

      <div className="w-full max-w-sm space-y-4">
        <Link href="/login" className="block w-full bg-white text-[#4c0d82] py-4 rounded-2xl font-black uppercase tracking-tighter no-underline shadow-xl active:scale-95 transition">
          Je suis Organisateur / DJ
        </Link>

        <div className="flex items-center gap-4">
          <div className="h-[1px] bg-white/20 flex-1"></div>
          <span className="text-[10px] font-bold uppercase text-white/40">OU</span>
          <div className="h-[1px] bg-white/20 flex-1"></div>
        </div>

        <button 
          onClick={handleScanQR}
          className="w-full bg-transparent border-2 border-white text-white py-4 rounded-2xl font-black uppercase tracking-widest cursor-pointer active:scale-95 transition hover:bg-white hover:text-black"
        >
          Scanner un QR Code
        </button>
      </div>

      <footer className="mt-auto pt-10">
        <p className="text-[10px] text-white/30 uppercase font-black tracking-[0.5em]">Powered by PartyLens</p>
      </footer>
    </main>
  );
}