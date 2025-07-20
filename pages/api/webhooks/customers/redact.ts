import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'POST') {
      console.log('🗑️ Customer data deletion request:', req.body);
      // Optional: Process or anonymize customer data
      res.status(200).send('OK');
    } else {
      res.status(405).end();
    }
  }
  