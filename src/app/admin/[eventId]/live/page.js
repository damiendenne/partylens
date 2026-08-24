"use client";

import { useState, useEffect, use, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { Maximize, Minimize, Camera } from 'lucide-react';

export default function LiveWall({ params }) {
  const unwrappedParams = use(params);
  const eventId = unwrappedParams.eventId;
  const mainRef = useRef(null);

  const [photos, setPhotos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [baseUrl, setBaseUrl] = useState("");
  const [eventData, setEventData] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") setBaseUrl(window.location.origin);

    const unsubEvent = onSnapshot(doc(db, "events", eventId), (snap) => {
      if (snap.exists()) setEventData(snap.data());
    });

    const q = query(collection(db, "events", eventId, "photos"), orderBy("createdAt", "desc"));
    const unsubPhotos = onSnapshot(q, (snap) => {
      const newPhotos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPhotos(newPhotos);
      if (newPhotos.length > 0) setCurrentIndex(0);
    });

    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);

    return () => {
      unsubEvent();
      unsubPhotos();
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, [eventId]);

  useEffect(() => {
    if (photos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [photos]);

  // Gestion des contrôles (bouton plein écran)
  useEffect(() => {
    const timer = setTimeout(() => setShowControls(false), 3000);
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timer);
      setTimeout(() => setShowControls(false), 3000);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timer);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) mainRef.current.requestFullscreen();
    else document.exitFullscreen();
  };

  // ÉCRAN D'ATTENTE DE PHOTOS
  if (photos.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#2d104d] via-[#210a3b] to-[#140427] text-white relative overflow-hidden font-sans">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/20 rounded-full blur-[140px]"></div>
      </div>
      <div className="relative z-10 flex flex-col items-center gap-6">
        <img src="/logo-partylens.png" alt="PartyLens" className="w-56 drop-shadow-[0_0_25px_rgba(249,115,22,0.4)]" />
        <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center animate-bounce">
          <Camera size={32} className="text-orange-400" />
        </div>
        <p className="font-black italic uppercase tracking-widest text-lg text-orange-200/90 animate-pulse">
          En attente des premières photos...
        </p>
      </div>
    </div>
  );

  const prevIndex = currentIndex === 0 ? photos.length - 1 : currentIndex - 1;

  return (
    <main ref={mainRef} className="h-screen w-screen bg-gradient-to-b from-[#2d104d] via-[#210a3b] to-[#140427] overflow-hidden relative select-none font-sans">
      
      {/* HABILLAGE DU SOIR & VAGUES ORANGÉES */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {eventData?.frameUrl ? (
          <img
            src={eventData.frameUrl}
            className="w-full h-full object-cover animate-vibe opacity-40"
            alt="Habillage Design"
          />
        ) : (
          <>
            <svg className="absolute -top-12 left-0 w-full h-[500px] text-orange-500/25 blur-xl opacity-80" viewBox="0 0 1440 320" preserveAspectRatio="none">
              <path fill="currentColor" d="M0,160L60,176C120,192,240,224,360,213.3C480,203,600,149,720,154.7C840,160,960,224,1080,229.3C1200,235,1320,181,1380,154.7L1440,128L1440,0L0,0Z"></path>
            </svg>
            <svg className="absolute bottom-0 right-0 w-full h-[500px] text-orange-600/25 blur-xl opacity-80" viewBox="0 0 1440 320" preserveAspectRatio="none">
              <path fill="currentColor" d="M0,224L60,213.3C120,203,240,181,360,186.7C480,192,600,224,720,218.7C840,213,960,171,1080,160C1200,149,1320,171,1380,181.3L1440,192L1440,320L0,320Z"></path>
            </svg>
            <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-r from-orange-500/20 via-amber-400/15 to-orange-600/15 rounded-full blur-[160px]"></div>
          </>
        )}
      </div>

      {/* LOGO PARTYLENS EN HAUT À GAUCHE */}
      <div className="fixed top-8 left-8 z-40">
        <img
          src="/logo-partylens.png"
          alt="PartyLens"
          className="w-48 md:w-64 h-auto drop-shadow-[0_10px_25px_rgba(0,0,0,0.6)]"
        />
      </div>

      {/* BOUTON PLEIN ÉCRAN */}
      <button
        onClick={toggleFullscreen}
        className={`fixed top-8 right-8 z-50 p-4 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-xl rounded-2xl text-white/80 hover:text-white cursor-pointer transition-all duration-500 shadow-lg active:scale-95 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
      </button>

      {/* DIAPORAMA PHOTO */}
      <div className="relative z-10 h-full w-full flex items-center justify-center p-8">
        <div className="relative w-full h-full max-w-[85vw] max-h-[80vh] flex items-center justify-center overflow-hidden rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.7)] border border-white/10 bg-black/30 backdrop-blur-md">
          {photos.length > 1 && (
            <img
              key={`prev-${photos[prevIndex]?.id}`}
              src={photos[prevIndex]?.url}
              className="absolute w-full h-full object-contain animate-fade-out"
              alt=""
            />
          )}
          <img
            key={`curr-${photos[currentIndex]?.id}`}
            src={photos[currentIndex]?.url}
            className="absolute w-full h-full object-contain animate-fade-in-zoom"
            alt="Live"
          />
        </div>
      </div>

      {/* QR CODE FIXE */}
      <div className="fixed bottom-8 right-8 z-40 bg-white/10 backdrop-blur-2xl p-4.5 rounded-[32px] flex flex-col items-center gap-3 shadow-[0_15px_35px_rgba(0,0,0,0.5)] border border-white/20">
        <div className="bg-white p-2.5 rounded-2xl shadow-md">
          {baseUrl && <QRCodeSVG value={`${baseUrl}/event/${eventId}`} size={95} />}
        </div>
        <p className="text-[10px] font-black uppercase text-orange-200 italic tracking-wider">
          Scannez & Participez
        </p>
      </div>

      <style jsx global>{`
        @keyframes fade-in-zoom { 
          0% { opacity: 0; transform: scale(1.08); } 
          100% { opacity: 1; transform: scale(1); } 
        }
        @keyframes fade-out { 
          0% { opacity: 1; } 
          100% { opacity: 0; } 
        }
        @keyframes vibe { 
          0% { transform: scale(1); } 
          100% { transform: scale(1.05); } 
        }
        .animate-fade-in-zoom { animation: fade-in-zoom 1.5s ease-out forwards; }
        .animate-fade-out { animation: fade-out 1.5s ease-in forwards; }
        .animate-vibe { animation: vibe 15s infinite alternate ease-in-out; }
      `}</style>
    </main>
  );
}