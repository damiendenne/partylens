import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb, admin } from '@/lib/firebaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
      if (purchaseType === 'frame_unlock') {
        if (!eventId || !frameId) throw new Error("Infos manquantes pour le déblocage de cadre");

        await adminDb.collection('events').doc(eventId).update({
          unlockedFrames: admin.firestore.FieldValue.arrayUnion(frameId),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Cadre ${frameId} débloqué pour la soirée ${eventId}`);
      }

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

        await adminDb.collection('users').doc(userId).update({
          usedUsb: admin.firestore.FieldValue.increment(1),
          lastUsbOrderDate: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Soirée "${eventName}" mise à jour après paiement USB`);
      }

      // Cas de l'achat d'un abonnement / pack
      else {
        const cleanPlanName = planName ? planName.trim().toUpperCase() : 'BRONZE';

        await adminDb.collection('users').doc(userId).set({
          plan: cleanPlanName,
          billingCycle: billingCycle || 'mensuel',
          status: "active",
          lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`✅ Pack ${cleanPlanName} activé à l'achat pour l'utilisateur ${userId}`);
      }

    } catch (error) {
      console.error("❌ Erreur Firebase lors du traitement Webhook :", error);
      return NextResponse.json({ error: "Erreur base de données" }, { status: 500 });
    }
  }

  // --- TRAITEMENT DU RENOUVELLEMENT MENSUEL AUTOMATIQUE ---
  if (event.type === 'invoice.paid') {
    const invoice = event.data.object;
    
    // On ne traite pas la première facture de la session checkout car elle est déjà gérée au-dessus
    if (invoice.billing_reason === 'subscription_cycle') {
      const subscriptionId = invoice.subscription;
      
      try {
        // On récupère les métadonnées qu'on a stockées dans l'abonnement
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const { userId, planName, billingCycle } = subscription.metadata || {};

        if (userId) {
          await adminDb.collection('users').doc(userId).update({
            status: "active",
            lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`🔄 RESSOUCRIPTION AUTO : Date de validité repoussée de 30 jours pour ${userId} (Plan: ${planName})`);
        }
      } catch (error) {
        console.error("❌ Erreur lors du renouvellement automatique :", error);
      }
    }
  }

  return NextResponse.json({ received: true });
}