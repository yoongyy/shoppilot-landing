// app/api/shopify/order-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGO_URL = process.env.MONGO_DB_URL!;
const DB_NAME = process.env.MONGODB_DB || 'shoppilot';

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ success: false, error: 'Missing sessionId' }, { status: 400 });
  }

  try {
    const client = await MongoClient.connect(MONGO_URL);
    const db = client.db(DB_NAME);
    const tokens = db.collection('tokens');

    const tokenRecord = await tokens.findOne({ sessionId });

    if (!tokenRecord) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        shop: tokenRecord.shop,
        accessToken: tokenRecord.accessToken,
        deployed: tokenRecord.deployed || false,
        themeId: tokenRecord.themeId || null,
        previewUrl: tokenRecord.previewUrl || null,
        email: tokenRecord.email || null,
        createdAt: tokenRecord.createdAt || null,
      },
    });
  } catch (error: any) {
    console.error('Order Status Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
