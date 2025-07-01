// pages/api/shopify/callback.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, shop } = req.query

  if (!code || !shop || typeof shop !== 'string' || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing code or shop' })
  }

  try {
    const accessTokenRes = await axios.post(
      `https://${shop}/admin/oauth/access_token`,
      {
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    const accessToken = accessTokenRes.data.access_token

    // 示例：创建一个商品
    const productRes = await axios.post(
      `https://${shop}/admin/api/2024-04/products.json`,
      {
        product: {
          title: 'Shoppilot 自动商品',
          body_html: '<strong>由 AI 自动生成的商品描述</strong>',
          vendor: 'Shoppilot',
          product_type: '自动生成',
        },
      },
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    )

    console.log('[Shopify Product Created]', productRes.data)

    res.redirect(`/success?shop=${shop}`)
  } catch (err: any) {
    console.error('[Shopify Error]', err?.response?.data || err)
    res.status(500).json({ error: 'Shopify API 错误', detail: err?.response?.data || err.message })
  }
}
