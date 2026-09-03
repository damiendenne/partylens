"use client";
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

const promoText = (code) => `Bonjour,\n\nBienvenue chez PartyLens ! Merci d’avoir utilisé notre service. Nous avons le plaisir de vous compter parmi nos clients fidèles et de vous offrir un code promo pour votre première soirée créée sur https://www.partylens.fr.\n\nVotre code promo :\n${code || '[VOTRE CODE PROMO]'}\n\nÀ saisir lors du paiement sécurisé Stripe.\n\nDécouvrez PartyLens : https://www.partylens.fr\n\nVotre avis nous intéresse ! Partagez votre expérience : https://g.page/r/Cb87GtRdn0tqEBM/review\n\nJe reste à votre disposition pour toute question.\n\nDamien\nVotre conseiller PartyLens`;

export default function AdminEmailPage() {
  const params = useSearchParams(); const router = useRouter();
  const to = params.get('to') || '';
  const [subject, setSubject] = useState(params.get('promo') ? 'Bienvenue chez PartyLens — votre offre privilégiée' : '');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState(params.get('promo') ? promoText('') : '');
  const [status, setStatus] = useState('');
  const send = async (e) => { e.preventDefault(); setStatus('Envoi...'); try { const token = await auth.currentUser.getIdToken(); const r = await fetch('/api/admin/send-email', { method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}, body:JSON.stringify({ recipients:[to], subject, message }) }); const d=await r.json(); if(!r.ok) throw new Error(d.error); setStatus('E-mail envoyé avec succès.'); } catch(err) { setStatus(`Erreur : ${err.message}`); } };
  return <main className="min-h-screen bg-[#0f071e] text-white p-6 md:p-12"><div className="max-w-4xl mx-auto"><button onClick={() => router.back()} className="mb-8 opacity-70">← Retour aux contacts</button><div className="rounded-3xl border border-white/20 bg-white/5 p-8"><h1 className="text-3xl font-black uppercase mb-2">Messagerie PartyLens</h1><p className="text-orange-300 mb-8">Conversation avec <strong>{to}</strong></p><div className="min-h-32 rounded-2xl bg-black/20 border border-white/10 p-6 mb-6 text-sm whitespace-pre-wrap opacity-80">{message || 'Votre conversation apparaîtra ici.'}</div><form onSubmit={send} className="grid gap-4"><input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Objet" required className="rounded-xl px-4 py-3 text-slate-900" />{params.get('promo') && <input value={code} onChange={e=>{setCode(e.target.value);setMessage(promoText(e.target.value));}} placeholder="Code promo à afficher" className="rounded-xl px-4 py-3 text-slate-900" />}<textarea value={message} onChange={e=>setMessage(e.target.value)} rows={12} required className="rounded-xl px-4 py-3 text-slate-900" /><button className="rounded-xl py-4 bg-gradient-to-r from-orange-500 to-pink-500 font-black uppercase">Envoyer à {to}</button>{status && <p className="text-sm font-bold">{status}</p>}</form></div></div></main>;
}
