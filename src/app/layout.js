import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// CONFIGURATION SEO POUR ÊTRE EN HAUT DES RECHERCHES
export const metadata = {
  title: "PartyLens | Animation Photo Interactive & Diaporama Live",
  description: "Boostez vos événements avec PartyLens : Diaporama en direct sur écran géant, demandes DJ par smartphone et souvenirs sur clé USB livrée à domicile. Contact : 07 87 01 60 77.",
  keywords: ["PartyLens", "animation mariage", "diaporama live", "partage photo événement", "clé USB souvenirs", "animation soirée"],
  authors: [{ name: "PartyLens" }],
  creator: "PartyLens",
  publisher: "PartyLens",
  formatDetection: {
    email: false,
    address: false,
    telephone: true, // Permet aux clients de cliquer sur ton numéro pour t'appeler direct
  },
  alternates: {
    canonical: 'https://www.partylens.fr',
  },
  // À REMPLACER PAR TON CODE QUAND TU AURAS CRÉÉ TA SEARCH CONSOLE
  verification: {
    google: "TON_CODE_DE_VERIFICATION_GOOGLE", 
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col relative bg-[#030005]">
        {/* LE VISUEL FIXE (Blobs) */}
        <div className="bg-blobs" aria-hidden="true">
          <div className="blob blob-pink"></div>
          <div className="blob blob-purple"></div>
          <div className="blob blob-blue"></div>
        </div>

        {/* CONTENU DES PAGES */}
        <main className="relative z-10 flex-1 flex flex-col">
          {children}
        </main>

        {/* LE PIED DE PAGE GLOBAL */}
        <footer className="w-full border-t border-white/5 bg-transparent py-8 text-center relative z-10 mt-auto">
          <div className="mb-4">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
              PartyLens — Animation Interactive partout en France
            </p>
          </div>
          <Link href="/legal" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 hover:text-white transition-colors no-underline italic">
            CGU / CGV & Mentions Légales
          </Link>
          <div className="mt-2 text-[9px] text-gray-700">
            SIRET : 10456039600012
          </div>
        </footer>

        {/* BOUTON CONTACT GLOBAL FLOTTANT */}
        <Link 
          href="/contact"
          className="fixed bottom-6 left-6 md:left-auto md:right-6 z-[9999] flex items-center gap-2 px-6 py-3 rounded-full bg-[#ff0080]/10 border border-[#ff0080]/30 text-[#ff0080] font-black uppercase text-[10px] tracking-widest backdrop-blur-md shadow-[0_0_20px_rgba(255,0,128,0.2)] hover:bg-[#ff0080]/20 hover:scale-105 transition-all no-underline w-fit"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          CONTACT
        </Link>
      </body>
    </html>
  );
}