"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  updateDoc
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  ArrowRight,
  UserCircle,
  CheckCircle2,
  Loader2,
  Package,
  EyeOff,
  LogOut,
  Edit2,
  Download,
  CreditCard,
  AlertTriangle,
  Star,
  ImageIcon,
  BookOpen
} from 'lucide-react';

function AdminContent() {
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

  const [shippingData, setShippingData] = useState({
    name: "",
    address: "",
    zip: "",
    city: "",
    phone: ""
  });

  const [isEditingCode, setIsEditingCode] = useState(false);
  const [newDjCode, setNewDjCode] = useState("");

  useEffect(() => {
    let unsubUser = () => {};
    let unsubEvents = () => {};

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        unsubUser = onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
          if (snap.exists()) {
            const uData = snap.data();

            setUserData(uData);
            unsubEvents();

            let qEvents;

            if (uData.linkedDjCode) {
              const cleanCode = uData.linkedDjCode.trim().toUpperCase();
              qEvents = query(collection(db, "events"), where("djCode", "==", cleanCode));
            } else {
              qEvents = query(
                collection(db, "events"),
                where("userId", "==", currentUser.uid),
                orderBy("createdAt", "desc")
              );
            }

            unsubEvents = onSnapshot(qEvents, (eSnap) => {
              const evts = eSnap.docs.map((eventDoc) => ({
                id: eventDoc.id,
                ...eventDoc.data()
              }));

              if (uData.linkedDjCode) {
                evts.sort((a, b) => {
                  return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
                });
              }

              setMyEvents(evts);
              setLoading(false);
            });
          }
        });
      } else {
        router.push('/login');
      }
    });

    return () => {
      unsubAuth();
      unsubUser();
      unsubEvents();
    };
  }, [router]);

  const handleUpdateDjCode = async () => {
    if (!newDjCode.trim() || !user) return;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        linkedDjCode: newDjCode.trim().toUpperCase()
      });

      setIsEditingCode(false);
      setNotify({ show: true, msg: "CODE DJ MIS À JOUR !" });
      setTimeout(() => setNotify({ show: false, msg: "" }), 3000);
    } catch (e) {
      console.error(e);
      alert("Erreur de mise à jour");
    }
  };

  const isPlanValid = () => {
    if (!userData?.plan) return false;
    if (userData.plan === "DEMO") return true;
    if (!userData?.lastPaymentDate) return false;

    const lastPay = typeof userData.lastPaymentDate.toDate === 'function'
      ? userData.lastPaymentDate.toDate()
      : new Date(userData.lastPaymentDate);

    const now = new Date();
    const diffInDays = (now - lastPay) / (1000 * 60 * 60 * 24);
    const limitDays = userData.plan === "VIP GOLD" ? 365 : 30;

    return diffInDays <= limitDays;
  };

  const buildEventPayload = () => {
    const djCode = "DJ-" + Math.floor(100 + Math.random() * 900);

    return {
      userId: user.uid,
      eventName: formData.eventName,
      djCode,
      plan: userData?.plan || 'BRONZE',
      createdAt: serverTimestamp(),
      status: "active",
      frameUrl: "",
      usbOrdered: formData.includeUsb,
      shippingInfo: formData.includeUsb
        ? {
            name: shippingData.name,
            address: shippingData.address,
            zip: shippingData.zip,
            city: shippingData.city,
            phone: shippingData.phone
          }
        : null
    };
  };

  const handleStartCreate = () => {
    setFormData({ eventName: "", includeUsb: false });
    setShippingData({ name: "", address: "", zip: "", city: "", phone: "" });

    if (userData?.role === 'organisateur' && userData?.isStandalone === false) {
      setNotify({ show: true, msg: "SEUL VOTRE DJ PEUT CRÉER UNE SOIRÉE." });
      return;
    }

    if (!isPlanValid()) {
      router.push('/admin/plan-selection');
      return;
    }

    setStep(1);
  };

  const handleCheckBeforeCreate = () => {
    if (!formData.eventName) return;

    if (formData.includeUsb) {
      setStep(5);
    } else {
      executeCreateEvent();
    }
  };

  const handlePayExtraUsb = async () => {
    if (!formData.eventName || !user) return;

    setLoading(true);

    try {
      const eventPayload = buildEventPayload();

      const docRef = await addDoc(collection(db, "events"), {
        ...eventPayload,
        paymentStatus: "pending",
        usbPaid: false
      });

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: 'usb_only',
          usbQty: 1,
          userId: user.uid,
          eventId: docRef.id,
          eventName: formData.eventName,
          shippingInfo: eventPayload.shippingInfo
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Erreur checkout");
      }
    } catch (e) {
      console.error(e);
      alert("Erreur de connexion au paiement.");
      setLoading(false);
    }
  };

  const executeCreateEvent = async () => {
    setLoading(true);

    try {
      const eventPayload = buildEventPayload();
      const docRef = await addDoc(collection(db, "events"), eventPayload);

      if (formData.includeUsb) {
        const usedUsb = userData?.usedUsb || 0;
        const freeLimit = userData?.plan === "VIP GOLD" ? 12 : 0;

        let newTotalAmount = parseFloat(userData?.totalAmount || 0);

        if (usedUsb >= freeLimit) {
          newTotalAmount += 15;
        }

        await updateDoc(doc(db, "users", user.uid), {
          usedUsb: usedUsb + 1,
          totalAmount: newTotalAmount.toFixed(2),
          lastUsbOrderDate: serverTimestamp()
        });
      }

      setActiveEventId(docRef.id);
      setActiveEventData({ id: docRef.id, ...eventPayload });
      setStep(3);
    } catch (e) {
      console.error(e);
      alert("Erreur création");
    } vanished: {
      setLoading(false); // Fix de la typo ici (remplace le withLoading erroné)
    }
  };

  const handleHideEvent = async (eventId) => {
    if (!confirm("Voulez-vous masquer cette soirée ?")) return;

    try {
      await updateDoc(doc(db, "events", eventId), {
        hiddenByDJ: true
      });

      setNotify({ show: true, msg: "SOIRÉE MASQUÉE" });
      setTimeout(() => setNotify({ show: false, msg: "" }), 3000);
    } catch (e) {
      console.error(e);
      alert("Erreur lors du masquage.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (loading && step === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white font-black italic uppercase tracking-[0.3em]">
        Chargement...
      </div>
    );
  }

  const visibleEvents = myEvents.filter((event) => {
    return !(userData?.role === 'dj' && event.hiddenByDJ);
  });

  const freeUsbLimit = userData?.plan === "VIP GOLD" ? 12 : 0;
  const usedUsbCount = userData?.usedUsb || 0;
  const remainingFreeUsb = Math.max(0, freeUsbLimit - usedUsbCount);

  return (
    <main className="min-h-screen bg-black text-white p-6 font-sans relative overflow-hidden">
      {notify.show && (
        <div className="fixed top-5 right-5 bg-[#ff0080] text-white font-black uppercase text-xs tracking-widest px-6 py-4 rounded-2xl z-50 shadow-2xl animate-in fade-in slide-in-from-top-4">
          {notify.msg}
        </div>
      )}

      <div className="max-w-7xl mx-auto flex justify-between items-center mb-12 relative z-10">
        <Link href="/">
          <img src="/logo-partylens.png" className="w-24 cursor-pointer" alt="Logo" />
        </Link>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Connecté avec</p>
            <p className="text-xs font-bold text-white uppercase">{userData?.email}</p>
            <span className="inline-block bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[9px] font-black text-[#ff0080] tracking-widest uppercase mt-1">
              Plan : {userData?.plan || "Aucun"}
            </span>
          </div>
          <button onClick={handleLogout} className="p-4 bg-white/5 hover:bg-red-500/20 border border-white/5 hover:border-red-500/30 text-gray-400 hover:text-red-500 rounded-2xl transition-all cursor-pointer">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 p-8 rounded-[35px]">
            <div className="flex items-center gap-4 mb-6">
              <UserCircle size={40} className="text-[#ff0080]" />
              <div>
                <h2 className="text-xl font-black uppercase italic tracking-tight">Espace {userData?.role}</h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Gestion de compte</p>
              </div>
            </div>

            {userData?.role === 'organisateur' && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Code DJ rattaché :</p>
                {isEditingCode ? (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="bg-black border border-[#ff0080]/30 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider text-white outline-none focus:border-[#ff0080] w-full"
                      value={newDjCode}
                      onChange={(e) => setNewDjCode(e.target.value)}
                      placeholder="EX: DJ-XYZ"
                    />
                    <button onClick={handleUpdateDjCode} className="bg-[#ff0080] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-white">Valider</button>
                    <button onClick={() => setIsEditingCode(false)} className="bg-white/5 px-3 py-2 rounded-xl text-[10px] font-bold text-gray-400">X</button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center bg-white/5 px-4 py-3 rounded-2xl border border-white/5">
                    <span className="text-xs font-black tracking-widest text-white uppercase">{userData?.linkedDjCode || "AUCUN CODE"}</span>
                    <button onClick={() => { setNewDjCode(userData?.linkedDjCode || ""); setIsEditingCode(true); }} className="text-[#ff0080] hover:text-white transition-colors">
                      <Edit2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {((userData?.role === 'organisateur' && userData?.isStandalone) || userData?.role === 'dj') && (
              <button onClick={handleStartCreate} className="w-full mt-6 py-4 bg-[#ff0080] rounded-2xl font-black uppercase text-[11px] tracking-widest text-white shadow-[0_0_20px_rgba(255,0,128,0.3)] hover:scale-[1.02] transition-all cursor-pointer">
                + Créer une nouvelle soirée
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 p-8 rounded-[35px]">
            <h2 className="text-2xl font-black uppercase italic tracking-tight mb-6 flex items-center gap-3">
              <BookOpen size={22} className="text-[#ff0080]" /> Vos Événements Actifs & Livres d'or
            </h2>

            {visibleEvents.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Aucune soirée active pour le moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleEvents.map((evt) => (
                  <div key={evt.id} className="bg-black/40 border border-white/5 hover:border-white/10 p-5 rounded-2xl transition-all relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-tight text-white group-hover:text-[#ff0080] transition-colors">{evt.eventName}</h3>
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Code unique : {evt.djCode}</p>
                      </div>
                      {userData?.role === 'dj' && (
                        <button onClick={() => handleHideEvent(evt.id)} className="text-gray-600 hover:text-red-500 transition-colors p-1" title="Masquer l'événement">
                          <EyeOff size={14} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/5">
                      <Link href={`/event/${evt.id}`} className="flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-[#ff0080] rounded-xl text-[10px] font-black uppercase tracking-wider text-center transition-all border border-white/5 hover:border-[#ff0080]">
                        <ImageIcon size={12} /> Live Photos
                      </Link>
                      <Link href={`/event/${evt.id}/guestbook`} className="flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-[#ff0080] rounded-xl text-[10px] font-black uppercase tracking-wider text-center transition-all border border-white/5 hover:border-[#ff0080]">
                        <BookOpen size={12} /> Livre d'or
                      </Link>
                    </div>

                    <div className="mt-4 flex justify-center p-3 bg-white rounded-xl w-32 mx-auto">
                      {typeof window !== 'undefined' && (
                        <QRCodeSVG value={`${window.location.origin}/event/${evt.id}`} size={100} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {step > 0 && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-lg p-8 rounded-[35px] relative max-h-[90vh] overflow-y-auto">
            
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-xl font-black uppercase italic tracking-tight">Nommer votre événement</h3>
                <input 
                  type="text" 
                  placeholder="NOM DE LA SOIRÉE (EX: MARIAGE SOPHIE & MARC)"
                  className="w-full bg-black border border-white/10 rounded-xl p-4 text-xs font-bold uppercase tracking-wider text-white outline-none focus:border-[#ff0080]"
                  value={formData.eventName}
                  onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                />
                
                <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5 mt-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide">Commander une clé USB souvenir</p>
                    <p className="text-[10px] font-medium text-gray-400 mt-1">Regroupe toutes les photos et le livre d'or de l'événement.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 accent-[#ff0080]"
                    checked={formData.includeUsb}
                    onChange={(e) => setFormData({ ...formData, includeUsb: e.target.checked })}
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep(0)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 font-bold uppercase text-[10px] tracking-wider rounded-xl transition-all">Annuler</button>
                  <button onClick={handleCheckBeforeCreate} disabled={!formData.eventName} className="flex-1 py-3 bg-[#ff0080] text-white font-black uppercase text-[10px] tracking-wider rounded-xl transition-all disabled:opacity-50">Continuer</button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <h3 className="text-xl font-black uppercase italic tracking-tight">Adresse de livraison USB</h3>
                <input type="text" placeholder="NOM COMPLET" className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs font-bold uppercase text-white outline-none" value={shippingData.name} onChange={(e) => setShippingData({ ...shippingData, name: e.target.value })} />
                <input type="text" placeholder="ADRESSE POSTALE" className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs font-bold uppercase text-white outline-none" value={shippingData.address} onChange={(e) => setShippingData({ ...shippingData, address: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="CODE POSTAL" className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs font-bold uppercase text-white outline-none" value={shippingData.zip} onChange={(e) => setShippingData({ ...shippingData, zip: e.target.value })} />
                  <input type="text" placeholder="VILLE" className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs font-bold uppercase text-white outline-none" value={shippingData.city} onChange={(e) => setShippingData({ ...shippingData, city: e.target.value })} />
                </div>
                <input type="tel" placeholder="TÉLÉPHONE" className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs font-bold uppercase text-white outline-none" value={shippingData.phone} onChange={(e) => setShippingData({ ...shippingData, phone: e.target.value })} />
                
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep(1)} className="flex-1 py-3 bg-white/5 text-gray-400 font-bold uppercase text-[10px] rounded-xl">Retour</button>
                  <button 
                    onClick={() => {
                      if (remainingFreeUsb > 0) {
                        executeCreateEvent();
                      } else {
                        handlePayExtraUsb();
                      }
                    }} 
                    disabled={!shippingData.name || !shippingData.address || !shippingData.zip || !shippingData.city || !shippingData.phone} 
                    className="flex-1 py-3 bg-[#ff0080] text-white font-black uppercase text-[10px] rounded-xl disabled:opacity-50"
                  >
                    {remainingFreeUsb > 0 ? "Valider (Inclus)" : "Passer au paiement (15€)"}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && activeEventData && (
              <div className="text-center space-y-6 py-4">
                <CheckCircle2 size={50} className="text-green-500 mx-auto animate-bounce" />
                <div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tight text-white">Soirée Créée !</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{activeEventData.eventName}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                  <p className="text-[10px] font-black text-[#ff0080] uppercase tracking-widest">Code DJ de l'événement</p>
                  <p className="text-3xl font-black tracking-widest mt-1 text-white">{activeEventData.djCode}</p>
                </div>
                <button onClick={() => setStep(0)} className="w-full py-4 bg-white text-black font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-gray-200 transition-all">
                  Accéder au Tableau de Bord
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white font-black uppercase tracking-widest">Chargement...</div>}>
      <AdminContent />
    </Suspense>
  );
}