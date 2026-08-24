"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, getDoc, collection, query, orderBy, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Music, Image as ImageIcon, ArrowLeft, Loader2, ExternalLink, Trash2, Layout, Lock, Power, Star, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function DJDashboard() {
  const router = useRouter();
  const { eventId } = useParams();

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    if (!eventId) return;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push('/login'); return; }

      try {
        const uDoc = await getDoc(doc(db, "users", user.uid));
        const uData = uDoc.data();
        setUserData(uData);

        if (uData?.role !== 'organisateur' && uData?.role !== 'dj') {
          router.push('/admin');
          return;
        }

        const eventDoc = await getDoc(doc(db, "events", eventId));
        if (!eventDoc.exists()) {
          router.push('/admin');
          return;
        }
        setEventData(eventDoc.data());

        const qMusic = query(collection(db, "events", eventId, "musicRequests"), orderBy("createdAt", "desc"));
        const unsubMusic = onSnapshot(qMusic, (snap) => setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

        const qPhotos = query(collection(db, "events", eventId, "photos"), orderBy("createdAt", "desc"));
        const unsubPhotos = onSnapshot(qPhotos, (snap) => setPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

        setLoading(false);
        return () => { unsubMusic(); unsubPhotos(); };

      } catch (e) {
        console.error(e);
        router.push('/admin');
      }
    });

    return () => unsubAuth();
  }, [eventId, router]);

  const handleEndEvent = async () => {
    if (!confirm("Voulez-vous vraiment clôturer cette soirée ? L'organisateur pourra télécharger les photos.")) return;
    try {
      await updateDoc(doc(db, "events", eventId), { status: "terminé", closedAt: serverTimestamp() });
      setEventData(prev => ({ ...prev, status: "terminé" }));
    } catch (e) { console.error(e); }
  };

  const handleDeleteRequest = async (id) => {
    try { await deleteDoc(doc(db, "events", eventId, "musicRequests", id)); } catch (e) { console.error(e); }
  };

  const formatTime = (firebaseDate) => {
    if (!firebaseDate) return "";
    return firebaseDate.toDate().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-[#2d104d] via-[#210a3b] to-[#140427] flex flex-col items-center justify-center text-white">
      <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
      <p className="text-[10px] uppercase tracking-[0.4em] font-black opacity-70 italic">Chargement régie...</p>
    </div>
  );

  const isBronze = userData?.plan === "BRONZE";
  const isFinished = eventData?.status === "terminé";

  return (
    <main className="min-h-screen relative overflow-x-hidden p-4 md:p-10 font-sans bg-gradient-to-b from-[#2d104d] via-[#210a3b] to-[#140427] text-white pb-16">
      
      {/* VAGUES LUMINEUSES ET FONDS GRAPHIQUES */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <svg className="absolute -top-12 left-0 w-full h-[500px] text-orange-500/20 blur-2xl opacity-70" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,160L60,176C120,192,240,224,360,213.3C480,203,600,149,720,154.7C840,160,960,224,1080,229.3C1200,235,1320,181,1380,154.7L1440,128L1440,0L0,0Z"></path>
        </svg>
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-r from-orange-500/20 via-amber-400/15 to-pink-500/10 rounded-full blur-[140px]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* LOGO */}
        <div className="mb-6 flex justify-center md:justify-start">
          <img 
            src="/logo-partylens.png" 
            alt="PartyLens" 
            className="w-44 h-auto drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]" 
          />
        </div>

        {/* HEADER DE LA RÉGIE */}
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 glass-card p-6 md:p-8 rounded-[35px] border border-white/15 shadow-2xl">
          <div className="flex items-center gap-5">
            <Link href="/admin" className="p-4 glass-card hover:bg-white/15 rounded-2xl text-gray-300 hover:text-white transition-all border border-white/10">
              <ArrowLeft size={22} />
            </Link>
            <div>
              <h1 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter leading-none flex items-center gap-2">
                RÉGIE LIVE <span className="text-orange-500">/</span> {eventData?.eventName || eventData?.title}
              </h1>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full border border-orange-500/30">
                  CODE DJ : {eventData?.djCode || '---'}
                </span>
                {isFinished && (
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-red-500/20 text-red-300 px-3 py-1 rounded-full border border-red-500/30">
                    SOIRÉE CLÔTURÉE
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            
            {/* BOUTON AVIS */}
            <Link 
              href="/avis" 
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-amber-500/30 no-underline shadow-lg"
            >
              <Star size={16} /> AVIS
            </Link>

            {!isFinished && (
              <button 
                onClick={handleEndEvent} 
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-600 text-red-400 hover:text-white px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/40 cursor-pointer shadow-lg"
              >
                <Power size={16} /> FIN DE SOIRÉE
              </button>
            )}

            {isBronze ? (
              <button 
                onClick={() => alert("🔒 Le catalogue de cadres (Design) est réservé aux packs Silver et VIP Gold.")} 
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-black/40 text-gray-500 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-not-allowed border border-white/5 opacity-70"
              >
                <Lock size={16} /> DESIGN
              </button>
            ) : (
              <Link 
                href={`/admin/catalogue-cadres?eventId=${eventId}`} 
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/15 no-underline shadow-lg"
              >
                <Layout size={16} /> DESIGN
              </Link>
            )}

            {isBronze ? (
              <button 
                onClick={() => alert("🔒 Passez au pack Silver ou VIP Gold pour débloquer le Diaporama.")} 
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-black/40 text-gray-500 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-not-allowed border border-white/5 opacity-70"
              >
                <Lock size={16} /> DIAPORAMA
              </button>
            ) : (
              <Link 
                href={`/admin/${eventId}/live`} 
                target="_blank" 
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:scale-[1.02] text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] no-underline"
              >
                DIAPORAMA <ExternalLink size={16} />
              </Link>
            )}
          </div>
        </header>

        {/* CONTENU PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* SECTION DEMANDES MUSICALES */}
          <div className="lg:col-span-5">
            <div className="glass-card rounded-[35px] p-6 md:p-8 border border-white/15 shadow-xl">
              <h2 className="mb-6 flex items-center gap-3 text-orange-300 text-lg font-black uppercase italic tracking-wider">
                <Music size={20} /> DEMANDES ({requests.length})
              </h2>
              
              {requests.length === 0 ? (
                <div className="text-center py-12 bg-black/30 rounded-2xl border border-white/5">
                  <p className="text-xs uppercase font-bold text-gray-400">Aucune demande reçue</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {requests.map(req => (
                    <div key={req.id} className="flex items-center justify-between p-4 bg-black/30 hover:bg-black/50 border border-white/10 rounded-2xl text-white transition-all">
                      <div>
                        <p className="font-extrabold uppercase text-xs tracking-wider">{req.song}</p>
                        <small className="text-[10px] font-bold text-orange-400/80">{formatTime(req.createdAt)}</small>
                      </div>
                      <button 
                        onClick={() => handleDeleteRequest(req.id)} 
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border-none bg-transparent cursor-pointer"
                        title="Supprimer la demande"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECTION GALERIE PHOTOS */}
          <div className="lg:col-span-7">
            <div className="glass-card rounded-[35px] p-6 md:p-8 border border-white/15 shadow-xl">
              <h2 className="mb-6 flex items-center gap-3 text-orange-300 text-lg font-black uppercase italic tracking-wider">
                <ImageIcon size={20} /> PHOTOS ({photos.length})
              </h2>

              {isFinished ? (
                <div className="text-center py-20 bg-black/30 rounded-3xl border border-dashed border-white/10">
                  <Lock size={40} className="text-orange-500 mb-4 mx-auto" />
                  <p className="font-black uppercase text-sm text-gray-300">Soirée Clôturée</p>
                  <p className="text-[10px] text-gray-400 mt-2 italic uppercase">Accès aux photos transféré à l'organisateur.</p>
                </div>
              ) : photos.length === 0 ? (
                <div className="text-center py-16 bg-black/30 rounded-2xl border border-white/5">
                  <p className="text-xs uppercase font-bold text-gray-400">Aucune photo envoyée pour le moment</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-2">
                  {photos.map(photo => (
                    <img 
                      key={photo.id} 
                      src={photo.url} 
                      className="w-full h-36 object-cover rounded-2xl border border-white/15 hover:border-orange-400/60 transition-all shadow-md hover:scale-[1.02]" 
                      alt="Photo invité" 
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <style jsx global>{`
        .glass-card { 
          background: rgba(255, 255, 255, 0.07); 
          backdrop-filter: blur(40px); 
        }
      `}</style>
    </main>
  );
}