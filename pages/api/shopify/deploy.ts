// pages/api/shopify/deploy.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';
import axios from 'axios';

const MONGO_URI = process.env.MONGO_DB_URL!;
const client = new MongoClient(MONGO_URI);
const dbName = 'shopify'; // 可自定义
const collectionName = 'token';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { shop } = req.body;

  if (!shop) {
    return res.status(400).json({ error: 'Missing shop in request' });
  }

  try {
    // 连接数据库
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // 查询 access_token
    const tokenEntry = await collection.findOne({ shop });
    if (!tokenEntry || !tokenEntry.accessToken) {
      return res.status(404).json({ error: 'Shop token not found' });
    }

    const accessToken = tokenEntry.accessToken;

    // 创建示例商品
    const response = await axios.post(
      `https://${shop}/admin/api/2024-04/products.json`,
      {
        product: {
          title: 'AI 自动生成商品',
          body_html: '<strong>这是一件 AI 生成的商品</strong>',
          vendor: 'Shoppilot',
          product_type: '智能商品',
          tags: ['AI', '自动化'],
        },
      },
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.status(200).json({ message: '商品已成功创建', product: response.data.product });
  } catch (error: any) {
    console.error('[Shopify Deploy Error]', {
      message: error.message,
      data: error?.response?.data,
    });

    return res.status(500).json({
      error: '部署失败',
      detail: error?.response?.data || error.message,
    });
  } finally {
    await client.close();
  }
}
