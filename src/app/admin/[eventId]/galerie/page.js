"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import { ArrowLeft, Download, Image as ImageIcon, Loader2, BookOpen, Play } from 'lucide-react';
import JSZip from 'jszip'; 

export default function GaleriePage() {
  const { eventId } = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [mediaItems, setMediaItems] = useState([]);
  const [eventName, setEventName] = useState("");
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push('/login'); return; }

      try {
        const eventDoc = await getDoc(doc(db, "events", eventId));
        if (eventDoc.exists()) {
          setEventName(eventDoc.data().eventName);
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

  // Fusion et Tri sécurisé par date
  useEffect(() => {
    const combined = [...photos, ...videos].sort((a, b) => {
      const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : Date.now();
      const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : Date.now();
      return dateB - dateA;
    });
    setMediaItems(combined);
    
    if (photos.length > 0 || videos.length > 0 || !loading) {
      setLoading(false);
    }
    
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, [photos, videos]);

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
    <div className="min-h-screen bg-[#140427] flex flex-col items-center justify-center text-white font-sans">
      <Loader2 className="animate-spin text-orange-400 mb-4 drop-shadow-[0_0_15px_rgba(249,115,22,0.6)]" size={40} />
      <p className="text-[10px] uppercase tracking-[0.4em] font-black text-orange-200/70 italic">Chargement des souvenirs...</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#2d104d] via-[#210a3b] to-[#140427] text-white p-6 md:p-12 font-sans overflow-x-hidden relative pb-16">
      
      {/* EFFET DE VAGUES LUMINEUSES ORANGE EN ARRIÈRE-PLAN */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <svg className="absolute -top-12 left-0 w-full h-[500px] text-orange-500/35 blur-xl opacity-90" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,160L60,176C120,192,240,224,360,213.3C480,203,600,149,720,154.7C840,160,960,224,1080,229.3C1200,235,1320,181,1380,154.7L1440,128L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,0,0Z"></path>
        </svg>

        <svg className="absolute top-[30%] -left-20 w-[130%] h-[550px] text-amber-500/30 blur-2xl transform rotate-3" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,96L80,122.7C160,149,320,203,480,208C640,213,800,171,960,149.3C1120,128,1280,128,1360,128L1440,128L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
        </svg>

        <svg className="absolute bottom-0 right-0 w-full h-[500px] text-orange-600/35 blur-xl opacity-90" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,224L60,213.3C120,203,240,181,360,186.7C480,192,600,224,720,218.7C840,213,960,171,1080,160C1200,149,1320,171,1380,181.3L1440,192L1440,320L1380,320C1280,320,1120,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
        </svg>

        <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-r from-orange-500/40 via-amber-400/30 to-pink-500/20 rounded-full blur-[130px]"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* EN-TÊTE */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <Link 
              href="/admin" 
              className="p-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-2xl text-white transition-all border border-white/20 shadow-lg no-underline active:scale-95"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter leading-none bg-gradient-to-r from-white via-orange-100 to-amber-200 bg-clip-text text-transparent">
                Galerie <span className="text-orange-400">/</span> {eventName || "ÉVÉNEMENT"}
              </h1>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-200/80 mt-2">
                {mediaItems.length} Média(s) capturé(s)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <Link 
              href={`/event/${eventId}/guestbook`}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border border-white/20 shadow-md no-underline active:scale-95"
            >
              <BookOpen size={16} className="text-amber-400" /> LIVRE D'OR
            </Link>

            <button 
              onClick={downloadAllMedia} 
              disabled={isDownloadingAll || mediaItems.length === 0}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:scale-105 active:scale-95 text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border border-orange-300/40 cursor-pointer shadow-[0_0_25px_rgba(249,115,22,0.5)] disabled:opacity-40 disabled:hover:scale-100 disabled:shadow-none"
            >
              {isDownloadingAll ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />} 
              {isDownloadingAll ? "CRÉATION DU ZIP..." : "TOUT TÉLÉCHARGER (.ZIP)"}
            </button>
          </div>
        </header>

        {/* CONTENEUR GLASSMORPHISM DE LA GALERIE */}
        <div className="bg-white/[0.08] border border-white/20 rounded-[40px] p-6 md:p-8 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {mediaItems.length === 0 ? (
            <div className="text-center py-20 opacity-60">
              <ImageIcon size={60} className="mx-auto mb-4 text-orange-400 drop-shadow-[0_0_10px_rgba(249,115,22,0.4)]" />
              <p className="text-xl font-black uppercase tracking-widest italic text-gray-200">Aucun souvenir pour l'instant</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {mediaItems.map((item, index) => (
                <div key={item.id} className="relative group rounded-3xl overflow-hidden border border-white/20 aspect-square bg-black/40 shadow-lg transition-transform duration-300 hover:scale-[1.02]">
                  
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
                      className="p-3.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl text-white cursor-pointer border border-orange-300/40 shadow-[0_0_20px_rgba(249,115,22,0.6)] hover:scale-110 active:scale-95 transition-all"
                    >
                      <Download size={18} />
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
        <div className="h-[1px] w-full bg-white/20 mb-6"></div>
        <p className="text-[10px] text-white/50 uppercase font-black tracking-[0.5em]">
          Powered by PartyLens
        </p>
      </footer>
    </main>
  );
}