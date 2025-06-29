// /api/shopify/callback.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY!;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, shop } = req.query;

  if (!shop || !code || typeof shop !== 'string' || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // 获取 access_token
    const tokenRes = await axios.post(`https://${shop}/admin/oauth/access_token`, {
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code,
    });

    const accessToken = tokenRes.data.access_token;

    // 示例：创建一个商品（你可替换为完整部署流程）
    await axios.post(
      `https://${shop}/admin/api/2024-04/products.json`,
      {
        product: {
          title: '示例商品',
          body_html: '<strong>这是一件 AI 自动生成的商品</strong>',
          vendor: 'Shoppilot',
          product_type: 'AI产品',
          tags: ['ai', 'shopify'],
        },
      },
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    res.redirect(`https://shoppilot.app/success?shop=${shop}`);
  } catch (error: any) {
    console.error('[Shopify OAuth Error]', error?.response?.data || error);
    res.status(500).json({ error: 'Shopify OAuth 失败', detail: error?.response?.data || error });
  }
}
