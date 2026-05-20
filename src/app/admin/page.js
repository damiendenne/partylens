"use client";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, doc, updateDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, Loader2, Package, EyeOff, LogOut, Download, AlertTriangle, Sparkles, Plus } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [myEvents, setMyEvents] = useState([]);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({ eventName: "", includeUsb: false });
  const [loading, setLoading] = useState(true);
  const [activeEventId, setActiveEventId] = useState("");
  const [activeEventData, setActiveEventData] = useState(null);
  const [notify, setNotify] = useState({ show: false, msg: "" });
  const [shippingData, setShippingData] = useState({ name: "", address: "", zip: "", city: "", phone: "" });

  useEffect(() => {
    let unsubUser = () => {};
    let unsubEvents = () => {};

    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        unsubUser = onSnapshot(doc(db, "users", currentUser.uid), async (snap) => {
          let uData = snap.exists() ? snap.data() : null;

          // LOGIQUE AUTO-DÉMO : Si l'utilisateur arrive depuis le bouton de test gratuit du site
          const isDemoRequested = window.location.search.includes('demo=true');
          if (!uData && isDemoRequested) {
            const newUserData = {
              uid: currentUser.uid,
              email: currentUser.email,
              plan: "DEMO",
              lastPaymentDate: serverTimestamp(),
              role: "organisateur",
              createdAt: serverTimestamp()
            };
            await setDoc(doc(db, "users", currentUser.uid), newUserData);
            uData = newUserData;
          }

          if (uData) {
            setUserData(uData);
            unsubEvents();

            let qEvents = query(
              collection(db, "events"),
              where("userId", "==", currentUser.uid),
              orderBy("createdAt", "desc")
            );

            unsubEvents = onSnapshot(qEvents, (eSnap) => {
              setMyEvents(eSnap.docs.map(d => ({ id: d.id, ...d.data() })));
              setLoading(false);
            });
          } else {
            setLoading(false);
          }
        });
      } else {
        router.push('/login');
      }
    });

    return () => { unsubAuth(); unsubUser(); unsubEvents(); };
  }, [router]);

  const isPlanValid = () => {
    if (!userData?.plan) return false;
    if (userData.plan === "DEMO") return true; // Les plans de test sont toujours valides pour créer 1 projet d'essai

    const lastPay = typeof userData.lastPaymentDate?.toDate === 'function'
      ? userData.lastPaymentDate.toDate()
      : new Date(userData.lastPaymentDate || Date.now());

    const now = new Date();
    const diffInDays = (now - lastPay) / (1000 * 60 * 60 * 24);
    const limitDays = userData.plan === "VIP GOLD" ? 365 : 45; // 45 jours de marge pour couvrir la soirée unique

    return diffInDays <= limitDays;
  };

  const handleStartCreate = () => {
    if (userData?.plan === "DEMO" && myEvents.length >= 1) {
      setNotify({ show: true, msg: "OFFRE D'ESSAI LIMITÉE À 1 ÉVÉNEMENT COMPTE." });
      setTimeout(() => setNotify({ show: false, msg: "" }), 4000);
      return;
    }
    
    if (!isPlanValid()) {
      router.push('/admin/plan-selection');
      return;
    }
    setStep(1);
  };

  const executeCreateEvent = async () => {
    setLoading(true);
    try {
      const djCode = "DJ-" + Math.floor(100 + Math.random() * 900);
      const eventPayload = {
        userId: user.uid,
        eventName: formData.eventName,
        djCode,
        plan: userData?.plan || 'BRONZE',
        createdAt: serverTimestamp(),
        status: "active",
        usbOrdered: formData.includeUsb,
        isDemo: userData?.plan === "DEMO"
      };

      const docRef = await addDoc(collection(db, "events"), eventPayload);
      setActiveEventId(docRef.id);
      setActiveEventData({ id: docRef.id, ...eventPayload });
      setStep(3);
    } catch (e) {
      alert("Erreur de création");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-black italic tracking-widest">CHARGEMENT...</div>;

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-12">
      {/* HEADER PANEL */}
      <div className="flex justify-between items-center mb-12 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-black italic uppercase">Mon Studio PartyLens</h1>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">
            Offre active : <span className="text-pink-500">{userData?.plan}</span>
          </p>
        </div>
        <button onClick={async () => { await signOut(auth); router.push('/login'); }} className="p-4 bg-white/5 hover:bg-red-600/20 rounded-2xl transition-all border-none text-white cursor-pointer">
          <LogOut size={18} />
        </button>
      </div>

      {step === 0 && (
        <div className="max-w-4xl mx-auto">
          {userData?.plan === "DEMO" && (
            <div className="bg-gradient-to-r from-purple-950 to-black border border-purple-500/30 p-6 rounded-3xl mb-8 flex items-center gap-4">
              <Sparkles className="text-purple-400 shrink-0" size={24} />
              <p className="text-xs text-gray-300 leading-relaxed font-semibold">
                Vous êtes en <span className="text-white font-black">MODE ESSAI GRATUIT</span>. Créez votre premier événement pour tester l'appareil photo en direct, l'affichage et les requêtes.
              </p>
            </div>
          )}

          <button onClick={handleStartCreate} className="w-full py-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-[30px] font-black italic text-xl uppercase tracking-wider hover:scale-[1.02] transition-transform cursor-pointer mb-12 flex items-center justify-center gap-3 shadow-xl">
            <Plus size={24} strokeWidth={3} /> Créer ma soirée
          </button>

          {/* LISTE DES SOIRÉES EXISTANTES */}
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 mb-6">Mes Événements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myEvents.map((evt) => (
              <div key={evt.id} className="p-6 rounded-3xl border border-white/5 bg-white/[0.02] flex flex-col justify-between">
                <div>
                  <h4 className="text-xl font-black uppercase tracking-tight text-white mb-1">{evt.eventName}</h4>
                  <p className="text-[10px] text-gray-500 uppercase font-black">Formule : {evt.plan} {evt.isDemo && "• ÉVÉNEMENT DE TEST"}</p>
                </div>
                <div className="flex gap-2 mt-6">
                  <Link href={`/gallery/${evt.id}`} className="flex-1 py-3 text-center bg-white text-black rounded-xl text-xs font-black uppercase tracking-wide">Galerie</Link>
                  <Link href={`/tv/${evt.id}`} className="flex-1 py-3 text-center bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-wide hover:bg-white/20">Écran Live</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ETAPE FORMULAIRE DE CRÉATION */}
      {step === 1 && (
        <div className="max-w-md mx-auto bg-[#0f1115] border border-white/5 p-8 rounded-[35px]">
          <h3 className="text-xl font-black uppercase italic mb-6">Nommer votre Événement</h3>
          <input 
            type="text" 
            placeholder="Ex: Mariage de Julie & Marc, Anniversaire 30 ans..." 
            className="w-full p-4 rounded-xl bg-black border border-white/10 text-white font-bold mb-6 text-center outline-none focus:border-pink-500"
            value={formData.eventName}
            onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
          />
          <button onClick={executeCreateEvent} disabled={!formData.eventName} className="w-full py-4 bg-white text-black font-black uppercase rounded-xl text-xs tracking-wider disabled:opacity-40 transition-all">
            GÉNÉRER MON ÉVÉNEMENT
          </button>
        </div>
      )}

      {/* CRÉATION EFFECTUÉE : AFFICHAGE QR CODE DU COMPTE */}
      {step === 3 && activeEventData && (
        <div className="max-w-md mx-auto text-center bg-[#0f1115] border border-white/10 p-10 rounded-[40px] shadow-2xl">
          <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-black uppercase italic mb-2">Votre soirée est prête !</h3>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-8">Téléchargez le QR code ci-dessous</p>

          <div className="bg-white p-6 rounded-3xl inline-block mb-8 shadow-inner">
            <QRCodeSVG value={`${window.location.origin}/event/${activeEventId}`} size={200} />
          </div>

          <div className="space-y-3">
            <Link href={`/gallery/${activeEventId}`} className="block w-full py-4 bg-white text-black font-black uppercase rounded-xl text-xs tracking-wider">Ouvrir la Galerie</Link>
            <button onClick={() => setStep(0)} className="block w-full py-4 bg-white/5 text-white font-bold uppercase rounded-xl text-xs tracking-wider border-none cursor-pointer hover:bg-white/10">Retour au Tableau de Bord</button>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS FLASH */}
      {notify.show && (
        <div className="fixed bottom-6 right-6 bg-red-600 text-white font-black uppercase tracking-wider text-xs px-6 py-4 rounded-xl z-50 shadow-2xl">
          {notify.msg}
        </div>
      )}
    </main>
  );
}