import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb, admin } from '@/lib/firebaseAdmin';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Erreur de signature Webhook :", err.message);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  // --- TRAITEMENT DU PREMIER PAIEMENT (CHECKOUT) ---
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id;
    const customerEmail = session.customer_details?.email || session.customer_email;

    const {
      purchaseType,
      planName,
      billingCycle,
      eventName,
      eventId,
      frameId,
      shippingName,
      shippingAddress,
      shippingZip,
      shippingCity,
      shippingPhone
    } = session.metadata || {};

    console.log(`💰 Paiement reçu (Type: ${purchaseType}) pour l'utilisateur : ${userId}`);

    if (!userId) {
      return NextResponse.json({ error: "Pas d'ID utilisateur" }, { status: 400 });
    }

    try {
      // 1. Déblocage de cadre spécifique
      if (purchaseType === 'frame_unlock') {
        if (!eventId || !frameId) throw new Error("Infos manquantes pour le déblocage de cadre");

        await adminDb.collection('events').doc(eventId).update({
          unlockedFrames: admin.firestore.FieldValue.arrayUnion(frameId),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Cadre ${frameId} débloqué pour la soirée ${eventId}`);
      }

      // 2. Commande Clé USB seule ou supplémentaire
      else if (purchaseType === 'extra_usb_event') {
        if (!eventId) throw new Error("eventId manquant pour la commande USB");

        const eventRef = adminDb.collection('events').doc(eventId);
        const shippingInfo = {
          name: shippingName || '',
          address: shippingAddress || '',
          zip: shippingZip || '',
          city: shippingCity || '',
          phone: shippingPhone || ''
        };

        const updateData = {
          paymentStatus: "paid",
          usbPaid: true,
          usbOrdered: true,
          usbStatus: "validée",
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const hasShippingInfo = Object.values(shippingInfo).some(val => typeof val === 'string' && val.trim() !== '');
        if (hasShippingInfo) updateData.shippingInfo = shippingInfo;

        await eventRef.update(updateData);

        await adminDb.collection('users').doc(userId).set({
          usedUsb: admin.firestore.FieldValue.increment(1),
          lastUsbOrderDate: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`✅ Soirée "${eventName}" mise à jour après paiement USB`);
      }

      // 3. Achat d'un forfait ou pack (UNIQUE / PRO)
      else {
        const cleanPlanName = planName ? planName.trim().toUpperCase() : 'UNIQUE';

        await adminDb.collection('users').doc(userId).set({
          plan: cleanPlanName,
          billingCycle: billingCycle || 'Unique',
          status: "active",
          lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`✅ Pack ${cleanPlanName} activé pour l'utilisateur ${userId}`);
      }

      // --- ENVOI OPTIONNEL D'UN EMAIL DE CONFIRMATION AVEC RESEND ---
      if (customerEmail) {
        await resend.emails.send({
          from: 'PartyLens <contact@partylens.fr>',
          to: [customerEmail],
          subject: '🎉 Confirmation de votre commande PartyLens !',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #140427; color: #ffffff; padding: 40px; border-radius: 24px;">
              <h1 style="color: #f97316; font-style: italic; text-align: center;">PARTYLENS</h1>
              <p style="text-align: center; color: #cbd5e1;">Paiement confirmé ! Votre commande pour <strong>${eventName || 'votre soirée'}</strong> a bien été validée.</p>
            </div>
          `
        }).catch(err => console.error("Erreur envoi email webhook :", err));
      }

    } catch (error) {
      console.error("❌ Erreur Firebase lors du traitement Webhook :", error);
      return NextResponse.json({ error: "Erreur base de données" }, { status: 500 });
    }
  }

  // --- TRAITEMENT DU RENOUVELLEMENT MENSUEL AUTOMATIQUE ---
  if (event.type === 'invoice.paid') {
    const invoice = event.data.object;
    
    if (invoice.billing_reason === 'subscription_cycle') {
      const subscriptionId = invoice.subscription;
      
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const { userId, planName } = subscription.metadata || {};

        if (userId) {
          await adminDb.collection('users').doc(userId).set({
            status: "active",
            lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
          console.log(`🔄 RENOUVELLEMENT AUTO : Abonnement prolongé pour ${userId} (Plan: ${planName})`);
        }
      } catch (error) {
        console.error("❌ Erreur lors du renouvellement automatique :", error);
      }
    }
  }

  return NextResponse.json({ received: true });
}