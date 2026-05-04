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
  AlertTriangle
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
    if (!userData?.plan || !userData?.lastPaymentDate) return false;

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
  const validSubscription = isPlanValid();

  return (
    <main className="min-h-screen relative overflow-hidden p-6 md:p-12 font-sans bg-black text-white flex flex-col">
      <div className="bg-blobs">
        <div className="blob blob-pink"></div>
        <div className="blob blob-purple"></div>
        <div className="blob blob-blue"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10 w-full flex-grow">

        {step === 0 && (
          <div>
            <header className="flex justify-between items-center mb-20">
              <img src="/logo-partylens.png" alt="Logo" className="w-48 h-auto" />

              <div className="flex gap-4">
                <button
                  onClick={handleLogout}
                  className="glass-card px-6 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-white border border-white/5 cursor-pointer transition-all hover:bg-white/10"
                >
                  <LogOut size={16} /> DÉCO
                </button>

                <Link
                  href="/admin/profil"
                  className="glass-card px-8 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase text-white border border-white/5 no-underline hover:bg-white/10 transition-all"
                >
                  <UserCircle size={18} /> MON COMPTE
                </Link>

                {!(userData?.role === 'organisateur' && userData?.isStandalone === false) && (
                  <button
                    onClick={handleStartCreate}
                    className={`${validSubscription ? 'bg-[#ff0080]' : 'bg-orange-600'} text-white px-10 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest border-none shadow-xl cursor-pointer hover:scale-105 transition-all`}
                  >
                    {validSubscription ? '+ CRÉER SOIRÉE' : '⚠️ S\'ABONNER'}
                  </button>
                )}
              </div>
            </header>

            {userData?.linkedDjCode && (
              <div className="mb-10 p-6 glass-card rounded-[30px] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#ff0080]/20 rounded-xl border border-[#ff0080]/30 text-[#ff0080]">
                    <Edit2 size={20} />
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-500">Votre Code DJ actuel</p>
                    <p className="text-xl font-black tracking-widest uppercase">{userData.linkedDjCode}</p>
                  </div>
                </div>

                {isEditingCode ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      className="px-6 py-3 rounded-xl bg-black border border-[#ff0080] text-white font-black uppercase text-center outline-none"
                      value={newDjCode}
                      onChange={(e) => setNewDjCode(e.target.value.toUpperCase())}
                    />

                    <button
                      onClick={handleUpdateDjCode}
                      className="bg-[#ff0080] text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] border-none cursor-pointer"
                    >
                      OK
                    </button>

                    <button
                      onClick={() => setIsEditingCode(false)}
                      className="text-gray-500 font-bold uppercase text-[10px] cursor-pointer bg-transparent border-none"
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
              <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-600 italic">
                Mes événements
              </h2>

              {userData?.role === 'dj' && (
                <div className="glass-card px-6 py-4 rounded-2xl border border-white/5 flex items-center gap-4">
                  <Package size={18} className="text-[#ff0080]" />

                  <div className="text-left">
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Compteur Clés USB</p>
                    <p className="text-xs font-black text-white">{usedUsbCount} / {freeUsbLimit} gratuites utilisées</p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {visibleEvents.map((event) => (
                <div
                  key={event.id}
                  className="glass-card p-10 rounded-[45px] border border-white/5 flex flex-col relative overflow-hidden"
                >
                  {event.usbOrdered && (
                    <div className="absolute top-6 right-6 flex items-center gap-2 bg-[#ff0080]/10 text-[#ff0080] px-3 py-1.5 rounded-full border border-[#ff0080]/30">
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
                        className="w-full py-4 bg-[#ff0080] text-white rounded-2xl font-black uppercase text-[10px] no-underline flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 hover:bg-[#e60073] transition-all"
                      >
                        ACCÉDER RÉGIE
                      </Link>
                    ) : (
                      <div className="bg-white/5 p-4 rounded-xl text-center text-[10px] font-bold text-gray-500 border border-dashed border-white/10 uppercase">
                        {event.status === 'terminé' ? "Soirée terminée" : "En cours"}
                      </div>
                    )}

                    <Link
                      href={`/event/${event.id}`}
                      className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border border-white/5 no-underline flex items-center justify-center gap-2"
                    >
                      PAGE INVITÉS <ArrowRight size={14} />
                    </Link>

                    {event.status === 'terminé' && userData?.role !== 'dj' && (
                      <Link
                        href={`/admin/${event.id}/galerie`}
                        className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black uppercase text-[10px] no-underline flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition-all"
                      >
                        <Download size={14} /> TÉLÉCHARGER PHOTOS
                      </Link>
                    )}

                    {userData?.role === 'dj' && (
                      <button
                        onClick={() => handleHideEvent(event.id)}
                        className="w-full py-4 mt-2 bg-red-600/10 hover:bg-red-600/30 text-red-500 hover:text-red-400 rounded-2xl font-black uppercase text-[10px] border border-red-500/20 cursor-pointer flex items-center justify-center gap-2 transition-all"
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
          <div className="glass-card p-12 rounded-[50px] max-w-xl mx-auto text-center border border-white/5 animate-in zoom-in">
            <button
              onClick={() => setStep(0)}
              className="mb-10 bg-transparent border-none text-gray-500 cursor-pointer font-black flex items-center gap-2"
            >
              <ArrowLeft size={14} /> RETOUR
            </button>

            <h2 className="text-4xl font-black italic uppercase mb-12 tracking-tighter">
              Nouvelle <span className="text-pink-600">Soirée</span>
            </h2>

            <input
              type="text"
              placeholder="NOM DE L'ÉVÉNEMENT"
              className="w-full p-8 rounded-[30px] bg-black border border-white/10 text-white font-black uppercase outline-none focus:border-pink-600 transition-all text-xl"
              value={formData.eventName}
              onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
            />

            <div
              onClick={() => setFormData({ ...formData, includeUsb: !formData.includeUsb })}
              className={`mt-6 w-full p-6 rounded-[30px] border transition-all cursor-pointer flex items-center justify-between ${
                formData.includeUsb
                  ? 'bg-[#ff0080]/10 border-[#ff0080]'
                  : 'bg-white/5 border-white/10 hover:border-white/30'
              }`}
            >
              <div className="flex items-center gap-4 text-left">
                <Package size={24} className={formData.includeUsb ? "text-[#ff0080]" : "text-gray-500"} />

                <div>
                  <p className={`font-black uppercase tracking-widest text-[12px] ${formData.includeUsb ? 'text-white' : 'text-gray-400'}`}>
                    INCLURE UNE CLÉ USB
                  </p>

                  <p className={`text-[10px] font-bold uppercase mt-1 ${remainingFreeUsb > 0 ? 'text-green-500' : 'text-orange-500'}`}>
                    {remainingFreeUsb > 0 ? `Gratuit (${remainingFreeUsb} clé(s) restante(s))` : 'Sera facturé 15€'}
                  </p>
                </div>
              </div>

              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                formData.includeUsb
                  ? 'border-[#ff0080] bg-[#ff0080]'
                  : 'border-gray-600'
              }`}>
                {formData.includeUsb && <CheckCircle2 size={14} className="text-white" />}
              </div>
            </div>

            <button
              onClick={handleCheckBeforeCreate}
              className="w-full p-8 rounded-[30px] bg-pink-600 font-black uppercase text-white cursor-pointer mt-8 border-none shadow-2xl transition-all hover:bg-pink-500"
            >
              LANCER LA SOIRÉE
            </button>
          </div>
        )}

        {step === 5 && (
          <div className="glass-card p-12 rounded-[50px] max-w-xl mx-auto text-center border border-white/10 animate-in zoom-in">
            <Package size={40} className="text-[#ff0080] mx-auto mb-6" />

            <h2 className="text-3xl font-black italic uppercase mb-2">
              Livraison de la clé
            </h2>

            <p className="text-gray-400 text-xs font-bold mb-8 uppercase tracking-widest">
              Coordonnées de l'organisateur
            </p>

            <div className="grid gap-4 text-left">
              <input
                type="text"
                placeholder="NOM ET PRÉNOM DU DESTINATAIRE"
                className="w-full p-5 rounded-2xl bg-black border border-white/10 text-white font-bold text-xs outline-none focus:border-pink-600 uppercase"
                value={shippingData.name}
                onChange={(e) => setShippingData({ ...shippingData, name: e.target.value.toUpperCase() })}
              />

              <input
                type="text"
                placeholder="ADRESSE POSTALE COMPLÈTE"
                className="w-full p-5 rounded-2xl bg-black border border-white/10 text-white font-bold text-xs outline-none focus:border-pink-600 uppercase"
                value={shippingData.address}
                onChange={(e) => setShippingData({ ...shippingData, address: e.target.value.toUpperCase() })}
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="CODE POSTAL"
                  className="w-full p-5 rounded-2xl bg-black border border-white/10 text-white font-bold text-xs outline-none focus:border-pink-600"
                  value={shippingData.zip}
                  onChange={(e) => setShippingData({ ...shippingData, zip: e.target.value })}
                />

                <input
                  type="text"
                  placeholder="VILLE"
                  className="w-full p-5 rounded-2xl bg-black border border-white/10 text-white font-bold text-xs outline-none focus:border-pink-600 uppercase"
                  value={shippingData.city}
                  onChange={(e) => setShippingData({ ...shippingData, city: e.target.value.toUpperCase() })}
                />
              </div>

              <input
                type="tel"
                placeholder="NUMÉRO DE TÉLÉPHONE"
                className="w-full p-5 rounded-2xl bg-black border border-white/10 text-white font-bold text-xs outline-none focus:border-pink-600"
                value={shippingData.phone}
                onChange={(e) => setShippingData({ ...shippingData, phone: e.target.value })}
              />
            </div>

            <button
              onClick={() => {
                const usedUsb = userData?.usedUsb || 0;
                const freeLimit = userData?.plan === "VIP GOLD" ? 12 : 0;

                if (usedUsb >= freeLimit) {
                  setStep(4);
                } else {
                  executeCreateEvent();
                }
              }}
              disabled={!shippingData.name || !shippingData.address || !shippingData.zip || !shippingData.city}
              className="w-full p-6 rounded-2xl bg-pink-600 hover:bg-pink-500 font-black uppercase text-white cursor-pointer border-none shadow-xl mt-8 transition-all disabled:opacity-30"
            >
              Continuer
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="glass-card p-12 rounded-[50px] max-w-xl mx-auto text-center border border-orange-500/30 animate-in zoom-in bg-orange-500/5">
            <AlertTriangle size={60} className="text-orange-500 mx-auto mb-6" />

            <h2 className="text-3xl font-black italic uppercase mb-4 text-orange-500 tracking-tighter">
              Facturation requise
            </h2>

            <p className="text-gray-300 font-bold mb-8">
              Votre quota de {freeUsbLimit} clés gratuites est épuisé.
              <br />
              Cette clé sera ajoutée à votre facturation.
            </p>

            <div className="bg-black/50 p-6 rounded-3xl border border-white/10 mb-8 flex justify-between items-center">
              <span className="text-sm font-black uppercase tracking-widest text-gray-400">Total</span>
              <span className="text-3xl font-black text-white">15,00 €</span>
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={handlePayExtraUsb}
                className="w-full p-6 rounded-2xl bg-orange-500 hover:bg-orange-400 font-black uppercase text-white cursor-pointer border-none shadow-xl flex items-center justify-center gap-2 tracking-widest text-xs"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : (
                  <>
                    <CreditCard size={18} /> Payer 15,00 € et Lancer
                  </>
                )}
              </button>

              <button
                onClick={() => setStep(1)}
                className="w-full p-6 rounded-2xl bg-transparent font-black uppercase text-gray-500 hover:text-white cursor-pointer border-none transition-all tracking-widest text-xs"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <div className="max-w-md mx-auto glass-card p-14 rounded-[60px] border border-white/5 shadow-2xl">
              <h2 className="text-4xl font-black italic uppercase mb-8 italic">
                {activeEventData?.eventName}
              </h2>

              <div className="bg-white p-8 rounded-[45px] inline-block mb-12">
                {typeof window !== "undefined" && (
                  <QRCodeSVG value={`${window.location.origin}/event/${activeEventId}`} size={220} />
                )}
              </div>

              <Link
                href={`/admin/${activeEventId}/dashboard`}
                className="w-full py-6 flex items-center justify-center bg-[#ff0080] rounded-[30px] text-[11px] font-black uppercase tracking-[0.3em] no-underline text-white"
              >
                ACCÉDER RÉGIE →
              </Link>
            </div>

            <button
              onClick={() => setStep(0)}
              className="mt-12 text-white/30 border-none bg-transparent cursor-pointer font-black uppercase text-[10px] italic"
            >
              Retour à l'accueil
            </button>
          </div>
        )}
      </div>

      {notify.show && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-8 py-4 rounded-full border border-pink-500/50 bg-black/90 text-pink-500 backdrop-blur-xl shadow-2xl animate-in slide-in-from-bottom-5">
          <CheckCircle2 size={18} />
          <span className="text-[10px] font-black uppercase italic tracking-widest">
            {notify.msg}
          </span>
        </div>
      )}

      <style jsx global>{`
        .bg-blobs { position: fixed; inset: 0; z-index: 0; overflow: hidden; background: black; }
        .blob { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.2; }
        .blob-pink { top: -10%; left: -10%; width: 50vw; height: 50vw; background: #ff0080; }
        .blob-purple { bottom: -10%; right: -10%; width: 60vw; height: 60vw; background: #7928ca; }
        .blob-blue { top: 20%; right: 10%; width: 30vw; height: 30vw; background: #0072ff; }
        .glass-card { background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(20px); }
      `}</style>
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="bg-black min-h-screen"></div>}>
      <AdminContent />
    </Suspense>
  );
}