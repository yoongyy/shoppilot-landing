import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  const fullPrompt = `
Strictly return a valid JSON object with the following structure for an online store idea:

- storeName: the name of the store
- description: a short summary of what the store sells
- products: an array of exactly 3 products. Each product should include:
  - name
  - description
  - image (use placeholder image URLs)

Example:
{
  "storeName": "Pet Paradise",
  "description": "High-quality accessories and supplies to keep your pets happy and healthy.",
  "products": [
    {
      "name": "Cat Ears Headband",
      "description": "A cute plush headband perfect for pet lovers.",
      "image": "https://via.placeholder.com/300x200?text=Cat+Ears"
    },
    {
      "name": "Smart Pet Feeder",
      "description": "Automatically dispenses food for your pet, great for busy pet owners.",
      "image": "https://via.placeholder.com/300x200?text=Smart+Feeder"
    },
    {
      "name": "Luxury Dog Bed",
      "description": "A cozy bed designed to give your dog the ultimate comfort.",
      "image": "https://via.placeholder.com/300x200?text=Dog+Bed"
    }
  ]
}

User request: ${prompt}
`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.CLAUDE_API_KEY!,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      messages: [
        { role: 'user', content: fullPrompt }
      ]
    }),
  });

  const data = await res.json();
  const raw = data.content?.[0]?.text || '';

  const cleaned = raw.replace(/```json|```/g, '').trim();

  try {
    return NextResponse.json(JSON.parse(cleaned));
  } catch (e) {
    return NextResponse.json({ error: 'Failed to parse Claude response', raw: cleaned }, { status: 500 });
  }
}
