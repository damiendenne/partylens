"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ArrowLeft, Baby, Cake, Check, Heart, Lock, Star, Loader2, CreditCard } from "lucide-react";

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
        name: `${theme.label} Gratuit ${i}`,
        cat: theme.id,
        isLocked: false,
        price: "GRATUIT",
        img: getStorageUrl(`designs/${theme.id}/free/${i}.jpg`),
      });
    }
    for (let i = 1; i <= 10; i++) {
      catalogue.push({
        id: `${theme.id}_premium_${i}`,
        name: `${theme.label} Premium ${i}`,
        cat: theme.id,
        isLocked: true,
        price: "0.99€",
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
      return () => { unsubAuth(); unsubEvent(); };
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
        designId: item.id
      });
      router.push(`/admin/${eventId}/dashboard`);
    } catch (e) {
      alert("Erreur lors de la sélection");
    } finally {
      setLoadingId(null);
    }
  };

  // --- FONCTION CORRIGÉE ICI ---
  const handleUnlockFrame = async (item) => {
    if (!user || !eventId) {
      alert("Erreur: session ou événement manquant");
      return;
    }
    setLoadingId(item.id);
    try {
      // On définit les URLs de retour basées sur l'URL actuelle
      const origin = window.location.origin;

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: 'frame_unlock',
          frameId: item.id,
          eventId: eventId,
          userId: user.uid,
          // On passe ces URLs à ton API Checkout
          success_url: `${origin}/admin/catalogue-cadres?eventId=${eventId}&success=true`,
          cancel_url: `${origin}/admin/catalogue-cadres?eventId=${eventId}`
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url; 
      } else {
        throw new Error(data.error);
      }
    } catch (e) {
      alert("Erreur lors de la connexion à Stripe");
      setLoadingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-black p-6 text-white md:p-10">
      <Link href={eventId ? `/admin/${eventId}/dashboard` : "/admin"} className="mb-8 flex items-center gap-2 text-sm text-white/60 hover:text-white">
        <ArrowLeft size={14} />
        Retour {eventId ? "Dashboard" : "Admin"}
      </Link>

      <header className="mb-10 text-left">
        <div className="mb-6">
          <img 
            src="/logo-partylens.png" 
            alt="PartyLens" 
            className="w-48 h-auto drop-shadow-xl" 
          />
        </div>
        
        <h1 className="text-5xl font-black uppercase italic md:text-7xl">
          Catalogue cadres
        </h1>
        <p className="mt-4 text-sm uppercase tracking-[0.25em] text-white/40">
          5 gratuits + 10 premium par thème
        </p>
      </header>

      <div className="mb-10 flex flex-wrap gap-3">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => setFilter(category.id)}
            className={`flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-black uppercase transition ${
              filter === category.id ? "bg-pink-600 text-white" : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
            }`}
          >
            {category.icon} {category.name}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const isUnlocked = eventData?.unlockedFrames?.includes(item.id);
          const canSelect = !item.isLocked || isUnlocked;

          return (
            <div key={item.id} className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.03] transition-all hover:border-white/20">
              <div className="relative aspect-video bg-zinc-900">
                <img
                  src={item.img}
                  alt={item.name}
                  loading="lazy"
                  className={`absolute inset-0 h-full w-full object-cover ${!canSelect ? "blur-[2px]" : ""}`}
                />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute right-4 top-4 rounded-full bg-black/70 px-4 py-2 text-[10px] font-black uppercase">
                  {isUnlocked ? "DÉBLOQUÉ" : item.price}
                </div>

                {!canSelect && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="rounded-full bg-black/80 p-5">
                      <Lock size={24} />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-400">
                  {item.cat}
                </p>
                <h3 className="mt-1 text-xl font-black uppercase">
                  {item.name}
                </h3>

                {canSelect ? (
                  <button 
                    onClick={() => handleSelect(item)}
                    disabled={loadingId !== null}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-pink-600 py-4 text-xs font-black uppercase transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                  >
                    {loadingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    {loadingId === item.id ? "Application..." : "Sélectionner"}
                  </button>
                ) : (
                  <button 
                    onClick={() => handleUnlockFrame(item)}
                    disabled={loadingId !== null}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 py-4 text-xs font-black uppercase hover:bg-white hover:text-black transition-colors"
                  >
                    {loadingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                    Débloquer {item.price}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <CatalogueContent />
    </Suspense>
  );
}