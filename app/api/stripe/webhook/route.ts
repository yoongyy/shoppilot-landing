import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { MongoClient } from 'mongodb';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-06-30.basil',
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const MONGO_URL = process.env.MONGO_DB_URL!;
const DB_NAME = process.env.MONGODB_DB || 'shoppilot';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, endpointSecret);
  } catch (err: any) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const sessionId = session.metadata?.sessionId;

    try {
      const client = await MongoClient.connect(MONGO_URL);
      const db = client.db(DB_NAME);
      const tokens = db.collection('tokens');

      await tokens.updateOne(
        { sessionId },
        { $set: { status: 'paid', paidAt: new Date() } }
      );
      console.log(`✅ Payment confirmed and session ${sessionId} marked as paid`);
    } catch (err) {
      console.error('Mongo update error:', err);
    }
  }

  return new NextResponse('Webhook received', { status: 200 });
}
