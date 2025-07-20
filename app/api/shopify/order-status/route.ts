// app/api/shopify/order-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

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
    const users = db.collection('users');
    const themes = db.collection('themes');
    const orders = db.collection('orders');

    const orderRecord = await orders.findOne({ sessionId });
    if (!orderRecord) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const userRecord = await users.findOne({ _id: new ObjectId(orderRecord.userId) });
    if (!userRecord) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    let theme = null;
    let price = 0;

    if (orderRecord.themeId) {
      theme = await themes.findOne({ _id: new ObjectId(orderRecord.themeId) });
      price = theme?.price ? parseFloat(theme.price) : 0;
    }

    return NextResponse.json({
      success: true,
      data: {
        shop: userRecord.shop,
        accessToken: userRecord.accessToken,
        email: userRecord.email || null,
        deployed: orderRecord.deployed || false,
        themeId: orderRecord.themeId || null,
        previewUrl: orderRecord.previewUrl || null,
        createdAt: orderRecord.createdAt || null,
        status: orderRecord.status || 'new',
        amount: price,
      },
    });
  } catch (error: any) {
    console.error('Order Status Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
