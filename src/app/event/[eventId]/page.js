"use client";

import { useState, useEffect, use, useRef } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera, Music, Share2, ArrowLeft, CheckCircle2, BookOpen, Image as ImageIcon, QrCode, X, Sparkles, Loader2, Sun, Moon, Mic, Square } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';

export default function GuestPage({ params }) {
  const unwrappedParams = use(params);
  const eventId = unwrappedParams.eventId;

  const [file, setFile] = useState(null);
  const [fileCount, setFileCount] = useState(0);
  const [song, setSong] = useState("");
  const [artist, setArtist] = useState("");
  const [guestMsg, setGuestMsg] = useState(""); 
  const [guestName, setGuestName] = useState(""); 
  
  // États pour l'enregistrement vocal (Mémo audio)
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);

  const [loading, setLoading] = useState(false);
  const [eventData, setEventData] = useState(null);
  const [notify, setNotify] = useState({ show: false, msg: "" });
  
  const [mounted, setMounted] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const [showModalQR, setShowModalQR] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);

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
        console.error("Erreur chargement événement :", err);
      }
    };
    fetchEvent();
  }, [eventId]);

  const showNotification = (msg) => {
    setNotify({ show: true, msg });
    setTimeout(() => setNotify({ show: false, msg: "" }), 3000);
  };

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
        showNotification("Lien copié !");
      }
    } catch (err) {
      console.error("Erreur partage :", err);
    }
  };

  // Gestion de l'enregistrement vocal + Retranscription texte robuste
  const startRecording = async () => {
    audioChunksRef.current = [];

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("⚠️ Votre navigateur ne supporte pas la retranscription vocale. Utilisez Google Chrome, Microsoft Edge ou Safari.");
    } else {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'fr-FR';
        recognition.interimResults = true;
        recognition.continuous = true;

        recognition.onresult = (event) => {
          let transcript = "";
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setGuestMsg(transcript);
        };

        recognition.onerror = (event) => {
          console.error("Erreur SpeechRecognition :", event.error);
          if (event.error === 'not-allowed') {
            showNotification("❌ Accès au micro refusé pour la retranscription.");
          } else {
            showNotification(`⚠️ Erreur vocale : ${event.error}`);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (e) {
        console.error("Exception au démarrage de la reco vocale :", e);
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : MediaRecorder.isTypeSupported('audio/mp4') 
          ? 'audio/mp4' 
          : '';

      const options = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      showNotification("🎙️ Enregistrement & retranscription en cours...");
    } catch (err) {
      console.error("Erreur accès micro (MediaRecorder) :", err);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      alert("Impossible d'accéder au microphone. Vérifiez vos autorisations.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      showNotification("🎙️ Enregistrement terminé !");
    }
  };

  const clearAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
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
        const compressionModule = await import('browser-image-compression');
        imageCompression = compressionModule.default;
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

      showNotification(`🚀 ${selectedFiles.length} Média(s) publié(s) !`);
      setFile(null);
      if (fileInput) fileInput.value = "";
    } catch (err) { 
      console.error("Erreur d'envoi :", err);
      alert("Une erreur est survenue lors de l'envoi de vos médias.");
    }
    setLoading(false);
  };

  const handleMusicRequest = async (e) => {
    e.preventDefault();
    if (!song.trim() || !artist.trim()) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, "events", eventId, "musicRequests"), { 
        song: `${artist.trim()} - ${song.trim()}`, 
        createdAt: serverTimestamp() 
      });
      showNotification("🎵 Demande envoyée !");
      setSong(""); 
      setArtist("");
    } catch (err) { 
      console.error("Erreur musique :", err); 
    }
    setLoading(false);
  };

  const handleGuestbookSubmit = async (e) => {
    e.preventDefault();
    if (!guestName.trim() || (!guestMsg.trim() && !audioBlob)) return;
    
    setLoading(true);
    try {
      let uploadedAudioUrl = null;

      if (audioBlob) {
        const extension = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
        const audioRef = ref(storage, `events/${eventId}/audio/${Date.now()}_${guestName.trim()}.${extension}`);
        await uploadBytes(audioRef, audioBlob);
        uploadedAudioUrl = await getDownloadURL(audioRef);
      }

      await addDoc(collection(db, "events", eventId, "guestbook"), { 
        message: guestMsg.trim() || "🎙️ Mémo vocal laissé dans le Grimoire", 
        author: guestName.trim(), 
        audioUrl: uploadedAudioUrl,
        createdAt: serverTimestamp() 
      });

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      showNotification("📖 Mot signé et enregistré !");
      setGuestMsg("");
      setGuestName("");
      setAudioBlob(null);
      setAudioUrl(null);
    } catch (err) { 
      console.error("Erreur livre d'or :", err); 
      alert("Une erreur est survenue lors de l'envoi.");
    }
    setLoading(false);
  };

  // Sécurité anti-hydratation pour bloquer les erreurs de nœuds du DOM
  if (!mounted) {
    return (
      <main className="min-h-screen bg-[#0f071e] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </main>
    );
  }

  return (
    <main className={`min-h-screen flex flex-col items-center px-6 py-12 font-sans relative transition-colors duration-300 ${
      darkMode 
        ? 'bg-[#0f071e] text-slate-100 selection:bg-orange-500 selection:text-white' 
        : 'bg-[#f4f4f6] text-slate-900 selection:bg-orange-500 selection:text-white'
    }`}>
      
      {/* BOUTON SWITCH MODE CLAIR / SOMBRE */}
      <button 
        key="theme-toggle-btn"
        onClick={() => setDarkMode(!darkMode)}
        className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md border cursor-pointer ${
          darkMode 
            ? 'bg-white/10 text-amber-300 border-white/20 hover:bg-white/20' 
            : 'bg-[#eaeaea] text-slate-700 border-slate-300 hover:bg-[#dedede]'
        }`}
        aria-label="Changer le mode d'affichage"
      >
        {darkMode ? <Sun key="sun-icon" size={15} /> : <Moon key="moon-icon" size={15} />}
        <span key="theme-label">{darkMode ? "Mode Clair" : "Mode Sombre"}</span>
      </button>

      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {darkMode ? (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-purple-600/15 via-orange-600/10 to-transparent rounded-full blur-[120px]"></div>
        ) : (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-purple-200/30 via-orange-100/20 to-transparent rounded-full blur-[100px]"></div>
        )}
      </div>

      {/* EN-TÊTE */}
      <header className="w-full max-w-md flex justify-between items-center mb-8 z-10 pt-2 pr-24">
        <button 
          onClick={() => window.history.back()} 
          className={`p-3 rounded-2xl transition-all border shadow-md cursor-pointer active:scale-95 ${
            darkMode 
              ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white' 
              : 'bg-[#eaeaea] hover:bg-slate-200 border-slate-300 text-slate-900'
          }`}
          aria-label="Retour"
        >
          <ArrowLeft size={18} />
        </button>

        <img 
          src="/logo-partylens.png" 
          alt="PartyLens" 
          className="w-36 h-auto drop-shadow-md" 
        />

        <button 
          onClick={handleShare} 
          className={`p-3 rounded-2xl transition-all border shadow-md cursor-pointer active:scale-95 ${
            darkMode 
              ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white' 
              : 'bg-[#eaeaea] hover:bg-slate-200 border-slate-300 text-slate-900'
          }`}
          aria-label="Partager"
        >
          <Share2 size={18} />
        </button>
      </header>

      {/* CONTENU PRINCIPAL */}
      <div className="w-full max-w-md space-y-6 z-10">
        
        {/* CARTE ÉVÉNEMENT */}
        <section className={`rounded-3xl p-8 backdrop-blur-xl shadow-xl transition-all duration-300 ${
          darkMode 
            ? 'bg-[#170c2c]/80 border border-white/10 shadow-2xl' 
            : 'bg-[#eaeaea]/90 border border-slate-300/80 shadow-slate-300/30'
        } text-center`}>
          <h1 className={`text-2xl md:text-3xl font-black italic uppercase tracking-tight mb-3 ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>
            {eventData?.eventName || "SOIRÉE"}
          </h1>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-500/20 border border-orange-300/40 rounded-full mb-6 shadow-sm">
            <Music size={14} className="text-amber-400" />
            <span className="text-[11px] font-black uppercase text-amber-300 tracking-wider">
              CODE DJ : {eventData?.djCode || "..."}
            </span>
          </div>

          <button
            onClick={() => setShowModalQR(true)}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider border transition-all mb-6 cursor-pointer shadow-sm active:scale-95 ${
              darkMode 
                ? 'bg-white/[0.04] hover:bg-white/10 border-white/10 text-white' 
                : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-900'
            }`}
          >
            <QrCode size={16} className="text-orange-500" /> Afficher le QR Code
          </button>

          <div className="flex flex-col gap-3">
            <Link
              href={`/photobooth/${eventId}`}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold uppercase tracking-wider text-xs no-underline flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:brightness-105 active:scale-98 transition-all"
            >
              <Sparkles size={16} /> Photobooth Live
            </Link>

            <div className="flex gap-3 w-full">
              <Link
                href={`/admin/${eventId}/galerie`}
                className={`flex-1 py-3.5 rounded-xl font-bold uppercase text-[11px] tracking-wider no-underline flex items-center justify-center gap-2 border transition-all active:scale-95 shadow-sm ${
                  darkMode 
                    ? 'bg-white/[0.04] hover:bg-white/10 border-white/10 text-white' 
                    : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-900'
                }`}
              >
                <ImageIcon size={14} className="text-orange-500" /> Galerie
              </Link>
              <Link
                href={`/event/${eventId}/guestbook`}
                className={`flex-1 py-3.5 rounded-xl font-bold uppercase text-[11px] tracking-wider no-underline flex items-center justify-center gap-2 border transition-all active:scale-95 shadow-sm ${
                  darkMode 
                    ? 'bg-white/[0.04] hover:bg-white/10 border-white/10 text-white' 
                    : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-900'
                }`}
              >
                <BookOpen size={14} className="text-amber-400" /> Livre d'or
              </Link>
            </div>

            <button
              onClick={handleShare}
              className={`w-full py-3.5 rounded-xl font-bold uppercase text-[11px] tracking-wider border flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-sm ${
                darkMode 
                  ? 'bg-white/[0.04] hover:bg-white/10 border-white/10 text-white' 
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-900'
              }`}
            >
              <Share2 size={14} /> Partager le lien
            </button>
          </div>
        </section>

        {/* SECTION MÉDIAS EN DIRECT */}
        <section className={`rounded-3xl p-8 backdrop-blur-xl shadow-xl transition-all duration-300 ${
          darkMode 
            ? 'bg-[#170c2c]/80 border border-white/10 shadow-2xl' 
            : 'bg-[#eaeaea]/90 border border-slate-300/80 shadow-slate-300/30'
        }`}>
          <h2 className={`text-lg font-black italic uppercase tracking-tight mb-5 flex items-center gap-2.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            <Camera size={20} className="text-orange-500" /> Médias en direct
          </h2>
          <form onSubmit={handlePhotoUpload} className="space-y-4">
            <label className={`block border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all group ${
              darkMode 
                ? 'border-white/20 hover:border-orange-500 bg-white/[0.02] hover:bg-white/[0.06] text-slate-300' 
                : 'border-slate-300 hover:border-orange-500 bg-white/50 hover:bg-orange-500/5 text-slate-700'
            }`}>
              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*,video/*"
                multiple
                onChange={(e) => { setFileCount(e.target.files?.length || 0); setFile(e.target.files && e.target.files.length > 0 ? e.target.files[0] : null); }}
                className="hidden" 
                disabled={loading}
              />
              <Camera size={32} className="text-orange-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span key="upload-label-text" className="text-xs font-bold uppercase tracking-wider block">
                {file ? (
                  fileCount > 1
                    ? `${fileCount} fichiers sélectionnés`
                    : file.name
                ) : "Cliquez pour ajouter photo ou vidéo"}
              </span>
            </label>

            {file && (
              <button 
                key="publish-media-btn"
                type="submit" 
                disabled={loading} 
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold uppercase text-xs tracking-wider shadow-lg shadow-orange-500/20 hover:brightness-105 active:scale-98 transition-all cursor-pointer"
              >
                {loading ? (
                  <span key="loading-state" className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Envoi en cours...
                  </span>
                ) : (
                  <span key="ready-state">Publier sur le mur 🚀</span>
                )}
              </button>
            )}
          </form>
        </section>

        {/* SECTION LIVRE D'OR (TEXTE + MÉMO VOCAL) */}
        <section className={`rounded-3xl p-8 backdrop-blur-xl shadow-xl transition-all duration-300 ${
          darkMode 
            ? 'bg-[#170c2c]/80 border border-white/10 shadow-2xl' 
            : 'bg-[#eaeaea]/90 border border-slate-300/80 shadow-slate-300/30'
        }`}>
          <h2 className={`text-lg font-black italic uppercase tracking-tight mb-5 flex items-center gap-2.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            <BookOpen size={20} className="text-amber-400" /> Livre d'or & Mémo Vocal
          </h2>
          <form onSubmit={handleGuestbookSubmit} className="space-y-4">
            <input 
              type="text" 
              required
              placeholder="Ton nom / signature" 
              value={guestName} 
              onChange={(e) => setGuestName(e.target.value)} 
              className={`w-full border p-3.5 rounded-xl outline-none transition text-xs font-medium ${
                darkMode 
                  ? 'bg-white/[0.04] border-white/10 text-white placeholder:text-slate-500 focus:border-orange-500' 
                  : 'bg-[#f4f4f6] border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-orange-500'
              }`}
            />
            
            <textarea 
              placeholder="Laissez un petit mot écrit ou parlez pour le transcrire ici..." 
              value={guestMsg} 
              onChange={(e) => setGuestMsg(e.target.value)} 
              className={`w-full border p-3.5 rounded-xl outline-none transition text-xs font-medium h-28 resize-none ${
                darkMode 
                  ? 'bg-white/[0.04] border-white/10 text-white placeholder:text-slate-500 focus:border-orange-500' 
                  : 'bg-[#f4f4f6] border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-orange-500'
              }`}
            />

            {/* Enregistreur Vocal Intégré avec clés de stabilisation */}
            <div className={`border rounded-2xl p-4 flex flex-col items-center gap-3 ${
              darkMode ? 'bg-white/[0.02] border-white/10' : 'bg-white/50 border-slate-300'
            }`}>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Mic size={14} /> Optionnel : Laisser un mémo vocal 🎙️
              </span>

              {!recording && !audioUrl && (
                <button
                  key="btn-start"
                  type="button"
                  onClick={startRecording}
                  className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-105 active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all cursor-pointer"
                >
                  <Mic size={15} /> Enregistrer la voix
                </button>
              )}

              {recording && (
                <button
                  key="btn-stop"
                  type="button"
                  onClick={stopRecording}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 animate-pulse text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all cursor-pointer"
                >
                  <Square size={15} /> Arrêter l'enregistrement
                </button>
              )}

              {audioUrl && (
                <div key="audio-preview-box" className="flex flex-col items-center gap-2 w-full">
                  <audio src={audioUrl} controls className="w-full h-8 accent-orange-500" />
                  <button
                    type="button"
                    onClick={clearAudio}
                    className="text-[10px] uppercase tracking-wider text-red-400 hover:underline font-bold cursor-pointer"
                  >
                    Effacer et recommencer l'audio
                  </button>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading || !guestName.trim() || (!guestMsg.trim() && !audioBlob)} 
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold uppercase text-xs tracking-wider shadow-lg shadow-orange-500/20 hover:brightness-105 active:scale-98 transition-all cursor-pointer disabled:opacity-40 disabled:hover:scale-100 disabled:shadow-none"
            >
              {loading ? "Envoi en cours..." : "Envoyer et signer le livre d'or"}
            </button>
          </form>
        </section>

        {/* SECTION DEMANDER UN TITRE */}
        <section className={`rounded-3xl p-8 backdrop-blur-xl shadow-xl transition-all duration-300 ${
          darkMode 
            ? 'bg-[#170c2c]/80 border border-white/10 shadow-2xl' 
            : 'bg-[#eaeaea]/90 border border-slate-300/80 shadow-slate-300/30'
        }`}>
          <h2 className={`text-lg font-black italic uppercase tracking-tight mb-5 flex items-center gap-2.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            <Music size={20} className="text-orange-500" /> Demander un titre
          </h2>
          <form onSubmit={handleMusicRequest} className="space-y-4">
            <input 
              type="text" 
              placeholder="Artiste" 
              value={artist} 
              onChange={(e) => setArtist(e.target.value)} 
              className={`w-full border p-3.5 rounded-xl outline-none transition text-xs font-medium ${
                darkMode 
                  ? 'bg-white/[0.04] border-white/10 text-white placeholder:text-slate-500 focus:border-orange-500' 
                  : 'bg-[#f4f4f6] border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-orange-500'
              }`} 
            />
            <input 
              type="text" 
              placeholder="Titre de la chanson" 
              value={song} 
              onChange={(e) => setSong(e.target.value)} 
              className={`w-full border p-3.5 rounded-xl outline-none transition text-xs font-medium ${
                darkMode 
                  ? 'bg-white/[0.04] border-white/10 text-white placeholder:text-slate-500 focus:border-orange-500' 
                  : 'bg-[#f4f4f6] border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-orange-500'
              }`} 
            />
            <button 
              type="submit" 
              disabled={loading || !artist.trim() || !song.trim()} 
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold uppercase text-xs tracking-wider shadow-lg shadow-orange-500/20 hover:brightness-105 active:scale-98 transition-all cursor-pointer disabled:opacity-40 disabled:hover:scale-100 disabled:shadow-none"
            >
              {loading ? "Envoi..." : "Envoyer au DJ"}
            </button>
          </form>
        </section>
      </div>

      {/* NOTIFICATION TOAST */}
      {notify.show && (
        <div key="toast-notification" className="fixed bottom-8 z-[100] animate-bounce">
          <div className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl border backdrop-blur-xl shadow-xl ${
            darkMode 
              ? 'border-orange-500/30 bg-[#170c2c]/95 text-white shadow-2xl' 
              : 'border-orange-500/30 bg-white/95 text-slate-900 shadow-xl'
          }`}>
            <CheckCircle2 size={18} className="text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider">{notify.msg}</span>
          </div>
        </div>
      )}

      {/* MODAL QR CODE */}
      {showModalQR && (
        <div 
          key="modal-qr-overlay"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-6" 
          onClick={() => setShowModalQR(false)}
        >
          <div 
            className={`backdrop-blur-xl border p-8 rounded-3xl text-center relative max-w-sm w-full shadow-2xl transition-all ${
              darkMode ? 'bg-[#170c2c] border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`} 
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowModalQR(false)}
              className={`absolute top-4 right-4 p-2.5 rounded-xl transition-all cursor-pointer border active:scale-95 ${
                darkMode ? 'bg-white/10 hover:bg-white/20 border-white/10 text-slate-300 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              }`}
            >
              <X size={16} />
            </button>
            
            <h3 className={`text-xl font-black italic uppercase tracking-tight mb-6 ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Partager la soirée
            </h3>
            
            <div className="bg-white p-6 rounded-2xl inline-block shadow-lg mb-6 border border-slate-200">
              {mounted && currentUrl ? (
                <QRCodeSVG value={currentUrl} size={180} fgColor="#0f071e" />
              ) : (
                <div style={{ width: 180, height: 180 }} className="bg-slate-200 animate-pulse rounded-xl" />
              )}
            </div>
            
            <p className={`text-[11px] font-bold uppercase tracking-wider leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Faites scanner ce code à vos invités
            </p>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="mt-16 relative z-10 w-full text-center max-w-md border-t pt-6 border-slate-300/20">
        <p className={`text-[10px] uppercase font-bold tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
          Powered by PartyLens
        </p>
      </footer>
    </main>
  );
}
