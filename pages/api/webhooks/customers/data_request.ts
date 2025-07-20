import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
    if (req.method === 'POST') {
      console.log('📦 Customer data request received:', req.body);
      // Optional: Process or store the request
      res.status(200).send('OK');
    } else {
      res.status(405).end();
    }
  }
  