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
  BookOpen,
  Sun,
  Moon,
  Palette,
  Presentation,
  Camera
} from 'lucide-react';

function AdminContent() {
  const router = useRouter();

  const [darkMode, setDarkMode] = useState(true);
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
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
      <div className={`min-h-screen flex items-center justify-center font-black italic uppercase tracking-[0.3em] ${
        darkMode ? 'bg-[#0f071e] text-white' : 'bg-[#f4f4f6] text-slate-900'
      }`}>
        <Loader2 className="animate-spin text-orange-400 mr-3" size={24} />
        Chargement...
      </div>
    );
  }

  const visibleEvents = myEvents.filter((event) => {
    return !(userData?.role === 'dj' && event.hiddenByDJ);
  });

  const validSubscription = isPlanValid();

  const cardBg = darkMode 
    ? 'bg-[#170c2c] border border-white/10 text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)]' 
    : 'bg-[#eaeaea] border border-slate-300 text-slate-900 shadow-lg';

  const inputBg = darkMode 
    ? 'bg-[#150a28] border-white/10 text-white placeholder-gray-500 focus:border-orange-500' 
    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-orange-500';

  return (
    <main className={`min-h-screen relative overflow-hidden p-6 md:p-12 font-sans transition-colors duration-300 flex flex-col ${
      darkMode 
        ? 'bg-[#0f071e] text-white selection:bg-orange-500 selection:text-white' 
        : 'bg-[#f4f4f6] text-slate-900 selection:bg-orange-500 selection:text-white'
    }`}>
      
      {/* Bouton Switch Mode Clair / Sombre */}
      <button 
        onClick={() => setDarkMode(!darkMode)}
        className={`absolute top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md border ${
          darkMode 
            ? 'bg-white/15 text-amber-300 border-white/20 hover:bg-white/25' 
            : 'bg-[#eaeaea] text-slate-700 border-slate-300 hover:bg-[#dedede]'
        }`}
        aria-label="Changer le mode d'affichage"
      >
        {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        <span>{darkMode ? "Mode Clair" : "Mode Sombre"}</span>
      </button>

      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {darkMode && (
          <>
            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-r from-orange-500/20 via-amber-500/10 to-purple-600/20 rounded-full blur-[140px]"></div>
            <div className="absolute bottom-10 right-10 w-[500px] h-[300px] bg-gradient-to-tr from-purple-600/15 to-orange-500/10 rounded-full blur-[120px]"></div>
          </>
        )}
      </div>

      <div className="max-w-6xl mx-auto relative z-10 w-full flex-grow">

        {step === 0 && (
          <div>
            <header className="flex flex-col md:flex-row justify-between items-center mb-20 gap-6">
              <img src="/logo-partylens.png" alt="Logo" className="w-48 h-auto drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]" />

              <div className="flex flex-wrap items-center justify-end gap-4">
                <button
                  onClick={handleLogout}
                  className={`${cardBg} px-6 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase cursor-pointer transition-all hover:opacity-80`}
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
                  className={`${cardBg} px-8 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase no-underline transition-all hover:opacity-80`}
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
              <div className={`mb-10 p-6 rounded-[30px] flex flex-col md:flex-row items-center justify-between gap-6 ${cardBg}`}>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-500/20 rounded-xl border border-orange-500/30 text-orange-400">
                    <Edit2 size={20} />
                  </div>

                  <div>
                    <p className={`text-[10px] font-black uppercase ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Votre Code DJ actuel</p>
                    <p className="text-xl font-black tracking-widest uppercase">{userData.linkedDjCode}</p>
                  </div>
                </div>

                {isEditingCode ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      className={`px-6 py-3 rounded-xl border border-orange-500 font-black uppercase text-center outline-none ${inputBg}`}
                      value={newDjCode}
                      onChange={(e) => setNewDjCode(e.target.value.toUpperCase())}
                    />

                    <button
                      onClick={handleUpdateDjCode}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] border-none cursor-pointer shadow-md"
                    >
                      OK
                    </button>

                    <button
                      onClick={() => setIsEditingCode(false)}
                      className={`font-bold uppercase text-[10px] cursor-pointer bg-transparent border-none ${darkMode ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
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
                    className={`px-8 py-3 rounded-xl font-black uppercase text-[10px] cursor-pointer transition-all ${
                      darkMode 
                        ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10' 
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300'
                    }`}
                  >
                    MODIFIER MON CODE DJ
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
              <h2 className={`text-[11px] font-black uppercase tracking-[0.4em] italic ${darkMode ? 'text-orange-200/60' : 'text-orange-600'}`}>
                Mes événements
              </h2>
            </div>

            {/* Cartes en ligne horizontale */}
            <div className="flex flex-col gap-6">
              {visibleEvents.map((event) => (
                <div
                  key={event.id}
                  className={`p-6 md:p-8 rounded-[35px] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 transition-all hover:border-orange-500/40 ${cardBg}`}
                >
                  {/* Partie gauche : Nom de la soirée et badge USB */}
                  <div className="flex flex-col gap-2 max-w-sm">
                    {event.usbOrdered && (
                      <div className="flex items-center gap-2 bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full border border-orange-500/40 w-fit">
                        <Package size={12} />
                        <span className="text-[8px] font-black uppercase tracking-tighter">Clé USB incluse</span>
                      </div>
                    )}
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter truncate">
                      {event.eventName}
                    </h3>
                  </div>

                  {/* Partie droite : Tous les boutons alignés en ligne */}
                  <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                    {(userData?.role === 'dj' || userData?.isStandalone !== false) ? (
                      <Link
                        href={`/admin/${event.id}/dashboard`}
                        className="px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-black uppercase text-[9px] no-underline flex items-center gap-1.5 shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:from-orange-600 hover:to-amber-600 transition-all"
                      >
                        RÉGIE
                      </Link>
                    ) : (
                      <div className={`px-4 py-3 rounded-xl text-center text-[9px] font-bold uppercase border border-dashed ${darkMode ? 'bg-white/5 text-gray-400 border-white/10' : 'bg-slate-200 text-slate-600 border-slate-300'}`}>
                        {event.status === 'terminé' ? "Terminée" : "En cours"}
                      </div>
                    )}

                    <Link
                      href={`/event/${event.id}`}
                      className={`px-4 py-3 rounded-xl font-black uppercase text-[9px] tracking-wider transition-all no-underline flex items-center gap-1.5 ${
                        darkMode 
                          ? 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10' 
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300'
                      }`}
                    >
                      INVITÉS <ArrowRight size={12} />
                    </Link>

                    <Link
                      href={`/admin/${event.id}/galerie`}
                      className="px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl font-black uppercase text-[9px] no-underline flex items-center gap-1.5 border border-blue-500/20 transition-all"
                    >
                      <ImageIcon size={12} /> GALERIE
                    </Link>

                    <Link
                      href={`/event/${event.id}/guestbook`}
                      className="px-4 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl font-black uppercase text-[9px] no-underline flex items-center gap-1.5 border border-amber-500/20 transition-all"
                    >
                      <BookOpen size={12} /> LIVRE D'OR
                    </Link>

                    {/* Bouton FOND DIAPO relié au catalogue de cadres avec transmission de l'eventId */}
                    <Link
                      href={`/admin/catalogue-cadres?eventId=${event.id}`}
                      className="px-4 py-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-xl font-black uppercase text-[9px] no-underline flex items-center gap-1.5 border border-purple-500/20 transition-all"
                    >
                      <Palette size={12} /> FOND DIAPO
                    </Link>

                    {/* Bouton DIAPORAMA relié à la vue live / diaporama de l'événement */}
                    <Link
                      href={`/admin/${event.id}/live`}
                      className="px-4 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl font-black uppercase text-[9px] no-underline flex items-center gap-1.5 border border-emerald-500/20 transition-all"
                    >
                      <Presentation size={12} /> DIAPORAMA
                    </Link>

                    {/* Bouton PHOTOBOOTH mis à jour */}
                    <Link
                      href={`/photobooth/${event.id}`}
                      className="px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl font-black uppercase text-[9px] no-underline flex items-center gap-1.5 border border-rose-500/20 transition-all"
                    >
                      <Camera size={12} /> PHOTOBOOTH
                    </Link>

                    {event.status === 'terminé' && userData?.role !== 'dj' && (
                      <Link
                        href={`/admin/${event.id}/galerie`}
                        className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase text-[9px] no-underline flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
                      >
                        <Download size={12} /> TÉLÉCHARGER
                      </Link>
                    )}

                    {userData?.role === 'dj' && (
                      <button
                        onClick={() => handleHideEvent(event.id)}
                        className="px-4 py-3 bg-red-600/10 hover:bg-red-600/30 text-red-400 rounded-xl font-black uppercase text-[9px] border border-red-500/20 cursor-pointer flex items-center gap-1.5 transition-all"
                      >
                        <EyeOff size={12} /> MASQUER
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {step === 1 && (
          <div className={`p-12 rounded-[50px] max-w-xl mx-auto text-center animate-in zoom-in shadow-2xl ${cardBg}`}>
            <button onClick={() => setStep(0)} className={`mb-10 bg-transparent border-none cursor-pointer font-black flex items-center gap-2 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
              <ArrowLeft size={14} /> RETOUR
            </button>
            <h2 className="text-4xl font-black italic uppercase mb-12 tracking-tighter">
              Nouvelle <span className="text-orange-400">Soirée</span>
            </h2>
            <input
              type="text"
              placeholder="NOM DE L'ÉVÉNEMENT"
              className={`w-full p-8 rounded-[30px] font-black uppercase outline-none transition-all text-xl border ${inputBg}`}
              value={formData.eventName}
              onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
            />
            <div
              onClick={() => setFormData({ ...formData, includeUsb: !formData.includeUsb })}
              className={`mt-6 w-full p-6 rounded-[30px] border transition-all cursor-pointer flex items-center justify-between ${
                formData.includeUsb 
                  ? 'bg-orange-500/15 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.2)]' 
                  : darkMode ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-white/60 border-slate-300 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center gap-4 text-left">
                <Package size={24} className={formData.includeUsb ? "text-orange-400" : darkMode ? "text-gray-400" : "text-slate-500"} />
                <div>
                  <p className={`font-black uppercase tracking-widest text-[12px] ${formData.includeUsb ? '' : darkMode ? 'text-gray-300' : 'text-slate-700'}`}>INCLURE UNE CLÉ USB</p>
                  <p className="text-[10px] font-bold uppercase mt-1 text-orange-400">
                    Option physique (+15,00 €)
                  </p>
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
          <div className={`p-12 rounded-[50px] max-w-xl mx-auto text-center animate-in zoom-in shadow-2xl ${cardBg}`}>
            <Package size={40} className="text-orange-400 mx-auto mb-6" />
            <h2 className="text-3xl font-black italic uppercase mb-2">Livraison de la clé</h2>
            <p className={`text-xs font-bold uppercase mb-6 ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
              Option facturée 15,00 €
            </p>
            <div className="grid gap-4 text-left">
              <input type="text" placeholder="NOM ET PRÉNOM" className={`w-full p-5 rounded-2xl font-bold text-xs uppercase outline-none border ${inputBg}`} value={shippingData.name} onChange={(e) => setShippingData({ ...shippingData, name: e.target.value.toUpperCase() })} />
              <input type="text" placeholder="ADRESSE" className={`w-full p-5 rounded-2xl font-bold text-xs uppercase outline-none border ${inputBg}`} value={shippingData.address} onChange={(e) => setShippingData({ ...shippingData, address: e.target.value.toUpperCase() })} />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="CODE POSTAL" className={`w-full p-5 rounded-2xl font-bold text-xs outline-none border ${inputBg}`} value={shippingData.zip} onChange={(e) => setShippingData({ ...shippingData, zip: e.target.value })} />
                <input type="text" placeholder="VILLE" className={`w-full p-5 rounded-2xl font-bold text-xs uppercase outline-none border ${inputBg}`} value={shippingData.city} onChange={(e) => setShippingData({ ...shippingData, city: e.target.value.toUpperCase() })} />
              </div>
              <input type="tel" placeholder="TÉLÉPHONE" className={`w-full p-5 rounded-2xl font-bold text-xs outline-none border ${inputBg}`} value={shippingData.phone} onChange={(e) => setShippingData({ ...shippingData, phone: e.target.value })} />
            </div>
            <button onClick={() => setStep(4)} disabled={!shippingData.name || !shippingData.address} className="w-full p-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 font-black uppercase text-white mt-8 disabled:opacity-30 cursor-pointer shadow-[0_0_20px_rgba(249,115,22,0.4)]">Continuer vers le paiement</button>
          </div>
        )}

        {step === 4 && (
          <div className={`p-12 rounded-[50px] max-w-xl mx-auto text-center border-orange-500/40 animate-in zoom-in bg-orange-500/10 shadow-2xl ${cardBg}`}>
            <AlertTriangle size={60} className="text-orange-400 mx-auto mb-6" />
            <h2 className="text-3xl font-black italic uppercase mb-4 text-orange-400">Paiement de la clé USB</h2>
            <p className={`font-bold mb-8 ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Cette clé USB souvenir sera facturée 15,00 €.</p>
            <button onClick={handlePayExtraUsb} className="w-full p-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 font-black uppercase text-white flex items-center justify-center gap-2 tracking-widest text-xs cursor-pointer shadow-[0_0_20px_rgba(249,115,22,0.4)]">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <><CreditCard size={18} /> Payer 15,00 € et Lancer</>}
            </button>
            <button onClick={() => setStep(1)} className={`w-full p-6 mt-4 font-black uppercase text-xs cursor-pointer bg-transparent border-none ${darkMode ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>Annuler</button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <div className={`max-w-md mx-auto p-14 rounded-[60px] shadow-2xl ${cardBg}`}>
              <h2 className="text-4xl font-black italic uppercase mb-8">{activeEventData?.eventName}</h2>
              <div className="bg-white p-8 rounded-[45px] inline-block mb-12 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                {typeof window !== "undefined" && <QRCodeSVG value={`${window.location.origin}/event/${activeEventId}`} size={220} />}
              </div>
              <Link href={`/admin/${activeEventId}/dashboard`} className="w-full py-6 flex items-center justify-center bg-gradient-to-r from-orange-500 to-amber-500 rounded-[30px] text-[11px] font-black uppercase tracking-[0.3em] no-underline text-white shadow-[0_0_25px_rgba(249,115,22,0.4)]">ACCÉDER RÉGIE →</Link>
            </div>
            <button onClick={() => setStep(0)} className={`mt-12 border-none bg-transparent cursor-pointer font-black uppercase text-[10px] italic ${darkMode ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>Retour à l'accueil</button>
          </div>
        )}

      </div>

      {notify.show && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-8 py-4 rounded-full border border-orange-500/50 backdrop-blur-xl shadow-[0_0_30px_rgba(249,115,22,0.3)] animate-in slide-in-from-bottom-5 ${darkMode ? 'bg-[#170c2c] text-orange-400' : 'bg-white text-orange-600'}`}>
          <CheckCircle2 size={18} />
          <span className="text-[10px] font-black uppercase italic tracking-widest">{notify.msg}</span>
        </div>
      )}
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen"></div>}>
      <AdminContent />
    </Suspense>
  );
}
