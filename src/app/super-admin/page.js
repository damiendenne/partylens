"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  CheckCircle,
  Truck,
  Euro,
  BarChart3,
  Download,
  Zap,
  ShieldCheck,
  User,
  Loader2,
  Trash2
} from 'lucide-react';

const PRICES = {
  bronze: 29,
  silver: 59,
  gold_monthly: 99,
  gold_annual: 990,
  frame: 0.99,
  usb: 15
};

const ADMIN_EMAIL = "damiendenne.nicolastual@outlook.fr";

const getShippingInfo = (event, user) => {
  const sources = [
    event?.shippingInfo,
    event?.deliveryInfo,
    event?.customerInfo,
    event?.clientInfo,
    user?.shippingInfo,
    user?.deliveryInfo,
    user?.customerInfo,
    user?.clientInfo
  ];

  const source = sources.find((item) => {
    if (!item || typeof item !== "object") return false;

    return Object.values(item).some((value) => {
      return typeof value === "string" && value.trim() !== "";
    });
  }) || {};

  return {
    name:
      source.name ||
      source.fullName ||
      source.displayName ||
      event?.shippingName ||
      user?.displayName ||
      user?.name ||
      "",

    address:
      source.address ||
      source.street ||
      source.streetAddress ||
      source.adresse ||
      event?.address ||
      event?.shippingAddress ||
      "",

    city:
      source.city ||
      source.ville ||
      event?.city ||
      event?.shippingCity ||
      "",

    zip:
      source.zip ||
      source.postalCode ||
      source.postcode ||
      source.codePostal ||
      event?.zip ||
      event?.shippingZip ||
      "",

    phone:
      source.phone ||
      source.phoneNumber ||
      source.tel ||
      event?.phone ||
      event?.shippingPhone ||
      "",

    email:
      source.email ||
      event?.email ||
      user?.email ||
      ""
  };
};

const hasShippingInfo = (shipping) => {
  return Boolean(
    shipping.address ||
    shipping.city ||
    shipping.zip ||
    shipping.name ||
    shipping.phone
  );
};

