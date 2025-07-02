// /app/api/temp-store/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { randomUUID } from 'crypto';

const client = new MongoClient(process.env.MONGO_DB_URL!);
const db = client.db('shoppilot');
const collection = db.collection('temp_results');

export async function POST(req: NextRequest) {
  const { result } = await req.json();
  const id = randomUUID();

  await collection.insertOne({ _id: id, result, createdAt: new Date() });

  return NextResponse.json({ id });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const doc = await collection.findOne({ _id: id });
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ result: doc.result });
}
