"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, signOut, deleteUser } from 'firebase/auth';
import { User, Mail, MapPin, Phone, CreditCard, ArrowLeft, Save, Loader2, CheckCircle2, ShieldAlert, AlertTriangle, X } from 'lucide-react';
import Link from 'next/link';

export default function ProfilPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notify, setNotify] = useState({ show: false, msg: "", type: "success" });
  
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

  // FONCTION POUR SUPPRIMER LE COMPTE DÉFINITIVEMENT
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "SUPPRIMER") return;
    
    setDeleting(true);
    try {
      // 1. (Optionnel) Supprimer les événements de l'utilisateur dans Firestore
      const eventsRef = collection(db, "events");
      const q = query(eventsRef, where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      const deletePromises = querySnapshot.docs.map((eventDoc) => 
        deleteDoc(doc(db, "events", eventDoc.id))
      );
      await Promise.all(deletePromises);

      // 2. Supprimer le document utilisateur dans Firestore
      await deleteDoc(doc(db, "users", user.uid));

      // 3. Supprimer l'utilisateur de l'Authentification Firebase
      await deleteUser(auth.currentUser);

      // Redirection automatique vers l'accueil/login
      router.push('/login');
      
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/requires-recent-login') {
        alert("Pour des raisons de sécurité, vous devez vous déconnecter et vous reconnecter avant de pouvoir supprimer votre compte.");
        await signOut(auth);
        router.push('/login');
      } else {
        alert("Une erreur est survenue lors de la suppression de votre compte.");
      }
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-black italic uppercase tracking-[0.3em]">Chargement...</div>;

  return (
    <main className="min-h-screen relative overflow-hidden p-6 md:p-12 font-sans bg-black text-white">
      
      {/* BACKGROUND BLOBS */}
      <div className="bg-blobs fixed inset-0 z-0 pointer-events-none">
        <div className="blob blob-pink absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#ff0080] opacity-20 blur-[120px] rounded-full"></div>
        <div className="blob blob-blue absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#0072ff] opacity-20 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* HEADER */}
        <header className="mb-12 flex items-center gap-6">
          <button 
            onClick={() => router.back()} 
            className="p-4 glass-card rounded-2xl text-gray-400 hover:text-white transition-all bg-transparent border border-white/5 cursor-pointer"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
            MON <span className="text-[#ff0080]">COMPTE</span>
          </h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* COLONNE GAUCHE (Formulaire) */}
          <div className="md:col-span-2 space-y-6">
            <div className="glass-card p-10 rounded-[40px] border border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-2xl">
              <h2 className="text-xl font-black uppercase italic tracking-widest text-gray-400 mb-8">Informations Personnelles</h2>
              
              <form onSubmit={handleSave} className="space-y-5">
                <div className="relative">
                  <User className="absolute left-5 top-5 text-gray-500" size={18} />
                  <input type="text" placeholder="NOM COMPLET" className="input-style" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>

                <div className="relative">
                  <Mail className="absolute left-5 top-5 text-gray-500" size={18} />
                  <input type="email" placeholder="EMAIL" disabled className="input-style opacity-50 cursor-not-allowed" value={formData.email} />
                </div>

                <div className="relative">
                  <Phone className="absolute left-5 top-5 text-gray-500" size={18} />
                  <input type="tel" placeholder="TÉLÉPHONE" className="input-style" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>

                <div className="pt-4">
                  <h3 className="text-[11px] font-black uppercase text-gray-600 tracking-[0.2em] mb-4">Adresse de facturation / Livraison</h3>
                  <div className="relative mb-5">
                    <MapPin className="absolute left-5 top-5 text-gray-500" size={18} />
                    <input type="text" placeholder="RUE / ADRESSE" className="input-style" value={formData.street} onChange={(e) => setFormData({...formData, street: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="CODE POSTAL" className="input-style" value={formData.zip} onChange={(e) => setFormData({...formData, zip: e.target.value})} />
                    <input type="text" placeholder="VILLE" className="input-style" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={saving} 
                  className="w-full mt-8 py-6 bg-[#ff0080] rounded-[25px] font-black uppercase text-[11px] tracking-[0.3em] shadow-[0_0_20px_rgba(255,0,128,0.4)] border-none text-white cursor-pointer active:scale-95 transition-all flex justify-center items-center gap-3 hover:bg-[#e60073]"
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> ENREGISTRER LES MODIFICATIONS</>}
                </button>
              </form>
            </div>
          </div>

          {/* COLONNE DROITE (Abonnement + Suppression) */}
          <div className="space-y-6">
            
            {/* ABONNEMENT */}
            <div className="glass-card p-8 rounded-[40px] border border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-xl flex flex-col">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 border border-white/10">
                <CreditCard className="text-gray-400" size={20} />
              </div>
              <h2 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.3em] mb-2">Abonnement Actuel</h2>
              <p className="text-3xl font-black italic uppercase text-white mb-6 tracking-tighter">PACK {packInfo.plan}</p>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-[11px] font-bold border-b border-white/5 pb-2">
                  <span className="text-gray-500 uppercase">Facturation</span>
                  <span className="text-white">{packInfo.billingCycle}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold border-b border-white/5 pb-2">
                  <span className="text-gray-500 uppercase">Clés USB</span>
                  <span className="text-white">{packInfo.usbQuantity} Unité(s)</span>
                </div>
              </div>

              <Link 
                href="/admin/plan-selection" 
                className="w-full mt-auto py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border border-white/10 cursor-pointer flex items-center justify-center no-underline text-center"
              >
                MODIFIER MON PACK
              </Link>
            </div>

            {/* ZONE DANGER : SUPPRESSION COMPTE */}
            <div className="glass-card p-8 rounded-[40px] border border-red-500/20 bg-red-500/5 backdrop-blur-3xl flex flex-col items-start mt-8">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-4 border border-red-500/20">
                <ShieldAlert className="text-red-500" size={20} />
              </div>
              <h2 className="text-[12px] font-black uppercase text-red-500 tracking-widest mb-2">Zone Danger</h2>
              <p className="text-[10px] font-bold text-gray-400 mb-6 leading-relaxed">
                La suppression de votre compte est définitive. Toutes vos données, soirées et photos seront effacées instantanément.
              </p>
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="w-full py-4 bg-transparent border border-red-500/50 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer"
              >
                SUPPRIMER MON COMPTE
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* MODALE DE CONFIRMATION DE SUPPRESSION */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card w-full max-w-md p-10 rounded-[40px] border border-red-500/30 relative shadow-2xl bg-[#0a0000]">
            
            <button onClick={() => {setShowDeleteModal(false); setDeleteConfirmText("");}} className="absolute top-6 right-6 text-gray-500 hover:text-white bg-transparent border-none cursor-pointer">
              <X size={20}/>
            </button>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Suppression Définitive</h3>
              <p className="text-[11px] font-bold text-gray-400 mt-3 leading-relaxed">
                Cette action est irréversible. Pour confirmer, veuillez taper le mot <strong className="text-red-500">SUPPRIMER</strong> ci-dessous.
              </p>
            </div>

            <input 
              type="text" 
              placeholder="Tapez SUPPRIMER" 
              className="w-full p-4 mb-6 rounded-2xl bg-black border border-red-500/30 text-white font-black uppercase text-center outline-none focus:border-red-500 transition-colors"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
            />

            <button 
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== "SUPPRIMER" || deleting}
              className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all border-none cursor-pointer flex items-center justify-center gap-2 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {deleting ? <Loader2 className="animate-spin" size={16} /> : "CONFIRMER LA SUPPRESSION"}
            </button>

          </div>
        </div>
      )}

      {/* NOTIFICATION FLOTTANTE DE SUCCÈS (Mise à jour profil) */}
      {notify.show && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3 px-8 py-4 rounded-full border border-green-500/50 bg-black/90 text-green-500 backdrop-blur-xl shadow-2xl">
            <CheckCircle2 size={18}/>
            <span className="text-[10px] font-black uppercase italic tracking-widest">{notify.msg}</span>
          </div>
        </div>
      )}

      <style jsx>{`
        .input-style {
          width: 100%;
          padding: 1.25rem 1.25rem 1.25rem 3.5rem;
          border-radius: 1.2rem;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: white;
          font-weight: 800;
          text-transform: uppercase;
          font-size: 0.75rem;
          outline: none;
          transition: border 0.3s;
        }
        .input-style:focus {
          border-color: #ff0080;
        }
        .glass-card { background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%); }
      `}</style>
    </main>
  );
}