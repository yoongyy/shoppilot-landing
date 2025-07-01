// app/api/shopify/callback/route.ts
import { shopifyApi, LATEST_API_VERSION, Session } from '@shopify/shopify-api';
import { NextRequest, NextResponse } from 'next/server';

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: ['write_products', 'write_themes', 'write_pages', 'write_content'],
  hostName: 'shoppilot.app',
  isEmbeddedApp: false,
  apiVersion: LATEST_API_VERSION,
  hostScheme: 'https',
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shop = searchParams.get('shop');
  const code = searchParams.get('code');

  if (!shop || !code) {
    return NextResponse.json({ error: 'Missing shop or code' }, { status: 400 });
  }

  try {
    // 获取访问令牌
    const tokenResponse = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: {} as any, // App Router 中暂时跳过
    });

    const session = tokenResponse.session;

    // 使用 Rest 客户端添加商品
    const client = new shopify.clients.Rest({ session });
    await client.post({
      path: 'products',
      data: {
        product: {
          title: 'Shoppilot 自动商品',
          body_html: '<strong>这是 AI 自动生成的商品</strong>',
          vendor: 'Shoppilot',
          product_type: 'AI产品',
          tags: ['ai', 'autogen'],
        },
      },
      type: 'application/json',
    });

    return NextResponse.redirect(`https://shoppilot.app/success?shop=${shop}`);
  } catch (error: any) {
    console.error('[Shopify OAuth Error]', error);
    return NextResponse.json(
      {
        error: 'Shopify OAuth 失败',
        detail: error?.response?.data || error,
      },
      { status: 500 }
    );
  }
}
