// pages/api/shopify/callback.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';
import axios from 'axios';

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY!;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET!;
const MONGO_DB_URL = process.env.MONGO_DB_URL!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, shop } = req.query;

  if (!shop || !code || typeof shop !== 'string' || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // 获取 access_token
    const tokenRes = await axios.post(`https://${shop}/admin/oauth/access_token`, {
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code,
    });

    const accessToken = tokenRes.data.access_token;

    // 保存 access_token 到 MongoDB
    const client = new MongoClient(MONGO_DB_URL);
    await client.connect();
    const db = client.db();
    const tokens = db.collection('token');

    await tokens.updateOne(
      { shop },
      { $set: { shop, accessToken, updatedAt: new Date() } },
      { upsert: true }
    );

    await client.close();

    // 重定向到首页（带 shop 参数）
    res.redirect(`https://shoppilot.app/?shop=${shop}`);
  } catch (error: any) {
    console.error('[Shopify OAuth Error]', {
      message: error.message,
      responseData: error?.response?.data,
      status: error?.response?.status,
    });
    
    res.status(500).json({
      error: 'Shopify OAuth 失败',
      detail: {
        message: error.message,
        data: error?.response?.data,
        status: error?.response?.status,
      },
    });
    
  }
}
