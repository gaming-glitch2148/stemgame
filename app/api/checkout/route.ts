import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: Request) {
  try {
    const { priceId, email } = await req.json();
    const secretKey = process.env.STRIPE_SECRET_KEY || "";

    // Safely log key status for debugging
    console.log("--- STRIPE DEBUG ---");
    console.log("Key Length:", secretKey.length);
    console.log("Key Prefix:", secretKey.substring(0, 7) + "...");
    console.log("Price ID received:", priceId);

    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is missing from environment variables.");
    }

    const stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16' as any,
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/?success=true`,
      cancel_url: `${req.headers.get('origin')}/?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("STRIPE API ERROR:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
