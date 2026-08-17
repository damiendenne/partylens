import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { email, photoUrl, eventId } = await request.json();

    if (!email || !photoUrl) {
      return NextResponse.json(
        { error: "Paramètres manquants (email ou photoUrl)" }, 
        { status: 400 }
      );
    }

    // 1. Télécharger l'image depuis Firebase Storage
    const imageResponse = await fetch(photoUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    
    // 2. Conversion nécessaire en Base64 pour Resend
    const base64Buffer = Buffer.from(arrayBuffer).toString('base64');

    // 3. Envoi de l'e-mail via Resend
    const data = await resend.emails.send({
      from: 'PartyLens <contact@partylens.fr>',
      to: [email],
      subject: '📸 Votre souvenir photo PartyLens !',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #ffffff; padding: 40px; border-radius: 24px;">
          <h2 style="color: #ec4899; text-transform: uppercase; font-style: italic; text-align: center; margin-bottom: 20px;">
            Souvenir de l'événement !
          </h2>
          <p style="text-align: center; color: #94a3b8; font-size: 14px; margin-bottom: 30px;">
            Merci d'avoir immortalisé ce moment avec PartyLens. Votre photo est également jointe à cet e-mail pour que vous puissiez l'enregistrer facilement !
          </p>
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="${photoUrl}" alt="Photo Photobooth" style="max-width: 100%; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);" />
          </div>
          <p style="text-align: center; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">
            Propulsé par PartyLens
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `souvenir-partylens-${Date.now()}.jpg`,
          content: base64Buffer, // Utilisation du contenu converti en base64
        },
      ],
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Erreur Resend:", error);
    return NextResponse.json(
      { error: "Erreur interne lors de l'envoi de l'e-mail" }, 
      { status: 500 }
    );
  }
}