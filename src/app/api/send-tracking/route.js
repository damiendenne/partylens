import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { email, eventName, trackingNumber } = await req.json();

    await resend.emails.send({
      from: 'PartyLens <contact@partylens.fr>', // Remplace tondomaine.com par ton domaine vérifié
      to: email,
      subject: `Expédition Clé USB : ${eventName}`,
      html: `
        <div style="font-family: sans-serif; background: #000; color: #fff; padding: 40px; border-radius: 20px;">
          <h1 style="color: #ff0080; font-style: italic;">PARTYLENS</h1>
          <p>Bonne nouvelle ! Ta clé USB pour la soirée <strong>${eventName}</strong> est prête et vient d'être expédiée.</p>
          <div style="background: #111; padding: 20px; border: 1px solid #333; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 0; color: #555; font-size: 10px; text-transform: uppercase;">Numéro de suivi</p>
            <p style="margin: 0; font-size: 20px; font-weight: bold; color: #ff0080;">${trackingNumber}</p>
          </div>
          <p style="font-size: 10px; color: #444;">Tu recevras tes souvenirs d'ici 3 à 5 jours ouvrés.</p>
        </div>
      `
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}