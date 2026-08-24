"use client";

import { useState, useEffect, use } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { Download, Lock, ArrowRight, X, Loader2, Maximize2 } from 'lucide-react';

export default function FinalGallery({ params }) {
  const unwrappedParams = use(params);
  const eventId = unwrappedParams.eventId;

  const [photos, setPhotos] = useState([]);
  const [eventData, setEventData] = useState(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    if (!eventId) return;

    // Vérification de la session
    const sessionAuth = sessionStorage.getItem(`auth_event_${eventId}`);
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
    }

    // 1. Informations événement
    const unsubEvent = onSnapshot(doc(db, "events", eventId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setEventData(data);

        if (!data.eventPassword || data.eventPassword.trim() === "") {
          setIsAuthenticated(true);
        }
      }
      setCheckingAuth(false);
    });

    // 2. Flux photos en temps réel
    const q = query(collection(db, "events", eventId, "photos"), orderBy("createdAt", "desc"));
    const unsubPhotos = onSnapshot(q, (snap) => {
      setPhotos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubEvent(); unsubPhotos(); };
  }, [eventId]);

  const checkPassword = (e) => {
    e.preventDefault();
    if (passwordInput === eventData?.eventPassword) {
      setIsAuthenticated(true);
      setError(false);
      sessionStorage.setItem(`auth_event_${eventId}`, 'true');
    } else {
      setError(true);
    }
  };

  const downloadImage = async (url, index) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `PartyLens_${eventData?.eventName || 'Souvenir'}_${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(url, '_blank');
    }
  };

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#2d104d] via-[#210a3b] to-[#140427] text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-orange-400 font-black uppercase text-xs tracking-widest animate-pulse">
          <Loader2 className="animate-spin" size={20} />
          Chargement de l&apos;album...
        </div>
      </main>
    );
  }

  // --- ÉCRAN DE VERROUILLAGE ---
  if (!isAuthenticated) {
    return (
      <main className="relative min-h-screen w-full bg-gradient-to-b from-[#2d104d] via-[#210a3b] to-[#140427] text-white flex items-center justify-center p-6 overflow-hidden">
        {/* Halos lumineux */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-500/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-sm bg-white/[0.04] backdrop-blur-2xl p-8 sm:p-10 rounded-[40px] border border-white/10 text-center shadow-[0_25px_60px_rgba(0,0,0,0.6)] relative z-10 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-orange-500/10 border border-orange-400/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-orange-400">
            <Lock size={28} />
          </div>

          <h2 className="text-2xl font-black italic uppercase tracking-tight mb-2 bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
            Galerie Privée
          </h2>
          <p className="text-orange-200/60 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
            Entrez le mot de passe de la soirée
          </p>
          
          <form onSubmit={checkPassword} className="space-y-4">
            <input 
              type="password" 
              placeholder="Mot de passe..." 
              className={`w-full p-4 rounded-2xl bg-black/40 border ${error ? 'border-red-500' : 'border-white/15'} text-white text-center font-bold outline-none focus:border-orange-500 transition-all placeholder:text-white/30`}
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
            {error && (
              <p className="text-red-400 text-[10px] font-black uppercase tracking-widest">
                Mot de passe incorrect
              </p>
            )}
            <button 
              type="submit" 
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 text-white font-black uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(249,115,22,0.4)] border border-orange-400/30 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              Accéder <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </main>
    );
  }

  // --- AFFICHAGE GALERIE ---
  return (
    <main className="relative min-h-screen w-full bg-gradient-to-b from-[#2d104d] via-[#210a3b] to-[#140427] text-white p-6 md:p-12 font-sans overflow-x-hidden">
      {/* Halos d'ambiance */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/15 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-orange-500/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-black italic bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent uppercase tracking-tight mb-2">
            ALBUM SOUVENIR
          </h1>
          <p className="text-orange-200/60 text-[11px] font-black uppercase tracking-[0.3em] italic">
            PartyLens • {eventData?.eventName || "Événement"}
          </p>
        </header>

        {/* Grille de Photos */}
        {photos.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.02] border border-white/10 rounded-[30px]">
            <p className="text-orange-200/50 text-xs font-black uppercase tracking-widest">
              Aucune photo dans cet album pour le moment
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
            {photos.map((photo, index) => (
              <div 
                key={photo.id} 
                className="group relative aspect-square rounded-[28px] overflow-hidden border border-white/10 bg-white/5 shadow-lg backdrop-blur-md cursor-pointer"
                onClick={() => setSelectedPhoto({ photo, index })}
              >
                <img 
                  src={photo.url} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  alt={`Souvenir ${index + 1}`} 
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-xs p-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadImage(photo.url, index);
                      }} 
                      className="bg-white/10 hover:bg-orange-500 text-white p-3 rounded-xl border border-white/20 transition-all active:scale-95"
                      title="Télécharger"
                    >
                      <Download size={18} />
                    </button>
                    <button 
                      className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-xl border border-white/20 transition-all active:scale-95"
                      title="Agrandir"
                    >
                      <Maximize2 size={18} />
                    </button>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-orange-200/80">
                    SOUVENIR #{index + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODALE DE PRÉVISUALISATION PLEIN ÉCRAN */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-12 right-0 text-white/70 hover:text-white bg-white/10 p-2 rounded-full border border-white/15 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <img 
              src={selectedPhoto.photo.url} 
              alt="Agrandissement" 
              className="max-h-[80vh] w-auto object-contain rounded-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
            />

            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={() => downloadImage(selectedPhoto.photo.url, selectedPhoto.index)}
                className="py-3 px-6 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg border border-orange-400/30 transition-all cursor-pointer flex items-center gap-2"
              >
                <Download size={16} />
                TÉLÉCHARGER LA PHOTO
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}