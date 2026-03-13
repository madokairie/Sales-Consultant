import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 300;

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { config, transcript, result, scriptPhases } = await req.json() as {
      config: Record<string, string>;
      transcript: string;
      result: 'closed' | 'lost' | 'pending';
      scriptPhases?: string;
    };

    if (!transcript || transcript.trim().length < 50) {
      return NextResponse.json({ error: '文字起こしテキストが短すぎます（50文字以上必要）' }, { status: 400 });
    }

    const resultLabel = result === 'closed' ? '成約' : result === 'lost' ? '失注' : '保留';

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: `あなたは個別セールスコンサルティングの分析専門家です。
商談の文字起こしを分析し、成約率を向上させるための具体的なフィードバックを提供してください。

【分析の観点】
1. ラポール構築: 信頼関係は作れていたか
2. ヒアリング: 相手の本質的な課題を引き出せたか
3. 深掘り: 痛みの明確化、緊急性の喚起ができたか
4. 提案: 課題に対する解決策として自然に提示できたか
5. 反論処理: 断り文句に適切に対応できたか
6. クロージング: 自然な流れで決断を促せたか
7. 話す比率: 相手に十分話させていたか（理想は相手7:自分3）
8. 質問の質: オープンクエスチョンを効果的に使えていたか
9. 沈黙の活用: 考える時間を与えていたか
10. 次のアクション: 明確に設定できたか

【必ず以下のJSON形式で回答】
\`\`\`json
{
  "overallScore": 75,
  "summary": "総評（2-3文）",
  "strengths": [
    {
      "point": "良かった点のタイトル",
      "detail": "具体的な説明",
      "timestamp": "該当する発言の引用",
      "severity": "high"
    }
  ],
  "improvements": [
    {
      "point": "改善点のタイトル",
      "detail": "具体的にどう改善すべきか",
      "timestamp": "該当する発言の引用",
      "severity": "high"
    }
  ],
  "missedOpportunities": [
    {
      "point": "見逃した機会のタイトル",
      "detail": "ここでこう言えば成約率が上がった",
      "timestamp": "該当する発言の引用",
      "severity": "medium"
    }
  ],
  "phaseAnalysis": [
    {
      "phase": "ヒアリング",
      "score": 80,
      "comment": "評価コメント",
      "suggestion": "改善提案"
    }
  ],
  "nextActions": ["次回やるべきこと1", "次回やるべきこと2"],
  "closingProbability": 60,
  "lostReason": "失注の場合の主要因（成約・保留の場合は空文字）"
}
\`\`\``,
      messages: [
        {
          role: 'user',
          content: `以下の個別相談の文字起こしを分析し、フィードバックを提供してください。

===商品情報===
商品名: ${config.productName || '不明'}
価格: ${config.productPrice || '不明'}
ターゲット: ${config.targetAudience || '不明'}
===ここまで===

===商談結果===
結果: ${resultLabel}
===ここまで===

${scriptPhases ? `===使用したスクリプト構成===\n${scriptPhases}\n===ここまで===\n` : ''}
===文字起こし===
${transcript.slice(0, 12000)}
===ここまで===

この商談を100点満点で採点し、具体的な改善点と次回のアクションを提案してください。
${result === 'lost' ? '特に失注の原因を詳しく分析してください。どの瞬間に相手の気持ちが離れたかを特定してください。' : ''}
${result === 'closed' ? '成約できた要因を分析し、再現性のあるパターンを抽出してください。' : ''}`,
        },
      ],
    });

    const fullText = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = fullText.match(/```json\s*([\s\S]*?)```/) || fullText.match(/\{[\s\S]*"overallScore"[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json({ error: '分析に失敗しました' }, { status: 500 });
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const parsed = JSON.parse(jsonStr);
    parsed.generatedAt = new Date().toISOString();

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Analyze session API error:', error);
    return NextResponse.json({ error: '商談分析に失敗しました' }, { status: 500 });
  }
}
