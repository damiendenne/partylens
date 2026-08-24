"use client";

import { useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Music, ArrowLeft, LoaderCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function JoinRegie() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
    <main className="relative min-h-screen w-full bg-gradient-to-b from-[#2d104d] via-[#210a3b] to-[#140427] flex flex-col items-center justify-center p-6 font-sans overflow-hidden text-white">
      {/* Halos lumineux d'ambiance */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-500/15 blur-[130px] rounded-full pointer-events-none" />

      {/* Bouton retour */}
      <Link
        href="/admin"
        className="absolute top-8 left-8 p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-xl text-white transition-all cursor-pointer shadow-lg active:scale-95"
      >
        <ArrowLeft size={24} />
      </Link>

      {/* Carte Glassmorphism */}
      <div className="relative z-10 w-full max-w-md bg-white/[0.05] border border-white/10 p-8 sm:p-10 rounded-[40px] text-center shadow-[0_25px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
        <div className="inline-flex p-4 bg-gradient-to-tr from-orange-500/20 to-amber-500/20 border border-orange-400/30 rounded-2xl mb-6 shadow-[0_0_20px_rgba(249,115,22,0.3)]">
          <Music className="text-orange-400" size={40} />
        </div>

        <h2 className="text-3xl font-black italic uppercase tracking-tight bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent mb-2">
          Rejoindre une Régie
        </h2>
        <p className="text-[10px] text-orange-200/60 uppercase tracking-widest font-black mb-8">
          Entrez le code fourni par l&apos;organisateur
        </p>

        <form onSubmit={handleJoin} className="space-y-6">
          <div className="relative">
            <input
              type="text"
              placeholder="EX: DJ-711"
              className="w-full p-5 rounded-2xl bg-white/10 border border-white/15 text-white text-center text-xl font-black uppercase tracking-widest outline-none focus:border-orange-500 transition-all placeholder:text-white/20"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-[0_0_25px_rgba(249,115,22,0.4)] border border-orange-400/30 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
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