"use client";
import { useState, useEffect, use, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import HTMLFlipBook from 'react-pageflip';
import { ArrowLeft, Loader2, Download } from 'lucide-react';
import { useRouter } from 'next/navigation'; // 👈 1. ON IMPORTE useRouter ÉVIDEMMENT
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function GuestbookView({ params }) {
  const unwrappedParams = use(params);
  const eventId = unwrappedParams.eventId;
  const router = useRouter(); // 👈 2. ON INITIALISE LE ROUTER
  const [messages, setMessages] = useState([]);
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const bookRef = useRef();
  const pdfExportRef = useRef(); 
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const fetchEvent = async () => {
      const snap = await getDoc(doc(db, "events", eventId));
      if (snap.exists()) setEventData(snap.data());
    };
    fetchEvent();

    const q = query(collection(db, "events", eventId, "guestbook"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const updateDimensions = () => {
      setDimensions({ width: window.innerWidth * 0.98, height: window.innerHeight * 0.90 });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => { unsub(); window.removeEventListener('resize', updateDimensions); };
  }, [eventId]);

  const downloadPDF = async () => {
    setExporting(true);
    const docPdf = new jsPDF('p', 'mm', 'a4');
    const pdfContainer = pdfExportRef.current;
    const pages = pdfContainer.querySelectorAll('.pdf-page');

    try {
      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], {
          scale: 2,
          useCORS: false,
          logging: false,
          backgroundColor: "#0c0c0c"
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

  if (loading || dimensions.width === 0) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
      <Loader2 className="animate-spin text-[#d4af37] mb-4" size={40} />
      <p className="tracking-[0.5em] uppercase text-[10px]">Ouverture du Grimoire...</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#050505] flex items-center justify-center overflow-hidden relative">
      
      <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50">
        {/* 👈 3. MODIFICATION ICI : On passe sur un bouton avec router.back() */}
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-white/30 hover:text-[#d4af37] transition no-underline text-[10px] font-black uppercase tracking-widest bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft size={14} /> Retour Galerie
        </button>
        
        <button 
          onClick={downloadPDF}
          disabled={exporting}
          className="flex items-center gap-2 bg-[#d4af37] hover:bg-white text-black px-6 py-2 rounded-full font-black text-[10px] tracking-[0.2em] transition-all disabled:opacity-50"
        >
          {exporting ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
          {exporting ? "CONSTRUCTION DU PDF..." : "TÉLÉCHARGER LE LIVRE"}
        </button>
      </header>

      {/* LE LIVRE D'OR (VISUEL ÉCRAN) */}
      <div className="relative z-10 w-full h-full flex items-center justify-center px-4">
        <HTMLFlipBook width={dimensions.width / 2} height={dimensions.height} size="stretch" className="book-main" showCover={true} usePortrait={false} ref={bookRef}>
          <div className="cover-page"><div className="cover-inner"><div className="ornament tl"></div><div className="ornament tr"></div><div className="ornament bl"></div><div className="ornament br"></div><div className="flex flex-col items-center justify-center h-full text-center space-y-6"><h2 className="gold-label">LIVRE D'OR</h2><h1 className="gold-title-main">{eventData?.eventName}</h1><div className="gold-separator"></div><p className="gold-brand">PARTYLENS</p></div></div></div>
          <div className="old-page bg-[#111] border-none"></div>
          {messages.map((m, index) => (
            <div key={m.id} className="old-page">
              <div className="parchment-container">
                <div className="gold-frame">
                  <span className="folio-id">Folio {index + 1}</span>
                  <div className="flex flex-col items-center justify-center">
                    <p className="ink-message">"{m.message}"</p>
                    <p className="author-sig">— {m.author || "Anonyme"}</p>
                  </div>
                  <div className="page-ornament-bottom"></div>
                </div>
              </div>
            </div>
          ))}
          <div className="old-page"><div className="parchment-container flex items-center justify-center"><h3 className="font-serif italic text-3xl text-[#3d2b1f] opacity-30 text-center">Fin du Grimoire</h3></div></div>
          <div className="cover-page"><div className="cover-inner opacity-20"></div></div>
        </HTMLFlipBook>
      </div>

      {/* ZONE CACHÉE POUR PDF */}
      <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }} ref={pdfExportRef}>
          <div className="pdf-page cover-page" style={{ width: '800px', height: '1131px' }}>
             <div className="cover-inner"><div className="ornament tl"></div><div className="ornament tr"></div><div className="ornament bl"></div><div className="ornament br"></div><div className="flex flex-col items-center justify-center h-full text-center"><h2 className="gold-label" style={{fontSize:'20px'}}>LIVRE D'OR</h2><h1 className="gold-title-main" style={{fontSize:'80px'}}>{eventData?.eventName}</h1><p className="gold-brand" style={{marginTop:'40px'}}>PARTYLENS</p></div></div>
          </div>
          {messages.map((m, index) => (
            <div key={m.id} className="pdf-page old-page" style={{ width: '800px', height: '1131px' }}>
               <div className="parchment-container">
                 <div className="gold-frame" style={{borderWidth:'2px'}}>
                    <span className="folio-id" style={{fontSize:'16px'}}>Folio {index + 1}</span>
                    <div className="flex flex-col items-center justify-center">
                      <p className="ink-message" style={{fontSize:'45px'}}>"{m.message}"</p>
                      <p className="author-sig" style={{fontSize:'25px', marginTop:'20px'}}>— {m.author || "Anonyme"}</p>
                    </div>
                  </div>
                </div>
            </div>
          ))}
      </div>

      <style jsx global>{`
        :root { --gold: #d4af37; --gold-light: #f9f295; --gold-dark: #8a6d10; }
        
        .cover-page { 
          background-color: #0c0c0c;
          background-image: radial-gradient(circle at 50% 50%, #1a1a1a 0%, #0c0c0c 100%);
        }
        
        .old-page { 
          background-color: #e6d8b9;
          background-image: 
            linear-gradient(45deg, rgba(80, 50, 20, 0.02) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(80, 50, 20, 0.02) 25%, transparent 25%);
          background-size: 4px 4px;
          box-shadow: inset 0 0 100px rgba(0,0,0,0.1);
          position: relative;
        }

        .cover-inner { margin: 40px; height: calc(100% - 80px); border: 2px solid rgba(212, 175, 55, 0.3); position: relative; }
        .ornament { position: absolute; width: 100px; height: 100px; background: var(--gold); mask-size: contain; -webkit-mask-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0 Q50 0 50 50 Q0 50 0 0' fill='black'/%3E%3C/svg%3E"); }
        .tl { top: 0; left: 0; } .tr { top: 0; right: 0; transform: rotate(90deg); } .bl { bottom: 0; left: 0; transform: rotate(-90deg); } .br { bottom: 0; right: 0; transform: rotate(180deg); }
        
        .gold-title-main { font-family: serif; font-size: 5vw; background: linear-gradient(to bottom, var(--gold-light), var(--gold), var(--gold-dark)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 900; font-style: italic; text-align: center; }
        .gold-label { color: var(--gold); letter-spacing: 0.5em; font-weight: 900; }
        .parchment-container { width: 100%; height: 100%; padding: 60px; display: flex; align-items: center; justify-content: center; }
        .gold-frame { width: 100%; height: 100%; border: 1px solid rgba(138, 77, 15, 0.2); display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; padding: 40px; }
        .folio-id { position: absolute; top: 20px; right: 30px; font-style: italic; color: #8a4d0f; font-weight: bold; }
        .ink-message { color: #2d1f15; font-family: serif; font-size: 4vh; text-align: center; font-style: italic; }
        .author-sig { color: #503214; font-family: serif; font-style: italic; font-size: 2.5vh; align-self: flex-end; margin-right: 40px; }
        .gold-brand { color: var(--gold); font-weight: 900; letter-spacing: 0.4em; font-size: 10px; }
        .pdf-page { display: flex; flex-direction: column; position: relative; }
      `}</style>
    </main>
  );
}