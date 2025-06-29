// app/api/shopify/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY!;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET!;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const shop = searchParams.get('shop');

  if (!code || !shop) {
    return NextResponse.json({ error: 'Missing code or shop' }, { status: 400 });
  }

  try {
    // 请求 access_token
    const tokenRes = await axios.post(`https://${shop}/admin/oauth/access_token`, {
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code,
    });

    const accessToken = tokenRes.data.access_token;

    // 创建一个示例商品
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

    return NextResponse.redirect(`https://shoppilot.app/success?shop=${shop}`);
  } catch (error: any) {
    console.error('[Shopify OAuth Error]', error?.response?.data || error);
    return NextResponse.json(
      {
        error: 'Shopify OAuth 失败',
        detail: error?.response?.data || error,
      },
      { status: 500 }
    );
  }
}
