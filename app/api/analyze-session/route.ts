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

【分析の大原則】
個別相談は「売り込む面談」ではなく「導く面談」。
ゴールはCTA完了（その場で申込完了）。ヒアリングや雑談はその手段に過ぎない。
「後で検討します」が発生した場合、それは面談の問題ではなく「導線の設計」の問題である可能性が高い。

【4つの失敗パターン検出（致命的減点）】
A. 相談で初めて商品説明をしている（事前教育不足）→ -15点
B. 雑談で終わっている（CTAに到達していない）→ -20点
C. 売ろうとしている（押している・説得している）→ -15点
D. 決断を委ねている（「ご検討ください」で終了）→ -10点

【分析の観点（16項目）】
1. ラポール構築: 信頼関係は作れていたか
2. ゴール共有: 面談の目的と流れを最初に伝えたか
3. ヒアリング効率: 15分以内に必要情報を収集できたか（30分以上かけていないか）
4. ヒアリングの目的意識: 「聞くこと」が目的化せず、CTA到達に必要な情報収集として機能しているか
5. 深掘り: 痛みの明確化、緊急性の喚起ができたか
6. 理想の未来: 解決後のビジョンを一緒に描けたか
7. 提案: 課題に対する解決策として自然に提示できたか
8. アドバイス抑制: その場でアドバイスしすぎて「満足して終わり」にしていないか（解決策は講座の中にあると伝えているか）
9. 反論処理: 断り文句に適切に対応できたか（ただし押していないか）
10. 決断確認ポイント: 「これからお申込みの手続きの説明に入らせていただきますが、よろしいですか？」のような明確な決断確認フレーズがあったか
11. NO対応: NOの場合に押さず・追わず・丁寧にお見送りできたか
12. CTA到達: 面談がCTA（申込手続き）まで到達したか。「後で送ります」「ご検討ください」で終わっていないか
13. 話す比率: 相手に十分話させていたか（理想は相手7:自分3）
14. 質問の質: オープンクエスチョンを効果的に使えていたか
15. 沈黙の活用: 考える時間を与えていたか
16. 時間配分: ヒアリング→課題整理→提案→CTAの時間配分は適切だったか

【「導く面談」vs「売り込む面談」の判定基準】
導く面談の特徴:
- 相手が自分で「やりたい」と言っている
- 決断確認フレーズで明確にYES/NOを確認している
- NOに対して押していない
- 「押された」ではなく「確認された」体験を提供している

売り込む面談の特徴:
- 説得・論破している
- 「今だけ」「特別に」等の煽り表現が多い
- NOに対して粘っている・覆そうとしている
- 曖昧なまま終わっている（YESかNOか不明確）

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
  "lostReason": "失注の場合の主要因（成約・保留の場合は空文字）",
  "consultationType": "導く面談 or 売り込む面談",
  "failurePatterns": ["検出された失敗パターン（A〜Dのいずれか）"],
  "decisionConfirmation": {
    "exists": true,
    "phrase": "使用された決断確認フレーズの引用",
    "response": "YES/NO/曖昧",
    "handling": "対応の評価"
  },
  "timeAllocation": {
    "hearing": "ヒアリングに使った推定時間",
    "proposal": "提案に使った推定時間",
    "cta": "CTA/クロージングに使った推定時間",
    "evaluation": "時間配分の評価"
  },
  "funnelDiagnosis": "NOや保留が多い場合、面談の問題か導線（事前教育・フィルタリング）の問題かの診断"
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

【高成約メソッド・チェックポイント】
- この面談は「導く面談」か「売り込む面談」か判定してください
- 4つの失敗パターン（A:初めて説明 B:雑談で終了 C:売ろうとしている D:決断を委ねている）に該当するものがないか検出してください
- 決断確認ポイント（「お申込みの手続きの説明に入らせていただきますが、よろしいですか？」等）があったか確認してください
- ヒアリングに30分以上かけていないか確認してください
- その場でアドバイスしすぎて相手が満足して終わっていないか確認してください
- 「後で検討します」「後で送ります」で終わっていないか確認してください

${result === 'lost' ? '【失注分析】特に失注の原因を詳しく分析してください。どの瞬間に相手の気持ちが離れたかを特定してください。また、面談自体の問題か、それとも導線（事前教育・フィルタリング）の問題かを診断してください。NOが多い場合、トークを磨くより導線を見直すべきかもしれません。' : ''}
${result === 'closed' ? '【成約分析】成約できた要因を分析し、再現性のあるパターンを抽出してください。特に「導く面談」として機能していたか、決断確認ポイントが効果的だったかを分析してください。' : ''}
${result === 'pending' ? '【保留分析】「後で検討」になった原因を分析してください。感情が冷める前にその場で決断を促す設計ができていたか確認してください。「後で」の9割は戻りません。' : ''}`,
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
