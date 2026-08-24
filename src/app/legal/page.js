"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Scale, ShieldCheck, Sun, Moon } from 'lucide-react';
import Link from 'next/link';

export default function LegalPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('cgu'); // 'cgu', 'cgv', ou 'mentions'
  const [darkMode, setDarkMode] = useState(true);

  return (
    <main className={`min-h-screen relative overflow-x-hidden font-sans pb-16 px-6 md:p-12 transition-colors duration-300 flex flex-col h-full ${
      darkMode 
        ? 'bg-[#0f071e] text-slate-100 selection:bg-orange-500 selection:text-white' 
        : 'bg-[#f4f4f6] text-slate-900 selection:bg-orange-500 selection:text-white'
    }`}>
      
      {/* BOUTON SWITCH MODE CLAIR / SOMBRE (FIXÉ EN HAUT À DROITE) */}
      <button 
        onClick={() => setDarkMode(!darkMode)}
        className={`absolute top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md border ${
          darkMode 
            ? 'bg-white/10 text-amber-300 border-white/20 hover:bg-white/20' 
            : 'bg-[#eaeaea] text-slate-700 border-slate-300 hover:bg-[#dedede]'
        }`}
        aria-label="Changer le mode d'affichage"
      >
        {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        <span>{darkMode ? "Mode Clair" : "Mode Sombre"}</span>
      </button>

      {/* BACKGROUND EFFECTS ADADPTÉS CLAIR / SOMBRE */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {darkMode ? (
          <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-r from-purple-600/15 via-orange-600/10 to-transparent rounded-full blur-[140px]"></div>
        ) : (
          <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-r from-purple-200/30 via-orange-100/20 to-transparent rounded-full blur-[100px]"></div>
        )}
      </div>

      <div className="w-full max-w-5xl mx-auto relative z-10 flex flex-col h-full">
        
        {/* HEADER */}
        <header className="mb-10 flex justify-between items-center pr-24 md:pr-0">
          <button 
            onClick={() => router.back()} 
            className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-wider transition-all px-4 py-2.5 rounded-2xl border backdrop-blur-xl shadow-md active:scale-95 cursor-pointer ${
              darkMode 
                ? 'bg-white/10 text-white/80 hover:text-white border-white/20 hover:bg-white/20' 
                : 'bg-[#eaeaea] text-slate-700 border-slate-300 hover:bg-[#dedede]'
            }`}
          >
            <ArrowLeft size={16} /> RETOUR
          </button>
          
          <img src="/logo-partylens.png" alt="Logo PartyLens" className="w-36 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
          
          <div className="w-20 hidden md:block"></div>
        </header>

        {/* TITRE PRINCIPAL */}
        <div className="text-center mb-10">
          <h1 className={`text-3xl md:text-5xl font-black italic uppercase tracking-tight mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            DOCUMENTS <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]">LÉGAUX</span>
          </h1>
          <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${darkMode ? 'text-orange-200/80' : 'text-orange-600'}`}>
            Transparence, Sécurité et Confiance
          </p>
        </div>

        {/* ONGLETS DE NAVIGATION */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <button 
            onClick={() => setActiveTab('cgu')}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-wider transition-all border cursor-pointer ${
              activeTab === 'cgu' 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-orange-400/50 text-white shadow-[0_0_25px_rgba(249,115,22,0.4)] scale-105' 
                : darkMode 
                  ? 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white backdrop-blur-md' 
                  : 'bg-[#eaeaea] border-slate-300 text-slate-700 hover:bg-[#dedede] hover:text-slate-900 backdrop-blur-md'
            }`}
          >
            <FileText size={16} /> Conditions d'Utilisation
          </button>
          
          <button 
            onClick={() => setActiveTab('cgv')}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-wider transition-all border cursor-pointer ${
              activeTab === 'cgv' 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-orange-400/50 text-white shadow-[0_0_25px_rgba(249,115,22,0.4)] scale-105' 
                : darkMode 
                  ? 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white backdrop-blur-md' 
                  : 'bg-[#eaeaea] border-slate-300 text-slate-700 hover:bg-[#dedede] hover:text-slate-900 backdrop-blur-md'
            }`}
          >
            <Scale size={16} /> Conditions de Vente
          </button>
          
          <button 
            onClick={() => setActiveTab('mentions')}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-wider transition-all border cursor-pointer ${
              activeTab === 'mentions' 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-orange-400/50 text-white shadow-[0_0_25px_rgba(249,115,22,0.4)] scale-105' 
                : darkMode 
                  ? 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white backdrop-blur-md' 
                  : 'bg-[#eaeaea] border-slate-300 text-slate-700 hover:bg-[#dedede] hover:text-slate-900 backdrop-blur-md'
            }`}
          >
            <ShieldCheck size={16} /> Mentions Légales
          </button>
        </div>

        {/* ZONE DE CONTENU TEXTUEL (GLASS CARD) */}
        <div className={`backdrop-blur-2xl p-8 md:p-12 rounded-[36px] flex-1 overflow-y-auto max-h-[60vh] custom-scrollbar transition-all ${
          darkMode 
            ? 'bg-[#170c2c]/80 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-slate-300' 
            : 'bg-[#eaeaea]/80 border border-slate-300/80 shadow-slate-300/30 text-slate-700'
        }`}>
          
          {/* CONTENU: CGU */}
          {activeTab === 'cgu' && (
            <div className="legal-text space-y-6 text-sm leading-relaxed">
              <h2 className={`text-2xl font-black italic uppercase mb-6 border-b pb-4 ${darkMode ? 'text-white border-white/10' : 'text-slate-900 border-slate-300'}`}>Conditions Générales d'Utilisation (CGU)</h2>
              
              <h3 className="text-xs font-black text-orange-500 mt-8 mb-2 tracking-widest uppercase">1. Objet du Service</h3>
              <p>La plateforme PartyLens permet aux organisateurs d'événements de créer des espaces interactifs de partage de photos (diaporama live, livre d'or numérique, photobooth interactif et Défi Photo Challenge) et aux invités de diffuser des contenus photographiques et musicaux en direct de manière ludique.</p>

              <h3 className="text-xs font-black text-orange-500 mt-8 mb-2 tracking-widest uppercase">2. Responsabilité de l'Organisateur</h3>
              <p>L'organisateur (créateur de l'événement) est le seul responsable du contenu diffusé lors de son événement. Il dispose d'un espace "Régie" lui permettant de modérer, supprimer et gérer les photos envoyées par les invités en temps réel. PartyLens agit en tant que simple hébergeur technique et décline toute responsabilité quant aux contenus illicites, injurieux ou inappropriés diffusés publiquement.</p>

              <h3 className="text-xs font-black text-orange-500 mt-8 mb-2 tracking-widest uppercase">3. Responsabilité des Invités</h3>
              <p>En scannant le QR code et en participant aux animations (partage de photos, photobooth ou Défi Photo Challenge), l'invité accepte que son image soit diffusée sur l'écran ou le vidéoprojecteur de l'événement et sauvegardée dans la galerie de l'organisateur. L'invité s'engage à ne pas envoyer de contenus à caractère pornographique, violent, haineux ou portant atteinte au droit à l'image de tiers.</p>

              <h3 className="text-xs font-black text-orange-500 mt-8 mb-2 tracking-widest uppercase">4. Propriété et Sauvegarde des Données</h3>
              <p>Les photos et messages collectés appartiennent à l'organisateur de l'événement. PartyLens conserve ces données pour une durée limitée afin de permettre leur téléchargement ou leur transfert sur support physique. PartyLens se réserve le droit de purger les serveurs 30 jours après la fin de l'événement.</p>
            </div>
          )}

          {/* CONTENU: CGV */}
          {activeTab === 'cgv' && (
            <div className="legal-text space-y-6 text-sm leading-relaxed">
              <h2 className={`text-2xl font-black italic uppercase mb-6 border-b pb-4 ${darkMode ? 'text-white border-white/10' : 'text-slate-900 border-slate-300'}`}>Conditions Générales de Vente (CGV)</h2>
              
              <h3 className="text-xs font-black text-amber-500 mt-8 mb-2 tracking-widest uppercase">1. Offres et Tarifs</h3>
              <p>PartyLens propose des formules adaptées aux événements :</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong className={darkMode ? 'text-white' : 'text-slate-900'}>Forfait Unique (9.99€ / soirée unique) :</strong> Accès compte régie, photos illimitées, album téléchargeable, live photo via vidéoprojecteur (fond gratuit, matériel non inclus), livre d'or numérique, photobooth via smartphone/tablette avec cadre au choix (matériel non inclus), Défi Photo Challenge inclus, et sélection musicale pour le DJ.</li>
                <li><strong className={darkMode ? 'text-white' : 'text-slate-900'}>Forfait Pro / Clé USB (24.99€ / événement) :</strong> Intègre l'ensemble du Forfait Unique ainsi qu'une clé USB physique regroupant l'intégralité des souvenirs photos et du livre d'or, expédiée à domicile ou en point relais (frais de port offerts).</li>
              </ul>

              <h3 className="text-xs font-black text-amber-500 mt-8 mb-2 tracking-widest uppercase">2. Achats de Clés USB Supplémentaires</h3>
              <p>L'utilisateur peut commander des clés USB souvenirs supplémentaires depuis son espace au tarif unitaire de 15€ TTC. La livraison s'effectue à l'adresse postale renseignée par le client.</p>

              <h3 className="text-xs font-black text-amber-500 mt-8 mb-2 tracking-widest uppercase">3. Conditions de Paiement</h3>
              <p>Les règlements sont effectués de manière sécurisée par carte bancaire via notre prestataire de paiement Stripe.</p>

              <h3 className="text-xs font-black text-amber-500 mt-8 mb-2 tracking-widest uppercase">4. Droit de Rétractation</h3>
              <p>Conformément à l'article L221-28 du Code de la Consommation, s'agissant de la fourniture d'un contenu numérique personnalisé dont l'exécution a commencé après accord préalable exprès, le client renonce expressément à son droit de rétractation dès l'activation de l'événement.</p>
              <p>Pour les clés USB physiques (biens matériels), le client dispose d'un délai de 14 jours à compter de la réception pour exercer son droit de rétractation, à condition que le produit n'ait pas été descellé ou altéré.</p>
            </div>
          )}

          {/* CONTENU: MENTIONS LÉGALES */}
          {activeTab === 'mentions' && (
            <div className="legal-text space-y-6 text-sm leading-relaxed">
              <h2 className={`text-2xl font-black italic uppercase mb-6 border-b pb-4 ${darkMode ? 'text-white border-white/10' : 'text-slate-900 border-slate-300'}`}>Mentions Légales</h2>
              
              <div className={`p-6 rounded-2xl border backdrop-blur-md ${darkMode ? 'bg-white/5 border-white/10' : 'bg-[#f4f4f6] border-slate-300'}`}>
                <h3 className="text-xs font-black text-orange-500 uppercase tracking-widest mb-3">Éditeur du Service</h3>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>Nom de l'entreprise : PartyLens</p>
                <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>SIRET : 10456039600012</p>
                <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Siège social : 30 TROUHEL 44460 FEGREAC</p>
                <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Directeur de la publication : DAMIEN DENNE</p>
              </div>

              <div className={`p-6 rounded-2xl border backdrop-blur-md mt-4 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-[#f4f4f6] border-slate-300'}`}>
                <h3 className="text-xs font-black text-orange-500 uppercase tracking-widest mb-3">Contact</h3>
                <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Email : contact@partylens.fr</p>
                <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Téléphone : 07 87 01 60 77</p>
              </div>

              <div className={`p-6 rounded-2xl border backdrop-blur-md mt-4 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-[#f4f4f6] border-slate-300'}`}>
                <h3 className="text-xs font-black text-orange-500 uppercase tracking-widest mb-3">Hébergement</h3>
                <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Ce site et ses bases de données sont hébergés par :</p>
                <p className={`font-medium mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Google LLC (Firebase)</p>
                <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>1600 Amphitheatre Parkway, Mountain View, CA 94043, USA.</p>
                <p className={`text-xs italic mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Serveurs situés en Europe.</p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* FOOTER */}
      <footer className={`mt-12 relative z-10 w-full text-center max-w-5xl mx-auto border-t pt-6 ${darkMode ? 'border-white/10 text-slate-500' : 'border-slate-300 text-slate-500'}`}>
        <p className="text-[10px] uppercase font-black tracking-[0.5em]">
          Powered by PartyLens
        </p>
      </footer>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(249, 115, 22, 0.6);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(249, 115, 22, 0.9);
        }
      `}</style>
    </main>
  );
}