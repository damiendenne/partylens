import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Resend } from 'resend';
import PaymentSuccessEmail from '@/email/payment-success';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

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
      customerEmail, // Assurez-vous de récupérer l'email du client depuis le body si besoin
      success_url: customSuccessUrl,
      cancel_url: customCancelUrl
    } = body;

    // Vos 3 prix Stripe officiels
    const STRIPE_PRICES = {
      forfait_999: "price_1TTRIL0kxrnMCRhvsIs6fydu", 
      forfait_2499: "price_1TTRII0kxrnMCRhvd9j5QlZX", 
      usb: "price_1TTRIK0kxrnMCRhvZZGwImVJ",          
    };

    if (!userId) {
      return NextResponse.json({ error: "Utilisateur manquant." }, { status: 400 });
    }

    const lineItems = [];

    // --- LOGIQUE DE SÉLECTION ---
    if (planId === 'usb_only') {
      lineItems.push({ price: STRIPE_PRICES.usb, quantity: 1 });
    } else {
      if (planId === 'unique') {
        lineItems.push({ price: STRIPE_PRICES.forfait_999, quantity: 1 });
      } else if (planId === 'pro') {
        lineItems.push({ price: STRIPE_PRICES.forfait_2499, quantity: 1 });
      }
      
      if (usbQty > 0) {
        lineItems.push({ price: STRIPE_PRICES.usb, quantity: usbQty });
      }
    }

    if (lineItems.length === 0) {
      return NextResponse.json({ error: "Aucun produit Stripe sélectionné." }, { status: 400 });
    }

    const sessionMode = 'payment';
    const purchaseType = planId === 'usb_only' ? 'extra_usb_event' : 'subscription_upgrade';

    // URLs de retour
    let finalSuccessUrl = `https://partylens.fr/admin?success=true&session_id={CHECKOUT_SESSION_ID}`;
    let finalCancelUrl = `https://partylens.fr/admin?canceled=true`;
    
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
      // Si vous avez l'email du client, vous pouvez le pré-remplir sur Stripe :
      // customer_email: customerEmail, 
      metadata: {
        purchaseType,
        planName: planId ? planId.toUpperCase() : '',
        billingCycle: billingCycle || 'Unique',
        userId: userId,
        eventId: eventId || '',
        eventName: eventName || '',
        shippingName: shippingInfo?.name || '',
        shippingAddress: shippingInfo?.address || '',
        shippingZip: shippingInfo?.zip || '',
        shippingCity: shippingInfo?.city || '',
        shippingPhone: shippingInfo?.phone || ''
      }
    };

    const session = await stripe.checkout.sessions.create(sessionData);

    /* 
      NOTE : Si vous voulez envoyer l'email d'ici (attention, le paiement n'est pas encore fait, 
      c'est juste la création du lien), ou idéalement dans votre Webhook Stripe :
      
      if (customerEmail) {
        await resend.emails.send({
          from: 'PartyLens <contact@partylens.fr>',
          to: [customerEmail],
          subject: 'Confirmation de votre commande PartyLens',
          react: <PaymentSuccessEmail eventName={eventName || 'Votre événement'} />,
        });
      }
    */

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error("Erreur Stripe :", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}