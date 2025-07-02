// /app/api/deploy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import axios from 'axios';

const client = new MongoClient(process.env.MONGO_DB_URL!);
const db = client.db('shoppilot');
const tokens = db.collection('tokens');
const results = db.collection('temp_results');

export async function POST(req: NextRequest) {
  const { shop, sessionId } = await req.json();

  if (!shop || !sessionId) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const tokenDoc = await tokens.findOne({ shop });
  const resultDoc = await results.findOne({ _id: sessionId });

  if (!tokenDoc || !resultDoc) {
    return NextResponse.json({ error: '找不到 accessToken 或生成内容' }, { status: 404 });
  }

  const accessToken = tokenDoc.accessToken;
  const result = resultDoc.result;

  try {
    for (const product of result.products) {
      await axios.post(
        `https://${shop}/admin/api/2024-04/products.json`,
        {
          product: {
            title: product.name,
            body_html: product.description,
            vendor: 'Shoppilot',
            product_type: 'AI商品',
            tags: ['ai', '自动生成'],
            images: [{ src: product.image }],
          },
        },
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Shopify 发布失败', err?.response?.data || err);
    return NextResponse.json({ error: '部署失败', detail: err?.response?.data || err }, { status: 500 });
  }
}
