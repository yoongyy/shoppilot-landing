// app/api/create-checkout-session

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

export async function POST(req: NextRequest) {
    try {
      const body = await req.json();
      const { themeId, email, sessionId, amount } = body;
  
      const amountNumber = parseFloat(amount);
      if (!themeId || !email || !sessionId || isNaN(amountNumber)) {
        return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
      }
  
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: amountNumber * 100,
              product_data: {
                name: `Theme Purchase - ${themeId}`,
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/finish?session_id=${sessionId}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?cancel=true`,
        metadata: {
          themeId,
          sessionId,
          email,
        },
      });
  
      return NextResponse.json({ url: checkoutSession.url });
    } catch (err: any) {
      console.error('Stripe session error:', err);
      return NextResponse.json({ error: 'Failed to create checkout session', detail: err.message }, { status: 500 });
    }
  }
