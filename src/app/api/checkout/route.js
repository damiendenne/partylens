import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { requireUser, unauthorized } from '@/lib/apiAuth';
import { adminDb, admin } from '@/lib/firebaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const authUser = await requireUser(req);
    if (!authUser) return unauthorized();
    const body = await req.json();

    if (body.purchaseType === 'product_order') {
      const cartItems = Array.isArray(body.cartItems) ? body.cartItems : [];
      if (!cartItems.length) return NextResponse.json({ error: 'Panier vide.' }, { status: 400 });
      const siteOrigin = new URL(req.url).origin;

      const lineItems = cartItems.map((item) => ({
        price_data: {
          currency: 'eur',
          product_data: { name: String(item.name || 'Article PartyLens').slice(0, 250) },
          unit_amount: Math.round(Number(item.price) * 100)
        },
        quantity: Math.max(1, Math.min(99, Number(item.quantity) || 1))
      }));

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: lineItems,
        payment_method_types: ['card'],
        allow_promotion_codes: true,
        success_url: `${siteOrigin}/boutique?success=1`,
        cancel_url: `${siteOrigin}/boutique?canceled=1`,
        client_reference_id: authUser.uid,
        customer_email: authUser.email || undefined,
        metadata: {
          purchaseType: 'product_order',
          userId: authUser.uid,
          customerName: String(body.customerName || '').slice(0, 150),
          items: JSON.stringify(cartItems).slice(0, 450)
        }
      });
      await adminDb.collection('orders').doc(session.id).set({
        userId: authUser.uid,
        email: body.customerEmail || authUser.email || '',
        customerName: String(body.customerName || '').slice(0, 150),
        customerAddress: String(body.customerAddress || '').slice(0, 300),
        items: cartItems,
        amountTotal: lineItems.reduce((sum, item) => sum + item.price_data.unit_amount * item.quantity, 0),
        currency: 'eur',
        stripeSessionId: session.id,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return NextResponse.json({ url: session.url });
    }

    const {
      planId,
      billingCycle,
      usbQty,
      userId,
      eventName,
      eventId,
      shippingInfo,
      customerEmail,
      success_url: customSuccessUrl,
      cancel_url: customCancelUrl
    } = body;

    // Identifiants Prix Stripe
    const STRIPE_PRICES = {
      forfait_999: "price_1TTRIL0kxrnMCRhvsIs6fydu", 
      forfait_2499: "price_1TTRII0kxrnMCRhvd9j5QlZX", 
      usb: "price_1TTRIK0kxrnMCRhvZZGwImVJ",         
    };

    if (!userId || userId !== authUser.uid) {
      return NextResponse.json({ error: "Utilisateur manquant." }, { status: 400 });
    }

    const lineItems = [];

    // Logique d'ajout des articles dans le panier Stripe
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

    // Gestion dynamique des URLs de redirection
    let finalSuccessUrl = `https://partylens.fr/admin?success=true&session_id={CHECKOUT_SESSION_ID}`;
    let finalCancelUrl = `https://partylens.fr/admin?canceled=true`;
    
    if (customSuccessUrl && customSuccessUrl.startsWith('https://partylens.fr/')) {
      finalSuccessUrl = customSuccessUrl + (customSuccessUrl.includes('?') ? '&' : '?') + "session_id={CHECKOUT_SESSION_ID}";
    }
    if (customCancelUrl && customCancelUrl.startsWith('https://partylens.fr/')) {
      finalCancelUrl = customCancelUrl;
    }

    // Configuration de la session Stripe Checkout
    const sessionData = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: sessionMode,
      allow_promotion_codes: true,
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      client_reference_id: userId,
      customer_email: customerEmail || undefined,
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

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error("Erreur Stripe Checkout API :", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
