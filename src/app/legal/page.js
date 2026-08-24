"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Scale, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function LegalPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('cgu'); // 'cgu', 'cgv', ou 'mentions'

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#2d104d] via-[#210a3b] to-[#140427] text-white p-6 md:p-12 relative overflow-x-hidden font-sans pb-16">
      
      {/* VAGUES LUMINEUSES ET DÉGRADÉS D'ARRIÈRE-PLAN */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <svg className="absolute -top-12 left-0 w-full h-[500px] text-orange-500/30 blur-xl opacity-80" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,160L60,176C120,192,240,224,360,213.3C480,203,600,149,720,154.7C840,160,960,224,1080,229.3C1200,235,1320,181,1380,154.7L1440,128L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,0,0Z"></path>
        </svg>

        <svg className="absolute top-[30%] -left-20 w-[130%] h-[550px] text-amber-500/25 blur-2xl transform rotate-3" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,96L80,122.7C160,149,320,203,480,208C640,213,800,171,960,149.3C1120,128,1280,128,1360,128L1440,128L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
        </svg>

        <svg className="absolute bottom-0 right-0 w-full h-[500px] text-orange-600/30 blur-xl opacity-80" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,224L60,213.3C120,203,240,181,360,186.7C480,192,600,224,720,218.7C840,213,960,171,1080,160C1200,149,1320,171,1380,181.3L1440,192L1440,320L1380,320C1280,320,1120,320,1080,320C960,320,840,320,720,320C600,320,160,320,0,320Z"></path>
        </svg>

        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-r from-orange-500/25 via-amber-400/20 to-orange-600/20 rounded-full blur-[140px]"></div>
      </div>

      <div className="w-full max-w-5xl mx-auto relative z-10 flex flex-col h-full">
        
        {/* HEADER */}
        <header className="mb-10 flex justify-between items-center">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-white/80 hover:text-white transition-all bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-2xl border border-white/20 backdrop-blur-xl shadow-md active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={16} /> RETOUR
          </button>
          
          <img src="/logo-partylens.png" alt="Logo PartyLens" className="w-36 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
          
          <div className="w-20"></div>
        </header>

        {/* TITRE PRINCIPAL */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tight mb-3">
            DOCUMENTS <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]">LÉGAUX</span>
          </h1>
          <p className="text-orange-200/80 text-[10px] font-black uppercase tracking-[0.3em]">
            Transparence, Sécurité et Confiance
          </p>
        </div>

        {/* ONGLETS DE NAVIGATION */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <button 
            onClick={() => setActiveTab('cgu')}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-wider transition-all border cursor-pointer ${activeTab === 'cgu' ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-orange-400/50 text-white shadow-[0_0_25px_rgba(249,115,22,0.4)] scale-105' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white backdrop-blur-md'}`}
          >
            <FileText size={16} /> Conditions d'Utilisation
          </button>
          
          <button 
            onClick={() => setActiveTab('cgv')}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-wider transition-all border cursor-pointer ${activeTab === 'cgv' ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-orange-400/50 text-white shadow-[0_0_25px_rgba(249,115,22,0.4)] scale-105' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white backdrop-blur-md'}`}
          >
            <Scale size={16} /> Conditions de Vente
          </button>
          
          <button 
            onClick={() => setActiveTab('mentions')}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-wider transition-all border cursor-pointer ${activeTab === 'mentions' ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-orange-400/50 text-white shadow-[0_0_25px_rgba(249,115,22,0.4)] scale-105' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white backdrop-blur-md'}`}
          >
            <ShieldCheck size={16} /> Mentions Légales
          </button>
        </div>

        {/* ZONE DE CONTENU TEXTUEL (GLASS CARD) */}
        <div className="bg-white/[0.07] backdrop-blur-2xl p-8 md:p-12 rounded-[36px] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex-1 overflow-y-auto max-h-[60vh] custom-scrollbar">
          
          {/* CONTENU: CGU */}
          {activeTab === 'cgu' && (
            <div className="legal-text space-y-6 text-white/80 text-sm leading-relaxed">
              <h2 className="text-2xl font-black italic uppercase text-white mb-6 border-b border-white/10 pb-4">Conditions Générales d'Utilisation (CGU)</h2>
              
              <h3 className="text-xs font-black text-orange-400 mt-8 mb-2 tracking-widest uppercase">1. Objet du Service</h3>
              <p>La plateforme PartyLens permet aux organisateurs d'événements de créer des espaces interactifs de partage de photos (diaporama live, livre d'or numérique, photobooth interactif et Défi Photo Challenge) et aux invités de diffuser des contenus photographiques et musicaux en direct de manière ludique.</p>

              <h3 className="text-xs font-black text-orange-400 mt-8 mb-2 tracking-widest uppercase">2. Responsabilité de l'Organisateur</h3>
              <p>L'organisateur (créateur de l'événement) est le seul responsable du contenu diffusé lors de son événement. Il dispose d'un espace "Régie" lui permettant de modérer, supprimer et gérer les photos envoyées par les invités en temps réel. PartyLens agit en tant que simple hébergeur technique et décline toute responsabilité quant aux contenus illicites, injurieux ou inappropriés diffusés publiquement.</p>

              <h3 className="text-xs font-black text-orange-400 mt-8 mb-2 tracking-widest uppercase">3. Responsabilité des Invités</h3>
              <p>En scannant le QR code et en participant aux animations (partage de photos, photobooth ou Défi Photo Challenge), l'invité accepte que son image soit diffusée sur l'écran ou le vidéoprojecteur de l'événement et sauvegardée dans la galerie de l'organisateur. L'invité s'engage à ne pas envoyer de contenus à caractère pornographique, violent, haineux ou portant atteinte au droit à l'image de tiers.</p>

              <h3 className="text-xs font-black text-orange-400 mt-8 mb-2 tracking-widest uppercase">4. Propriété et Sauvegarde des Données</h3>
              <p>Les photos et messages collectés appartiennent à l'organisateur de l'événement. PartyLens conserve ces données pour une durée limitée afin de permettre leur téléchargement ou leur transfert sur support physique. PartyLens se réserve le droit de purger les serveurs 30 jours après la fin de l'événement.</p>
            </div>
          )}

          {/* CONTENU: CGV */}
          {activeTab === 'cgv' && (
            <div className="legal-text space-y-6 text-white/80 text-sm leading-relaxed">
              <h2 className="text-2xl font-black italic uppercase text-white mb-6 border-b border-white/10 pb-4">Conditions Générales de Vente (CGV)</h2>
              
              <h3 className="text-xs font-black text-amber-400 mt-8 mb-2 tracking-widest uppercase">1. Offres et Tarifs</h3>
              <p>PartyLens propose des formules adaptées aux événements :</p>
              <ul className="list-disc pl-5 space-y-2 mt-2 text-white/70">
                <li><strong className="text-white">Forfait Unique (9.99€ / soirée unique) :</strong> Accès compte régie, photos illimitées, album téléchargeable, live photo via vidéoprojecteur (fond gratuit, matériel non inclus), livre d'or numérique, photobooth via smartphone/tablette avec cadre au choix (matériel non inclus), Défi Photo Challenge inclus, et sélection musicale pour le DJ.</li>
                <li><strong className="text-white">Forfait Pro / Clé USB (24.99€ / événement) :</strong> Intègre l'ensemble du Forfait Unique ainsi qu'une clé USB physique regroupant l'intégralité des souvenirs photos et du livre d'or, expédiée à domicile ou en point relais (frais de port offerts).</li>
              </ul>

              <h3 className="text-xs font-black text-amber-400 mt-8 mb-2 tracking-widest uppercase">2. Achats de Clés USB Supplémentaires</h3>
              <p>L'utilisateur peut commander des clés USB souvenirs supplémentaires depuis son espace au tarif unitaire de 15€ TTC. La livraison s'effectue à l'adresse postale renseignée par le client.</p>

              <h3 className="text-xs font-black text-amber-400 mt-8 mb-2 tracking-widest uppercase">3. Conditions de Paiement</h3>
              <p>Les règlements sont effectués de manière sécurisée par carte bancaire via notre prestataire de paiement Stripe.</p>

              <h3 className="text-xs font-black text-amber-400 mt-8 mb-2 tracking-widest uppercase">4. Droit de Rétractation</h3>
              <p>Conformément à l'article L221-28 du Code de la Consommation, s'agissant de la fourniture d'un contenu numérique personnalisé dont l'exécution a commencé après accord préalable exprès, le client renonce expressément à son droit de rétractation dès l'activation de l'événement.</p>
              <p>Pour les clés USB physiques (biens matériels), le client dispose d'un délai de 14 jours à compter de la réception pour exercer son droit de rétractation, à condition que le produit n'ait pas été descellé ou altéré.</p>
            </div>
          )}

          {/* CONTENU: MENTIONS LÉGALES */}
          {activeTab === 'mentions' && (
            <div className="legal-text space-y-6 text-white/80 text-sm leading-relaxed">
              <h2 className="text-2xl font-black italic uppercase text-white mb-6 border-b border-white/10 pb-4">Mentions Légales</h2>
              
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
                <h3 className="text-xs font-black text-orange-300 uppercase tracking-widest mb-3">Éditeur du Service</h3>
                <p className="text-white font-medium">Nom de l'entreprise : PartyLens</p>
                <p className="text-white/70 text-xs">SIRET : 10456039600012</p>
                <p className="text-white/70 text-xs">Siège social : 30 TROUHEL 44460 FEGREAC</p>
                <p className="text-white/70 text-xs">Directeur de la publication : DAMIEN DENNE</p>
              </div>

              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md mt-4">
                <h3 className="text-xs font-black text-orange-300 uppercase tracking-widest mb-3">Contact</h3>
                <p className="text-white/70 text-xs">Email : contact@partylens.fr</p>
                <p className="text-white/70 text-xs">Téléphone : 07 87 01 60 77</p>
              </div>

              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md mt-4">
                <h3 className="text-xs font-black text-orange-300 uppercase tracking-widest mb-3">Hébergement</h3>
                <p className="text-white/70 text-xs">Ce site et ses bases de données sont hébergés par :</p>
                <p className="text-white font-medium mt-1">Google LLC (Firebase)</p>
                <p className="text-white/70 text-xs">1600 Amphitheatre Parkway, Mountain View, CA 94043, USA.</p>
                <p className="text-white/50 text-[11px] italic mt-1">Serveurs situés en Europe.</p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* FOOTER */}
      <footer className="mt-12 relative z-10 w-full text-center max-w-5xl mx-auto">
        <div className="h-[1px] w-full bg-white/10 mb-6"></div>
        <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.5em]">
          Powered by PartyLens
        </p>
      </footer>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
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