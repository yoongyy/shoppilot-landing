import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGO_URL = process.env.MONGO_DB_URL!;
const DB_NAME = process.env.MONGODB_DB || 'shoppilot';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Missing sessionId' }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await MongoClient.connect(MONGO_URL);
    const db = client.db(DB_NAME);
    const temp_results = db.collection('temp_results');
    const tokens = db.collection('tokens');

    // Fetch generated store data
    const storeData = await temp_results.findOne({ id: sessionId });
    if (!storeData) {
      return NextResponse.json({ success: false, error: 'Generated store content not found' }, { status: 404 });
    }

    // Fetch Shopify token info
    const tokenData = await tokens.findOne({ sessionId });
    if (!tokenData || !tokenData.accessToken || !tokenData.shop) {
      return NextResponse.json({ success: false, error: 'Shopify authorization info not found' }, { status: 404 });
    }

    const accessToken = tokenData.accessToken;
    const shop = tokenData.shop;

    // Upload products to Shopify
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
            product_type: 'AI Product',
            tags: ['AI Generated', 'ShopPilot'],
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
        console.error('Failed to upload to Shopify:', err);
        return NextResponse.json({ success: false, error: 'Upload failed', detail: err }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Deployment Error]', error);
    return NextResponse.json({ success: false, error: 'Internal server error', detail: error.message }, { status: 500 });
  }
}
