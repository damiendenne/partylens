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
      if (!currentUser) {
        setLoading(false);
        router.push('/login');
        return;
      }

      setUser(currentUser);

      unsubUser = onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
        if (!snap.exists()) {
          setLoading(false);
          return;
        }

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
        }, (error) => {
          console.error("Erreur Firestore events:", error);
          setLoading(false);
        });
      }, (error) => {
        console.error("Erreur Firestore users:", error);
        setLoading(false);
      });
    });

    return () => {
      unsubAuth();
      unsubUser();
      unsubEvents();
    };
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");

    if (success === "true") {
      window.history.replaceState({}, document.title, window.location.pathname);
      setNotify({ show: true, msg: "🎉 ABONNEMENT ACTIVÉ ! MERCI POUR VOTRE CONFIANCE." });
      setTimeout(() => setNotify({ show: false, msg: "" }), 5000);
    }
  }, []);

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
    
    if (userData.plan === "DEMO") {
      if (myEvents && myEvents.length > 0) {
        return false;
      }
      return true;
    }

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
    if (!isPlanValid()) {
      router.push('/admin/plan-selection');
      return; 
    }

    setFormData({ eventName: "", includeUsb: false });
    setShippingData({ name: "", address: "", zip: "", city: "", phone: "" });

    if (userData?.role === 'organisateur' && userData?.isStandalone === false) {
      setNotify({ show: true, msg: "SEUL VOTRE DJ PEUT CRÉER UNE SOIRÉE." });
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
    } finally {
      setLoading(false);
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
      <div className="min-h-screen bg-gradient-to-b from-[#2d104d] via-[#210a3b] to-[#140427] flex items-center justify-center text-white font-black italic uppercase tracking-[0.3em]">
        <Loader2 className="animate-spin text-orange-400 mr-3" size={24} />
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
  const validSubscription = isPlanValid();

  return (
    <main className="min-h-screen relative overflow-hidden p-6 md:p-12 font-sans bg-gradient-to-b from-[#2d104d] via-[#210a3b] to-[#140427] text-white flex flex-col">
      {/* VAGUES LUMINEUSES ET FONDS GRAPHIQUES */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <svg className="absolute -top-12 left-0 w-full h-[500px] text-orange-500/30 blur-xl opacity-80" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,160L60,176C120,192,240,224,360,213.3C480,203,600,149,720,154.7C840,160,960,224,1080,229.3C1200,235,1320,181,1380,154.7L1440,128L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,0,0Z"></path>
        </svg>
        <svg className="absolute bottom-0 right-0 w-full h-[500px] text-orange-600/30 blur-xl opacity-80" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,224L60,213.3C120,203,240,181,360,186.7C480,192,600,224,720,218.7C840,213,960,171,1080,160C1200,149,1320,171,1380,181.3L1440,192L1440,320L1380,320C1320,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
        </svg>
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-r from-orange-500/30 via-amber-400/20 to-pink-500/15 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10 w-full flex-grow">

        {step === 0 && (
          <div>
            <header className="flex justify-between items-center mb-20">
              <img src="/logo-partylens.png" alt="Logo" className="w-48 h-auto drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]" />

              <div className="flex flex-wrap items-center justify-end gap-4">
                <button
                  onClick={handleLogout}
                  className="glass-card px-6 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase text-gray-300 hover:text-white border border-white/10 cursor-pointer transition-all hover:bg-white/10"
                >
                  <LogOut size={16} /> DÉCO
                </button>

                <Link
                  href="/avis"
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-6 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase border border-amber-500/30 no-underline transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                >
                  <Star size={16} /> AVIS
                </Link>

                <Link
                  href="/admin/profil"
                  className="glass-card px-8 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase text-white border border-white/10 no-underline hover:bg-white/10 transition-all"
                >
                  <UserCircle size={18} /> MON COMPTE
                </Link>

                {!(userData?.role === 'organisateur' && userData?.isStandalone === false) && (
                  <button
                    onClick={handleStartCreate}
                    className={`${validSubscription ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 shadow-[0_0_20px_rgba(249,115,22,0.4)]' : 'bg-red-600'} text-white px-10 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-orange-300/30 cursor-pointer hover:scale-105 transition-all`}
                  >
                    {validSubscription ? '+ CRÉER SOIRÉE' : '⚠️ S\'ABONNER'}
                  </button>
                )}
              </div>
            </header>

            {userData?.linkedDjCode && (
              <div className="mb-10 p-6 glass-card rounded-[30px] border border-white/15 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-500/20 rounded-xl border border-orange-500/30 text-orange-400">
                    <Edit2 size={20} />
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400">Votre Code DJ actuel</p>
                    <p className="text-xl font-black tracking-widest uppercase text-white">{userData.linkedDjCode}</p>
                  </div>
                </div>

                {isEditingCode ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      className="px-6 py-3 rounded-xl bg-black/50 border border-orange-500 text-white font-black uppercase text-center outline-none"
                      value={newDjCode}
                      onChange={(e) => setNewDjCode(e.target.value.toUpperCase())}
                    />

                    <button
                      onClick={handleUpdateDjCode}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] border-none cursor-pointer"
                    >
                      OK
                    </button>

                    <button
                      onClick={() => setIsEditingCode(false)}
                      className="text-gray-400 hover:text-white font-bold uppercase text-[10px] cursor-pointer bg-transparent border-none"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setNewDjCode(userData.linkedDjCode);
                      setIsEditingCode(true);
                    }}
                    className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-black uppercase text-[10px] text-white border border-white/10 cursor-pointer transition-all"
                  >
                    MODIFIER MON CODE DJ
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
              <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-orange-200/60 italic">
                Mes événements
              </h2>

              {userData?.role === 'dj' && (
                <div className="glass-card px-6 py-4 rounded-2xl border border-white/15 flex items-center gap-4">
                  <Package size={18} className="text-orange-400" />

                  <div className="text-left">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Compteur Clés USB</p>
                    <p className="text-xs font-black text-white">{usedUsbCount} / {freeUsbLimit} gratuites utilisées</p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {visibleEvents.map((event) => (
                <div
                  key={event.id}
                  className="glass-card p-10 rounded-[45px] border border-white/15 flex flex-col relative overflow-hidden hover:border-orange-500/40 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
                >
                  {event.usbOrdered && (
                    <div className="absolute top-6 right-6 flex items-center gap-2 bg-orange-500/20 text-orange-300 px-3 py-1.5 rounded-full border border-orange-500/40">
                      <Package size={12} />
                      <span className="text-[8px] font-black uppercase tracking-tighter">Clé USB incluse</span>
                    </div>
                  )}

                  <h3 className="text-3xl font-black italic uppercase mb-14 tracking-tighter truncate text-white mt-4">
                    {event.eventName}
                  </h3>

                  <div className="mt-auto flex flex-col gap-3">
                    {(userData?.role === 'dj' || userData?.isStandalone !== false) ? (
                      <Link
                        href={`/admin/${event.id}/dashboard`}
                        className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-black uppercase text-[10px] no-underline flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:from-orange-600 hover:to-amber-600 transition-all"
                      >
                        ACCÉDER RÉGIE
                      </Link>
                    ) : (
                      <div className="bg-white/5 p-4 rounded-xl text-center text-[10px] font-bold text-gray-400 border border-dashed border-white/10 uppercase">
                        {event.status === 'terminé' ? "Soirée terminée" : "En cours"}
                      </div>
                    )}

                    <Link
                      href={`/event/${event.id}`}
                      className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border border-white/10 no-underline flex items-center justify-center gap-2"
                    >
                      PAGE INVITÉS <ArrowRight size={14} />
                    </Link>

                    <div className="flex gap-2 w-full mt-1">
                      <Link
                        href={`/admin/${event.id}/galerie`}
                        className="flex-1 py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl font-black uppercase text-[9px] no-underline flex items-center justify-center gap-2 border border-blue-500/20 transition-all"
                      >
                        <ImageIcon size={12} /> GALERIE
                      </Link>
                      <Link
                        href={`/event/${event.id}/guestbook`}
                        className="flex-1 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl font-black uppercase text-[9px] no-underline flex items-center justify-center gap-2 border border-amber-500/20 transition-all"
                      >
                        <BookOpen size={12} /> LIVRE D'OR
                      </Link>
                    </div>

                    {event.status === 'terminé' && userData?.role !== 'dj' && (
                      <Link
                        href={`/admin/${event.id}/galerie`}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] no-underline flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                      >
                        <Download size={14} /> TÉLÉCHARGER PHOTOS
                      </Link>
                    )}

                    {userData?.role === 'dj' && (
                      <button
                        onClick={() => handleHideEvent(event.id)}
                        className="w-full py-4 mt-2 bg-red-600/10 hover:bg-red-600/30 text-red-400 rounded-2xl font-black uppercase text-[10px] border border-red-500/20 cursor-pointer flex items-center justify-center gap-2 transition-all"
                      >
                        <EyeOff size={14} /> MASQUER
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {step === 1 && (
          <div className="glass-card p-12 rounded-[50px] max-w-xl mx-auto text-center border border-white/20 animate-in zoom-in shadow-2xl">
            <button onClick={() => setStep(0)} className="mb-10 bg-transparent border-none text-gray-400 hover:text-white cursor-pointer font-black flex items-center gap-2">
              <ArrowLeft size={14} /> RETOUR
            </button>
            <h2 className="text-4xl font-black italic uppercase mb-12 tracking-tighter">
              Nouvelle <span className="text-orange-400">Soirée</span>
            </h2>
            <input
              type="text"
              placeholder="NOM DE L'ÉVÉNEMENT"
              className="w-full p-8 rounded-[30px] bg-black/40 border border-white/15 text-white font-black uppercase outline-none focus:border-orange-500 transition-all text-xl"
              value={formData.eventName}
              onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
            />
            <div
              onClick={() => setFormData({ ...formData, includeUsb: !formData.includeUsb })}
              className={`mt-6 w-full p-6 rounded-[30px] border transition-all cursor-pointer flex items-center justify-between ${formData.includeUsb ? 'bg-orange-500/15 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.2)]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
            >
              <div className="flex items-center gap-4 text-left">
                <Package size={24} className={formData.includeUsb ? "text-orange-400" : "text-gray-400"} />
                <div>
                  <p className={`font-black uppercase tracking-widest text-[12px] ${formData.includeUsb ? 'text-white' : 'text-gray-300'}`}>INCLURE UNE CLÉ USB</p>
                  <p className={`text-[10px] font-bold uppercase mt-1 ${remainingFreeUsb > 0 ? 'text-emerald-400' : 'text-orange-400'}`}>{remainingFreeUsb > 0 ? `Gratuit (${remainingFreeUsb} clé(s) restante(s))` : 'Sera facturé 15€'}</p>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData.includeUsb ? 'border-orange-500 bg-orange-500' : 'border-gray-500'}`}>
                {formData.includeUsb && <CheckCircle2 size={14} className="text-white" />}
              </div>
            </div>
            <button onClick={handleCheckBeforeCreate} className="w-full p-8 rounded-[30px] bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 font-black uppercase text-white cursor-pointer mt-8 border-none shadow-[0_0_25px_rgba(249,115,22,0.5)] transition-all hover:scale-[1.02]">
              LANCER LA SOIRÉE
            </button>
          </div>
        )}

        {step === 5 && (
          <div className="glass-card p-12 rounded-[50px] max-w-xl mx-auto text-center border border-white/20 animate-in zoom-in shadow-2xl">
            <Package size={40} className="text-orange-400 mx-auto mb-6" />
            <h2 className="text-3xl font-black italic uppercase mb-2">Livraison de la clé</h2>
            <div className="grid gap-4 text-left mt-8">
              <input type="text" placeholder="NOM ET PRÉNOM" className="w-full p-5 rounded-2xl bg-black/40 border border-white/15 text-white font-bold text-xs uppercase focus:border-orange-500 outline-none" value={shippingData.name} onChange={(e) => setShippingData({ ...shippingData, name: e.target.value.toUpperCase() })} />
              <input type="text" placeholder="ADRESSE" className="w-full p-5 rounded-2xl bg-black/40 border border-white/15 text-white font-bold text-xs uppercase focus:border-orange-500 outline-none" value={shippingData.address} onChange={(e) => setShippingData({ ...shippingData, address: e.target.value.toUpperCase() })} />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="CODE POSTAL" className="w-full p-5 rounded-2xl bg-black/40 border border-white/15 text-white font-bold text-xs focus:border-orange-500 outline-none" value={shippingData.zip} onChange={(e) => setShippingData({ ...shippingData, zip: e.target.value })} />
                <input type="text" placeholder="VILLE" className="w-full p-5 rounded-2xl bg-black/40 border border-white/15 text-white font-bold text-xs uppercase focus:border-orange-500 outline-none" value={shippingData.city} onChange={(e) => setShippingData({ ...shippingData, city: e.target.value.toUpperCase() })} />
              </div>
              <input type="tel" placeholder="TÉLÉPHONE" className="w-full p-5 rounded-2xl bg-black/40 border border-white/15 text-white font-bold text-xs focus:border-orange-500 outline-none" value={shippingData.phone} onChange={(e) => setShippingData({ ...shippingData, phone: e.target.value })} />
            </div>
            <button onClick={() => usedUsbCount >= freeUsbLimit ? setStep(4) : executeCreateEvent()} disabled={!shippingData.name || !shippingData.address} className="w-full p-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 font-black uppercase text-white mt-8 disabled:opacity-30 cursor-pointer shadow-[0_0_20px_rgba(249,115,22,0.4)]">Continuer</button>
          </div>
        )}

        {step === 4 && (
          <div className="glass-card p-12 rounded-[50px] max-w-xl mx-auto text-center border border-orange-500/40 animate-in zoom-in bg-orange-500/10 shadow-2xl">
            <AlertTriangle size={60} className="text-orange-400 mx-auto mb-6" />
            <h2 className="text-3xl font-black italic uppercase mb-4 text-orange-400">Facturation requise</h2>
            <p className="text-gray-300 font-bold mb-8">Quota épuisé. Cette clé sera facturée 15€.</p>
            <button onClick={handlePayExtraUsb} className="w-full p-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 font-black uppercase text-white flex items-center justify-center gap-2 tracking-widest text-xs cursor-pointer shadow-[0_0_20px_rgba(249,115,22,0.4)]">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <><CreditCard size={18} /> Payer 15,00 € et Lancer</>}
            </button>
            <button onClick={() => setStep(1)} className="w-full p-6 mt-4 text-gray-400 hover:text-white font-black uppercase text-xs cursor-pointer bg-transparent border-none">Annuler</button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <div className="max-w-md mx-auto glass-card p-14 rounded-[60px] border border-white/20 shadow-2xl">
              <h2 className="text-4xl font-black italic uppercase mb-8">{activeEventData?.eventName}</h2>
              <div className="bg-white p-8 rounded-[45px] inline-block mb-12 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                {typeof window !== "undefined" && <QRCodeSVG value={`${window.location.origin}/event/${activeEventId}`} size={220} />}
              </div>
              <Link href={`/admin/${activeEventId}/dashboard`} className="w-full py-6 flex items-center justify-center bg-gradient-to-r from-orange-500 to-amber-500 rounded-[30px] text-[11px] font-black uppercase tracking-[0.3em] no-underline text-white shadow-[0_0_25px_rgba(249,115,22,0.4)]">ACCÉDER RÉGIE →</Link>
            </div>
            <button onClick={() => setStep(0)} className="mt-12 text-gray-400 hover:text-white border-none bg-transparent cursor-pointer font-black uppercase text-[10px] italic">Retour à l'accueil</button>
          </div>
        )}

      </div>

      {notify.show && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-8 py-4 rounded-full border border-orange-500/50 bg-black/90 text-orange-400 backdrop-blur-xl shadow-[0_0_30px_rgba(249,115,22,0.3)] animate-in slide-in-from-bottom-5">
          <CheckCircle2 size={18} />
          <span className="text-[10px] font-black uppercase italic tracking-widest">{notify.msg}</span>
        </div>
      )}

      <style jsx global>{`
        .glass-card { background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(40px); }
      `}</style>
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="bg-[#2d104d] min-h-screen"></div>}>
      <AdminContent />
    </Suspense>
  );
}