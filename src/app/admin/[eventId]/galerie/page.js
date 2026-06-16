"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import { ArrowLeft, Download, Image as ImageIcon, Loader2, BookOpen, Play } from 'lucide-react'; // Ajout de Play
import JSZip from 'jszip'; 

export default function GaleriePage() {
  const { eventId } = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [mediaItems, setMediaItems] = useState([]); // Tableau fusionné
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
    
    // On arrête le chargement une fois la première fusion faite
    if (photos.length > 0 || videos.length > 0 || !loading) {
      setLoading(false);
    }
    
    // Sécurité de secours si la base est vraiment vide
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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
      <Loader2 className="animate-spin text-[#ff0080] mb-4" size={40} />
      <p className="text-[10px] uppercase tracking-[0.4em] font-black opacity-50 italic">Chargement des souvenirs...</p>
    </div>
  );

  return (
    <main className="min-h-screen relative overflow-hidden p-6 md:p-12 font-sans bg-black text-white">
      <div className="bg-blobs">
        <div className="blob blob-pink"></div>
        <div className="blob blob-purple"></div>
        <div className="blob blob-blue"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <Link href="/admin" className="p-4 glass-card rounded-2xl text-gray-400 hover:text-white transition-all border border-white/5 no-underline">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter leading-none">
                Galerie <span className="text-[#ff0080]">/</span> {eventName}
              </h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-2">
                {mediaItems.length} Média(s) capturé(s)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link 
              href={`/event/${eventId}/guestbook`}
              className="flex items-center gap-3 bg-[#ff0080] hover:bg-[#ff0080]/80 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all border-none cursor-pointer shadow-lg shadow-[#ff0080]/20 no-underline"
            >
              <BookOpen size={16} /> LIVRE D'OR
            </Link>

            <button 
              onClick={downloadAllMedia} 
              disabled={isDownloadingAll || mediaItems.length === 0}
              className="flex items-center gap-3 bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all border-none cursor-pointer shadow-lg shadow-green-500/20 disabled:opacity-50"
            >
              {isDownloadingAll ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />} 
              {isDownloadingAll ? "CRÉATION DU ZIP..." : "TOUT TÉLÉCHARGER (.ZIP)"}
            </button>
          </div>
        </header>

        <div className="glass-card p-10 rounded-[40px] border border-white/5">
          {mediaItems.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <ImageIcon size={60} className="mx-auto mb-6 text-gray-600" />
              <p className="text-xl font-black uppercase tracking-widest italic">Aucun souvenir pour l'instant</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {mediaItems.map((item, index) => (
                <div key={item.id} className="relative group rounded-2xl overflow-hidden border border-white/10 aspect-square bg-black">
                  
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
                      <div className="absolute bottom-3 right-3 bg-black/60 p-1.5 rounded-full backdrop-blur-sm">
                        <Play size={12} className="text-white fill-white" />
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={item.url} 
                      alt="Souvenir" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  )}

                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <button 
                      onClick={() => downloadSingleMedia(item.url, index, item.isVideo)}
                      className="p-4 bg-[#ff0080] rounded-full text-white cursor-pointer border-none shadow-xl hover:bg-white hover:text-black transition-colors"
                    >
                      <Download size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .bg-blobs { position: fixed; inset: 0; z-index: 0; overflow: hidden; background: black; }
        .blob { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.2; }
        .blob-pink { top: -10%; left: -10%; width: 50vw; height: 50vw; background: #ff0080; }
        .blob-purple { bottom: -10%; right: -10%; width: 60vw; height: 60vw; background: #7928ca; }
        .blob-blue { top: 20%; right: 10%; width: 30vw; height: 30vw; background: #0072ff; }
        .glass-card { background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(20px); }
      `}</style>
    </main>
  );
}