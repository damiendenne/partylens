"use client";
import { useState, useEffect, use } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera, Music, Share2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';

export default function GuestPage({ params }) {
  const unwrappedParams = use(params);
  const eventId = unwrappedParams.eventId;

  const [file, setFile] = useState(null);
  const [song, setSong] = useState("");
  const [artist, setArtist] = useState("");
  const [loading, setLoading] = useState(false);
  const [eventData, setEventData] = useState(null);
  const [notify, setNotify] = useState({ show: false, msg: "" });
  
  // --- AJOUT : État pour vérifier si on est sur le client ---
  const [mounted, setMounted] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

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

  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    try {
      const storageRef = ref(storage, `events/${eventId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await addDoc(collection(db, "events", eventId, "photos"), { url, createdAt: serverTimestamp() });
      setNotify({ show: true, msg: "📸 Photo publiée !" });
      setFile(null);
      setTimeout(() => setNotify({ show: false, msg: "" }), 3000);
    } catch (err) { console.error(err); }
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

  return (
    <main className="min-h-screen p-6 flex flex-col items-center relative overflow-hidden bg-black text-white">
      <div className="bg-blobs">
        <div className="blob blob-purple"></div>
        <div className="blob blob-pink"></div>
      </div>

      <header className="w-full max-w-md flex justify-between items-center mb-10 z-10">
          <Link href={`/admin`} className="p-2 text-gray-500 hover:text-white transition"><ArrowLeft size={24} /></Link>
          <img src="/logo-partylens.png" alt="PartyLens" className="w-40 h-auto" />
          <button className="p-3 glass-card rounded-full"><Share2 size={20}/></button>
      </header>

      <div className="w-full max-w-md space-y-6 z-10 animate-in fade-in slide-in-from-bottom duration-700">
        
        <section className="glass-card p-10 rounded-[50px] text-center">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-2">{eventData?.eventName || "SOIRÉE"}</h1>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/20 border border-purple-500/40 rounded-full mb-8">
            <Music size={14} className="text-purple-400" />
            <span className="text-[11px] font-black uppercase text-purple-400 tracking-widest italic">CODE DJ : {eventData?.djCode || "..."}</span>
          </div>

          <div className="bg-white p-6 rounded-[40px] inline-block shadow-[0_0_50px_rgba(255,255,255,0.1)] mb-6 border-8 border-white/5">
            {mounted ? (
              <QRCodeSVG value={currentUrl} size={180} />
            ) : (
              <div style={{ width: 180, height: 180 }} className="bg-gray-800 animate-pulse rounded-lg" />
            )}
          </div>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.4em]">Partagez ce QR Code avec vos amis</p>
        </section>

        <section className="glass-card p-8 rounded-[40px]">
          <h2 className="text-lg font-black italic uppercase mb-6 flex items-center gap-3"><Camera size={20} className="text-pink-500" /> Photo en direct</h2>
          <form onSubmit={handlePhotoUpload} className="space-y-4">
            <label className="block border-2 border-dashed border-white/10 rounded-[30px] p-10 text-center bg-white/[0.02] cursor-pointer hover:bg-white/[0.05] transition relative">
              {/* FIX ICI : Retrait de capture="environment" pour activer la galerie */}
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setFile(e.target.files[0])} 
                className="hidden" 
              />
              <Camera size={32} className="text-gray-700 mx-auto mb-3" />
              <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">
                {file ? file.name : "Choisir ou prendre une photo"}
              </span>
            </label>
            {file && (
              <button type="submit" disabled={loading} className="w-full py-5 bg-pink-600 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-pink-600/20">
                {loading ? "Envoi..." : "Publier sur le mur 🚀"}
              </button>
            )}
          </form>
        </section>

        <section className="glass-card p-8 rounded-[40px]">
          <h2 className="text-lg font-black italic uppercase mb-6 flex items-center gap-3"><Music size={20} className="text-purple-500" /> Demander un titre</h2>
          <form onSubmit={handleMusicRequest} className="space-y-4">
            <input type="text" placeholder="Artiste" value={artist} onChange={(e) => setArtist(e.target.value)} className="w-full bg-black border border-white/10 p-5 rounded-2xl outline-none focus:border-purple-500 transition text-sm text-white font-bold" />
            <input type="text" placeholder="Titre" value={song} onChange={(e) => setSong(e.target.value)} className="w-full bg-black border border-white/10 p-5 rounded-2xl outline-none focus:border-purple-500 transition text-sm text-white font-bold" />
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

      <style jsx>{`
        .bg-blobs { position: fixed; inset: 0; z-index: 0; overflow: hidden; }
        .blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.15; }
        .blob-purple { top: -10%; left: -10%; width: 400px; height: 400px; background: #7c3aed; }
        .blob-pink { bottom: -10%; right: -10%; width: 400px; height: 400px; background: #db2777; }
        .glass-card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.05); }
      `}</style>
    </main>
  );
}