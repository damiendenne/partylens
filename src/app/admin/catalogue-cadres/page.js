"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ArrowLeft, Baby, Cake, Check, Heart, Star, Loader2, Sun, Moon } from "lucide-react";

const BUCKET = "partylens-94ad0.firebasestorage.app";

const CATEGORIES = [
  { id: "all", name: "Tous", icon: <Star size={14} /> },
  { id: "mariage", name: "Mariage", icon: <Heart size={14} /> },
  { id: "anniversaire", name: "Anniversaire", icon: <Cake size={14} /> },
  { id: "bapteme", name: "Baptême", icon: <Baby size={14} /> },
  { id: "fete", name: "Fête", icon: <Star size={14} /> },
];

const getStorageUrl = (path) => {
  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(path)}?alt=media`;
};

const generateCatalogue = () => {
  const themes = [
    { id: "mariage", label: "Mariage" },
    { id: "anniversaire", label: "Anniversaire" },
    { id: "bapteme", label: "Baptême" },
    { id: "fete", label: "Fête" },
  ];

  const catalogue = [];

  themes.forEach((theme) => {
    for (let i = 1; i <= 5; i++) {
      catalogue.push({
        id: `${theme.id}_free_${i}`,
        name: `${theme.label} ${i}`,
        cat: theme.id,
        isLocked: false,
        price: "GRATUIT",
        img: getStorageUrl(`designs/${theme.id}/free/${i}.jpg`),
      });
    }

    for (let i = 1; i <= 13; i++) {
      catalogue.push({
        id: `${theme.id}_premium_${i}`,
        name: `${theme.label} ${i + 5}`,
        cat: theme.id,
        isLocked: false,
        price: "GRATUIT",
        img: getStorageUrl(`designs/${theme.id}/premium/${i}.jpg`),
      });
    }
  });

  return catalogue;
};

const DATA = generateCatalogue();

function CatalogueContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = searchParams.get("eventId");

  const [user, setUser] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loadingId, setLoadingId] = useState(null);
  const [darkMode, setDarkMode] = useState(true);

  // Gestion du mode jour/nuit avec localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('partylens_dark_mode');
    if (savedMode !== null) {
      setDarkMode(JSON.parse(savedMode));
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('partylens_dark_mode', JSON.stringify(newMode));
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    if (eventId) {
      const unsubEvent = onSnapshot(doc(db, "events", eventId), (snap) => {
        if (snap.exists()) setEventData(snap.data());
      });

      return () => {
        unsubAuth();
        unsubEvent();
      };
    }

    return () => unsubAuth();
  }, [eventId]);

  const items = useMemo(() => {
    return filter === "all" ? DATA : DATA.filter((item) => item.cat === filter);
  }, [filter]);

  const handleSelect = async (item) => {
    if (!eventId) return;

    setLoadingId(item.id);

    try {
      const eventRef = doc(db, "events", eventId);

      await updateDoc(eventRef, {
        frameUrl: item.img,
        backgroundUrl: item.img,
        designId: item.id,
      });

      router.push(`/admin/${eventId}/dashboard`);
    } catch (e) {
      alert("Erreur lors de la sélection");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <main className={`min-h-screen p-6 md:p-12 relative overflow-x-hidden font-sans transition-colors duration-300 ${
      darkMode ? 'bg-[#0f071e] text-slate-100' : 'bg-[#f4f4f6] text-slate-900'
    }`}>
      
      {/* ARRIÈRE-PLAN LUMINEUX ET DÉGRADÉS */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {darkMode ? (
          <>
            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-r from-purple-600/15 via-orange-600/10 to-transparent rounded-full blur-[140px]"></div>
          </>
        ) : (
          <>
            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-r from-purple-200/30 via-orange-100/20 to-transparent rounded-full blur-[120px]"></div>
          </>
        )}
      </div>

      <div className="w-full max-w-7xl mx-auto relative z-10">
        
        {/* BARRE SUPÉRIEURE (BOUTON RETOUR & TOGGLE MODE) */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href={eventId ? `/admin/${eventId}/dashboard` : "/admin"}
            className={`inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider px-4 py-2.5 rounded-2xl border backdrop-blur-xl shadow-md transition-all active:scale-95 ${
              darkMode 
                ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white/80 hover:text-white' 
                : 'bg-[#eaeaea] hover:bg-[#dedede] border-slate-300 text-slate-700'
            }`}
          >
            <ArrowLeft size={16} />
            RETOUR {eventId ? "DASHBOARD" : "ADMIN"}
          </Link>

          <button 
            onClick={toggleDarkMode}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-lg border backdrop-blur-xl ${
              darkMode 
                ? 'bg-white/10 text-amber-300 border-white/20 hover:bg-white/20' 
                : 'bg-[#eaeaea] text-slate-700 border-slate-300 hover:bg-[#dedede]'
            }`}
            aria-label="Changer le mode d'affichage"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            <span className="text-[10px] uppercase tracking-wider">{darkMode ? "Clair" : "Sombre"}</span>
          </button>
        </div>

        {/* HEADER */}
        <header className="mb-10 text-left">
          <div className="mb-6">
            <img
              src="/logo-partylens.png"
              alt="PartyLens"
              className="h-auto w-48 drop-shadow-md"
            />
          </div>

          <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tight">
            CATALOGUE <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">CADRES</span>
          </h1>

          <p className={`mt-2 text-[11px] font-black uppercase tracking-[0.25em] ${darkMode ? 'text-orange-300/80' : 'text-orange-600'}`}>
            Tous les cadres sont 100% gratuits
          </p>
        </header>

        {/* ONGLETS CATEGORIES */}
        <div className="mb-10 flex flex-wrap gap-3">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setFilter(category.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black uppercase text-[11px] tracking-wider transition-all border cursor-pointer ${
                filter === category.id
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 border-orange-400/50 text-white shadow-lg scale-105"
                  : darkMode
                    ? "bg-white/10 border-white/15 text-white/70 hover:bg-white/20 hover:text-white backdrop-blur-md"
                    : "bg-[#eaeaea] border-slate-300 text-slate-700 hover:bg-[#dedede]"
              }`}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>

        {/* GRILLE DES CADRES */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            return (
              <div
                key={item.id}
                className={`overflow-hidden rounded-[36px] border backdrop-blur-2xl shadow-xl transition-all hover:scale-[1.01] ${
                  darkMode 
                    ? 'border-white/15 bg-white/[0.07] hover:border-white/30 hover:shadow-[0_20px_60px_rgba(249,115,22,0.2)]' 
                    : 'border-slate-300/80 bg-white/70 hover:border-slate-400 shadow-slate-200'
                }`}
              >
                <div className="relative aspect-video bg-black/40 overflow-hidden">
                  <img
                    src={item.img}
                    alt={item.name}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                  <div className="absolute right-4 top-4 rounded-full bg-orange-500/90 border border-orange-300/40 backdrop-blur-md px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-white shadow-lg">
                    GRATUIT
                  </div>
                </div>

                <div className="p-6">
                  <p className={`text-[10px] font-black uppercase tracking-[0.25em] ${darkMode ? 'text-amber-300' : 'text-orange-600'}`}>
                    {item.cat}
                  </p>

                  <h3 className={`mt-1 text-xl font-black uppercase italic tracking-wide ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {item.name}
                  </h3>

                  <button
                    onClick={() => handleSelect(item)}
                    disabled={loadingId !== null}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 py-4 text-xs font-black uppercase tracking-[0.2em] text-white shadow-md border border-orange-400/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {loadingId === item.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}

                    {loadingId === item.id ? "APPLICATION..." : "SÉLECTIONNER"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f071e]" />}>
      <CatalogueContent />
    </Suspense>
  );
}