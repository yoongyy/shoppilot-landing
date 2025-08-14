// pages/api/contact.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { name, email, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields: name, email, message' });
  }

  try {
    const subject = `New contact form message from ${name}`;
    const text = `From: ${name} <${email}>\n\nMessage:\n${message}`;

    await resend.emails.send({
      from: 'ShopPilot <no-reply@shoppilot.app>',
      to: 'contact@shoppilot.app',
      replyTo: email,
      subject,
      text,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <h2>New contact form message</h2>
          <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
          <p style="white-space:pre-wrap">${message}</p>
        </div>
      `,
    });

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
