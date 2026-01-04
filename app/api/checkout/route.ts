import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: Request) {
  try {
    // 1. Get data from request safely
    const body = await req.json();
    const { priceId, email } = body;

    // 2. Validate environment variables
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      console.error("DEBUG: STRIPE_SECRET_KEY is missing in Vercel!");
      return NextResponse.json({ error: "Server configuration error (Secret Key)" }, { status: 500 });
    }

    if (!priceId) {
      console.error("DEBUG: priceId was not provided by the frontend!");
      return NextResponse.json({ error: "Missing Price ID" }, { status: 400 });
    }

    // 3. Initialize Stripe
    const stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16' as any,
    });

    // 4. Get Origin for redirects
    const origin = req.headers.get('origin') || 'https://stemgame-w1af.vercel.app';

    console.log(`DEBUG: Creating session for ${email} with price ${priceId}`);

    // 5. Create Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: email && email.includes('@') ? email : undefined,
      success_url: `${origin}/?success=true`,
      cancel_url: `${origin}/?canceled=true`,
    });

    if (!session.url) {
      throw new Error("Stripe failed to generate a checkout URL.");
    }

    return NextResponse.json({ url: session.url });

  } catch (err: any) {
    console.error("CRITICAL STRIPE ERROR:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
