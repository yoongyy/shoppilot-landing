// utils/verifyShopifyWebhook.ts
import crypto from 'crypto';

export function verifyShopifyWebhook(req: any, secret: string): boolean {
  const hmacHeader = req.headers['x-shopify-hmac-sha256'];
  const rawBody = JSON.stringify(req.body);

  const generatedHash = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(generatedHash, 'utf8'),
    Buffer.from(hmacHeader, 'utf8')
  );
}
