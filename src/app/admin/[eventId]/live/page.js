"use client";

import { useState, useEffect, use, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { Maximize, Minimize, Camera, Sun, Moon } from 'lucide-react';

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
  const [darkMode, setDarkMode] = useState(true);

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

  // Gestion des contrôles (boutons plein écran et mode)
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
    <div className={`min-h-screen flex flex-col items-center justify-center relative overflow-hidden font-sans transition-colors duration-300 ${
      darkMode ? 'bg-[#0f071e] text-slate-100' : 'bg-[#f4f4f6] text-slate-900'
    }`}>
      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {darkMode ? (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-b from-purple-600/15 via-orange-600/10 to-transparent rounded-full blur-[140px]"></div>
        ) : (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-b from-purple-200/30 via-orange-100/20 to-transparent rounded-full blur-[120px]"></div>
        )}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        <img src="/logo-partylens.png" alt="PartyLens" className="w-56 drop-shadow-md" />
        <div className={`w-16 h-16 rounded-2xl backdrop-blur-md flex items-center justify-center animate-bounce border ${
          darkMode ? 'bg-white/10 border-white/20 text-orange-400' : 'bg-[#eaeaea] border-slate-300 text-orange-600'
        }`}>
          <Camera size={32} />
        </div>
        <p className={`font-bold uppercase tracking-widest text-sm ${darkMode ? 'text-orange-400' : 'text-orange-600'} animate-pulse`}>
          En attente des premières photos...
        </p>
      </div>
    </div>
  );

  const prevIndex = currentIndex === 0 ? photos.length - 1 : currentIndex - 1;

  return (
    <main ref={mainRef} className={`h-screen w-screen overflow-hidden relative select-none font-sans transition-colors duration-300 ${
      darkMode ? 'bg-[#0f071e] text-slate-100' : 'bg-[#f4f4f6] text-slate-900'
    }`}>
      
      {/* BACKGROUND EFFECTS / HABILLAGE */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {eventData?.frameUrl ? (
          <img
            src={eventData.frameUrl}
            className="w-full h-full object-cover animate-vibe opacity-40"
            alt="Habillage Design"
          />
        ) : (
          darkMode ? (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-purple-600/15 via-orange-600/10 to-transparent rounded-full blur-[140px]"></div>
          ) : (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-purple-200/30 via-orange-100/20 to-transparent rounded-full blur-[120px]"></div>
          )
        )}
      </div>

      {/* BOUTONS DE CONTRÔLE (MODE ET PLEIN ÉCRAN) EN HAUT À DROITE */}
      <div className={`fixed top-8 right-8 z-50 flex items-center gap-3 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button 
          onClick={toggleDarkMode}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all shadow-lg border backdrop-blur-xl ${
            darkMode 
              ? 'bg-white/10 text-amber-300 border-white/20 hover:bg-white/20' 
              : 'bg-[#eaeaea] text-slate-700 border-slate-300 hover:bg-[#dedede]'
          }`}
          aria-label="Changer le mode d'affichage"
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button
          onClick={toggleFullscreen}
          className={`p-3.5 backdrop-blur-xl rounded-2xl cursor-pointer transition-all duration-300 shadow-lg border active:scale-95 ${
            darkMode 
              ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white' 
              : 'bg-[#eaeaea] hover:bg-[#dedede] border-slate-300 text-slate-700'
          }`}
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
      </div>

      {/* LOGO PARTYLENS EN HAUT À GAUCHE */}
      <div className="fixed top-8 left-8 z-40">
        <img
          src="/logo-partylens.png"
          alt="PartyLens"
          className="w-48 md:w-64 h-auto drop-shadow-md"
        />
      </div>

      {/* DIAPORAMA PHOTO */}
      <div className="relative z-10 h-full w-full flex items-center justify-center p-8">
        <div className={`relative w-full h-full max-w-[85vw] max-h-[80vh] flex items-center justify-center overflow-hidden rounded-3xl shadow-2xl backdrop-blur-md border ${
          darkMode ? 'bg-black/30 border-white/10' : 'bg-white/60 border-slate-300/80'
        }`}>
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
      <div className={`fixed bottom-8 right-8 z-40 backdrop-blur-2xl p-4.5 rounded-[32px] flex flex-col items-center gap-3 shadow-xl border ${
        darkMode ? 'bg-[#170c2c]/80 border-white/20' : 'bg-[#eaeaea]/90 border-slate-300/80'
      }`}>
        <div className="bg-white p-2.5 rounded-2xl shadow-md">
          {baseUrl && <QRCodeSVG value={`${baseUrl}/event/${eventId}`} size={95} />}
        </div>
        <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
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