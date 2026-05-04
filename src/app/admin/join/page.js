"use client";
import { useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Music, ArrowLeft, LoaderCircle } from 'lucide-react';
import Link from 'next/link';

export default function JoinRegie() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleJoin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Chercher l'event avec ce code DJ
      const q = query(collection(db, "events"), where("djCode", "==", code.toUpperCase()));
      const snap = await getDocs(q);

      if (snap.empty) {
        alert("Code DJ invalide ou inexistant.");
      } else {
        const eventId = snap.docs[0].id;
        const eventDoc = snap.docs[0];

        // 2. Lier cet event au compte du DJ actuel
        // On ajoute l'UID du DJ dans un tableau "allowedDJs" pour qu'il apparaisse dans sa liste
        await updateDoc(doc(db, "events", eventId), {
          collaborators: arrayUnion(auth.currentUser.uid)
        });

        alert("Connexion réussie ! La soirée est ajoutée à vos prestations.");
        router.push('/admin');
      }
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-sans">
      <Link href="/admin" className="absolute top-10 left-10 text-gray-500 hover:text-white transition-colors">
        <ArrowLeft size={32} />
      </Link>

      <div className="w-full max-w-md bg-[#0f1115] p-10 rounded-[40px] border border-white/5 text-center shadow-2xl">
        <Music className="text-purple-500 mx-auto mb-6" size={48} />
        <h2 className="text-2xl font-black italic uppercase mb-2">Rejoindre une Régie</h2>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-8 font-bold">Entrez le code fourni par l'organisateur</p>
        
        <form onSubmit={handleJoin} className="space-y-6">
          <input 
            type="text" 
            placeholder="Ex: DJ-711" 
            className="w-full p-6 rounded-2xl bg-black border-2 border-purple-500/20 text-white text-center text-xl font-black uppercase outline-none focus:border-purple-500 transition-all"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <button 
            disabled={loading}
            className="w-full p-5 rounded-2xl bg-purple-600 text-white font-black uppercase tracking-widest hover:bg-purple-700 transition cursor-pointer border-none flex items-center justify-center gap-3"
          >
            {loading ? <LoaderCircle className="animate-spin" /> : "Connecter la Régie"}
          </button>
        </form>
      </div>
    </main>
  );
}