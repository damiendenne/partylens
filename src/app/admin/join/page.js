"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Music, ArrowLeft, LoaderCircle, ArrowRight, Sun, Moon } from "lucide-react";
import Link from "next/link";

export default function JoinRegie() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const router = useRouter();

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

  const handleJoin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const q = query(collection(db, "events"), where("djCode", "==", code.toUpperCase()));
      const snap = await getDocs(q);

      if (snap.empty) {
        alert("Code DJ invalide ou inexistant.");
      } else {
        const eventId = snap.docs[0].id;

        await updateDoc(doc(db, "events", eventId), {
          collaborators: arrayUnion(auth.currentUser.uid),
        });

        alert("Connexion réussie ! La soirée est ajoutée à vos prestations.");
        router.push("/admin");
      }
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`relative min-h-screen w-full flex flex-col items-center justify-center p-6 font-sans overflow-hidden transition-colors duration-300 ${
      darkMode ? 'bg-[#0f071e] text-white' : 'bg-[#f4f4f6] text-slate-900'
    }`}>
      {/* Halos lumineux d'ambiance */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/25 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-500/20 blur-[130px] rounded-full pointer-events-none" />

      {/* Bouton retour en haut à gauche */}
      <Link
        href="/admin"
        className={`absolute top-8 left-8 p-3 rounded-full border backdrop-blur-xl transition-all cursor-pointer shadow-lg active:scale-95 flex items-center justify-center ${
          darkMode 
            ? 'bg-white/10 hover:bg-white/20 border-white/15 text-white' 
            : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
        }`}
      >
        <ArrowLeft size={24} />
      </Link>

      {/* Bouton Toggle Mode en haut à droite */}
      <div className="absolute top-8 right-8 z-50">
        <button 
          onClick={toggleDarkMode}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-lg border backdrop-blur-xl cursor-pointer ${
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

      {/* Carte Glassmorphism */}
      <div className={`relative z-10 w-full max-w-md border p-8 sm:p-10 rounded-[40px] text-center backdrop-blur-2xl transition-colors duration-300 ${
        darkMode 
          ? 'bg-white/[0.05] border-white/10 text-white shadow-[0_25px_60px_rgba(0,0,0,0.6)]' 
          : 'bg-white/80 border-slate-300/80 text-slate-900 shadow-xl'
      }`}>
        <div className="inline-flex p-4 bg-gradient-to-tr from-orange-500/20 to-amber-500/20 border border-orange-400/30 rounded-2xl mb-6 shadow-lg">
          <Music className="text-orange-400" size={40} />
        </div>

        <h2 className="text-3xl font-black italic uppercase tracking-tight bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent mb-2">
          Rejoindre une Régie
        </h2>
        <p className={`text-[10px] uppercase tracking-widest font-black mb-8 ${darkMode ? 'text-orange-200/70' : 'text-orange-600'}`}>
          Entrez le code fourni par l&apos;organisateur
        </p>

        <form onSubmit={handleJoin} className="space-y-6">
          <div className="relative">
            <input
              type="text"
              placeholder="EX: DJ-711"
              className={`w-full p-5 rounded-2xl border text-center text-xl font-black uppercase tracking-widest outline-none transition-all ${
                darkMode 
                  ? 'bg-white/10 border-white/15 text-white placeholder:text-white/20 focus:border-orange-500' 
                  : 'bg-[#eaeaea]/60 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-orange-500'
              }`}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg border border-orange-400/30 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <LoaderCircle className="animate-spin" size={20} />
            ) : (
              <>
                Connecter la Régie
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}