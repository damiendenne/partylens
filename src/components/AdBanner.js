import Link from 'next/link';
import { Camera, ArrowRight, Sparkles } from 'lucide-react';

/** Responsive PartyLens advertising banner.
 * Use format="leaderboard", "square" or "mobile".
 */
export default function AdBanner({ format = 'leaderboard', href = '/register?demo=true' }) {
  const sizes = {
    leaderboard: 'w-full max-w-[970px] min-h-[250px] md:min-h-[250px]',
    square: 'w-full max-w-[500px] aspect-square',
    mobile: 'w-full max-w-[320px] min-h-[180px]'
  };

  return (
    <Link href={href} className={`group relative isolate overflow-hidden rounded-3xl border border-orange-300/30 bg-[#160b27] text-white shadow-2xl shadow-orange-950/40 ${sizes[format] || sizes.leaderboard}`}>
      <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-fuchsia-500/25 blur-3xl transition-transform duration-500 group-hover:scale-125" />
      <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-orange-500/25 blur-3xl" />
      <div className="relative flex h-full flex-col justify-between p-7 md:p-9">
        <div className="flex items-center justify-between gap-4">
          <img src="/logo-partylens.png" alt="PartyLens" className="h-12 w-auto object-contain" />
          <span className="rounded-full border border-orange-300/30 bg-orange-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-200">Animation événementielle</span>
        </div>
        <div className="mt-6 max-w-2xl">
          <p className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-orange-300"><Sparkles size={16} /> Vos invités vont adorer</p>
          <h2 className="text-3xl font-black leading-tight md:text-5xl">Transformez votre soirée en souvenirs inoubliables.</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75 md:text-base">Photobooth, galerie photo live et livre d’or numérique. Tout fonctionne par QR code, sans application à télécharger.</p>
        </div>
        <div className="mt-7 flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-3 text-sm font-black shadow-lg shadow-orange-500/25 transition group-hover:brightness-110"><Camera size={18} /> Créer mon événement <ArrowRight size={18} /></span>
          <span className="text-xs font-semibold text-white/60">Essai gratuit · PartyLens.fr</span>
        </div>
      </div>
    </Link>
  );
}
