"use client";
import { useState, useEffect, use, useRef } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera, Music, Share2, ArrowLeft, CheckCircle2, BookOpen, Image as ImageIcon, QrCode, X, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';

export default function GuestPage({ params }) {
  const unwrappedParams = use(params);
  const eventId = unwrappedParams.eventId;

  const [file, setFile] = useState(null);
  const [song, setSong] = useState("");
  const [artist, setArtist] = useState("");
  const [guestMsg, setGuestMsg] = useState(""); 
  const [guestName, setGuestName] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [eventData, setEventData] = useState(null);
  const [notify, setNotify] = useState({ show: false, msg: "" });
  
  const [mounted, setMounted] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const [showModalQR, setShowModalQR] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }

    const fetchEvent = async () => {
      const snap = await getDoc(doc(db, "events", eventId));
      if (snap.exists()) setEventData(snap.data());
    };
    fetchEvent();
  }, [eventId]);

  const handleShare = async () => {
    const shareData = {
      title: `Rejoins la soirée ${eventData?.eventName || ''}`,
      text: `Participe à l'événement et partage tes photos sur PartyLens !`,
      url: currentUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(currentUrl);
        setNotify({ show: true, msg: "Lien copié !" });
        setTimeout(() => setNotify({ show: false, msg: "" }), 3000);
      }
    } catch (err) {
      console.error("Erreur partage:", err);
    }
  };

  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    
    const fileInput = fileInputRef.current;
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) return;
    
    setLoading(true);
    const selectedFiles = Array.from(fileInput.files);
    
    try {
      if (eventData?.plan === "DEMO") {
        const photosSnapshot = await getDocs(query(collection(db, "events", eventId, "photos")));
        if (photosSnapshot.size >= 5 || (photosSnapshot.size + selectedFiles.length) > 5) {
          alert(`Limite de 5 photos privée pour la démo ! (Actuelles : ${photosSnapshot.size})`);
          setFile(null);
          fileInput.value = "";
          setLoading(false);
          return;
        }
      }

      let imageCompression = null;
      try {
        const module = await import('browser-image-compression');
        imageCompression = module.default;
      } catch (err) {
        console.warn("Impossible de charger le module de compression :", err);
      }

      const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, fileType: 'image/jpeg' };

      for (const currentFile of selectedFiles) {
        let finalFile = currentFile;
        const isVideo = currentFile.type.startsWith('video/');

        if (!isVideo && imageCompression) {
          try {
            const compressedBlob = await imageCompression(currentFile, options);
            finalFile = new File([compressedBlob], currentFile.name, { type: 'image/jpeg' });
          } catch (compressionErr) {
            console.error("Échec compression image, envoi du fichier brut :", compressionErr);
          }
        }

        const storageRef = ref(storage, `events/${eventId}/${Date.now()}_${finalFile.name}`);
        await uploadBytes(storageRef, finalFile);
        const url = await getDownloadURL(storageRef);
        
        const targetCollection = isVideo ? "videos" : "photos";
        
        await addDoc(collection(db, "events", eventId, targetCollection), { 
          url, 
          createdAt: serverTimestamp() 
        });
      }

      setNotify({ show: true, msg: `🚀 ${selectedFiles.length} Médias(s) publié(s) !` });
      setFile(null);
      fileInput.value = "";
      setTimeout(() => setNotify({ show: false, msg: "" }), 3000);
    } catch (err) { 
      console.error("Erreur d'envoi général :", err);
      alert("Une erreur est survenue lors du traitement de vos médias.");
    }
    setLoading(false);
  };

  const handleMusicRequest = async (e) => {
    e.preventDefault();
    if (!song || !artist) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "events", eventId, "musicRequests"), { song: `${artist} - ${song}`, createdAt: serverTimestamp() });
      setNotify({ show: true, msg: "🎵 Demande envoyée !" });
      setSong(""); setArtist("");
      setTimeout(() => setNotify({ show: false, msg: "" }), 3000);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleGuestbookSubmit = async (e) => {
    e.preventDefault();
    if (!guestMsg.trim() || !guestName.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "events", eventId, "guestbook"), { 
        message: guestMsg, 
        author: guestName, 
        createdAt: serverTimestamp() 
      });
      setNotify({ show: true, msg: "📖 Mot signé !" });
      setGuestMsg("");
      setGuestName("");
      setTimeout(() => setNotify({ show: false, msg: "" }), 3000);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  return (
    <main className="min-h-screen p-6 flex flex-col items-center relative overflow-hidden bg-black text-white">
      <div className="bg-blobs">
        <div className="blob blob-purple"></div>
        <div className="blob blob-pink"></div>
      </div>

      <header className="w-full max-w-md flex justify-between items-center mb-10 z-10">
          <button 
            onClick={() => window.history.back()} 
            className="p-2 text-gray-500 hover:text-white transition cursor-pointer border-none bg-transparent"
          >
            <ArrowLeft size={24} />
          </button>
          
          <img src="/logo-partylens.png" alt="PartyLens" className="w-40 h-auto" />
          <button onClick={handleShare} className="p-3 glass-card rounded-full active:scale-90 transition border-none"><Share2 size={20}/></button>
      </header>

      <div className="w-full max-w-md space-y-6 z-10 animate-in fade-in slide-in-from-bottom duration-700">
        
        <section className="glass-card p-10 rounded-[50px] text-center">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-2">{eventData?.eventName || "SOIRÉE"}</h1>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/20 border border-purple-500/40 rounded-full mb-8">
            <Music size={14} className="text-purple-400" />
            <span className="text-[11px] font-black uppercase text-purple-400 tracking-widest italic">CODE DJ : {eventData?.djCode || "..."}</span>
          </div>

          <button
            onClick={() => setShowModalQR(true)}
            className="mx-auto flex items-center justify-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-full font-black uppercase text-[11px] tracking-[0.2em] border border-white/10 transition-all mb-8 cursor-pointer shadow-xl"
          >
            <QrCode size={18} /> Afficher le QR Code
          </button>

          <div className="flex flex-col gap-3">
            <Link
              href={`/photobooth/${eventId}`}
              className="w-full py-4 bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 rounded-2xl font-black uppercase text-[10px] no-underline flex items-center justify-center gap-2 border border-pink-500/20 transition-all"
            >
              <Sparkles size={14} /> Photobooth Live
            </Link>
            <div className="flex gap-2 w-full">
              <Link
                href={`/admin/${eventId}/galerie`}
                className="flex-1 py-4 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-2xl font-black uppercase text-[10px] no-underline flex items-center justify-center gap-2 border border-blue-500/20 transition-all"
              >
                <ImageIcon size={14} /> Galerie
              </Link>
              <Link
                href={`/event/${eventId}/guestbook`}
                className="flex-1 py-4 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 rounded-2xl font-black uppercase text-[10px] no-underline flex items-center justify-center gap-2 border border-yellow-500/20 transition-all"
              >
                <BookOpen size={14} /> Livre d'or
              </Link>
            </div>
            <button
              onClick={handleShare}
              className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] border border-white/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Share2 size={14} /> Partager le lien
            </button>
          </div>
        </section>

        <section className="glass-card p-8 rounded-[40px]">
          <h2 className="text-lg font-black italic uppercase mb-6 flex items-center gap-3"><Camera size={20} className="text-pink-500" /> Médias en direct</h2>
          <form onSubmit={handlePhotoUpload} className="space-y-4">
            <label className="block border-4 border-dashed border-pink-500/50 rounded-[30px] p-10 text-center bg-pink-500/[0.08] cursor-pointer hover:bg-pink-500/[0.15] transition-all relative">
              <input 
                type="file" 
                ref={fileInputRef}
                id="photoUpload"
                name="photoUpload"
                accept="image/*,video/*"
                multiple
                onChange={(e) => setFile(e.target.files && e.target.files.length > 0 ? e.target.files[0] : null)} 
                className="hidden" 
                disabled={loading}
              />
              <Camera size={40} className="text-pink-500 mx-auto mb-3" />
              <span className="text-[12px] text-white font-black uppercase tracking-widest block">
                {file ? (
                  fileInputRef.current?.files?.length > 1 
                    ? `${fileInputRef.current.files.length} fichiers sélectionnés` 
                    : file.name
                ) : "CLIQUEZ POUR AJOUTER PHOTO/VIDÉO"}
              </span>
            </label>
            {file && (
              <button type="submit" disabled={loading} className="w-full py-5 bg-pink-600 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-pink-600/20">
                {loading ? "Optimisation et Envoi..." : "Publier sur le mur 🚀"}
              </button>
            )}
          </form>
        </section>

        <section className="glass-card p-8 rounded-[40px]">
          <h2 className="text-lg font-black italic uppercase mb-6 flex items-center gap-3"><BookOpen size={20} className="text-[#ff0080]" /> Livre d'or</h2>
          <form onSubmit={handleGuestbookSubmit} className="space-y-4">
            <input 
              type="text" 
              placeholder="Ton nom / signature" 
              value={guestName} 
              onChange={(e) => setGuestName(e.target.value)} 
              className="w-full bg-black border border-white/20 p-5 rounded-2xl outline-none focus:border-[#ff0080] transition text-sm text-white font-bold placeholder:text-gray-600"
            />
            <textarea 
              placeholder="Laissez un petit mot pour le livre d'or..." 
              value={guestMsg} 
              onChange={(e) => setGuestMsg(e.target.value)} 
              className="w-full bg-black border border-white/20 p-5 rounded-2xl outline-none focus:border-[#ff0080] transition text-sm text-white font-bold h-32 resize-none placeholder:text-gray-600"
            />
            <button type="submit" disabled={loading || !guestMsg.trim() || !guestName.trim()} className="w-full py-5 bg-[#ff0080] rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-[#ff0080]/20">
              {loading ? "Envoi..." : "Envoyer et signer"}
            </button>
          </form>
        </section>

        <section className="glass-card p-8 rounded-[40px]">
          <h2 className="text-lg font-black italic uppercase mb-6 flex items-center gap-3"><Music size={20} className="text-purple-500" /> Demander un titre</h2>
          <form onSubmit={handleMusicRequest} className="space-y-4">
            <input type="text" placeholder="Artiste" value={artist} onChange={(e) => setArtist(e.target.value)} className="w-full bg-black border border-white/20 p-5 rounded-2xl outline-none focus:border-purple-500 transition text-sm text-white font-bold placeholder:text-gray-600" />
            <input type="text" placeholder="Titre" value={song} onChange={(e) => setSong(e.target.value)} className="w-full bg-black border border-white/20 p-5 rounded-2xl outline-none focus:border-purple-500 transition text-sm text-white font-bold placeholder:text-gray-600" />
            <button type="submit" disabled={loading} className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-purple-600/20">
              {loading ? "Envoi..." : "Envoyer au DJ"}
            </button>
          </form>
        </section>
      </div>

      {notify.show && (
        <div className="fixed bottom-10 z-[100] animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3 px-10 py-4 rounded-full border border-pink-500/50 bg-black/80 text-pink-500 backdrop-blur-xl shadow-2xl">
            <CheckCircle2 size={18}/><span className="text-[10px] font-black uppercase italic tracking-widest">{notify.msg}</span>
          </div>
        </div>
      )}

      {showModalQR && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-6" onClick={() => setShowModalQR(false)}>
          <div className="bg-[#0f1115] p-8 rounded-[40px] border border-white/10 text-center relative max-w-sm w-full animate-in zoom-in duration-300 shadow-2xl" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setShowModalQR(false)}
              className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer border-none"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-xl font-black italic uppercase tracking-tighter mb-8">Partager la soirée</h3>
            
            <div className="bg-white p-6 rounded-[30px] inline-block shadow-[0_0_50px_rgba(255,255,255,0.1)] mb-6 border-8 border-white/5">
              {mounted && currentUrl ? (
                <QRCodeSVG value={currentUrl} size={200} />
              ) : (
                <div style={{ width: 200, height: 200 }} className="bg-gray-800 animate-pulse rounded-lg" />
              )}
            </div>
            
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] leading-relaxed">
              Faites scanner ce code <br /> à vos amis pour les inviter
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        .bg-blobs { position: fixed; inset: 0; z-index: 0; overflow: hidden; }
        .blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.3; }
        .blob-purple { top: -10%; left: -10%; width: 400px; height: 400px; background: #9333ea; }
        .blob-pink { bottom: -10%; right: -10%; width: 400px; height: 400px; background: #ec4899; }
        
        .glass-card { 
          background: rgba(255, 255, 255, 0.12); 
          backdrop-filter: blur(16px); 
          border: 3px solid rgba(255, 255, 255, 0.35); 
          box-shadow: 0 10px 40px 0 rgba(0, 0, 0, 0.8);
        }
      `}</style>
    </main>
  );
}