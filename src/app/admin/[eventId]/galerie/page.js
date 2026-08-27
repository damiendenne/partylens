"use client";
import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import { ArrowLeft, Download, Image as ImageIcon, Loader2, BookOpen, Play, Sun, Moon } from 'lucide-react';
import JSZip from 'jszip'; 

export default function GaleriePage() {
  const { eventId } = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [eventName, setEventName] = useState("");
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('partylens_dark_mode');
    return saved === null ? true : JSON.parse(saved);
  });

  // Gestion du mode jour/nuit avec localStorage
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('partylens_dark_mode', JSON.stringify(newMode));
  };

  useEffect(() => {
    if (!eventId) return;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push('/login'); return; }

      try {
        const eventDoc = await getDoc(doc(db, "events", eventId));
        if (eventDoc.exists()) {
          const event = eventDoc.data();
          const allowed = event.userId === user.uid || (Array.isArray(event.collaborators) && event.collaborators.includes(user.uid));
          if (!allowed) { router.push('/admin'); return; }
          setEventName(event.eventName);
        } else {
          router.push('/admin');
          return;
        }

        // Écoute des Photos
        const qPhotos = query(collection(db, "events", eventId, "photos"));
        const unsubPhotos = onSnapshot(qPhotos, (snap) => {
          setPhotos(snap.docs.map(d => ({ id: d.id, isVideo: false, ...d.data() })));
        });

        // Écoute des Vidéos
        const qVideos = query(collection(db, "events", eventId, "videos"));
        const unsubVideos = onSnapshot(qVideos, (snap) => {
          setVideos(snap.docs.map(d => ({ id: d.id, isVideo: true, ...d.data() })));
        });

        return () => {
          unsubPhotos();
          unsubVideos();
        };
      } catch (e) {
        console.error("Erreur de chargement", e);
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, [eventId, router]);

  const mediaItems = useMemo(() => [...photos, ...videos].sort((a, b) => {
      const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
      const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
      return dateB - dateA;
    }), [photos, videos]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const downloadSingleMedia = async (url, index, isVideo) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const extension = isVideo ? 'mp4' : 'jpg';
      a.download = `partylens_${eventName || 'souvenir'}_${index + 1}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error("Erreur lors du téléchargement", e);
    }
  };

  const downloadAllMedia = async () => {
    if (mediaItems.length === 0) return;
    setIsDownloadingAll(true);
    
    try {
      const zip = new JSZip();
      const folderName = `Souvenirs_${eventName || 'PartyLens'}`.replace(/\s+/g, '_');
      const imgFolder = zip.folder(folderName);

      const fetchPromises = mediaItems.map(async (item, index) => {
        try {
          const response = await fetch(item.url);
          const blob = await response.blob();
          const extension = item.isVideo ? 'mp4' : 'jpg';
          imgFolder.file(`souvenir_${index + 1}.${extension}`, blob);
        } catch (err) {
          console.error("Erreur lors de la récupération d'un média", err);
        }
      });

      await Promise.all(fetchPromises);
      const zipContent = await zip.generateAsync({ type: 'blob' });

      const zipUrl = window.URL.createObjectURL(zipContent);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `${folderName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(zipUrl);

    } catch (e) {
      console.error("Erreur lors de la création du ZIP", e);
      alert("Une erreur est survenue lors de la création du fichier ZIP.");
    } finally {
      setIsDownloadingAll(false);
    }
  };

  if (loading) return (
    <div className={`min-h-screen flex flex-col items-center justify-center transition-colors duration-300 ${darkMode ? 'bg-[#0f071e] text-slate-100' : 'bg-[#f4f4f6] text-slate-900'}`}>
      <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
      <p className="text-xs uppercase tracking-widest font-bold opacity-70">Chargement des souvenirs...</p>
    </div>
  );

  return (
    <main className={`min-h-screen flex flex-col px-6 md:px-12 py-12 font-sans relative overflow-x-hidden pb-16 transition-colors duration-300 ${
      darkMode 
        ? 'bg-[#0f071e] text-slate-100 selection:bg-orange-500 selection:text-white' 
        : 'bg-[#f4f4f6] text-slate-900 selection:bg-orange-500 selection:text-white'
    }`}>
      
      {/* BOUTON SWITCH MODE CLAIR / SOMBRE (FIXÉ EN HAUT À DROITE) */}
      <button 
        onClick={toggleDarkMode}
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

      <div className="max-w-6xl mx-auto w-full relative z-10">
        
        {/* EN-TÊTE */}
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin" 
              className={`p-3 rounded-xl transition-all border ${
                darkMode ? 'bg-white/[0.04] text-slate-200 border-white/10 hover:bg-white/[0.08]' : 'bg-[#dedede] text-slate-700 border-slate-300 hover:bg-[#dedede]'
              }`}
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                GALERIE <span className="text-orange-500">/</span> {eventName || "ÉVÉNEMENT"}
              </h1>
              <p className={`text-[11px] font-bold uppercase tracking-wider mt-1 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                {mediaItems.length} Média(s) capturé(s)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
            <Link 
              href={`/event/${eventId}/guestbook`}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                darkMode ? 'bg-white/[0.04] text-amber-400 border-white/10 hover:bg-white/[0.08]' : 'bg-[#dedede] text-amber-700 border-slate-300 hover:bg-[#dedede]'
              }`}
            >
              <BookOpen size={16} /> LIVRE D'OR
            </Link>

            <button 
              onClick={downloadAllMedia} 
              disabled={isDownloadingAll || mediaItems.length === 0}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-105 active:scale-95 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isDownloadingAll ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />} 
              {isDownloadingAll ? "CRÉATION DU ZIP..." : "TOUT TÉLÉCHARGER (.ZIP)"}
            </button>
          </div>
        </header>

        {/* CONTENEUR GLASSMORPHISM DE LA GALERIE */}
        <div className={`rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-xl ${
          darkMode ? 'bg-[#170c2c]/80 border border-white/10' : 'bg-[#eaeaea]/80 border border-slate-300/80'
        }`}>
          {mediaItems.length === 0 ? (
            <div className={`text-center py-20 rounded-2xl border ${darkMode ? 'bg-white/[0.02] border-white/5 text-slate-400' : 'bg-[#f4f4f6] border-slate-300/60 text-slate-600'}`}>
              <ImageIcon size={48} className="mx-auto mb-3 text-orange-500 opacity-80" />
              <p className="text-sm font-bold tracking-wider">Aucun souvenir pour l'instant</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {mediaItems.map((item, index) => (
                <div key={item.id} className={`relative group rounded-2xl overflow-hidden border aspect-square shadow-sm transition-transform duration-300 hover:scale-[1.02] ${
                  darkMode ? 'bg-black/40 border-white/10' : 'bg-white border-slate-300/80'
                }`}>
                  
                  {item.isVideo ? (
                    <div className="w-full h-full relative">
                      <video 
                        src={item.url} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        muted
                        playsInline
                        autoPlay
                        loop
                      />
                      <div className="absolute bottom-3 right-3 bg-black/60 p-2 rounded-full backdrop-blur-md border border-white/20 shadow-md">
                        <Play size={12} className="text-amber-300 fill-amber-300" />
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={item.url} 
                      alt="Souvenir" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  )}

                  {/* OVERLAY TÉLÉCHARGEMENT */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <button 
                      onClick={() => downloadSingleMedia(item.url, index, item.isVideo)}
                      className="p-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-white cursor-pointer shadow-lg hover:scale-110 active:scale-95 transition-all"
                      title="Télécharger ce souvenir"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* FOOTER */}
      <footer className="mt-12 relative z-10 w-full text-center max-w-6xl mx-auto">
        <div className={`h-[1px] w-full mb-6 ${darkMode ? 'bg-white/10' : 'bg-slate-300'}`}></div>
        <p className={`text-[10px] uppercase font-bold tracking-[0.4em] ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
          Powered by PartyLens
        </p>
      </footer>
    </main>
  );
}
