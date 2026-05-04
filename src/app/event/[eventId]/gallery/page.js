"use client";
import { useState, useEffect, use } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { Download, ImageIcon, Lock, ArrowRight } from 'lucide-react';

export default function FinalGallery({ params }) {
  const unwrappedParams = use(params);
  const eventId = unwrappedParams.eventId;

  const [photos, setPhotos] = useState([]);
  const [eventData, setEventData] = useState(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    // 1. Récupérer les infos de l'event (pour le mot de passe)
    const unsubEvent = onSnapshot(doc(db, "events", eventId), (snap) => {
      if (snap.exists()) setEventData(snap.data());
    });

    // 2. Récupérer les photos
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
      link.download = `PartyLens_Souvenir_${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(url, '_blank');
    }
  };

  // --- ÉCRAN DE VERROUILLAGE ---
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-[#0f1115] p-10 rounded-[40px] border border-white/5 text-center shadow-2xl animate-in zoom-in">
          <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-purple-500">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-black italic uppercase tracking-tight mb-2">Galerie Privée</h2>
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-8">Entrez le mot de passe de la soirée</p>
          
          <form onSubmit={checkPassword} className="space-y-4">
            <input 
              type="password" 
              placeholder="Mot de passe..." 
              className={`w-full p-5 rounded-2xl bg-black border ${error ? 'border-red-500' : 'border-white/10'} text-white text-center outline-none focus:border-purple-500 transition-all`}
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
            {error && <p className="text-red-500 text-[10px] uppercase font-bold tracking-widest">Mot de passe incorrect</p>}
            <button type="submit" className="w-full p-5 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:bg-purple-500 hover:text-white transition-all flex items-center justify-center gap-2">
              Accéder <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </main>
    );
  }

  // --- AFFICHAGE DE LA GALERIE ---
  return (
    <main className="min-h-screen bg-black text-white p-6">
      <header className="max-w-6xl mx-auto mb-10 text-center">
        <h1 className="text-4xl font-black italic bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent uppercase tracking-tighter mb-2">Album Souvenir</h1>
        <p className="text-gray-500 text-xs uppercase tracking-[0.3em] italic font-bold">PartyLens • {eventData?.eventName}</p>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <div key={photo.id} className="group relative aspect-square rounded-[32px] overflow-hidden border border-white/5 bg-[#0f1115]">
            <img src={photo.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Souvenir" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm">
              <button onClick={() => downloadImage(photo.url, index)} className="bg-white text-black p-4 rounded-full shadow-2xl active:scale-90 transition-transform">
                <Download size={24} />
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest text-white mt-3">Enregistrer</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}