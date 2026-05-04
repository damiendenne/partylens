import Image from 'next/image';

export default function Logo({ className = "w-32" }) {
  return (
    <div className={`relative ${className}`}>
      <img 
        src="/logo-partylens.png" // Assure-toi de renommer ton image ainsi dans le dossier /public
        alt="PartyLens Logo"
        className="w-full h-auto object-contain"
      />
    </div>
  );
}