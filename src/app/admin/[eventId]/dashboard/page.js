"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, getDoc, collection, query, orderBy, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Music, Image as ImageIcon, ArrowLeft, Loader2, ExternalLink, Trash2, Layout, Lock, Power, Star, Sun, Moon } from 'lucide-react';
import Link from 'next/link';

export default function DJDashboard() {
  const router = useRouter();
  const { eventId } = useParams();

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('partylens_dark_mode');
    return saved === null ? true : JSON.parse(saved);
  });

  // Gestion du mode jour/nuit avec localStorage
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('partylens_dark_mode', JSON.stringify(newMode));
  };

  useEffect(() => {
    if (!eventId) return;

    let unsubMusic = () => {};
    let unsubPhotos = () => {};

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) { 
        router.push('/login'); 
        return; 
      }

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
        const event = eventDoc.data();
        const isOwner = event.userId === user.uid;
        const isCollaborator = Array.isArray(event.collaborators) && event.collaborators.includes(user.uid);
        if (!isOwner && !isCollaborator) {
          router.push('/admin');
          return;
        }
        setEventData(event);

        const qMusic = query(collection(db, "events", eventId, "musicRequests"), orderBy("createdAt", "desc"));
        unsubMusic = onSnapshot(qMusic, (snap) => setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

        const qPhotos = query(collection(db, "events", eventId, "photos"), orderBy("createdAt", "desc"));
        unsubPhotos = onSnapshot(qPhotos, (snap) => setPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

        setLoading(false);
      } catch (e) {
        console.error(e);
        router.push('/admin');
      }
    });

    return () => {
      unsubAuth();
      unsubMusic();
      unsubPhotos();
    };
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
    <div className={`min-h-screen flex flex-col items-center justify-center transition-colors duration-300 ${darkMode ? 'bg-[#0f071e] text-slate-100' : 'bg-[#f4f4f6] text-slate-900'}`}>
      <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
      <p className="text-xs uppercase tracking-widest font-bold opacity-70">Chargement de la régie...</p>
    </div>
  );

  const isBronze = userData?.plan === "BRONZE";
  const isFinished = eventData?.status === "terminé";

  return (
    <main className={`min-h-screen flex flex-col items-center px-6 py-12 font-sans relative transition-colors duration-300 ${
      darkMode 
        ? 'bg-[#0f071e] text-slate-100 selection:bg-orange-500 selection:text-white' 
        : 'bg-[#f4f4f6] text-slate-900 selection:bg-orange-500 selection:text-white'
    }`}>
      
      {/* BOUTON SWITCH MODE CLAIR / SOMBRE (FIXÉ EN HAUT À DROITE) */}
      <button 
        onClick={toggleDarkMode}
        className={`absolute top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md border ${
          darkMode 
            ? 'bg-white/10 text-amber-300 border-white/20 hover:bg-white/20' 
            : 'bg-[#eaeaea] text-slate-700 border-slate-300 hover:bg-[#dedede]'
        }`}
        aria-label="Changer le mode d'affichage"
      >
        {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        <span>{darkMode ? "Mode Clair" : "Mode Sombre"}</span>
      </button>

      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {darkMode ? (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-purple-600/15 via-orange-600/10 to-transparent rounded-full blur-[120px]"></div>
        ) : (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-purple-200/30 via-orange-100/20 to-transparent rounded-full blur-[100px]"></div>
        )}
      </div>

      <div className="relative z-10 w-full max-w-6xl flex flex-col items-center">
        
        {/* LOGO */}
        <img 
          src="/logo-partylens.png" 
          alt="PartyLens" 
          className="w-[320px] max-w-[80vw] h-auto mb-8 drop-shadow-md" 
        />

        {/* HEADER DE LA RÉGIE */}
        <header className={`w-full mb-10 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 ${
          darkMode 
            ? 'bg-[#170c2c]/80 border border-white/10 shadow-2xl' 
            : 'bg-[#eaeaea]/80 border border-slate-300/80 shadow-slate-300/30'
        }`}>
          <div className="flex items-center gap-4">
            <Link href="/admin" className={`p-3 rounded-xl transition-all border ${
              darkMode ? 'bg-white/[0.04] text-slate-200 border-white/10 hover:bg-white/[0.08]' : 'bg-[#dedede] text-slate-700 border-slate-300 hover:bg-[#dedede]'
            }`}>
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className={`text-xl md:text-2xl font-extrabold tracking-tight flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                RÉGIE LIVE <span className="text-orange-500">/</span> {eventData?.eventName || eventData?.title}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md border ${
                  darkMode ? 'bg-white/5 text-orange-400 border-white/10' : 'bg-[#dedede] text-orange-600 border-slate-300'
                }`}>
                  CODE DJ : {eventData?.djCode || '---'}
                </span>
                {isFinished && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 px-3 py-1 rounded-md border border-red-500/30">
                    SOIRÉE CLÔTURÉE
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* BOUTON AVIS */}
            <Link 
              href="/avis" 
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                darkMode ? 'bg-white/[0.04] text-amber-400 border-white/10 hover:bg-white/[0.08]' : 'bg-[#dedede] text-amber-700 border-slate-300 hover:bg-[#dedede]'
              }`}
            >
              <Star size={15} /> AVIS
            </Link>

            {!isFinished && (
              <button 
                onClick={handleEndEvent} 
                className="flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-red-500/30 cursor-pointer"
              >
                <Power size={15} /> FIN DE SOIRÉE
              </button>
            )}

            {isBronze ? (
              <button 
                onClick={() => alert("🔒 Le catalogue de cadres (Design) est réservé aux packs Silver et VIP Gold.")} 
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-not-allowed border opacity-60 ${
                  darkMode ? 'bg-white/[0.02] text-slate-500 border-white/5' : 'bg-[#dedede] text-slate-400 border-slate-300'
                }`}
              >
                <Lock size={15} /> DESIGN
              </button>
            ) : (
              <Link 
                href={`/admin/catalogue-cadres?eventId=${eventId}`} 
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  darkMode ? 'bg-white/[0.04] text-white border-white/10 hover:bg-white/[0.08]' : 'bg-[#dedede] text-slate-800 border-slate-300 hover:bg-[#dedede]'
                }`}
              >
                <Layout size={15} /> DESIGN
              </Link>
            )}

            {isBronze ? (
              <button 
                onClick={() => alert("🔒 Passez au pack Silver ou VIP Gold pour débloquer le Diaporama.")} 
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-not-allowed border opacity-60 ${
                  darkMode ? 'bg-white/[0.02] text-slate-500 border-white/5' : 'bg-[#dedede] text-slate-400 border-slate-300'
                }`}
              >
                <Lock size={15} /> DIAPORAMA
              </button>
            ) : (
              <Link 
                href={`/admin/${eventId}/live`} 
                target="_blank" 
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-105 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-orange-500/20"
              >
                DIAPORAMA <ExternalLink size={15} />
              </Link>
            )}
          </div>
        </header>

        {/* CONTENU PRINCIPAL */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* SECTION DEMANDES MUSICALES */}
          <div className="lg:col-span-5">
            <div className={`rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-xl ${
              darkMode ? 'bg-[#170c2c]/80 border border-white/10' : 'bg-[#eaeaea]/80 border border-slate-300/80'
            }`}>
              <h2 className={`mb-6 flex items-center gap-2.5 text-base font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                <Music size={18} className="text-orange-500" /> DEMANDES MUSICALES ({requests.length})
              </h2>
              
              {requests.length === 0 ? (
                <div className={`text-center py-12 rounded-2xl border ${darkMode ? 'bg-white/[0.02] border-white/5 text-slate-400' : 'bg-[#f4f4f6] border-slate-300/60 text-slate-600'}`}>
                  <p className="text-xs font-semibold">Aucune demande reçue</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {requests.map(req => (
                    <div key={req.id} className={`flex items-center justify-between p-4 border rounded-2xl transition-all ${
                      darkMode ? 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5 text-slate-200' : 'bg-[#f4f4f6] hover:bg-slate-200 border-slate-300/60 text-slate-800'
                    }`}>
                      <div>
                        <p className="font-bold text-xs tracking-wider mb-1">{req.song}</p>
                        <span className={`text-[10px] font-semibold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>{formatTime(req.createdAt)}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteRequest(req.id)} 
                        className={`p-2 rounded-xl transition-all border-none cursor-pointer ${
                          darkMode ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10 bg-transparent' : 'text-slate-500 hover:text-red-600 hover:bg-red-100 bg-transparent'
                        }`}
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
            <div className={`rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-xl ${
              darkMode ? 'bg-[#170c2c]/80 border border-white/10' : 'bg-[#eaeaea]/80 border border-slate-300/80'
            }`}>
              <h2 className={`mb-6 flex items-center gap-2.5 text-base font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                <ImageIcon size={18} className="text-orange-500" /> GALERIE PHOTOS ({photos.length})
              </h2>

              {isFinished ? (
                <div className={`text-center py-20 rounded-2xl border border-dashed ${darkMode ? 'bg-white/[0.02] border-white/10 text-slate-300' : 'bg-[#f4f4f6] border-slate-300 text-slate-700'}`}>
                  <Lock size={36} className="text-orange-500 mb-3 mx-auto" />
                  <p className="font-bold text-sm">Soirée Clôturée</p>
                  <p className="text-[11px] text-slate-400 mt-1">Accès aux photos transféré à l'organisateur.</p>
                </div>
              ) : photos.length === 0 ? (
                <div className={`text-center py-16 rounded-2xl border ${darkMode ? 'bg-white/[0.02] border-white/5 text-slate-400' : 'bg-[#f4f4f6] border-slate-300/60 text-slate-600'}`}>
                  <p className="text-xs font-semibold">Aucune photo envoyée pour le moment</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-2">
                  {photos.map(photo => (
                    <img 
                      key={photo.id} 
                      src={photo.url} 
                      className={`w-full h-36 object-cover rounded-2xl border transition-all shadow-sm hover:scale-[1.02] ${
                        darkMode ? 'border-white/10 hover:border-orange-500/50' : 'border-slate-300/80 hover:border-orange-500/60'
                      }`} 
                      alt="Photo invité" 
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
