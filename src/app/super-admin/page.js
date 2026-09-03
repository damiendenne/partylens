"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  getDocs,
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
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
  Trash2,
  MessageSquare,
  Mail,
  Star,
  Calendar,
  Lock,
  ArrowRight,
  Sun,
  Moon
} from 'lucide-react';

const PRICES = {
  bronze: 29,
  silver: 59,
  gold_monthly: 99,
  gold_annual: 990,
  frame: 0.99,
  usb: 15
};

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
  
  const [darkMode, setDarkMode] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [submittingLogin, setSubmittingLogin] = useState(false);

  const [activeTab, setActiveTab] = useState("logistique");
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [photoboothEmails, setPhotoboothEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [notify, setNotify] = useState({ show: false, msg: "" });

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      const tokenResult = user ? await user.getIdTokenResult() : null;
      setIsAuthenticated(Boolean(user && tokenResult?.claims?.admin === true));
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

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

    const unsubFeedbacks = onSnapshot(
      query(collection(db, "feedbacks"), orderBy("createdAt", "desc")),
      (snap) => {
        setFeedbacks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    );
    const unsubPhotoboothEmails = onSnapshot(collection(db, "photoboothEmails"), (snap) => {
      setPhotoboothEmails(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubEvents();
      unsubUsers();
      unsubFeedbacks();
      unsubPhotoboothEmails();
    };
  }, [isAuthenticated]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setSubmittingLogin(true);
    try {
      await signInWithEmailAndPassword(auth, emailInput.trim(), passwordInput);
      setIsAuthenticated(true);
    } catch {
      setLoginError("Identifiants incorrects.");
    }
    setSubmittingLogin(false);
  };

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
        setDownloadingId(null);
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
    if (!confirm("Voulez-vous supprimer définitivement cette soirée et toutes ses données ?")) return;

    try {
      const photosSnap = await getDocs(collection(db, "events", eventId, "photos"));
      const batch = writeBatch(db);
      photosSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();

      await deleteDoc(doc(db, "events", eventId));

      setNotify({ show: true, msg: "SOIRÉE SUPPRIMÉE" });
      setTimeout(() => setNotify({ show: false, msg: "" }), 3000);
    } catch (e) {
      console.error("Erreur lors de la suppression :", e);
      alert("Erreur lors de la suppression : " + e.message);
    }
  };

  const deleteFeedback = async (id) => {
    if (!confirm("Supprimer cet avis ?")) return;
    try {
      await deleteDoc(doc(db, "feedbacks", id));
      setNotify({ show: true, msg: "AVIS SUPPRIMÉ" });
      setTimeout(() => setNotify({ show: false, msg: "" }), 3000);
    } catch (e) {
      console.error("Erreur lors de la suppression de l'avis :", e);
      alert("Erreur lors de la suppression de l'avis : " + e.message);
    }
  };

  // NOUVEAU : Fonction pour supprimer un client / utilisateur
  const deleteUser = async (userId) => {
    if (!confirm("Voulez-vous supprimer définitivement ce client ?")) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      setNotify({ show: true, msg: "CLIENT SUPPRIMÉ" });
      setTimeout(() => setNotify({ show: false, msg: "" }), 3000);
    } catch (e) {
      console.error("Erreur lors de la suppression du client :", e);
      alert("Erreur lors de la suppression du client : " + e.message);
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

  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center italic font-black uppercase tracking-[0.3em] ${
        darkMode ? 'bg-gradient-to-b from-[#2d104d] via-[#210a3b] to-[#140427] text-white' : 'bg-[#f4f4f6] text-slate-900'
      }`}>
        <Loader2 className="animate-spin text-orange-400" size={32} />
      </div>
    );
  }

  const ThemeToggleBtn = (
    <button 
      onClick={() => setDarkMode(!darkMode)}
      className={`absolute top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md border cursor-pointer ${
        darkMode 
          ? 'bg-white/10 text-amber-300 border-white/20 hover:bg-white/20' 
          : 'bg-[#eaeaea] text-slate-700 border-slate-300 hover:bg-[#dedede]'
      }`}
      aria-label="Changer le mode d'affichage"
    >
      {darkMode ? <Sun size={15} /> : <Moon size={15} />}
      <span>{darkMode ? "Mode Clair" : "Mode Sombre"}</span>
    </button>
  );

  if (!isAuthenticated) {
    return (
      <main className={`min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-sans transition-colors duration-300 ${
        darkMode ? 'bg-gradient-to-b from-[#2d104d] via-[#210a3b] to-[#140427] text-white' : 'bg-[#f4f4f6] text-slate-900'
      }`}>
        {ThemeToggleBtn}

        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {darkMode ? (
            <>
              <svg className="absolute -top-12 left-0 w-full h-[500px] text-orange-500/35 blur-xl opacity-90" viewBox="0 0 1440 320" preserveAspectRatio="none">
                <path fill="currentColor" d="M0,160L60,176C120,192,240,224,360,213.3C480,203,600,149,720,154.7C840,160,960,224,1080,229.3C1200,235,1320,181,1380,154.7L1440,128L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,0,0Z"></path>
              </svg>
              <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-r from-orange-500/40 via-amber-400/30 to-pink-500/20 rounded-full blur-[130px]"></div>
            </>
          ) : (
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-r from-purple-200/30 via-orange-100/30 to-transparent rounded-full blur-[100px]"></div>
          )}
        </div>

        <div className={`relative z-10 w-full max-w-md p-10 rounded-[40px] backdrop-blur-2xl transition-all ${
          darkMode ? 'bg-[#170c2c]/80 border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]' : 'bg-white/90 border border-slate-300 shadow-slate-300/40 text-slate-900'
        }`}>
          <div className="text-center mb-8">
            <h1 className={`text-4xl font-black italic uppercase tracking-tighter mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              CONSOLE <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-200 bg-clip-text text-transparent">BOSS</span>
            </h1>
            <p className={`text-xs uppercase tracking-widest font-bold ${darkMode ? 'text-orange-200/70' : 'text-orange-600/80'}`}>Accès restreint administrateur</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className={`block text-[10px] font-black uppercase tracking-wider mb-2 ${darkMode ? 'text-orange-200/80' : 'text-slate-600'}`}>Adresse Email</label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="contact@partylens.fr"
                required
                className={`w-full p-4 rounded-2xl text-xs font-bold outline-none transition-all ${
                  darkMode ? 'bg-black/40 border border-white/20 text-white focus:border-orange-400 placeholder:text-gray-500' : 'bg-white border border-slate-300 text-slate-900 focus:border-orange-500 placeholder:text-slate-400 shadow-sm'
                }`}
              />
            </div>

            <div>
              <label className={`block text-[10px] font-black uppercase tracking-wider mb-2 ${darkMode ? 'text-orange-200/80' : 'text-slate-600'}`}>Mot de passe</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••••••"
                required
                className={`w-full p-4 rounded-2xl text-xs font-bold outline-none transition-all ${
                  darkMode ? 'bg-black/40 border border-white/20 text-white focus:border-orange-400 placeholder:text-gray-500' : 'bg-white border border-slate-300 text-slate-900 focus:border-orange-500 placeholder:text-slate-400 shadow-sm'
                }`}
              />
            </div>

            {loginError && (
              <p className="text-red-400 text-[10px] font-black uppercase tracking-wider text-center">{loginError}</p>
            )}

            <button
              type="submit"
              disabled={submittingLogin}
              className="w-full mt-4 bg-gradient-to-r from-orange-500 via-amber-500 to-pink-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(249,115,22,0.6)] border border-orange-300/40 cursor-pointer"
            >
              {submittingLogin ? <Loader2 className="animate-spin" size={16} /> : <>Se connecter <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center italic font-black uppercase tracking-[0.3em] ${
        darkMode ? 'bg-gradient-to-b from-[#2d104d] via-[#210a3b] to-[#140427] text-white' : 'bg-[#f4f4f6] text-slate-900'
      }`}>
        Chargement des données...
      </div>
    );
  }

  return (
    <main className={`min-h-screen p-6 md:p-12 font-sans relative overflow-hidden transition-colors duration-300 ${
      darkMode ? 'bg-gradient-to-b from-[#2d104d] via-[#210a3b] to-[#140427] text-white' : 'bg-[#f4f4f6] text-slate-900'
    }`}>
      {ThemeToggleBtn}

      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {darkMode ? (
          <>
            <svg className="absolute -top-12 left-0 w-full h-[500px] text-orange-500/35 blur-xl opacity-90" viewBox="0 0 1440 320" preserveAspectRatio="none">
              <path fill="currentColor" d="M0,160L60,176C120,192,240,224,360,213.3C480,203,600,149,720,154.7C840,160,960,224,1080,229.3C1200,235,1320,181,1380,154.7L1440,128L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,0,0Z"></path>
            </svg>
            <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-r from-orange-500/40 via-amber-400/30 to-pink-500/20 rounded-full blur-[130px]"></div>
          </>
        ) : (
          <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-r from-purple-200/30 via-orange-100/30 to-transparent rounded-full blur-[100px]"></div>
        )}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
          <h1 className={`text-5xl md:text-6xl font-black italic uppercase tracking-tighter ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            CONSOLE <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-200 bg-clip-text text-transparent">BOSS</span>
          </h1>

          <nav className={`flex flex-wrap gap-2 p-1.5 rounded-full border backdrop-blur-xl shadow-lg ${
            darkMode ? 'bg-white/[0.08] border-white/20' : 'bg-[#eaeaea] border-slate-300'
          }`}>
            {[
              { id: "dashboard", label: "STATS", icon: <BarChart3 size={14} /> },
              { id: "organisateurs", label: "CLIENTS", icon: <User size={14} /> },
              { id: "djs", label: "DJS", icon: <ShieldCheck size={14} /> },
              { id: "soirees", label: "SOIRÉES", icon: <Calendar size={14} /> },
              { id: "logistique", label: "LOGISTIQUE", icon: <Truck size={14} /> },
              { id: "avis", label: "AVIS", icon: <MessageSquare size={14} /> },
              { id: "emails", label: "EMAILS", icon: <Mail size={14} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-pink-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.5)] border border-orange-300/40'
                    : darkMode 
                      ? 'text-gray-300 hover:text-white hover:bg-white/10' 
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </header>

        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-in fade-in slide-in-from-bottom-4">
            <StatCard label="CHIFFRE D'AFFAIRES" value={`${stats.totalCA.toFixed(0)}€`} icon={<Euro className="text-orange-400" />} darkMode={darkMode} />
            <StatCard label="ABONNEMENTS" value={`${(stats.bronze.ca + stats.silver.ca + stats.gold.ca).toFixed(0)}€`} icon={<Zap className="text-amber-300" />} darkMode={darkMode} />
            <StatCard label="CADRES UNITÉS" value={stats.frames.count} icon={<CheckCircle className="text-orange-400" />} darkMode={darkMode} />
          </div>
        )}

        {activeTab === "avis" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
            {feedbacks.map((f) => (
              <div key={f.id} className={`border p-8 rounded-[35px] relative group transition-all backdrop-blur-xl shadow-xl ${
                darkMode ? 'bg-[#170c2c]/80 border-white/20 text-white hover:border-orange-400/80' : 'bg-white/90 border-slate-300 text-slate-950 hover:border-orange-500/80 shadow-slate-300/40'
              }`}>
                <button 
                  onClick={() => deleteFeedback(f.id)}
                  className={`absolute top-6 right-6 transition-colors cursor-pointer ${darkMode ? 'text-gray-400 hover:text-red-400' : 'text-slate-400 hover:text-red-600'}`}
                >
                  <Trash2 size={18} />
                </button>

                <div className="flex items-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={i < f.rating ? "#fbbf24" : "none"} className={i < f.rating ? "text-amber-400" : "text-gray-400"} />
                  ))}
                </div>

                <p className="text-lg font-bold italic mb-6 leading-tight">&ldquo;{f.message}&rdquo;</p>

                <div className={`space-y-3 pt-6 border-t ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
                  <div className={`flex items-center gap-3 text-[10px] font-black uppercase tracking-wider ${darkMode ? 'text-orange-200/80' : 'text-orange-700'}`}>
                    <Mail size={14} className="text-orange-400" /> {f.email}
                  </div>
                  <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-gray-400">
                    <Calendar size={14} /> {f.createdAt?.toDate().toLocaleDateString('fr-FR')}
                  </div>
                  <div className={`flex items-center gap-3 text-[10px] font-black uppercase ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    <User size={14} /> {f.name}
                  </div>
                </div>

                <a 
                  href={`mailto:${f.email}?subject=Votre avis sur PartyLens`}
                  className={`mt-6 block text-center py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all no-underline shadow-md ${
                    darkMode 
                      ? 'bg-white/15 hover:bg-white text-white hover:text-purple-950 border border-white/25' 
                      : 'bg-slate-200 hover:bg-slate-900 text-slate-800 hover:text-white border border-slate-300'
                  }`}
                >
                  Répondre par Email
                </a>
              </div>
            ))}
          </div>
        )}

        {activeTab === "emails" && (
          <div className="grid gap-4 animate-in fade-in">
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-[#170c2c]/80 border-white/20 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
              <h2 className="text-xl font-black uppercase">Contacts collectés</h2>
              <p className="text-xs opacity-70 mt-1">Comptes inscrits et adresses saisies dans le photobooth.</p>
            </div>
            {[...new Map([
              ...users.filter((u) => u.email || u.Email || u.mail || u.eMail).map((u) => {
                const email = u.email || u.Email || u.mail || u.eMail;
                return [String(email).toLowerCase(), { email: String(email), source: 'Compte inscrit', date: u.createdAt }];
              }),
              ...photoboothEmails.map((e) => [e.email.toLowerCase(), { email: e.email, source: 'Photobooth', date: e.createdAt }])
            ]).values()].sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0)).map((item) => (
              <div key={item.email} className={`flex items-center justify-between gap-4 p-5 rounded-2xl border ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                <div><Mail size={16} className="inline mr-3 text-orange-400" /><span className="font-bold">{item.email}</span></div>
                <span className="text-[10px] uppercase font-black opacity-60">{item.source}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "soirees" && (
          <div className="grid gap-6 animate-in fade-in">
            {events.length === 0 ? (
              <p className={`text-center text-xs italic ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Aucune soirée enregistrée pour le moment.</p>
            ) : (
              events.map((e) => {
                const user = users.find((u) => u.id === e.userId);

                return (
                  <div
                    key={e.id}
                    className={`border p-8 rounded-[40px] flex flex-wrap justify-between items-center gap-8 transition-all backdrop-blur-xl ${
                      darkMode 
                        ? 'bg-[#170c2c]/80 border-white/20 text-white hover:border-orange-400/90' 
                        : 'bg-white/90 border-slate-300 text-slate-900 hover:border-orange-500/90 shadow-slate-300/40'
                    }`}
                  >
                    <div className="flex-grow min-w-[250px]">
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">
                        {e.plan || "PLAN GRATUIT / BRONZE"} {e.usbOrdered ? "• Option USB" : ""}
                      </p>

                      <h3 className="text-2xl font-black italic tracking-tighter mb-2">
                        {e.eventName}
                      </h3>
                      
                      <p className={`text-xs font-bold mb-1 ${darkMode ? 'text-orange-200/80' : 'text-slate-600'}`}>
                        Organisateur : <span className={darkMode ? 'text-white' : 'text-slate-900'}>{user?.name || user?.email || e.userId}</span>
                      </p>

                      <p className="text-[10px] text-gray-400">
                        Créée le : {e.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || "Date N/A"}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => downloadAllPhotos(e)}
                        disabled={downloadingId === e.id}
                        className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border flex items-center gap-2 shadow-md cursor-pointer ${
                          darkMode 
                            ? 'bg-white/15 hover:bg-white text-white hover:text-purple-950 border-white/25' 
                            : 'bg-slate-200 hover:bg-slate-900 text-slate-800 hover:text-white border-slate-300'
                        }`}
                      >
                        {downloadingId === e.id ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                        Télécharger ZIP
                      </button>

                      <button
                        onClick={() => purgeEvent(e.id)}
                        className="bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border border-red-500/30 flex items-center gap-2 cursor-pointer"
                        title="Supprimer la soirée"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === "logistique" && (
          <div className="grid gap-6 animate-in fade-in">
            {events.filter((e) => e.usbOrdered || e.plan === "VIP GOLD").map((e) => {
              const user = users.find((u) => u.id === e.userId);
              const shipping = getShippingInfo(e, user);
              const hasShipping = hasShippingInfo(shipping);

              return (
                <div
                  key={e.id}
                  className={`border p-8 rounded-[40px] flex flex-wrap justify-between items-center gap-8 transition-all backdrop-blur-xl ${
                    darkMode 
                      ? 'bg-[#170c2c]/80 border-white/20 text-white hover:border-orange-400/90 hover:shadow-[0_0_30px_rgba(249,115,22,0.45)]' 
                      : 'bg-white/90 border-slate-300 text-slate-900 hover:border-orange-500/90 shadow-slate-300/40'
                  }`}
                >
                  <div className="flex-grow min-w-[250px]">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">
                      {e.usbStatus || "VALIDÉE"}
                    </p>

                    <h3 className="text-2xl font-black italic tracking-tighter mb-2">
                      {e.eventName}
                    </h3>
                    <p className={`text-xs font-bold mb-2 ${darkMode ? 'text-orange-200/80' : 'text-slate-600'}`}>
                      Organisateur ID : <span className={darkMode ? 'text-white' : 'text-slate-900'}>{e.userId}</span>
                    </p>

                    {hasShipping ? (
                      <div className={`mt-4 p-4 rounded-2xl border text-xs space-y-1 ${
                        darkMode ? 'bg-black/40 border-white/10 text-gray-200' : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}>
                        <p><strong className={darkMode ? 'text-white' : 'text-slate-900'}>Nom :</strong> {shipping.name}</p>
                        <p><strong className={darkMode ? 'text-white' : 'text-slate-900'}>Adresse :</strong> {shipping.address}, {shipping.zip} {shipping.city}</p>
                        <p><strong className={darkMode ? 'text-white' : 'text-slate-900'}>Tél :</strong> {shipping.phone || "Non renseigné"} | <strong className={darkMode ? 'text-white' : 'text-slate-900'}>Email :</strong> {shipping.email}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-500 italic mt-2">Aucune adresse de livraison renseignée.</p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex flex-col gap-2">
                      <select
                        value={e.usbStatus || "en attente"}
                        onChange={(ev) => updateUsbStatus(e.id, ev.target.value)}
                        className={`border px-4 py-2 rounded-xl text-xs font-bold outline-none cursor-pointer ${
                          darkMode ? 'bg-black/40 border-white/20 text-white focus:border-orange-400' : 'bg-white border-slate-300 text-slate-900 focus:border-orange-500 shadow-sm'
                        }`}
                      >
                        <option value="en attente" className={darkMode ? "bg-purple-950" : "bg-white"}>En attente</option>
                        <option value="en préparation" className={darkMode ? "bg-purple-950" : "bg-white"}>En préparation</option>
                        <option value="envoyé" className={darkMode ? "bg-purple-950" : "bg-white"}>Envoyé</option>
                      </select>
                      <input
                        type="text"
                        placeholder="N° de suivi Colissimo"
                        defaultValue={e.trackingNumber || ""}
                        onBlur={(ev) => updateUsbStatus(e.id, e.usbStatus || "en attente", ev.target.value)}
                        className={`border px-4 py-2 rounded-xl text-xs font-bold outline-none ${
                          darkMode ? 'bg-black/40 border-white/20 text-white focus:border-orange-400 placeholder:text-gray-500' : 'bg-white border-slate-300 text-slate-900 focus:border-orange-500 placeholder:text-slate-400 shadow-sm'
                        }`}
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadAllPhotos(e)}
                        disabled={downloadingId === e.id}
                        className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border flex items-center gap-2 shadow-md cursor-pointer ${
                          darkMode 
                            ? 'bg-white/15 hover:bg-white text-white hover:text-purple-950 border-white/25' 
                            : 'bg-slate-200 hover:bg-slate-900 text-slate-800 hover:text-white border-slate-300'
                        }`}
                      >
                        {downloadingId === e.id ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                        ZIP
                      </button>
                      <button
                        onClick={() => purgeEvent(e.id)}
                        className="bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border border-red-500/30 flex items-center gap-2 cursor-pointer"
                        title="Supprimer la soirée"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "organisateurs" && (
          <div className="grid gap-6 animate-in fade-in">
            {users.length === 0 ? (
              <p className={`text-center text-xs italic ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Aucun client enregistré pour le moment.</p>
            ) : (
              users.map((u) => (
                <div key={u.id} className={`border p-8 rounded-[40px] flex justify-between items-center backdrop-blur-xl shadow-xl ${
                  darkMode ? 'bg-[#170c2c]/80 border-white/20 text-white' : 'bg-white/90 border-slate-300 text-slate-900 shadow-slate-300/40'
                }`}>
                  <div>
                    <h3 className="text-xl font-black italic tracking-tighter mb-1">{u.name || u.email}</h3>
                    <p className={`text-xs ${darkMode ? 'text-orange-200/80' : 'text-slate-600'}`}>Plan : <span className="text-amber-500 font-bold">{u.plan || "Gratuit"}</span></p>
                    <p className="text-[10px] text-gray-400 mt-1">ID : {u.id}</p>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{u.email}</p>
                      <p className="text-[10px] text-gray-400">Inscrit le {u.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || "N/A"}</p>
                    </div>

                    <button
                      onClick={() => deleteUser(u.id)}
                      className="bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white p-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border border-red-500/30 flex items-center gap-2 cursor-pointer"
                      title="Supprimer le client"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "djs" && (
          <div className={`border p-10 rounded-[40px] backdrop-blur-xl text-center shadow-xl ${
            darkMode ? 'bg-[#170c2c]/80 border-white/20 text-white' : 'bg-white/90 border-slate-300 text-slate-900 shadow-slate-300/40'
          }`}>
            <h3 className="text-2xl font-black italic mb-4">Espace DJs / Régie</h3>
            <p className={`text-xs ${darkMode ? 'text-orange-200/80' : 'text-slate-600'}`}>Gestion centralisée des accès DJ et des demandes de titres en temps réel.</p>
          </div>
        )}
      </div>

      {notify.show && (
        <div className="fixed bottom-6 right-6 bg-gradient-to-r from-orange-500 via-amber-500 to-pink-500 text-white font-black uppercase tracking-wider text-xs px-6 py-4 rounded-2xl shadow-[0_0_30px_rgba(249,115,22,0.6)] border border-orange-300/40 z-50 animate-bounce">
          {notify.msg}
        </div>
      )}
    </main>
  );
}

function StatCard({ label, value, icon, darkMode }) {
  return (
    <div className={`border p-8 rounded-[30px] flex items-center justify-between backdrop-blur-xl shadow-xl transition-all ${
      darkMode ? 'bg-[#170c2c]/80 border-white/20 text-white' : 'bg-white/90 border-slate-300 text-slate-900 shadow-slate-300/40'
    }`}>
      <div>
        <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-orange-200/70' : 'text-orange-700'}`}>{label}</p>
        <p className={`text-4xl font-black italic tracking-tighter ${darkMode ? 'text-white' : 'text-slate-900'}`}>{value}</p>
      </div>
      <div className={`p-4 rounded-2xl border shadow-inner ${darkMode ? 'bg-black/40 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
        {icon}
      </div>
    </div>
  );
}
