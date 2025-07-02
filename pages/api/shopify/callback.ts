// /pages/api/shopify/callback.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { MongoClient } from 'mongodb';

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY!;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET!;
const MONGO_DB_URL = process.env.MONGO_DB_URL!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, shop, state } = req.query;
  const sessionId = req.query.session_id as string;

  if (!shop || !code || typeof shop !== 'string' || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const tokenRes = await axios.post(`https://${shop}/admin/oauth/access_token`, {
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code,
    });

    const accessToken = tokenRes.data.access_token;

    const client = new MongoClient(MONGO_DB_URL);
    const db = client.db('shoppilot');
    const tokens = db.collection('tokens');

    await tokens.updateOne(
      { shop },
      { $set: { shop, accessToken, updatedAt: new Date() } },
      { upsert: true }
    );

    // ✅ 带上 sessionId 回首页，恢复页面状态
    res.redirect(`/?shop=${shop}&session_id=${sessionId}`);
  } catch (err: any) {
    console.error('Shopify callback error', err?.response?.data || err);
    res.status(500).json({ error: 'OAuth 失败', detail: err?.response?.data || err });
  }
}
