import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json() as { text: string };

    if (!text || text.trim().length < 20) {
      return NextResponse.json({ error: 'テキストが短すぎます' }, { status: 400 });
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: `あなたはセールスページや商品情報テキストから、構造化された商品情報を抽出する専門家です。
入力されたテキストから以下の項目を抽出し、JSONで返してください。
見つからない項目は空文字にしてください。

必ず以下のJSON形式で回答：
\`\`\`json
{
  "productName": "商品・サービス名",
  "productPrice": "価格",
  "productDescription": "商品概要（2-3文で要約）",
  "productBenefits": "ベネフィット・得られる結果（箇条書き）",
  "targetAudience": "ターゲット",
  "competitors": "競合・代替手段（あれば）",
  "differentiators": "差別化ポイント（あれば）",
  "commonObjections": "想定される断り文句（あれば）"
}
\`\`\``,
      messages: [
        {
          role: 'user',
          content: `以下のテキストから商品情報を抽出してください：\n\n${text.slice(0, 8000)}`,
        },
      ],
    });

    const fullText = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = fullText.match(/```json\s*([\s\S]*?)```/) || fullText.match(/\{[\s\S]*"productName"[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json({ error: '情報の抽出に失敗しました' }, { status: 500 });
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const parsed = JSON.parse(jsonStr);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Parse config API error:', error);
    const message = error instanceof Error ? error.message : '不明なエラー';
    return NextResponse.json({ error: `情報抽出に失敗しました: ${message}` }, { status: 500 });
  }
}
