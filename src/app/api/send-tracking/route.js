import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { email, eventName, trackingNumber } = await req.json();

    if (!email || !trackingNumber) {
      return NextResponse.json(
        { error: "Paramètres manquants (email ou trackingNumber)" },
        { status: 400 }
      );
    }

    await resend.emails.send({
      from: 'PartyLens <contact@partylens.fr>',
      to: [email],
      subject: `🚚 Expédition Clé USB : ${eventName || 'Votre Événement'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #140427; color: #ffffff; padding: 40px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1);">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #f97316; font-style: italic; font-weight: 900; margin: 0; font-size: 28px; letter-spacing: -1px; text-transform: uppercase;">
              PARTYLENS
            </h1>
            <p style="color: #f59e0b; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 3px; margin-top: 4px;">
              Expédition de vos souvenirs
            </p>
          </div>

          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
            Bonne nouvelle ! La clé USB de souvenirs pour l'événement <strong>${eventName || 'Votre soirée'}</strong> est prête et vient d'être expédiée.
          </p>

          <div style="background-color: rgba(255, 255, 255, 0.05); padding: 24px; border: 1px solid rgba(249, 115, 22, 0.3); border-radius: 16px; margin: 24px 0; text-align: center;">
            <p style="margin: 0 0 6px 0; color: #94a3b8; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">
              Numéro de suivi La Poste / Transporteur
            </p>
            <p style="margin: 0; font-size: 22px; font-weight: 900; color: #f97316; letter-spacing: 2px;">
              ${trackingNumber}
            </p>
          </div>

          <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 24px; line-height: 1.4;">
            Vous recevrez votre clé USB directement à domicile d'ici 3 à 5 jours ouvrés.
          </p>
        </div>
      `
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur d'envoi d'e-mail d'expédition :", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}