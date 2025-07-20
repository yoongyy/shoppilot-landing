import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { MongoClient } from 'mongodb';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const MONGO_URL = process.env.MONGO_DB_URL!;
const DB_NAME = process.env.MONGODB_DB || 'shoppilot';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const sig = req.headers['stripe-signature'];
  let event: Stripe.Event;

  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig!, endpointSecret);
  } catch (err: any) {
    console.error('❌ Stripe webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const sessionId = session.metadata?.sessionId;

    if (!sessionId) {
      return res.status(400).send('Missing sessionId');
    }

    try {
      const client = await MongoClient.connect(MONGO_URL);
      const db = client.db(DB_NAME);
      const orders = db.collection('orders');

      await orders.updateOne(
        { sessionId },
        {
          $set: {
            status: 'paid',
            paidAt: new Date(),
          },
        }
      );

      console.log(`✅ Session ${sessionId} marked as paid`);
      await client.close();
    } catch (e) {
      console.error('❌ DB error:', e);
      return res.status(500).send('Database error');
    }
  }

  return res.status(200).send('OK');
}
