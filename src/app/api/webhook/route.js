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

    return NextResponse.json(
      { error: "Signature invalide" },
      { status: 400 }
    );
  }

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
      return NextResponse.json(
        { error: "Pas d'ID utilisateur" },
        { status: 400 }
      );
    }

    try {
      // --- CAS 1 : DÉBLOCAGE D'UN CADRE PREMIUM (0,99€) ---
      if (purchaseType === 'frame_unlock') {
        if (!eventId || !frameId) {
          throw new Error("Infos manquantes pour le déblocage de cadre");
        }

        await adminDb.collection('events').doc(eventId).update({
          unlockedFrames: admin.firestore.FieldValue.arrayUnion(frameId),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Cadre ${frameId} débloqué pour la soirée ${eventId}`);
      }

      // --- CAS 2 : ACHAT D'UNE CLÉ USB POUR UNE SOIRÉE EXISTANTE (15€) ---
      else if (purchaseType === 'extra_usb_event') {
        if (!eventId) {
          throw new Error("eventId manquant pour la commande USB");
        }

        const eventRef = adminDb.collection('events').doc(eventId);
        const eventSnap = await eventRef.get();

        if (!eventSnap.exists) {
          throw new Error(`Soirée introuvable : ${eventId}`);
        }

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

        const hasShippingInfo = Object.values(shippingInfo).some((value) => {
          return typeof value === 'string' && value.trim() !== '';
        });

        if (hasShippingInfo) {
          updateData.shippingInfo = shippingInfo;
        }

        await eventRef.update(updateData);

        await adminDb.collection('users').doc(userId).update({
          usedUsb: admin.firestore.FieldValue.increment(1),
          lastUsbOrderDate: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Soirée "${eventName}" mise à jour après paiement USB (ID: ${eventId})`);
      }

      // --- CAS 3 : ABONNEMENT OU UPGRADE ---
      else {
        await adminDb.collection('users').doc(userId).set({
          plan: planName,
          billingCycle: billingCycle,
          status: "active",
          lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`✅ Pack ${planName} activé pour l'utilisateur ${userId}`);
      }

    } catch (error) {
      console.error("❌ Erreur Firebase lors du traitement Webhook :", error);

      return NextResponse.json(
        { error: "Erreur base de données" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}