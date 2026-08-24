"use client";

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { Download, Lock, ArrowRight, X, Loader2, Maximize2, Sun, Moon } from 'lucide-react';

export default function FinalGallery({ params }) {
  const unwrappedParams = use(params);
  const eventId = unwrappedParams.eventId;

  const [darkMode, setDarkMode] = useState(true);
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
      <main className={`min-h-screen flex items-center justify-center font-sans transition-colors duration-300 ${
        darkMode ? 'bg-[#0f071e] text-white' : 'bg-[#f4f4f6] text-slate-900'
      }`}>
        <div className="flex items-center gap-3 text-orange-500 font-black uppercase text-xs tracking-widest animate-pulse">
          <Loader2 className="animate-spin" size={20} />
          Chargement de l&apos;album...
        </div>
      </main>
    );
  }

  // --- ÉCRAN DE VERROUILLAGE ---
  if (!isAuthenticated) {
    return (
      <main className={`relative min-h-screen w-full flex items-center justify-center p-6 overflow-hidden transition-colors duration-300 ${
        darkMode 
          ? 'bg-[#0f071e] text-slate-100 selection:bg-orange-500 selection:text-white' 
          : 'bg-[#f4f4f6] text-slate-900 selection:bg-orange-500 selection:text-white'
      }`}>
        
        {/* BOUTON SWITCH MODE CLAIR / SOMBRE */}
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

        <div className={`w-full max-w-sm p-8 sm:p-10 rounded-[36px] text-center shadow-xl relative z-10 border backdrop-blur-xl animate-in zoom-in-95 duration-200 ${
          darkMode ? 'bg-[#170c2c]/80 border-white/10 shadow-2xl' : 'bg-[#eaeaea]/80 border-slate-300/80 shadow-slate-300/30'
        }`}>
          <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-orange-500">
            <Lock size={28} />
          </div>

          <h2 className={`text-2xl font-extrabold tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Galerie Privée
          </h2>
          <p className={`text-xs font-medium mb-8 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Entrez le mot de passe de la soirée
          </p>
          
          <form onSubmit={checkPassword} className="space-y-4">
            <input 
              type="password" 
              placeholder="Mot de passe..." 
              className={`w-full p-4 rounded-xl border text-center text-xs font-medium outline-none transition-all ${
                error 
                  ? 'border-red-500 text-red-500' 
                  : darkMode 
                    ? 'bg-white/[0.02] border-white/10 text-white placeholder-slate-400 focus:border-orange-500' 
                    : 'bg-[#f4f4f6] border-slate-300 text-slate-900 placeholder-slate-500 focus:border-orange-500'
              }`}
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
            {error && (
              <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider">
                Mot de passe incorrect
              </p>
            )}
            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 rounded-xl font-bold tracking-wide text-xs shadow-lg shadow-orange-500/20 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
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
    <main className={`min-h-screen flex flex-col items-center px-6 py-16 font-sans relative transition-colors duration-300 ${
      darkMode 
        ? 'bg-[#0f071e] text-slate-100 selection:bg-orange-500 selection:text-white' 
        : 'bg-[#f4f4f6] text-slate-900 selection:bg-orange-500 selection:text-white'
    }`}>
      
      {/* BOUTON SWITCH MODE CLAIR / SOMBRE */}
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

      <div className="max-w-6xl w-full relative z-10 flex flex-col items-center">
        
        {/* LOGO & HEADER */}
        <img 
          src="/logo-partylens.png" 
          alt="PartyLens" 
          className="w-[420px] max-w-[90vw] h-auto mb-6 drop-shadow-md" 
        />

        <header className="mb-12 text-center">
          <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Album Souvenir : {eventData?.eventName || "Événement"}
          </h1>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Retrouvez et téléchargez tous les clichés partagés par les invités.
          </p>
        </header>

        {/* Grille de Photos */}
        {photos.length === 0 ? (
          <div className={`w-full max-w-xl text-center py-16 border rounded-3xl shadow-sm ${
            darkMode ? 'bg-white/[0.02] border-white/5 text-slate-400' : 'bg-[#eaeaea] border-slate-300/60 text-slate-600'
          }`}>
            <p className="text-xs font-medium italic">
              Aucune photo dans cet album pour le moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 w-full">
            {photos.map((photo, index) => (
              <div 
                key={photo.id} 
                className={`group relative aspect-square rounded-2xl overflow-hidden border shadow-sm backdrop-blur-md cursor-pointer transition-all ${
                  darkMode ? 'bg-white/[0.02] border-white/10' : 'bg-[#eaeaea] border-slate-300/60'
                }`}
                onClick={() => setSelectedPhoto({ photo, index })}
              >
                <img 
                  src={photo.url} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  alt={`Souvenir ${index + 1}`} 
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadImage(photo.url, index);
                      }} 
                      className="bg-white/10 hover:bg-orange-500 text-white p-3 rounded-xl border border-white/20 transition-all active:scale-95 cursor-pointer"
                      title="Télécharger"
                    >
                      <Download size={18} />
                    </button>
                    <button 
                      className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-xl border border-white/20 transition-all active:scale-95 cursor-pointer"
                      title="Agrandir"
                    >
                      <Maximize2 size={18} />
                    </button>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-300">
                    Souvenir #{index + 1}
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
              className="max-h-[80vh] w-auto object-contain rounded-2xl border border-white/15 shadow-2xl"
            />

            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={() => downloadImage(selectedPhoto.photo.url, selectedPhoto.index)}
                className="py-3 px-6 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold text-xs shadow-lg hover:brightness-105 transition-all cursor-pointer flex items-center gap-2"
              >
                <Download size={16} />
                Télécharger la photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className={`mt-20 pt-8 relative z-10 w-full text-center border-t max-w-6xl ${darkMode ? 'border-white/10 text-slate-500' : 'border-slate-300 text-slate-500'}`}>
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