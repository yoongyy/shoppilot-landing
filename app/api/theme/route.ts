// app/api/theme/route.ts
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGO_URL = process.env.MONGO_DB_URL!;
const DB_NAME = process.env.MONGODB_DB || 'shoppilot';

export async function GET() {
  try {
    const client = await MongoClient.connect(MONGO_URL);
    const db = client.db(DB_NAME);
    const themes = db.collection('themes');

    const allThemes = await themes.find({}).toArray();
    const transformed = allThemes.map(theme => ({
      _id: theme._id.toString(),
      name: theme.name,
      category: theme.category,
      previewImage: theme.previewImage,
      previewUrl: theme.previewUrl,
      password: theme.password,
      price: theme.price || 0, // 0 means free
    }));
    return NextResponse.json(transformed);
  } catch (err) {
    console.error('[Theme Fetch Error]', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch themes' }, { status: 500 });
  }
}
