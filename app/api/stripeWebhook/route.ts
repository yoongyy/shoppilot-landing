import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { MongoClient } from 'mongodb';
import { buffer } from 'stream/consumers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const MONGO_URL = process.env.MONGO_DB_URL!;
const DB_NAME = process.env.MONGODB_DB || 'shoppilot';

// Disable Next.js body parsing by exporting config
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  let rawBody: string;
  const sig = req.headers.get('stripe-signature');

  try {
    // Stripe requires raw body
    rawBody = await req.text();
  } catch (err) {
    console.error('Error reading raw body:', err);
    return new NextResponse('Invalid body', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, endpointSecret);
  } catch (err: any) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const sessionId = session.metadata?.sessionId;

    if (!sessionId) {
      console.warn('Missing sessionId in metadata');
      return new NextResponse('Missing sessionId', { status: 400 });
    }

    try {
      const client = await MongoClient.connect(MONGO_URL);
      const db = client.db(DB_NAME);
      const tokens = db.collection('tokens');

      await tokens.updateOne(
        { sessionId },
        {
          $set: {
            status: 'paid',
            paidAt: new Date(),
          },
        }
      );

      console.log(`✅ Payment confirmed and session ${sessionId} marked as paid`);

      await client.close();
    } catch (err) {
      console.error('MongoDB update error:', err);
      return new NextResponse('Database error', { status: 500 });
    }
  }

  return new NextResponse('Webhook received', { status: 200 });
}
