import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse) {
    if (req.method === 'POST') {
      console.log('🏪 Shop uninstall data deletion request:', req.body);
      // Optional: Clean up shop data from your database
      res.status(200).send('OK');
    } else {
      res.status(405).end();
    }
  }
  