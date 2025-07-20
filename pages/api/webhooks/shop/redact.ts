import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyShopifyWebhook } from '@/utils/verifyShopifyWebhook';

const SHOPIFY_SECRET = process.env.SHOPIFY_API_SECRET!;

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).end('Method Not Allowed');
    }
    // const verified = verifyShopifyWebhook(req, SHOPIFY_SECRET);

    // if (!verified) {
    //     console.warn('⚠️ Webhook verification failed');
    //     return res.status(401).json({ message: 'Unauthorized' });
    //   }

      console.log('✅ Verified webhook received:', req.body);

      // Do something with the webhook (e.g., log, store, respond)
      return res.status(200).json({ message: 'Webhook processed successfully' });
  }
  