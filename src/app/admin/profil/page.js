"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, signOut, deleteUser } from 'firebase/auth';
import { User, Mail, MapPin, Phone, CreditCard, ArrowLeft, Save, Loader2, CheckCircle2, ShieldAlert, AlertTriangle, X, Sun, Moon } from 'lucide-react';
import Link from 'next/link';

export default function ProfilPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notify, setNotify] = useState({ show: false, msg: "", type: "success" });
  const [darkMode, setDarkMode] = useState(true);
  
  // ÉTATS DE LA MODALE DE SUPPRESSION
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    zip: '',
    city: ''
  });
  
  const [packInfo, setPackInfo] = useState({
    plan: 'Aucun',
    billingCycle: '-',
    usbQuantity: 0,
    totalAmount: 0
  });

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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setFormData({
              name: data.name || '',
              email: data.email || currentUser.email,
              phone: data.phone || '',
              street: data.address?.street || '',
              zip: data.address?.zip || '',
              city: data.address?.city || ''
            });
            setPackInfo({
              plan: data.plan || 'Aucun',
              billingCycle: data.billingCycle || '-',
              usbQuantity: data.usbQuantity || 0,
              totalAmount: data.totalAmount || 0
            });
          }
        } catch (error) {
          console.error("Erreur chargement profil :", error);
        } finally {
          setLoading(false);
        }
      } else {
        router.push('/login');
      }
    });

    return () => unsub();
  }, [router]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: formData.name,
        phone: formData.phone,
        address: {
          street: formData.street,
          zip: formData.zip,
          city: formData.city
        }
      });
      setNotify({ show: true, msg: "PROFIL MIS À JOUR", type: "success" });
      setTimeout(() => setNotify({ show: false, msg: "", type: "success" }), 3000);
    } catch (error) {
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "SUPPRIMER") return;
    
    setDeleting(true);
    try {
      const eventsRef = collection(db, "events");
      const q = query(eventsRef, where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      const deletePromises = querySnapshot.docs.map((eventDoc) => 
        deleteDoc(doc(db, "events", eventDoc.id))
      );
      await Promise.all(deletePromises);

      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(auth.currentUser);

      router.push('/login');
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/requires-recent-login') {
        alert("Pour des raisons de sécurité, veuillez vous déconnecter et vous reconnecter avant de supprimer votre compte.");
        await signOut(auth);
        router.push('/login');
      } else {
        alert("Une erreur est survenue lors de la suppression de votre compte.");
      }
    } finally {
      setDeleting(false);
    }
  };

  const cardBg = darkMode 
    ? 'bg-[#170c2c] border border-white/10 text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)]' 
    : 'bg-[#eaeaea] border border-slate-300 text-slate-900 shadow-lg';

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-black italic uppercase tracking-[0.3em] transition-colors duration-300 ${
        darkMode ? 'bg-[#0f071e] text-white' : 'bg-[#f4f4f6] text-slate-900'
      }`}>
        <Loader2 className="animate-spin text-orange-400 mr-3" size={24} />
        Chargement...
      </div>
    );
  }

  return (
    <main className={`min-h-screen relative overflow-hidden p-6 md:p-12 font-sans flex flex-col transition-colors duration-300 ${
      darkMode ? 'bg-[#0f071e] text-white selection:bg-orange-500 selection:text-white' : 'bg-[#f4f4f6] text-slate-900 selection:bg-orange-500 selection:text-white'
    }`}>
      
      {/* Halos de lumière d'ambiance */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {darkMode && (
          <>
            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-r from-orange-500/20 via-amber-500/10 to-purple-600/20 rounded-full blur-[140px]"></div>
            <div className="absolute bottom-10 right-10 w-[500px] h-[300px] bg-gradient-to-tr from-purple-600/15 to-orange-500/10 rounded-full blur-[120px]"></div>
          </>
        )}
      </div>

      {/* BOUTON TOGGLE MODE EN HAUT À DROITE */}
      <button 
        onClick={toggleDarkMode}
        className={`absolute top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md border cursor-pointer ${
          darkMode 
            ? 'bg-white/15 text-amber-300 border-white/20 hover:bg-white/25' 
            : 'bg-[#eaeaea] text-slate-700 border-slate-300 hover:bg-[#dedede]'
        }`}
        aria-label="Changer le mode d'affichage"
      >
        {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        <span>{darkMode ? "Mode Clair" : "Mode Sombre"}</span>
      </button>

      <div className="max-w-5xl mx-auto relative z-10 w-full flex-grow">
        
        {/* HEADER */}
        <header className="mb-12 flex items-center gap-6">
          <button 
            onClick={() => router.back()} 
            className={`p-4 rounded-2xl transition-all border backdrop-blur-xl cursor-pointer ${
              darkMode 
                ? 'bg-white/10 hover:bg-white/25 border-white/15 text-white' 
                : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 shadow-md'
            }`}
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className={`text-4xl md:text-5xl font-black italic uppercase tracking-tighter ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            MON <span className="text-orange-500">COMPTE</span>
          </h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* COLONNE GAUCHE (Formulaire) */}
          <div className="md:col-span-2 space-y-6">
            <div className={`p-8 sm:p-10 rounded-[45px] transition-colors duration-300 ${cardBg}`}>
              <h2 className={`text-xl font-black uppercase italic tracking-widest mb-8 ${darkMode ? 'text-orange-200/70' : 'text-orange-600'}`}>Informations Personnelles</h2>
              
              <form onSubmit={handleSave} className="space-y-5">
                <div className="relative">
                  <User className="absolute left-5 top-5 text-orange-500" size={18} />
                  <input type="text" placeholder="NOM COMPLET" className={`input-style ${darkMode ? 'dark-input' : 'light-input'}`} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>

                <div className="relative">
                  <Mail className="absolute left-5 top-5 text-gray-400" size={18} />
                  <input type="email" placeholder="EMAIL" disabled className={`input-style opacity-50 cursor-not-allowed ${darkMode ? 'dark-input border-white/5' : 'light-input border-slate-300'}`} value={formData.email} />
                </div>

                <div className="relative">
                  <Phone className="absolute left-5 top-5 text-orange-500" size={18} />
                  <input type="tel" placeholder="TÉLÉPHONE" className={`input-style ${darkMode ? 'dark-input' : 'light-input'}`} value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>

                <div className="pt-4">
                  <h3 className={`text-[11px] font-black uppercase tracking-[0.2em] mb-4 ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Adresse de facturation / Livraison</h3>
                  <div className="relative mb-5">
                    <MapPin className="absolute left-5 top-5 text-orange-500" size={18} />
                    <input type="text" placeholder="RUE / ADRESSE" className={`input-style ${darkMode ? 'dark-input' : 'light-input'}`} value={formData.street} onChange={(e) => setFormData({...formData, street: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="CODE POSTAL" className={`input-style ${darkMode ? 'dark-input' : 'light-input'}`} value={formData.zip} onChange={(e) => setFormData({...formData, zip: e.target.value})} />
                    <input type="text" placeholder="VILLE" className={`input-style ${darkMode ? 'dark-input' : 'light-input'}`} value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={saving} 
                  className="w-full mt-8 py-6 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-[25px] font-black uppercase text-[11px] tracking-[0.3em] shadow-lg border-none text-white cursor-pointer active:scale-95 hover:scale-[1.02] transition-all flex justify-center items-center gap-3"
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> ENREGISTRER LES MODIFICATIONS</>}
                </button>
              </form>
            </div>
          </div>

          {/* COLONNE DROITE (Abonnement + Suppression) */}
          <div className="space-y-6">
            
            {/* ABONNEMENT */}
            <div className={`p-8 rounded-[45px] flex flex-col transition-colors duration-300 ${cardBg}`}>
              <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center mb-6 border border-orange-500/30 text-orange-500">
                <CreditCard size={20} />
              </div>
              <h2 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>Abonnement Actuel</h2>
              <p className={`text-3xl font-black italic uppercase mb-6 tracking-tighter ${darkMode ? 'text-white' : 'text-slate-900'}`}>PACK <span className="text-orange-500">{packInfo.plan}</span></p>
              
              <div className={`space-y-4 mb-8 border-b pb-4 ${darkMode ? 'border-white/10' : 'border-slate-300'}`}>
                <div className="flex justify-between items-center text-[11px] font-bold pb-1">
                  <span className={`uppercase ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Facturation</span>
                  <span className={darkMode ? 'text-white' : 'text-slate-900'}>{packInfo.billingCycle}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold pb-1">
                  <span className={`uppercase ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Clés USB</span>
                  <span className={darkMode ? 'text-white' : 'text-slate-900'}>{packInfo.usbQuantity} Unité(s)</span>
                </div>
              </div>

              <Link 
                href="/admin/plan-selection" 
                className={`w-full mt-auto py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border cursor-pointer flex items-center justify-center no-underline text-center ${
                  darkMode ? 'bg-white/10 hover:bg-white/25 text-white border-white/15' : 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300'
                }`}
              >
                MODIFIER MON PACK
              </Link>
            </div>

            {/* ZONE DANGER : SUPPRESSION COMPTE */}
            <div className="p-8 rounded-[45px] border border-red-500/40 bg-red-500/10 backdrop-blur-3xl flex flex-col items-start shadow-lg">
              <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center mb-4 border border-red-500/30 text-red-400">
                <ShieldAlert size={20} />
              </div>
              <h2 className="text-[12px] font-black uppercase text-red-400 tracking-widest mb-2">Zone Danger</h2>
              <p className={`text-[10px] font-bold mb-6 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                La suppression de votre compte est définitive. Toutes vos données, soirées et photos seront effacées instantanément.
              </p>
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="w-full py-4 bg-transparent border border-red-500/50 hover:bg-red-600 text-red-400 hover:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer"
              >
                SUPPRIMER MON COMPTE
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* MODALE DE CONFIRMATION DE SUPPRESSION */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className={`w-full max-w-md p-8 sm:p-10 rounded-[45px] border border-red-500/40 relative shadow-2xl ${
            darkMode ? 'bg-[#1a0831] text-white' : 'bg-white text-slate-900'
          }`}>
            
            <button onClick={() => {setShowDeleteModal(false); setDeleteConfirmText("");}} className={`absolute top-6 right-6 bg-transparent border-none cursor-pointer ${darkMode ? 'text-gray-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}>
              <X size={20}/>
            </button>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30 text-red-400">
                <AlertTriangle size={24} />
              </div>
              <h3 className={`text-2xl font-black italic uppercase tracking-tighter ${darkMode ? 'text-white' : 'text-slate-900'}`}>Suppression Définitive</h3>
              <p className={`text-[11px] font-bold mt-3 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                Cette action est irréversible. Pour confirmer, veuillez taper le mot <strong className="text-red-400">SUPPRIMER</strong> ci-dessous.
              </p>
            </div>

            <input 
              type="text" 
              placeholder="Tapez SUPPRIMER" 
              className={`w-full p-4 mb-6 rounded-2xl border border-red-500/40 font-black uppercase text-center outline-none focus:border-red-500 transition-colors ${
                darkMode ? 'bg-black/50 text-white' : 'bg-slate-100 text-slate-900'
              }`}
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
            />

            <button 
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== "SUPPRIMER" || deleting}
              className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all border-none cursor-pointer flex items-center justify-center gap-2 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
            >
              {deleting ? <Loader2 className="animate-spin" size={16} /> : "CONFIRMER LA SUPPRESSION"}
            </button>

          </div>
        </div>
      )}

      {/* NOTIFICATION FLOTTANTE DE SUCCÈS */}
      {notify.show && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3 px-8 py-4 rounded-full border border-orange-500/50 bg-black/90 text-orange-400 backdrop-blur-xl shadow-2xl">
            <CheckCircle2 size={18}/>
            <span className="text-[10px] font-black uppercase italic tracking-widest">{notify.msg}</span>
          </div>
        </div>
      )}

      <style jsx global>{`
        .input-style {
          width: 100%;
          padding: 1.25rem 1.25rem 1.25rem 3.5rem;
          border-radius: 1.2rem;
          font-weight: 800;
          text-transform: uppercase;
          font-size: 0.75rem;
          outline: none;
          transition: all 0.3s;
        }
        .dark-input {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
        }
        .dark-input:focus {
          border-color: #f97316;
          box-shadow: 0 0 15px rgba(249, 115, 22, 0.2);
        }
        .light-input {
          background: #ffffff;
          border: 1px solid rgba(203, 213, 225, 0.9);
          color: #0f172a;
        }
        .light-input:focus {
          border-color: #f97316;
          box-shadow: 0 0 15px rgba(249, 115, 22, 0.2);
        }
      `}</style>
    </main>
  );
}