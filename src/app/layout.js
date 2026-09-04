"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import LyjyAd from "@/components/LyjyAd";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isPhotobooth = pathname.includes("/photobooth");
  const isSuperAdmin = pathname.startsWith("/super-admin");

  return (
    <html lang="fr" className="h-full antialiased">
      <head>
        <title>PartyLens France — Animation photo interactive pour vos événements</title>
        <meta name="description" content="PartyLens transforme vos événements en expériences interactives avec photobooth, galerie photo, livre d’or et animations live." />
        <meta name="keywords" content="photobooth, animation photo, borne photo, événement, mariage, anniversaire, soirée, galerie photo, livre d'or numérique, QR code, animation événementielle, France" />
        <meta name="author" content="PartyLens France" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="googlebot" content="index, follow" />
        <meta name="theme-color" content="#030005" />
        <meta httpEquiv="content-language" content="fr-FR" />
        <meta property="og:title" content="PartyLens — Animation photo interactive" />
        <meta property="og:description" content="Photobooth, galerie et animations live pour des souvenirs inoubliables." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.partylens.fr" />
        <meta property="og:image" content="https://www.partylens.fr/logo-partylens.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://www.partylens.fr" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'PartyLens France',
          url: 'https://www.partylens.fr',
          logo: 'https://www.partylens.fr/logo-partylens.png',
          description: 'Animation photo interactive, photobooth, galerie photo et livre d’or numérique pour mariages, anniversaires et événements en France',
          telephone: '+33787016077',
          email: 'contact@partylens.fr',
          address: { '@type': 'PostalAddress', addressCountry: 'FR' }
        }) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'PartyLens France',
          url: 'https://www.partylens.fr',
          inLanguage: 'fr-FR',
          potentialAction: { '@type': 'SearchAction', target: 'https://www.partylens.fr/?q={search_term_string}', 'query-input': 'required name=search_term_string' }
        }) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: 'Animation photobooth PartyLens',
          provider: { '@type': 'Organization', name: 'PartyLens France', url: 'https://www.partylens.fr' },
          areaServed: { '@type': 'Country', name: 'France' },
          serviceType: 'Animation photo événementielle',
          description: 'Photobooth, galerie photo live, QR code, livre d’or audio et animations interactives pour événements.'
        }) }} />
      </head>
      <body className="min-h-full flex flex-col relative bg-[#030005]">
        {!isSuperAdmin && <LyjyAd />}
        
        {!isPhotobooth && (
          <div className="bg-blobs" aria-hidden="true">
            <div className="blob blob-pink"></div>
            <div className="blob blob-purple"></div>
            <div className="blob blob-blue"></div>
          </div>
        )}

        <main className="relative z-10 flex-1 flex flex-col">
          {children}
        </main>

        {!isPhotobooth && (
          <>
            <footer className="w-full border-t border-white/5 bg-transparent py-8 text-center relative z-10 mt-auto">
              <div className="mb-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                  PartyLens — Animation Interactive partout en France
                </p>
              </div>
              <Link href="/legal" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 hover:text-white transition-colors no-underline italic">
                CGU / CGV & Mentions Légales
              </Link>
              <div className="mt-2 text-[9px] text-gray-700">SIRET : 10456039600012</div>
            </footer>

            <Link 
              href="/contact"
              className="fixed bottom-6 left-6 md:left-auto md:right-6 z-[9999] flex items-center gap-2 px-6 py-3 rounded-full bg-[#ff0080]/10 border border-[#ff0080]/30 text-[#ff0080] font-black uppercase text-[10px] tracking-widest backdrop-blur-md shadow-[0_0_20px_rgba(255,0,128,0.2)] hover:bg-[#ff0080]/20 hover:scale-105 transition-all no-underline w-fit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              CONTACT
            </Link>
          </>
        )}

        <GoogleAnalytics gaId="G-F8PMJ8TNJF" />
      </body>
    </html>
  );
}
