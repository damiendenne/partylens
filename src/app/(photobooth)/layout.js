export default function PhotoboothLayout({ children }) {
  // Ce layout ne contient ni Footer, ni Bouton Contact, ni Blobs
  // Il laisse juste passer le contenu de ta page Photobooth
  return (
    <div className="h-full w-full bg-black">
      {children}
    </div>
  );
}