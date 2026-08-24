"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ArrowLeft, Baby, Cake, Check, Heart, Star, Loader2 } from "lucide-react";

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
    <main className="min-h-screen bg-gradient-to-b from-[#2d104d] via-[#210a3b] to-[#140427] p-6 md:p-12 text-white relative overflow-x-hidden font-sans">
      
      {/* VAGUES LUMINEUSES ET DÉGRADÉS D'ARRIÈRE-PLAN */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <svg className="absolute -top-12 left-0 w-full h-[500px] text-orange-500/30 blur-xl opacity-80" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,160L60,176C120,192,240,224,360,213.3C480,203,600,149,720,154.7C840,160,960,224,1080,229.3C1200,235,1320,181,1380,154.7L1440,128L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,0,0Z"></path>
        </svg>

        <svg className="absolute top-[30%] -left-20 w-[130%] h-[550px] text-amber-500/25 blur-2xl transform rotate-3" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,96L80,122.7C160,149,320,203,480,208C640,213,800,171,960,149.3C1120,128,1280,128,1360,128L1440,128L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
        </svg>

        <svg className="absolute bottom-0 right-0 w-full h-[500px] text-orange-600/30 blur-xl opacity-80" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,224L60,213.3C120,203,240,181,360,186.7C480,192,600,224,720,218.7C840,213,960,171,1080,160C1200,149,1320,171,1380,181.3L1440,192L1440,320L1380,320C1280,320,1120,320,1080,320C960,320,840,320,720,320C600,320,160,320,0,320Z"></path>
        </svg>

        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-r from-orange-500/25 via-amber-400/20 to-orange-600/20 rounded-full blur-[140px]"></div>
      </div>

      <div className="w-full max-w-7xl mx-auto relative z-10">
        
        {/* BOUTON RETOUR */}
        <Link
          href={eventId ? `/admin/${eventId}/dashboard` : "/admin"}
          className="mb-8 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-white/80 hover:text-white transition-all bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-2xl border border-white/20 backdrop-blur-xl shadow-md active:scale-95"
        >
          <ArrowLeft size={16} />
          RETOUR {eventId ? "DASHBOARD" : "ADMIN"}
        </Link>

        {/* HEADER */}
        <header className="mb-10 text-left">
          <div className="mb-6">
            <img
              src="/logo-partylens.png"
              alt="PartyLens"
              className="h-auto w-48 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
            />
          </div>

          <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tight">
            CATALOGUE <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]">CADRES</span>
          </h1>

          <p className="mt-2 text-orange-200/80 text-[11px] font-black uppercase tracking-[0.25em]">
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
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 border-orange-400/50 text-white shadow-[0_0_25px_rgba(249,115,22,0.4)] scale-105"
                  : "bg-white/10 border-white/15 text-white/70 hover:bg-white/20 hover:text-white backdrop-blur-md"
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
                className="overflow-hidden rounded-[36px] border border-white/15 bg-white/[0.07] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all hover:border-white/30 hover:shadow-[0_20px_60px_rgba(249,115,22,0.2)] hover:scale-[1.01]"
              >
                <div className="relative aspect-video bg-black/40 overflow-hidden">
                  <img
                    src={item.img}
                    alt={item.name}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                  <div className="absolute right-4 top-4 rounded-full bg-orange-500/80 border border-orange-300/40 backdrop-blur-md px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-white shadow-lg">
                    GRATUIT
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-300">
                    {item.cat}
                  </p>

                  <h3 className="mt-1 text-xl font-black uppercase italic tracking-wide text-white">
                    {item.name}
                  </h3>

                  <button
                    onClick={() => handleSelect(item)}
                    disabled={loadingId !== null}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 py-4 text-xs font-black uppercase tracking-[0.2em] text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] border border-orange-400/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer"
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
    <Suspense fallback={<div className="min-h-screen bg-[#2d104d]" />}>
      <CatalogueContent />
    </Suspense>
  );
}