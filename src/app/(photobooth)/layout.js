export default function PhotoboothLayout({ children }) {
  // Ce layout épuré conserve le fond violet nuit emblématique de PartyLens
  // sans afficher de footer ni de bouton de contact pour l'interface photobooth.
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#2d104d] via-[#210a3b] to-[#140427] text-white">
      {children}
    </div>
  );
}