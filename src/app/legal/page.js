"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Scale, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function LegalPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('cgu'); // 'cgu', 'cgv', ou 'mentions'

  return (
    <main className="min-h-screen bg-black flex flex-col p-6 md:p-12 font-sans relative overflow-hidden text-white">
      {/* BACKGROUND BLOBS */}
      <div className="bg-blobs fixed inset-0 z-0 pointer-events-none">
        <div className="blob blob-pink absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#ff0080] opacity-10 blur-[120px] rounded-full"></div>
        <div className="blob blob-blue absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#0072ff] opacity-10 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-5xl mx-auto relative z-10 flex flex-col h-full">
        
        {/* HEADER */}
        <header className="mb-12 flex justify-between items-center">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
          >
            <ArrowLeft size={14} /> RETOUR
          </button>
          <img src="/logo-partylens.png" alt="Logo" className="w-32" />
          <div className="w-14"></div>
        </header>

        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4">
          <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">
            DOCUMENTS <span className="text-[#ff0080]">LÉGAUX</span>
          </h1>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">
            Transparence, Sécurité et Confiance
          </p>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button 
            onClick={() => setActiveTab('cgu')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border cursor-pointer ${activeTab === 'cgu' ? 'bg-[#ff0080] border-[#ff0080] text-white shadow-[0_0_20px_rgba(255,0,128,0.3)]' : 'bg-transparent border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <FileText size={16} /> Conditions d'Utilisation
          </button>
          <button 
            onClick={() => setActiveTab('cgv')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border cursor-pointer ${activeTab === 'cgv' ? 'bg-[#0072ff] border-[#0072ff] text-white shadow-[0_0_20px_rgba(0,114,255,0.3)]' : 'bg-transparent border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Scale size={16} /> Conditions de Vente
          </button>
          <button 
            onClick={() => setActiveTab('mentions')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border cursor-pointer ${activeTab === 'mentions' ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-transparent border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <ShieldCheck size={16} /> Mentions Légales
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="glass-card flex-1 p-8 md:p-12 rounded-[40px] border border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-2xl overflow-y-auto max-h-[60vh] custom-scrollbar animate-in fade-in zoom-in">
          
          {/* CONTENT: CGU */}
          {activeTab === 'cgu' && (
            <div className="legal-text space-y-6 text-gray-300 text-sm leading-relaxed">
              <h2 className="text-2xl font-black italic uppercase text-white mb-6">Conditions Générales d'Utilisation (CGU)</h2>
              
              <h3 className="text-lg font-bold text-[#ff0080] mt-8 mb-2">1. Objet du Service</h3>
              <p>La plateforme PartyLens permet aux organisateurs d'événements de créer des espaces interactifs de partage de photos ("Live Wall" / Diaporama) et aux invités de diffuser des contenus photographiques et musicaux en direct.</p>

              <h3 className="text-lg font-bold text-[#ff0080] mt-8 mb-2">2. Responsabilité de l'Organisateur</h3>
              <p>L'organisateur (créateur de l'événement) est le seul responsable du contenu diffusé lors de son événement. Il dispose d'un espace "Régie" lui permettant de modérer, supprimer et gérer les photos envoyées par les invités en temps réel. PartyLens agit en tant que simple hébergeur technique et décline toute responsabilité quant aux contenus illicites, injurieux ou inappropriés diffusés publiquement.</p>

              <h3 className="text-lg font-bold text-[#ff0080] mt-8 mb-2">3. Responsabilité des Invités</h3>
              <p>En scannant le QR code et en envoyant une photo, l'invité accepte que son image soit diffusée sur l'écran géant de l'événement et sauvegardée dans la galerie de l'organisateur. L'invité s'engage à ne pas envoyer de contenus à caractère pornographique, violent, haineux ou portant atteinte au droit à l'image de tiers.</p>

              <h3 className="text-lg font-bold text-[#ff0080] mt-8 mb-2">4. Propriété et Sauvegarde des Données</h3>
              <p>Les photos collectées appartiennent à l'organisateur de l'événement. PartyLens conserve ces données pour une durée limitée afin de permettre leur téléchargement ou leur transfert sur support physique (Clé USB). PartyLens se réserve le droit de purger les serveurs 30 jours après la fin de l'événement.</p>
            </div>
          )}

          {/* CONTENT: CGV */}
          {activeTab === 'cgv' && (
            <div className="legal-text space-y-6 text-gray-300 text-sm leading-relaxed">
              <h2 className="text-2xl font-black italic uppercase text-white mb-6">Conditions Générales de Vente (CGV)</h2>
              
              <h3 className="text-lg font-bold text-[#0072ff] mt-8 mb-2">1. Offres et Abonnements</h3>
              <p>PartyLens propose trois formules principales :</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong>Pack Bronze (9.99€ / mois) :</strong> Accès à la régie, photos illimitées, support. (Diaporama non inclus).</li>
                <li><strong>Pack Silver (12.99€ / mois) :</strong> Fonctionnalités Bronze + Accès au Diaporama (Live Wall) sur vidéoprojecteur (videoprojecteur non inclu).</li>
                <li><strong>Pack VIP Gold (299€ / an ou 24.99€ / mois avec engagement 1 an) :</strong> Fonctionnalités Silver + 12 Clés USB incluses et accès prioritaire.</li>
              </ul>

              <h3 className="text-lg font-bold text-[#0072ff] mt-8 mb-2">2. Achats de Clés USB</h3>
              <p>L'utilisateur peut commander des clés USB supplémentaires depuis son tableau de bord au tarif de 15€ TTC l'unité. Les frais de port sont inclus. La livraison s'effectue à l'adresse postale renseignée dans le profil de l'utilisateur.</p>

              <h3 className="text-lg font-bold text-[#0072ff] mt-8 mb-2">3. Conditions de Paiement et Renouvellement</h3>
              <p>Les paiements sont effectués de manière sécurisée via notre prestataire de paiement stripe. Les abonnements mensuels et annuels sont a renouvelé par l'utilisateur.</p>

              <h3 className="text-lg font-bold text-[#0072ff] mt-8 mb-2">4. Droit de Rétractation</h3>
              <p>Conformément à l'article L221-28 du Code de la Consommation, s'agissant de la fourniture d'un contenu numérique non fourni sur un support matériel dont l'exécution a commencé après accord préalable exprès du consommateur, le client renonce expressément à son droit de rétractation pour les abonnements digitaux dès la création de son premier événement.</p>
              <p>Pour les clés USB (biens matériels), le client dispose d'un délai de 14 jours à compter de la réception pour exercer son droit de rétractation, à condition que la clé n'ait pas été utilisée ou altérée.</p>
            </div>
          )}

          {/* CONTENT: MENTIONS LÉGALES */}
          {activeTab === 'mentions' && (
            <div className="legal-text space-y-6 text-gray-300 text-sm leading-relaxed">
              <h2 className="text-2xl font-black italic uppercase text-white mb-6">Mentions Légales</h2>
              
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <h3 className="font-bold text-white mb-4">Éditeur du Service</h3>
                <p>Nom de l'entreprise : partylens</p>
                <p>SIRET : 10456039600012</p>
                <p>Siège social : 30 TROUHEL 44460 FEGREAC</p>
                <p>Directeur de la publication : DAMIEN DENNE</p>
              </div>

              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mt-4">
                <h3 className="font-bold text-white mb-4">Contact</h3>
                <p>Email : contact@partylens.fr</p>
                <p>Téléphone : 07 87 01 60 77</p>
              </div>

              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mt-4">
                <h3 className="font-bold text-white mb-4">Hébergement</h3>
                <p>Ce site et ses bases de données sont hébergés par :</p>
                <p>Google LLC (Firebase)</p>
                <p>1600 Amphitheatre Parkway, Mountain View, CA 94043, USA.</p>
                <p>Serveurs situés en Europe.</p>
              </div>
            </div>
          )}

        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .glass-card { background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%); }
        .legal-text h3 { letter-spacing: 0.05em; text-transform: uppercase; font-size: 0.8rem; }
      `}</style>
    </main>
  );
}