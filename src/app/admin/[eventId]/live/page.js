"use client";
import { useState, useEffect, use, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { Maximize, Minimize } from 'lucide-react';

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

  // Gestion des contrôles (bouton plein écran) uniquement
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

  if (photos.length === 0) return (
    <div className="min-h-screen flex items-center justify-center text-white bg-black">
      <p className="font-black italic uppercase animate-pulse">En attente de photos...</p>
    </div>
  );

  const prevIndex = currentIndex === 0 ? photos.length - 1 : currentIndex - 1;

  return (
    <main ref={mainRef} className="h-screen w-screen bg-black overflow-hidden relative select-none">
      
      {/* 1. L'HABILLAGE (Design du catalogue) */}
      <div className="absolute inset-0 z-0">
        {eventData?.frameUrl && (
          <img 
            src={eventData.frameUrl} 
            className="w-full h-full object-cover animate-vibe" 
            alt="Habillage Design" 
          />
        )}
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      {/* LOGO PARTYLENS EN HAUT À GAUCHE */}
      <div className="fixed top-8 left-8 z-40">
        <img 
          src="/logo-partylens.png" 
          alt="PartyLens" 
          className="w-48 md:w-64 h-auto drop-shadow-[0_0_15px_rgba(0,0,0,0.6)]" 
        />
      </div>

      {/* Bouton Plein Écran (disparaît si pas de mouvement) */}
      <button 
        onClick={toggleFullscreen}
        className={`fixed top-8 right-8 z-50 p-4 glass-card rounded-2xl text-white/50 border-none cursor-pointer transition-opacity duration-500 hover:text-white ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
      </button>

      {/* 2. LE DIAPORAMA PHOTO */}
      <div className="relative z-10 h-full w-full flex items-center justify-center">
        <div className="relative w-full h-full max-w-[85vw] max-h-[80vh] flex items-center justify-center overflow-hidden rounded-lg shadow-2xl">
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

      {/* 3. QR CODE FIXE (Z-index élevé, pas de condition showControls) */}
      <div className="fixed bottom-10 right-10 z-40 glass-card p-4 rounded-[30px] flex flex-col items-center gap-3 shadow-2xl border border-white/10 bg-black/20 backdrop-blur-md">
        <div className="bg-white p-2 rounded-xl shadow-lg">
          {baseUrl && <QRCodeSVG value={`${baseUrl}/event/${eventId}`} size={90} />}
        </div>
        <p className="text-[10px] font-black uppercase text-white italic tracking-wider">Scannez & Participez</p>
      </div>

      <style jsx global>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
        }
        @keyframes fade-in-zoom { 0% { opacity: 0; transform: scale(1.1); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes fade-out { 0% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes vibe { 0% { transform: scale(1); } 100% { transform: scale(1.05); } }
        .animate-fade-in-zoom { animation: fade-in-zoom 1.5s ease-out forwards; }
        .animate-fade-out { animation: fade-out 1.5s ease-in forwards; }
        .animate-vibe { animation: vibe 15s infinite alternate ease-in-out; }
      `}</style>
    </main>
  );
}