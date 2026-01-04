import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: '2023-10-16' as any,
});

export async function POST(req: Request) {
  try {
    const { priceId, email } = await req.json();

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is missing from environment variables.");
    }

    if (!priceId) {
      throw new Error("priceId is missing from the request body.");
    }

    console.log(`Starting checkout for email: ${email}, priceId: ${priceId}`);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email || undefined,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/?success=true`,
      cancel_url: `${req.headers.get('origin')}/?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("STRIPE CHECKOUT ERROR:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
