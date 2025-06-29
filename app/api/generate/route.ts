import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  const fullPrompt = `
请严格返回 JSON 格式，生成一个商店信息，包含：
- storeName（商店名称）
- description（简要说明）
- products：一个包含 3 个商品的数组，每个商品包含：
  - name
  - description
  - image（可使用 placeholder 图）

例如：
{
  "storeName": "宠物精品屋",
  "description": "精选宠物用品和配件，让你的宠物快乐成长",
  "products": [
    {
      "name": "猫耳发箍",
      "description": "可爱毛绒猫耳，适合主人佩戴",
      "image": "https://via.placeholder.com/300x200?text=猫耳发箍"
    },
    ...
  ]
}

用户输入描述：${prompt}
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

  // 清理 markdown 包裹的代码块
  const cleaned = raw.replace(/```json|```/g, '').trim();

  try {
    return NextResponse.json(JSON.parse(cleaned));
  } catch (e) {
    return NextResponse.json({ error: '解析失败', raw: cleaned }, { status: 500 });
  }
}
