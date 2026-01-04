import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { priceId, email } = body;

    const secretKey = process.env.STRIPE_SECRET_KEY;

    // PROTECTION: Ensure we are using a SECRET key (sk_), not a PUBLISHABLE key (pk_)
    if (!secretKey || !secretKey.startsWith('sk_')) {
      console.error("CRITICAL: Invalid Stripe Secret Key format. Key must start with 'sk_'.");
      return NextResponse.json({ 
        error: "Server Configuration Error: The secret key provided is invalid or has the wrong format (starts with pk_ instead of sk_)." 
      }, { status: 500 });
    }

    if (!priceId) {
      return NextResponse.json({ error: "Missing Price ID" }, { status: 400 });
    }

    const stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16' as any,
    });

    const origin = req.headers.get('origin') || 'https://stemgame-w1af.vercel.app';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      customer_email: email && email.includes('@') ? email : undefined,
      success_url: `${origin}/?success=true`,
      cancel_url: `${origin}/?canceled=true`,
    });

    return NextResponse.json({ url: session.url });

  } catch (err: any) {
    console.error("STRIPE API ERROR:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
