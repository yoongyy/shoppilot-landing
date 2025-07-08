// app/api/shopify/deploy/route.ts
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGO_URL = process.env.MONGO_DB_URL!;
const DB_NAME = process.env.MONGODB_DB || 'shoppilot';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ success: false, error: '缺少 sessionId' }, { status: 400 });
    }

    // 连接 MongoDB
    const client = await MongoClient.connect(MONGO_URL);
    const db = client.db(DB_NAME);
    const temp_results = db.collection('temp_results');
    const tokens = db.collection('tokens');

    // 获取 store data（用户生成的内容）
    const storeData = await temp_results.findOne({ id: sessionId });
    if (!storeData) {
      return NextResponse.json({ success: false, error: '未找到生成的商店内容' }, { status: 404 });
    }

    // 获取 token data（shopify token）
    const tokenData = await tokens.findOne({ sessionId });
    if (!tokenData || !tokenData.accessToken || !tokenData.shop) {
      return NextResponse.json({ success: false, error: '未找到 shopify 授权信息' }, { status: 404 });
    }

    const accessToken = tokenData.accessToken;
    const shop = tokenData.shop;

    // 上传商品到 Shopify
    for (const product of storeData.result?.products || []) {
      const res = await fetch(`https://${shop}/admin/api/2024-04/products.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product: {
            title: product.name,
            body_html: product.description,
            vendor: 'ShopPilot',
            product_type: 'AI产品',
            tags: ['AI生成', 'shoppilot'],
            images: [
              {
                src: product.image,
              },
            ],
          },
        }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        console.error('Shopify 上传失败:', err);
        return NextResponse.json({ success: false, error: '上传失败', detail: err }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[部署错误]', error);
    return NextResponse.json({ success: false, error: '内部错误', detail: error.message }, { status: 500 });
  }
}
