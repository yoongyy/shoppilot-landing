// pages/api/shopify/callback.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { shopifyApi, LATEST_API_VERSION, DataType } from '@shopify/shopify-api';

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  // scopes: ['write_products', 'write_themes', 'write_pages', 'write_content'],
  scopes: ['write_products', 'write_themes', 'write_content'],
  hostName: 'shoppilot.app',
  isEmbeddedApp: false,
  apiVersion: LATEST_API_VERSION,
  hostScheme: 'https',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { shop, code } = req.query;

  if (!shop || !code || typeof shop !== 'string' || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const tokenResponse = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });

    const session = tokenResponse.session;

    const client = new shopify.clients.Rest({ session });

    await client.post({
      path: 'products',
      data: {
        product: {
          title: 'Shoppilot 自动商品',
          body_html: '<strong>AI 自动生成商品</strong>',
          vendor: 'Shoppilot',
          product_type: 'AI产品',
          tags: ['ai', 'autogen'],
        },
      },
      type: DataType.JSON,
    });
    console.log(shop);
    res.redirect(`https://shoppilot.app/success?shop=${shop}`);
  } catch (error: any) {
    console.error('[Shopify OAuth Error]', error);
    res.status(500).json({ error: 'OAuth 授权失败', detail: error });
  }
}
