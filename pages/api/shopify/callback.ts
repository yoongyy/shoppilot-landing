// /pages/api/shopify/callback.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { MongoClient, ObjectId } from 'mongodb';

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY!;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET!;
const MONGO_DB_URL = process.env.MONGO_DB_URL!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, shop } = req.query;
  const rawState = req.query.state as string; 
  let sessionId = '';
  // let email = '';
  let themeId = '';

  try {
    const parsed = JSON.parse(decodeURIComponent(rawState));
    sessionId = parsed.sessionId;
    // email = parsed.email || '';
    themeId = parsed.themeId || '';
  } catch (e) {
    return res.status(400).json({ error: 'Invalid state format' });
  }

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

    // Step 2: Get shop details (including email)
    const shopRes = await axios.get(`https://${shop}/admin/api/2023-07/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
      },
    });

    const shopData = shopRes.data.shop;
    const email = shopData.email;

    const client = new MongoClient(MONGO_DB_URL);
    const db = client.db('shoppilot');
    const users = db.collection('users');
    const themes = db.collection('themes');
    const orders = db.collection('orders');

    // Upsert user
    const userResult = await users.findOneAndUpdate(
      { shop },
      {
        $setOnInsert: {
          shop,
          email,
          accessToken,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    const user = userResult?.value;
    
    if (!user || !user._id) {
      console.error('User creation or lookup failed:', userResult);
      return new Response('User creation failed', { status: 500 });
    }

    let theme = null;

    console.log('themeId from state:', themeId);

    // Step 4: Create order
    if (themeId) {
      theme = await themes.findOne({ _id: new ObjectId(themeId) });
      console.log('Theme found?', theme);
      if (theme) {
        const isFree = !theme.price || parseFloat(theme.price) === 0;
        const status = isFree ? 'paid' : 'pending_payment';

        const insertResult = await orders.insertOne({
          userId: user._id,
          sessionId,
          shop,
          themeId: theme._id,
          taskType: 'install',
          status,
          price: parseFloat(theme.price || '0'),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log('Order insert result:', insertResult);
      }
    }

    // ✅ 带上 sessionId 回首页，恢复页面状态
    res.redirect(`/finish?shop=${shop}&session_id=${sessionId}`);
  } catch (err: any) {
    console.error('Shopify callback error', err?.response?.data || err);
    res.status(500).json({ error: 'OAuth 失败', detail: err?.response?.data || err });
  }
}
