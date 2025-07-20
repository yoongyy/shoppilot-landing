import crypto from 'crypto';
import type { NextApiRequest } from 'next';

export function verifyShopifyWebhook(req: NextApiRequest, secret: string): boolean {
  try {
    const hmacHeader = req.headers['x-shopify-hmac-sha256'];

    if (!hmacHeader || typeof hmacHeader !== 'string') {
      console.warn('🚨 Missing or invalid HMAC header');
      return false;
    }

    const rawBody = JSON.stringify(req.body);

    const generatedHash = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('base64');

    // Safe buffer comparison
    const verified = crypto.timingSafeEqual(
      Buffer.from(generatedHash, 'utf8'),
      Buffer.from(hmacHeader, 'utf8')
    );

    return verified;
  } catch (err) {
    console.error('❌ Error verifying webhook:', err);
    return false;
  }
}
