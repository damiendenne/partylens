"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import { ArrowLeft, Download, Image as ImageIcon, Loader2 } from 'lucide-react';
import JSZip from 'jszip'; // <-- IMPORT DE LA NOUVELLE LIBRAIRIE

export default function GaleriePage() {
  const { eventId } = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [eventName, setEventName] = useState("");
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push('/login'); return; }

      try {
        // Récupérer le nom de l'événement
        const eventDoc = await getDoc(doc(db, "events", eventId));
        if (eventDoc.exists()) {
          setEventName(eventDoc.data().eventName);
        }

        // Récupérer les photos
        const qPhotos = query(collection(db, "events", eventId, "photos"), orderBy("createdAt", "desc"));
        const unsubPhotos = onSnapshot(qPhotos, (snap) => {
          setPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          setLoading(false);
        });

        return () => unsubPhotos();
      } catch (e) {
        console.error("Erreur de chargement", e);
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, [eventId, router]);

  // Fonction pour télécharger une photo à l'unité
  const downloadSinglePhoto = async (url, index) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `partylens_${eventName || 'photo'}_${index + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error("Erreur lors du téléchargement", e);
    }
  };

  // NOUVELLE FONCTION : TÉLÉCHARGEMENT EN .ZIP
  const downloadAllPhotos = async () => {
    if (photos.length === 0) return;
    setIsDownloadingAll(true);
    
    try {
      const zip = new JSZip();
      
      // On crée un nom de dossier propre (on remplace les espaces par des tirets du bas)
      const folderName = `Souvenirs_${eventName || 'PartyLens'}`.replace(/\s+/g, '_');
      const imgFolder = zip.folder(folderName);

      // On récupère toutes les images en parallèle
      const fetchPromises = photos.map(async (photo, index) => {
        try {
          const response = await fetch(photo.url);
          const blob = await response.blob();
          // On ajoute l'image dans le dossier ZIP
          imgFolder.file(`photo_${index + 1}.jpg`, blob);
        } catch (err) {
          console.error("Erreur lors de la récupération d'une photo", err);
        }
      });

      // On attend que toutes les images soient téléchargées dans la mémoire
      await Promise.all(fetchPromises);

      // On génère le fichier ZIP
      const zipContent = await zip.generateAsync({ type: 'blob' });

      // On déclenche le téléchargement du fichier ZIP sur le PC de l'utilisateur
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
                {photos.length} Photo(s) capturée(s)
              </p>
            </div>
          </div>

          <button 
            onClick={downloadAllPhotos} 
            disabled={isDownloadingAll || photos.length === 0}
            className="flex items-center gap-3 bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all border-none cursor-pointer shadow-lg shadow-green-500/20 disabled:opacity-50"
          >
            {isDownloadingAll ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />} 
            {isDownloadingAll ? "CRÉATION DU ZIP..." : "TOUT TÉLÉCHARGER (.ZIP)"}
          </button>
        </header>

        <div className="glass-card p-10 rounded-[40px] border border-white/5">
          {photos.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <ImageIcon size={60} className="mx-auto mb-6 text-gray-600" />
              <p className="text-xl font-black uppercase tracking-widest italic">Aucune photo pour l'instant</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {photos.map((photo, index) => (
                <div key={photo.id} className="relative group rounded-2xl overflow-hidden border border-white/10 aspect-square bg-black">
                  <img 
                    src={photo.url} 
                    alt="Souvenir" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <button 
                      onClick={() => downloadSinglePhoto(photo.url, index)}
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