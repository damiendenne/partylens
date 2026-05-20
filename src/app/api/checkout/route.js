import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      planId,
      billingCycle,
      usbQty,
      userId,
      eventName,
      eventId,
      frameId,
      shippingInfo,
      success_url: customSuccessUrl,
      cancel_url: customCancelUrl
    } = body;

    // Tes prix Stripe
    const STRIPE_PRICES = {
      bronze: "price_1TTRIL0kxrnMCRhvsIs6fydu",
      silver: "price_1TTRII0kxrnMCRhvZF64mAns",
      gold_annual: "price_1TTRII0kxrnMCRhve2lMO0uE",
      gold_monthly: "price_1TTRII0kxrnMCRhvd9j5QlZX",
      usb: "price_1TTRIK0kxrnMCRhvZZGwImVJ",
      frame: "price_1TTRIN0kxrnMCRhvgN6FPIEI"
    };

    if (!userId) {
      return NextResponse.json({ error: "Utilisateur manquant." }, { status: 400 });
    }

    const lineItems = [];
    let isRecurring = false;

    // --- LOGIQUE DE SÉLECTION ---
    if (planId === 'usb_only') {
      lineItems.push({ price: STRIPE_PRICES.usb, quantity: 1 });
    } else if (planId === 'frame_unlock') {
      lineItems.push({ price: STRIPE_PRICES.frame, quantity: 1 });
    } else {
      // SEUL LE GOLD MENSUEL EST RÉCURRENT
      if (planId === 'gold' && billingCycle !== 'Annuel') {
        isRecurring = true;
      }

      if (planId === 'bronze') lineItems.push({ price: STRIPE_PRICES.bronze, quantity: 1 });
      if (planId === 'silver') lineItems.push({ price: STRIPE_PRICES.silver, quantity: 1 });
      if (planId === 'gold') {
        if (billingCycle === 'Annuel') {
          lineItems.push({ price: STRIPE_PRICES.gold_annual, quantity: 1 });
        } else {
          lineItems.push({ price: STRIPE_PRICES.gold_monthly, quantity: 1 });
        }
      }
      if (usbQty > 0) lineItems.push({ price: STRIPE_PRICES.usb, quantity: usbQty });
    }

    if (lineItems.length === 0) {
      return NextResponse.json({ error: "Aucun produit Stripe sélectionné." }, { status: 400 });
    }

    const sessionMode = isRecurring ? 'subscription' : 'payment';

    const purchaseType =
      planId === 'frame_unlock' ? 'frame_unlock' :
      planId === 'usb_only' ? 'extra_usb_event' : 'subscription_upgrade';

    // URLs de retour
    let finalSuccessUrl = `https://partylens.fr/admin?success=true&session_id={CHECKOUT_SESSION_ID}`;
    let finalCancelUrl = `https://partylens.fr/admin?canceled=true`;

    if (planId === 'frame_unlock' && eventId) {
      finalSuccessUrl = `https://partylens.fr/admin/catalogue-cadres?eventId=${eventId}&success=true`;
      finalCancelUrl = `https://partylens.fr/admin/catalogue-cadres?eventId=${eventId}`;
    }
    
    if (customSuccessUrl) finalSuccessUrl = customSuccessUrl + (customSuccessUrl.includes('?') ? '&' : '?') + "session_id={CHECKOUT_SESSION_ID}";
    if (customCancelUrl) finalCancelUrl = customCancelUrl;

    // Configuration de la session Stripe
    const sessionData = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: sessionMode,
      allow_promotion_codes: true,
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      client_reference_id: userId,
      metadata: {
        purchaseType,
        planName: planId === 'gold' ? 'VIP GOLD' : (planId ? planId.toUpperCase() : ''),
        billingCycle: billingCycle || 'Unique',
        userId: userId,
        eventId: eventId || '',
        eventName: eventName || '',
        frameId: frameId || '',
        shippingName: shippingInfo?.name || '',
        shippingAddress: shippingInfo?.address || '',
        shippingZip: shippingInfo?.zip || '',
        shippingCity: shippingInfo?.city || '',
        shippingPhone: shippingInfo?.phone || ''
      }
    };

    // Si c'est un abonnement, on ajoute les metadata pour le renouvellement auto
    if (sessionMode === 'subscription') {
      sessionData.subscription_data = {
        metadata: {
          userId: userId,
          planName: 'VIP GOLD',
          billingCycle: 'mensuel'
        }
      };
    }

    const session = await stripe.checkout.sessions.create(sessionData);
    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error("Erreur Stripe :", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}