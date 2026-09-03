import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { adminDb } from '@/lib/firebaseAdmin';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { email, photoUrl, eventId } = await request.json();

    if (!email || !photoUrl || !/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
      return NextResponse.json(
        { error: "Paramètres manquants (email ou photoUrl)" }, 
        { status: 400 }
      );
    }
    await adminDb.collection('photoboothEmails').doc(email.toLowerCase()).set({ email: email.toLowerCase(), eventId: eventId || null, createdAt: new Date() }, { merge: true });

    let parsedUrl;
    try { parsedUrl = new URL(photoUrl); } catch { return NextResponse.json({ error: "URL photo invalide" }, { status: 400 }); }
    const allowedHost = /(^|\.)firebasestorage\.app$|(^|\.)firebasestorage\.googleapis\.com$|(^|\.)storage\.googleapis\.com$|(^|\.)appspot\.com$/.test(parsedUrl.hostname);
    if (parsedUrl.protocol !== 'https:' || !allowedHost) {
      return NextResponse.json({ error: "Source photo non autorisée" }, { status: 400 });
    }

    // 1. Télécharger l'image depuis la source (ex: Firebase Storage)
    const imageResponse = await fetch(photoUrl);
    if (!imageResponse.ok) {
      throw new Error("Impossible de récupérer l'image depuis l'URL fournie");
    }
    const contentLength = Number(imageResponse.headers.get('content-length') || 0);
    if (contentLength > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Photo trop volumineuse" }, { status: 413 });
    }
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Envoi de l'e-mail via Resend
    const data = await resend.emails.send({
      from: 'PartyLens <contact@partylens.fr>',
      to: [email],
      subject: '📸 Votre souvenir photo PartyLens !',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #140427; color: #ffffff; padding: 40px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1);">
          <h2 style="color: #f97316; text-transform: uppercase; font-style: italic; text-align: center; margin-bottom: 10px; font-size: 24px;">
            Souvenir de l'événement !
          </h2>
          <p style="text-align: center; color: #cbd5e1; font-size: 14px; margin-bottom: 30px; line-height: 1.5;">
            Merci d'avoir immortalisé ce moment avec PartyLens. Votre photo est également jointe à cet e-mail pour que vous puissiez l'enregistrer facilement en haute qualité !
          </p>
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="${photoUrl}" alt="Photo Souvenir PartyLens" style="max-width: 100%; height: auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.15);" />
          </div>
          <p style="text-align: center; color: #f59e0b; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">
            Propulsé par PartyLens
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `souvenir-partylens-${Date.now()}.jpg`,
          content: buffer,
        },
      ],
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Erreur Resend API :", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne lors de l'envoi de l'e-mail" }, 
      { status: 500 }
    );
  }
}
