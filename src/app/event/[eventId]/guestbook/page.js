"use client";
import { useState, useEffect, use, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import HTMLFlipBook from 'react-pageflip';
import { ArrowLeft, Loader2, Download, Mic, DownloadCloud, FileAudio, Sun, Moon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import AudioGuestbook from '../AudioGuestbook';

export default function GuestbookView({ params }) {
  const unwrappedParams = use(params);
  const eventId = unwrappedParams.eventId;
  const router = useRouter();

  const [darkMode, setDarkMode] = useState(true);
  const [messages, setMessages] = useState([]);
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const bookRef = useRef();
  const pdfExportRef = useRef(); 

  const pageWidth = 450;
  const pageHeight = 650;

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const snap = await getDoc(doc(db, "events", eventId));
        if (snap.exists()) setEventData(snap.data());
      } catch (err) {
        console.error("Erreur chargement événement :", err);
      }
    };
    fetchEvent();

    const q = query(collection(db, "events", eventId, "guestbook"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, [eventId]);

  const downloadPDF = async () => {
    setExporting(true);
    const docPdf = new jsPDF('p', 'mm', 'a4');
    const pdfContainer = pdfExportRef.current;
    if (!pdfContainer) {
      setExporting(false);
      return;
    }
    const pages = pdfContainer.querySelectorAll('.pdf-page');

    try {
      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], {
          scale: 2,
          useCORS: false,
          logging: false,
          backgroundColor: "#fdfbf7"
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) docPdf.addPage();
        docPdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }
      docPdf.save(`Livre_d_Or_${eventData?.eventName || 'PartyLens'}.pdf`);
    } catch (err) {
      console.error("Erreur export PDF:", err);
    }
    setExporting(false);
  };

  const downloadSingleAudio = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Erreur téléchargement audio:", err);
      window.open(url, '_blank');
    }
  };

  const downloadAllAudios = async () => {
    const audioMessages = messages.filter(m => m.audioUrl);
    if (audioMessages.length === 0) return;

    for (let i = 0; i < audioMessages.length; i++) {
      const m = audioMessages[i];
      const filename = `Vocal_${m.author || 'Invite'}_${i + 1}.webm`;
      await downloadSingleAudio(m.audioUrl, filename);
      await new Promise(resolve => setTimeout(resolve, 400));
    }
  };

  if (loading) return (
    <div className={`min-h-screen flex flex-col items-center justify-center font-sans transition-colors duration-300 ${
      darkMode ? 'bg-[#0f071e] text-white' : 'bg-[#f4f4f6] text-slate-900'
    }`}>
      <Loader2 className="animate-spin text-orange-500 mb-4 drop-shadow-[0_0_15px_rgba(249,115,22,0.6)]" size={40} />
      <p className="tracking-[0.5em] uppercase text-[11px] font-black text-orange-400/80 italic">Ouverture du Grimoire...</p>
    </div>
  );

  const audioCount = messages.filter(m => m.audioUrl).length;

  return (
    <main className={`min-h-screen flex flex-col items-center justify-center relative p-6 font-sans overflow-x-hidden pb-16 transition-colors duration-300 ${
      darkMode 
        ? 'bg-[#0f071e] text-slate-100 selection:bg-orange-500 selection:text-white' 
        : 'bg-[#f4f4f6] text-slate-900 selection:bg-orange-500 selection:text-white'
    }`}>

      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {darkMode ? (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-purple-600/15 via-orange-600/10 to-transparent rounded-full blur-[120px]"></div>
        ) : (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-purple-200/30 via-orange-100/20 to-transparent rounded-full blur-[100px]"></div>
        )}
      </div>

      {/* HEADER FIXE */}
      <header className={`absolute top-0 left-0 w-full p-4 md:p-5 flex flex-wrap justify-between items-center z-40 gap-3 backdrop-blur-2xl border-b transition-colors duration-300 ${
        darkMode ? 'bg-[#170c2c]/80 border-white/10 shadow-2xl' : 'bg-white/80 border-slate-300/80 shadow-slate-200'
      }`}>
        <button 
          onClick={() => router.back()} 
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all text-[11px] font-black uppercase tracking-wider cursor-pointer shadow-md active:scale-95 ${
            darkMode 
              ? 'text-white bg-white/10 hover:bg-white/20 border-white/20' 
              : 'text-slate-700 bg-[#eaeaea] hover:bg-[#dedede] border-slate-300'
          }`}
        >
          <ArrowLeft size={16} /> Retour Galerie
        </button>
        
        <div className="flex flex-wrap items-center gap-2.5">
          {/* BOUTON SWITCH MODE CLAIR / SOMBRE INTÉGRÉ */}
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md border cursor-pointer active:scale-95 ${
              darkMode 
                ? 'bg-white/10 text-amber-300 border-white/20 hover:bg-white/20' 
                : 'bg-[#eaeaea] text-slate-700 border-slate-300 hover:bg-[#dedede]'
            }`}
            aria-label="Changer le mode d'affichage"
          >
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            <span>{darkMode ? "Mode Clair" : "Mode Sombre"}</span>
          </button>

          {audioCount > 0 && (
            <button 
              onClick={downloadAllAudios}
              className={`flex items-center gap-2 backdrop-blur-xl px-4 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer border shadow-md active:scale-95 ${
                darkMode 
                  ? 'bg-white/10 hover:bg-white/20 text-white border-white/20' 
                  : 'bg-[#eaeaea] hover:bg-[#dedede] text-slate-700 border-slate-300'
              }`}
            >
              <FileAudio size={15} className="text-amber-500" /> Tout télécharger ({audioCount})
            </button>
          )}

          <button 
            onClick={() => setShowAudioModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:scale-105 active:scale-95 text-white px-4 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer border border-orange-300/40 shadow-[0_0_20px_rgba(249,115,22,0.4)]"
          >
            <Mic size={15} /> Mémo Vocal 🎙️
          </button>

          <button 
            onClick={downloadPDF}
            disabled={exporting}
            className={`flex items-center gap-2 backdrop-blur-xl px-4 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all disabled:opacity-40 shadow-md cursor-pointer border active:scale-95 ${
              darkMode 
                ? 'bg-white/10 hover:bg-white/20 text-white border-white/20' 
                : 'bg-[#eaeaea] hover:bg-[#dedede] text-slate-700 border-slate-300'
            }`}
          >
            {exporting ? <Loader2 className="animate-spin" size={15} /> : <Download size={15} />}
            <span>{exporting ? "Création..." : "Télécharger PDF"}</span>
          </button>
        </div>
      </header>

      {/* MODAL AUDIO */}
      {showAudioModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md relative">
            <button 
              onClick={() => setShowAudioModal(false)}
              className="absolute -top-4 -right-4 bg-white hover:bg-gray-200 text-black w-10 h-10 rounded-full flex items-center justify-center font-bold transition z-10 cursor-pointer shadow-xl border border-white/40"
            >
              ✕
            </button>
            <AudioGuestbook eventId={eventId} />
          </div>
        </div>
      )}

      {/* CONTENEUR DU LIVRE */}
      <div className="relative z-10 flex items-center justify-center mt-32 mb-10 w-full max-w-6xl">
        <div className={`p-4 md:p-6 rounded-[40px] backdrop-blur-2xl shadow-2xl border transition-colors duration-300 ${
          darkMode ? 'bg-white/[0.08] border-white/20' : 'bg-white/60 border-slate-300'
        }`}>
          <HTMLFlipBook 
            width={pageWidth} 
            height={pageHeight} 
            size="fixed"
            minWidth={350}
            maxWidth={550}
            minHeight={500}
            maxHeight={750}
            className="shadow-2xl mx-auto rounded-lg overflow-hidden" 
            showCover={true} 
            usePortrait={false}
            maxShadowOpacity={0.6}
            mobileScrollSupport={true}
            ref={bookRef}
          >
            
            {/* Couverture Avant */}
            <div className="cover-page">
              <div className="cover-inner">
                <div className="ornament tl"></div>
                <div className="ornament tr"></div>
                <div className="ornament bl"></div>
                <div className="ornament br"></div>
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6 px-8">
                  <h2 className="gold-label">LIVRE D'OR OFFICIEL</h2>
                  <h1 className="gold-title-main">{eventData?.eventName || "PartyLens"}</h1>
                  <div className="gold-separator"></div>
                  <p className="gold-brand">SOUVENIRS & ÉTERNITÉ</p>
                </div>
              </div>
            </div>

            {/* Page de garde intérieure */}
            <div className="old-page flex items-center justify-center p-10">
              <div className="text-center space-y-4">
                <p className="font-serif italic text-base text-[#4a2e12] uppercase tracking-widest font-bold">— Grimoire des Invités —</p>
                <div className="gold-separator"></div>
                <p className="font-serif text-sm text-[#5c3814] leading-relaxed">Chaque mot, chaque rire et chaque voix s'inscrivent ici pour marquer ce moment à jamais.</p>
              </div>
            </div>

            {/* Messages */}
            {messages.map((m, index) => (
              <div key={m.id} className="old-page">
                <div className="parchment-container">
                  <div className="gold-frame">
                    <span className="folio-id">Folio {index + 1}</span>
                    <div className="flex flex-col items-center justify-center w-full px-6 space-y-4">
                      <p className="ink-message">"{m.message}"</p>
                      {m.audioUrl && (
                        <div className="mt-2 w-full bg-[#faedd0] p-3.5 rounded-2xl border border-[#b8860b] flex flex-col gap-2.5 shadow-md">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <Mic size={16} className="text-[#8a4d0f] shrink-0 animate-pulse" />
                              <span className="text-[11px] font-black text-[#503214] uppercase tracking-wider">Mémo Vocal</span>
                            </div>
                            <button 
                              onClick={() => downloadSingleAudio(m.audioUrl, `Vocal_${m.author || 'Invite'}_${index + 1}.webm`)}
                              className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:scale-105 active:scale-95 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md cursor-pointer border border-orange-300/40"
                            >
                              <DownloadCloud size={14} /> Télécharger
                            </button>
                          </div>
                          <audio src={m.audioUrl} controls className="w-full h-8 accent-orange-500" />
                        </div>
                      )}
                      <p className="author-sig">— {m.author || "Anonyme"}</p>
                    </div>
                    <div className="page-ornament-bottom"></div>
                  </div>
                </div>
              </div>
            ))}

            {/* Page de fin */}
            <div className="old-page">
              <div className="parchment-container flex items-center justify-center">
                <div className="text-center space-y-3">
                  <h3 className="font-serif italic text-3xl text-[#503214] font-bold tracking-widest">Fin du Grimoire</h3>
                  <div className="gold-separator"></div>
                  <p className="font-serif text-xs text-[#704218] uppercase tracking-widest">Merci pour tous ces merveilleux souvenirs</p>
                </div>
              </div>
            </div>

            {/* Couverture Arrière */}
            <div className="cover-page">
              <div className="cover-inner flex items-center justify-center">
                <p className="gold-brand">PARTYLENS — COLLECTION</p>
              </div>
            </div>

          </HTMLFlipBook>
        </div>
      </div>

      {/* ZONE CACHÉE POUR PDF */}
      <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }} ref={pdfExportRef}>
        <div className="pdf-page cover-page" style={{ width: '800px', height: '1131px' }}>
          <div className="cover-inner"><div className="ornament tl"></div><div className="ornament tr"></div><div className="ornament bl"></div><div className="ornament br"></div><div className="flex flex-col items-center justify-center h-full text-center"><h2 className="gold-label" style={{fontSize:'22px'}}>LIVRE D'OR OFFICIEL</h2><h1 className="gold-title-main" style={{fontSize:'75px'}}>{eventData?.eventName}</h1><p className="gold-brand" style={{marginTop:'40px', fontSize:'14px'}}>PARTYLENS</p></div></div>
        </div>
        {messages.map((m, index) => (
          <div key={m.id} className="pdf-page old-page" style={{ width: '800px', height: '1131px' }}>
            <div className="parchment-container">
              <div className="gold-frame" style={{borderWidth:'3px'}}>
                <span className="folio-id" style={{fontSize:'18px'}}>Folio {index + 1}</span>
                <div className="flex flex-col items-center justify-center w-full px-12">
                  <p className="ink-message" style={{fontSize:'38px', lineHeight:'1.5'}}>"{m.message}"</p>
                  <p className="author-sig" style={{fontSize:'24px', marginTop:'35px'}}>— {m.author || "Anonyme"}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <footer className="mt-8 relative z-10 w-full text-center max-w-6xl mx-auto">
        <div className={`h-[1px] w-full mb-6 ${darkMode ? 'bg-white/20' : 'bg-slate-300'}`}></div>
        <p className={`text-[10px] uppercase font-black tracking-[0.5em] ${darkMode ? 'text-white/50' : 'text-slate-500'}`}>
          Powered by PartyLens
        </p>
      </footer>

      <style jsx global>{`
        :root { --gold: #e6c547; --gold-light: #fff5bc; --gold-dark: #8f6c0a; }
        
        .cover-page { 
          background-color: #1a140d;
          background-image: radial-gradient(circle at center, #3d3020 0%, #110d08 100%);
          box-shadow: inset 0 0 50px rgba(0,0,0,0.9), 0 0 30px rgba(230,197,71,0.4);
          height: 100%;
          width: 100%;
          border: 2px solid var(--gold);
        }
        
        .old-page { 
          background-color: #fffaf0;
          background-image: 
            linear-gradient(90deg, rgba(0,0,0,0.04) 0%, rgba(255,255,255,0.7) 4%, transparent 12%),
            linear-gradient(45deg, rgba(184, 134, 11, 0.05) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(184, 134, 11, 0.05) 25%, transparent 25%);
          background-size: 100% 100%, 8px 8px, 8px 8px;
          box-shadow: inset 0 0 90px rgba(138, 77, 15, 0.2), inset -20px 0 30px rgba(0,0,0,0.15);
          height: 100%;
          width: 100%;
          position: relative;
        }

        .cover-inner { margin: 25px; height: calc(100% - 50px); border: 2px solid var(--gold); position: relative; border-radius: 4px; }
        .ornament { position: absolute; width: 60px; height: 60px; background: var(--gold); mask-size: contain; -webkit-mask-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0 Q50 0 50 50 Q0 50 0 0' fill='black'/%3E%3C/svg%3E"); }
        .tl { top: 0; left: 0; } .tr { top: 0; right: 0; transform: rotate(90deg); } .bl { bottom: 0; left: 0; transform: rotate(-90deg); } .br { bottom: 0; right: 0; transform: rotate(180deg); }
        
        .gold-title-main { font-family: serif; font-size: 3.2rem; background: linear-gradient(to bottom, var(--gold-light), var(--gold), var(--gold-dark)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 900; font-style: italic; text-align: center; text-shadow: 0 4px 15px rgba(0,0,0,0.5); }
        .gold-label { color: var(--gold); letter-spacing: 0.5em; font-weight: 900; font-size: 12px; text-shadow: 0 2px 5px rgba(0,0,0,0.8); }
        .gold-separator { width: 80px; height: 2px; background: linear-gradient(to right, transparent, var(--gold), transparent); margin: 15px auto; }
        
        .parchment-container { width: 100%; height: 100%; padding: 25px; display: flex; align-items: center; justify-content: center; }
        .gold-frame { width: 100%; height: 100%; border: 2px solid rgba(184, 134, 11, 0.6); background: rgba(255, 252, 245, 0.95); display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; padding: 20px; box-shadow: inset 0 0 25px rgba(138,77,15,0.1); border-radius: 6px; }
        
        .folio-id { position: absolute; top: 15px; right: 20px; font-style: italic; color: #8f6c0a; font-weight: bold; font-size: 12px; opacity: 0.9; }
        .ink-message { color: #1a0f05; font-family: 'Georgia', serif; font-size: 1.2rem; text-align: center; font-style: italic; line-height: 1.5; font-weight: 600; text-shadow: 0 1px 1px rgba(255,255,255,0.9); }
        .author-sig { color: #503214; font-family: 'Georgia', serif; font-style: italic; font-weight: bold; font-size: 1.1rem; align-self: flex-end; margin-right: 15px; margin-top: 10px; }
        
        .gold-brand { color: var(--gold); font-weight: 900; letter-spacing: 0.4em; font-size: 11px; text-shadow: 0 2px 4px rgba(0,0,0,0.9); }
        .pdf-page { display: flex; flex-direction: column; position: relative; }
      `}</style>
    </main>
  );
}