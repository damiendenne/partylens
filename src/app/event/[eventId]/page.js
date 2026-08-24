"use client";

import { useState, useEffect, use, useRef } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera, Music, Share2, ArrowLeft, CheckCircle2, BookOpen, Image as ImageIcon, QrCode, X, Sparkles, Loader2 } from 'lucide-react';
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
      try {
        const snap = await getDoc(doc(db, "events", eventId));
        if (snap.exists()) setEventData(snap.data());
      } catch (err) {
        console.error("Erreur chargement événement:", err);
      }
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
          alert(`Limite de 5 photos pour la version démo ! (Actuelles : ${photosSnapshot.size})`);
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
        console.warn("Module de compression indisponible :", err);
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
            console.error("Erreur compression image :", compressionErr);
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

      setNotify({ show: true, msg: `🚀 ${selectedFiles.length} Média(s) publié(s) !` });
      setFile(null);
      fileInput.value = "";
      setTimeout(() => setNotify({ show: false, msg: "" }), 3000);
    } catch (err) { 
      console.error("Erreur d'envoi :", err);
      alert("Une erreur est survenue lors de l'envoi de vos médias.");
    }
    setLoading(false);
  };

  const handleMusicRequest = async (e) => {
    e.preventDefault();
    if (!song || !artist) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "events", eventId, "musicRequests"), { 
        song: `${artist} - ${song}`, 
        createdAt: serverTimestamp() 
      });
      setNotify({ show: true, msg: "🎵 Demande envoyée !" });
      setSong(""); 
      setArtist("");
      setTimeout(() => setNotify({ show: false, msg: "" }), 3000);
    } catch (err) { 
      console.error(err); 
    }
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
    } catch (err) { 
      console.error(err); 
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#2d104d] via-[#210a3b] to-[#140427] text-white flex flex-col items-center p-6 font-sans overflow-x-hidden relative pb-16">
      
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

      {/* EN-TÊTE */}
      <header className="w-full max-w-md flex justify-between items-center mb-6 z-10 pt-2">
        <button 
          onClick={() => window.history.back()} 
          className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-2xl text-white transition-all border border-white/20 shadow-lg cursor-pointer active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>

        <img 
          src="/logo-partylens.png" 
          alt="PartyLens" 
          className="w-44 h-auto drop-shadow-[0_0_30px_rgba(249,115,22,0.5)]" 
        />

        <button 
          onClick={handleShare} 
          className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-2xl text-white transition-all border border-white/20 shadow-lg cursor-pointer active:scale-95"
        >
          <Share2 size={18} />
        </button>
      </header>

      {/* CONTENU PRINCIPAL */}
      <div className="w-full max-w-md space-y-6 z-10">
        
        {/* CARTE ÉVÉNEMENT */}
        <section className="bg-white/[0.08] border border-white/20 rounded-[40px] p-8 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-2 bg-gradient-to-r from-white via-orange-100 to-amber-200 bg-clip-text text-transparent">
            {eventData?.eventName || "SOIRÉE"}
          </h1>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-500/20 border border-orange-300/40 rounded-full mb-6 shadow-[0_0_15px_rgba(249,115,22,0.3)]">
            <Music size={14} className="text-amber-300" />
            <span className="text-[11px] font-black uppercase text-amber-200 tracking-widest italic">
              CODE DJ : {eventData?.djCode || "..."}
            </span>
          </div>

          <button
            onClick={() => setShowModalQR(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white rounded-2xl font-black uppercase text-[11px] tracking-wider border border-white/20 transition-all mb-6 cursor-pointer shadow-md active:scale-95"
          >
            <QrCode size={18} className="text-orange-400" /> Afficher le QR Code
          </button>

          <div className="flex flex-col gap-3">
            <Link
              href={`/photobooth/${eventId}`}
              className="w-full py-4 bg-gradient-to-r from-orange-500 via-amber-500 to-pink-500 text-white rounded-2xl font-black uppercase tracking-tight text-xs no-underline flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(249,115,22,0.5)] border border-orange-300/40 hover:scale-105 active:scale-95 transition-all"
            >
              <Sparkles size={18} /> Photobooth Live
            </Link>

            <div className="flex gap-3 w-full">
              <Link
                href={`/admin/${eventId}/galerie`}
                className="flex-1 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black uppercase text-[10px] tracking-wider no-underline flex items-center justify-center gap-2 border border-white/20 transition-all active:scale-95 shadow-md"
              >
                <ImageIcon size={14} className="text-orange-400" /> Galerie
              </Link>
              <Link
                href={`/event/${eventId}/guestbook`}
                className="flex-1 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black uppercase text-[10px] tracking-wider no-underline flex items-center justify-center gap-2 border border-white/20 transition-all active:scale-95 shadow-md"
              >
                <BookOpen size={14} className="text-amber-400" /> Livre d'or
              </Link>
            </div>

            <button
              onClick={handleShare}
              className="w-full py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest border border-white/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-md"
            >
              <Share2 size={14} /> Partager le lien
            </button>
          </div>
        </section>

        {/* SECTION MÉDIAS EN DIRECT */}
        <section className="bg-white/[0.08] border border-white/20 rounded-[40px] p-8 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <h2 className="text-xl font-black italic uppercase tracking-tighter mb-6 flex items-center gap-3">
            <Camera size={22} className="text-orange-400" /> Médias en direct
          </h2>
          <form onSubmit={handlePhotoUpload} className="space-y-4">
            <label className="block border-2 border-dashed border-orange-400/60 hover:border-orange-400 rounded-[30px] p-8 text-center bg-black/20 cursor-pointer hover:bg-orange-500/10 transition-all group">
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
              <Camera size={38} className="text-orange-400 mx-auto mb-3 group-hover:scale-110 transition-transform drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
              <span className="text-[11px] text-gray-100 font-black uppercase tracking-wider block">
                {file ? (
                  fileInputRef.current?.files?.length > 1 
                    ? `${fileInputRef.current.files.length} fichiers sélectionnés` 
                    : file.name
                ) : "Cliquez pour ajouter photo/vidéo"}
              </span>
            </label>

            {file && (
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-4 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-[0_0_25px_rgba(249,115,22,0.6)] border border-orange-300/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Envoi en cours...
                  </span>
                ) : (
                  "Publier sur le mur 🚀"
                )}
              </button>
            )}
          </form>
        </section>

        {/* SECTION LIVRE D'OR */}
        <section className="bg-white/[0.08] border border-white/20 rounded-[40px] p-8 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <h2 className="text-xl font-black italic uppercase tracking-tighter mb-6 flex items-center gap-3">
            <BookOpen size={22} className="text-amber-400" /> Livre d'or
          </h2>
          <form onSubmit={handleGuestbookSubmit} className="space-y-4">
            <input 
              type="text" 
              placeholder="Ton nom / signature" 
              value={guestName} 
              onChange={(e) => setGuestName(e.target.value)} 
              className="w-full bg-black/40 border border-white/20 p-4 rounded-2xl outline-none focus:border-orange-400 transition text-xs font-bold text-white placeholder:text-gray-400"
            />
            <textarea 
              placeholder="Laissez un petit mot pour le livre d'or..." 
              value={guestMsg} 
              onChange={(e) => setGuestMsg(e.target.value)} 
              className="w-full bg-black/40 border border-white/20 p-4 rounded-2xl outline-none focus:border-orange-400 transition text-xs font-bold text-white h-28 resize-none placeholder:text-gray-400"
            />
            <button 
              type="submit" 
              disabled={loading || !guestMsg.trim() || !guestName.trim()} 
              className="w-full py-4 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-[0_0_25px_rgba(249,115,22,0.6)] border border-orange-300/40 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:hover:scale-100 disabled:shadow-none"
            >
              {loading ? "Envoi..." : "Envoyer et signer"}
            </button>
          </form>
        </section>

        {/* SECTION DEMANDER UN TITRE */}
        <section className="bg-white/[0.08] border border-white/20 rounded-[40px] p-8 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <h2 className="text-xl font-black italic uppercase tracking-tighter mb-6 flex items-center gap-3">
            <Music size={22} className="text-orange-400" /> Demander un titre
          </h2>
          <form onSubmit={handleMusicRequest} className="space-y-4">
            <input 
              type="text" 
              placeholder="Artiste" 
              value={artist} 
              onChange={(e) => setArtist(e.target.value)} 
              className="w-full bg-black/40 border border-white/20 p-4 rounded-2xl outline-none focus:border-orange-400 transition text-xs font-bold text-white placeholder:text-gray-400" 
            />
            <input 
              type="text" 
              placeholder="Titre de la chanson" 
              value={song} 
              onChange={(e) => setSong(e.target.value)} 
              className="w-full bg-black/40 border border-white/20 p-4 rounded-2xl outline-none focus:border-orange-400 transition text-xs font-bold text-white placeholder:text-gray-400" 
            />
            <button 
              type="submit" 
              disabled={loading || !artist || !song} 
              className="w-full py-4 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-[0_0_25px_rgba(249,115,22,0.6)] border border-orange-300/40 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:hover:scale-100 disabled:shadow-none"
            >
              {loading ? "Envoi..." : "Envoyer au DJ"}
            </button>
          </form>
        </section>
      </div>

      {/* NOTIFICATION TOAST */}
      {notify.show && (
        <div className="fixed bottom-8 z-[100]">
          <div className="flex items-center gap-3 px-6 py-3.5 rounded-2xl border border-orange-400/50 bg-[#2d104d]/95 text-white backdrop-blur-2xl shadow-[0_0_30px_rgba(249,115,22,0.4)]">
            <CheckCircle2 size={18} className="text-amber-400" />
            <span className="text-xs font-black uppercase tracking-wider">{notify.msg}</span>
          </div>
        </div>
      )}

      {/* MODAL QR CODE HARMONISÉE */}
      {showModalQR && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-6" 
          onClick={() => setShowModalQR(false)}
        >
          <div 
            className="bg-white/[0.08] backdrop-blur-2xl border border-white/20 p-8 rounded-[40px] text-center relative max-w-sm w-full shadow-[0_20px_50px_rgba(0,0,0,0.6)]" 
            onClick={e => e.stopPropagation()}
          >
            {/* BOUTON FERMER */}
            <button 
              onClick={() => setShowModalQR(false)}
              className="absolute top-4 right-4 p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl text-gray-300 hover:text-white transition-all cursor-pointer border border-white/20 active:scale-95"
            >
              <X size={18} />
            </button>
            
            {/* TITRE */}
            <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-6 bg-gradient-to-r from-white via-orange-100 to-amber-200 bg-clip-text text-transparent">
              Partager la soirée
            </h3>
            
            {/* SUPPORT BLANC ET BORDURE BRILANTE POUR LE QR CODE */}
            <div className="bg-white p-6 rounded-[32px] inline-block shadow-[0_0_40px_rgba(249,115,22,0.45)] mb-6 border-2 border-orange-400/40 transform hover:scale-[1.02] transition-transform">
              {mounted && currentUrl ? (
                <QRCodeSVG value={currentUrl} size={190} fgColor="#140427" />
              ) : (
                <div style={{ width: 190, height: 190 }} className="bg-gray-200 animate-pulse rounded-2xl" />
              )}
            </div>
            
            {/* LÉGENDE */}
            <p className="text-[11px] text-orange-200/90 font-black italic uppercase tracking-[0.2em] leading-relaxed">
              Faites scanner ce code <br /> à vos invités
            </p>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="mt-12 relative z-10 w-full text-center max-w-md">
        <div className="h-[1px] w-full bg-white/20 mb-6"></div>
        <p className="text-[10px] text-white/50 uppercase font-black tracking-[0.5em]">
          Powered by PartyLens
        </p>
      </footer>
    </main>
  );
}