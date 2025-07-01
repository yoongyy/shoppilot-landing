// pages/api/shopify/deploy.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { shop } = req.body;

  if (!shop || typeof shop !== 'string') {
    return res.status(400).json({ error: '缺少 shop 参数' });
  }

  // 注意：你应该从数据库获取该 shop 对应的 access_token
  // 这里我们临时写死（⚠️实际项目中请替换为安全存储）
  const accessToken = process.env.DEMO_SHOPIFY_ACCESS_TOKEN;

  if (!accessToken) {
    return res.status(500).json({ error: '未配置 access token' });
  }

  try {
    // 1️⃣ 创建商品
    await axios.post(
      `https://${shop}/admin/api/2024-04/products.json`,
      {
        product: {
          title: '🐾 AI 自动生成狗狗零食',
          body_html: '<strong>营养丰富，狗狗最爱！</strong>',
          vendor: 'ShopPilot',
          product_type: '宠物食品',
          tags: ['AI', '宠物', '狗狗'],
        },
      },
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    // 2️⃣ 创建首页页面
    await axios.post(
      `https://${shop}/admin/api/2024-04/pages.json`,
      {
        page: {
          title: '欢迎来到我的狗狗商店',
          body_html: `
            <h2>我们为狗狗挑选了最优质的食品和玩具</h2>
            <p>点击上方商品开始购物！</p>
          `,
        },
      },
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('部署错误:', err?.response?.data || err.message);
    return res.status(500).json({ error: 'Shopify 部署失败', detail: err?.response?.data || err.message });
  }
}