export default function SuperAdmin() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("logistique");
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [notify, setNotify] = useState({ show: false, msg: "" });

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
        router.push('/');
      } else {
        const unsubEvents = onSnapshot(
          query(collection(db, "events"), orderBy("createdAt", "desc")),
          (snap) => {
            setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            setLoading(false);
          }
        );

        const unsubUsers = onSnapshot(
          query(collection(db, "users"), orderBy("createdAt", "desc")),
          (snap) => {
            setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          }
        );

        return () => {
          unsubEvents();
          unsubUsers();
        };
      }
    });

    return () => unsubAuth();
  }, [router]);

  const stats = useMemo(() => {
    const s = {
      bronze: { count: 0, ca: 0 },
      silver: { count: 0, ca: 0 },
      gold: { count: 0, ca: 0 },
      frames: { count: 0, ca: 0 },
      usb: { count: 0, ca: 0 },
      totalCA: 0
    };

    users.forEach((u) => {
      if (u.plan === "BRONZE") {
        s.bronze.count++;
        s.bronze.ca += PRICES.bronze;
      }

      if (u.plan === "SILVER") {
        s.silver.count++;
        s.silver.ca += PRICES.silver;
      }

      if (u.plan === "VIP GOLD") {
        s.gold.count++;
        s.gold.ca += u.billingCycle === "Annuel" ? PRICES.gold_annual : PRICES.gold_monthly;
      }
    });

    events.forEach((e) => {
      if (e.usbOrdered) {
        s.usb.count++;
        if (e.usbPaid) s.usb.ca += PRICES.usb;
      }

      if (e.unlockedFrames) {
        s.frames.count += e.unlockedFrames.length;
        s.frames.ca += e.unlockedFrames.length * PRICES.frame;
      }
    });

    s.totalCA = s.bronze.ca + s.silver.ca + s.gold.ca + s.frames.ca + s.usb.ca;

    return s;
  }, [users, events]);

  const downloadAllPhotos = async (event) => {
    setDownloadingId(event.id);

    const zip = new JSZip();
    const folder = zip.folder(event.eventName.replace(/\s+/g, '_'));

    try {
      const photosColRef = collection(db, "events", event.id, "photos");
      const querySnapshot = await getDocs(photosColRef);

      if (querySnapshot.empty) {
        alert("Aucune photo !");
        return;
      }

      const downloadPromises = querySnapshot.docs.map(async (docSnap, index) => {
        const photoData = docSnap.data();

        if (photoData.url) {
          const response = await fetch(photoData.url);
          const blob = await response.blob();
          folder.file(`photo_${index + 1}.jpg`, blob);
        }
      });

      await Promise.all(downloadPromises);

      const content = await zip.generateAsync({ type: "blob" });

      saveAs(content, `PartyLens_${event.eventName}.zip`);

      setNotify({ show: true, msg: "ZIP PRÊT !" });
      setTimeout(() => setNotify({ show: false, msg: "" }), 3000);
    } catch (e) {
      alert("Erreur CORS Storage.");
    } finally {
      setDownloadingId(null);
    }
  };

  const purgeEvent = async (eventId) => {
    if (!confirm("Voulez-vous supprimer définitivement la galerie de cette soirée ?")) return;

    try {
      const photosSnap = await getDocs(collection(db, "events", eventId, "photos"));
      const batch = writeBatch(db);

      photosSnap.docs.forEach((d) => batch.delete(d.ref));

      await batch.commit();

      setNotify({ show: true, msg: "GALERIE PURGÉE" });
      setTimeout(() => setNotify({ show: false, msg: "" }), 3000);
    } catch (e) {
      alert("Erreur purge");
    }
  };

  const updateUsbStatus = async (eventId, newStatus, trackingNumber = null) => {
    try {
      const eventData = events.find((e) => e.id === eventId);
      const user = users.find((u) => u.id === eventData.userId);
      const shipping = getShippingInfo(eventData, user);

      const data = { usbStatus: newStatus };

      if (newStatus !== eventData.usbStatus) {
        data[`usb_date_${newStatus}`] = new Date().toISOString();
      }

      if (trackingNumber !== null) {
        data.trackingNumber = trackingNumber;
      }

      await updateDoc(doc(db, "events", eventId), data);

      if (newStatus === "envoyé" && (trackingNumber || eventData.trackingNumber)) {
        const email = shipping.email;

        if (email) {
          await fetch('/api/send-tracking', {
            method: 'POST',
            body: JSON.stringify({
              email,
              eventName: eventData.eventName,
              trackingNumber: trackingNumber || eventData.trackingNumber
            })
          });
        }
      }

      if (trackingNumber !== null) {
        setNotify({ show: true, msg: "SUIVI ENREGISTRÉ" });
        setTimeout(() => setNotify({ show: false, msg: "" }), 2000);
      }
    } catch (e) {
      alert("Erreur MAJ");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white italic font-black uppercase tracking-[0.3em]">
        Console Boss...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans relative overflow-hidden">
      <div className="bg-blobs">
        <div className="blob blob-pink"></div>
        <div className="blob blob-purple"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-16">
          <h1 className="text-6xl font-black italic uppercase tracking-tighter">
            CONSOLE <span className="text-[#ff0080]">BOSS</span>
          </h1>

          <nav className="flex gap-2 bg-white/5 p-1.5 rounded-full border border-white/10 backdrop-blur-md">
            {[
              { id: "dashboard", label: "STATS", icon: <BarChart3 size={14} /> },
              { id: "organisateurs", label: "CLIENTS", icon: <User size={14} /> },
              { id: "djs", label: "DJS", icon: <ShieldCheck size={14} /> },
              { id: "logistique", label: "LOGISTIQUE", icon: <Truck size={14} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#ff0080] text-white shadow-[0_0_20px_rgba(255,0,128,0.4)]'
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </header>

        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-in fade-in slide-in-from-bottom-4">
            <StatCard label="CHIFFRE D'AFFAIRES" value={`${stats.totalCA.toFixed(0)}€`} icon={<Euro className="text-green-500" />} />
            <StatCard label="ABONNEMENTS" value={`${(stats.bronze.ca + stats.silver.ca + stats.gold.ca).toFixed(0)}€`} icon={<Zap className="text-yellow-500" />} />
            <StatCard label="CADRES UNITÉS" value={stats.frames.count} icon={<CheckCircle className="text-blue-500" />} />
          </div>
        )}

        {activeTab === "logistique" && (
          <div className="grid gap-6">
            {events.filter((e) => e.usbOrdered || e.plan === "VIP GOLD").map((e) => {
              const user = users.find((u) => u.id === e.userId);
              const shipping = getShippingInfo(e, user);
              const hasShipping = hasShippingInfo(shipping);

              return (
                <div
                  key={e.id}
                  className="glass-card p-8 rounded-[40px] border border-white/5 flex flex-wrap justify-between items-center gap-8 hover:border-[#ff0080]/30 transition-all"
                >
                  <div className="flex-grow min-w-[250px]">
                    <p className="text-[10px] font-black text-[#ff0080] uppercase tracking-widest mb-1">
                      {e.usbStatus || "VALIDÉE"}
                    </p>

                    <h3 className="text-4xl font-black italic uppercase mb-6 tracking-tighter">
                      {e.eventName}
                    </h3>

                    <div className="bg-black/30 p-6 rounded-3xl border border-white/5 text-[10px] font-bold text-gray-500 uppercase leading-relaxed">
                      {hasShipping ? (
                        <>
                          <span className="text-white text-xs">
                            {shipping.name || "Nom non renseigné"}
                          </span>
                          <br />

                          <span className="text-gray-300">
                            {shipping.address || "Rue non renseignée"}
                          </span>
                          <br />

                          <span className="text-gray-300">
                            {shipping.zip || "CP non renseigné"} {shipping.city || "Ville non renseignée"}
                          </span>
                          <br />

                          <span className="text-gray-600">
                            {shipping.phone || "Téléphone non renseigné"}
                          </span>

                          {shipping.email && (
                            <>
                              <br />
                              <span className="text-gray-600 lowercase normal-case">
                                {shipping.email}
                              </span>
                            </>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-red-500 italic">
                            ADRESSE NON RENSEIGNÉE
                          </span>
                          <span className="text-[8px] text-gray-600 lowercase normal-case mt-1">
                            Document event : {e.id}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 min-w-[160px]">
                    <StatusRow label="1. VALIDÉE" date={e.createdAt} active={true} />
                    <StatusRow label="2. PRÉPARÉE" date={e.usb_date_preparé} active={Boolean(e.usb_date_preparé)} />
                    <StatusRow label="3. ENVOYÉE" date={e.usb_date_envoyé} active={Boolean(e.usb_date_envoyé)} />
                    <StatusRow label="4. REÇUE" date={e.usb_date_recue} active={Boolean(e.usb_date_recue)} />
                  </div>

                  <div className="flex flex-col gap-3 min-w-[240px]">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="N° DE SUIVI"
                        defaultValue={e.trackingNumber || ""}
                        onBlur={(el) => updateUsbStatus(e.id, e.usbStatus || "validée", el.target.value)}
                        className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-[10px] font-black uppercase text-[#ff0080] outline-none focus:border-[#ff0080] transition-all placeholder:text-gray-800"
                      />
                      <Truck size={14} className="absolute right-4 top-4 text-gray-800" />
                    </div>

                    <select
                      className="bg-[#111] border border-white/10 p-4 rounded-2xl text-[10px] font-black uppercase text-white outline-none cursor-pointer hover:border-[#ff0080]"
                      onChange={(opt) => updateUsbStatus(e.id, opt.target.value)}
                      value={e.usbStatus || "validée"}
                    >
                      <option value="validée">1. VALIDÉE</option>
                      <option value="preparé">2. PRÉPARÉE</option>
                      <option value="envoyé">3. ENVOYÉE</option>
                      <option value="recue">4. REÇUE</option>
                    </select>

                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadAllPhotos(e)}
                        disabled={downloadingId === e.id}
                        className="flex-grow py-4 bg-white/5 hover:bg-white text-white hover:text-black rounded-2xl font-black uppercase text-[10px] transition-all flex items-center justify-center gap-3 border border-white/10"
                      >
                        {downloadingId === e.id ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                        ZIP
                      </button>

                      <button
                        onClick={() => purgeEvent(e.id)}
                        className="p-4 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-2xl transition-all border border-red-500/20"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {(activeTab === "organisateurs" || activeTab === "djs") && (
          <div className="glass-card rounded-[40px] border border-white/5 overflow-hidden animate-in fade-in">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-[9px] uppercase font-black text-gray-500 tracking-widest">
                <tr>
                  <th className="p-6">NOM</th>
                  <th className="p-6">PACK</th>
                  <th className="p-6">INFOS</th>
                  <th className="p-6">TOTAL</th>
                </tr>
              </thead>

              <tbody className="text-[11px] font-bold uppercase italic">
                {users
                  .filter((u) => activeTab === "organisateurs" ? (u.role === 'organisateur' || !u.role) : u.role === 'dj')
                  .map((u) => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="p-6">
                        {u.displayName || u.email.split('@')[0]}
                      </td>

                      <td className="p-6">
                        <span className="px-3 py-1.5 bg-[#ff0080]/10 text-[#ff0080] rounded-lg border border-[#ff0080]/20">
                          {u.plan || "BRONZE"}
                        </span>
                      </td>

                      <td className="p-6 text-gray-500">
                        {u.email}
                      </td>

                      <td className="p-6">
                        {activeTab === "djs" ? `${u.usedUsb || 0} USB` : `${events.filter((e) => e.userId === u.id).length} SOIRÉES`}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {notify.show && (
        <div className="fixed bottom-10 right-10 bg-[#ff0080] text-white px-10 py-5 rounded-2xl font-black uppercase text-[10px] italic shadow-[0_10px_40px_rgba(255,0,128,0.5)] z-50 animate-in slide-in-from-right-10">
          {notify.msg}
        </div>
      )}

      <style jsx global>{`
        .bg-blobs { position: fixed; inset: 0; z-index: 0; background: #050505; }
        .blob { position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.15; }
        .blob-pink { top: -10%; left: -10%; width: 60vw; height: 60vw; background: #ff0080; }
        .blob-purple { bottom: -10%; right: -10%; width: 50vw; height: 50vw; background: #7928ca; }
        .glass-card { background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(40px); }
      `}</style>
    </main>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="glass-card p-10 rounded-[50px] border border-white/5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 transition-all">
        {icon}
      </div>

      <p className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] mb-4">
        {label}
      </p>

      <h2 className="text-6xl font-black italic tracking-tighter">
        {value}
      </h2>
    </div>
  );
}

function StatusRow({ label, date, active }) {
  return (
    <div className={`flex items-center gap-3 ${active ? 'opacity-100' : 'opacity-20'}`}>
      <div className={`w-2.5 h-2.5 rounded-full ${active ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-white'}`} />

      <div>
        <p className="text-[9px] font-black uppercase tracking-tighter">
          {label}
        </p>

        {date && (
          <p className="text-[8px] text-gray-500 font-bold">
            {new Date(date.seconds ? date.toDate() : date).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}