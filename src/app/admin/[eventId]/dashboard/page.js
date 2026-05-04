"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, getDoc, collection, query, orderBy, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Music, Image as ImageIcon, ArrowLeft, LoaderCircle, ExternalLink, Trash2, Layout, Lock, Power, Star } from 'lucide-react';
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
      setEventData(prev => ({...prev, status: "terminé"}));
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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
      <LoaderCircle className="animate-spin text-[#ff0080] mb-4" size={40} />
      <p className="text-[10px] uppercase tracking-[0.4em] font-black opacity-50 italic">Chargement régie...</p>
    </div>
  );

  const isBronze = userData?.plan === "BRONZE";
  const isFinished = eventData?.status === "terminé";

  return (
    <main className="min-h-screen relative overflow-hidden p-4 md:p-10 bg-black text-white">
      <div className="bg-blobs"><div className="blob blob-pink"></div><div className="blob blob-purple"></div><div className="blob blob-blue"></div></div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        <div className="mb-6 flex justify-center md:justify-start">
          <img 
            src="/logo-partylens.png" 
            alt="PartyLens" 
            className="w-48 h-auto drop-shadow-xl" 
          />
        </div>

        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <Link href="/admin" className="p-4 glass-card rounded-2xl text-gray-400 hover:text-white transition-all">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter leading-none">
                Régie Live <span className="text-[#ff0080]">/</span> {eventData?.eventName}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff0080]">CODE DJ : {eventData?.djCode}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            
            {/* NOUVEAU BOUTON AVIS ICI */}
            <Link href="/avis" className="flex items-center gap-3 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all border border-yellow-500/30 no-underline shadow-xl">
              <Star size={16} /> AVIS
            </Link>

            {!isFinished && (
              <button onClick={handleEndEvent} className="flex items-center gap-3 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all border border-red-500/30 cursor-pointer shadow-xl">
                <Power size={16} /> FIN DE SOIRÉE
              </button>
            )}

            {isBronze ? (
              <button onClick={() => alert("🔒 Le catalogue de cadres (Design) est réservé aux packs Silver et VIP Gold.")} className="flex items-center gap-3 bg-gray-800 text-gray-400 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all cursor-not-allowed border border-white/5 opacity-80">
                <Lock size={16} /> DESIGN
              </button>
            ) : (
              <Link href={`/admin/catalogue-cadres?eventId=${eventId}`} className="flex items-center gap-3 bg-white/10 hover:bg-white/20 text-white px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all border border-white/10 no-underline shadow-xl">
                <Layout size={16} /> DESIGN
              </Link>
            )}

            {isBronze ? (
              <button onClick={() => alert("🔒 Passez au pack Silver ou VIP Gold pour débloquer le Diaporama.")} className="flex items-center gap-3 bg-gray-800 text-gray-400 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all cursor-not-allowed border border-white/5 opacity-80">
                <Lock size={16} /> Diaporama
              </button>
            ) : (
              <Link href={`/admin/${eventId}/live`} target="_blank" className="flex items-center gap-3 bg-[#ff0080] hover:bg-[#e60073] text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(255,0,128,0.3)] no-underline">
                DIAPORAMA <ExternalLink size={16} />
              </Link>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <div className="glass-card rounded-[40px] p-8">
              <h2 className="mb-6 flex items-center gap-3 text-white text-xl font-black uppercase italic tracking-wider"><Music size={20}/> Demandes ({requests.length})</h2>
              {requests.map(req => (
                <div key={req.id} className="flex justify-between p-4 bg-white/5 mb-2 rounded-xl text-white">
                  <div><p className="font-bold">{req.song}</p><small className="text-gray-400">{formatTime(req.createdAt)}</small></div>
                  <button onClick={() => handleDeleteRequest(req.id)} className="text-gray-500 hover:text-red-500 bg-transparent border-none cursor-pointer transition-colors"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="glass-card rounded-[40px] p-8">
              <h2 className="mb-6 flex items-center gap-3 text-white text-xl font-black uppercase italic tracking-wider"><ImageIcon size={20}/> Photos ({photos.length})</h2>
              {isFinished ? (
                <div className="text-center py-20 bg-black/40 rounded-3xl border border-dashed border-white/10">
                  <Lock size={40} className="text-[#ff0080] mb-4 mx-auto" />
                  <p className="font-bold uppercase text-gray-400">Soirée Clôturée</p>
                  <p className="text-[10px] text-gray-600 mt-2 italic uppercase">Accès aux photos transféré à l'organisateur.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {photos.map(photo => <img key={photo.id} src={photo.url} className="w-full h-32 object-cover rounded-xl border border-white/10" alt="" />)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{` .bg-blobs { position: fixed; inset: 0; z-index: 0; overflow: hidden; background: black; } .blob { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.2; } .blob-pink { top: -10%; left: -10%; width: 50vw; height: 50vw; background: #ff0080; } .blob-purple { bottom: -10%; right: -10%; width: 60vw; height: 60vw; background: #7928ca; } .blob-blue { top: 20%; right: 10%; width: 30vw; height: 30vw; background: #0072ff; } .glass-card { background: rgba(255,255,255,0.02); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.05); } `}</style>
    </main>
  );
}