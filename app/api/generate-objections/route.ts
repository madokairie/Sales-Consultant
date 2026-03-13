import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 300;

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { config } = await req.json();

    const preEduLabel = config.preEducationLevel === 'full'
      ? '教育済み（価格まで公開）'
      : config.preEducationLevel === 'partial'
      ? '説明済み（価格未公開）'
      : '事前説明なし';

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16384,
      system: `あなたは個別セールスコンサルティングの専門家であり、「導く面談」メソッドに基づく反論処理辞典の作成者です。

【大原則：「導く面談」の反論処理哲学】
反論処理とは「反論を覆すこと」ではない。
相手が安心して本音を話せる状態を作ること。
NOと言われたら → 押さない・追わない・丁寧にお見送り。
これが最も重要な原則。

【なぜ押さないのか】
- 押すと → キャンセル・クレーム・返金要求になりやすい
- 押さないと → 「押されない」とわかった相手は安心して本音で話す
- 結果的に自分から「やりたい」と言ってくれる
- 「押された」ではなく「確認された」体験を提供する

【反論の本質】
反論の多くは「本当の理由」ではない。
「高い」と言う人の本音は「価値がわからない」「不安」「決断が怖い」。
「検討します」と言う人の本音は「断る勇気がない」「まだ納得していない」。
反論の裏にある心理を理解し、それに対応するスクリプトを作る。

【反論処理の3ステップ】
1. 受け止める（共感）：「そうですよね」「おっしゃる通りです」
2. 確認する（質問）：「ちなみに、○○ということですか？」
3. 選択肢を渡す（判断は相手に委ねる）：「もし○○だったら、どう思われますか？」
※ 絶対に「でも」「しかし」で始めない。論破しない。説得しない。

【事前教育レベル別の反論傾向】
■ 教育済み（価格まで公開）：
- 価格反論は少ない（既に知っている）
- 「タイミング」「自信がない」系が多い
- 反論処理は軽めでOK。背中を押すより確認する姿勢で。

■ 説明済み（価格未公開）：
- 価格反論が最も出やすい
- 「高い」への対応が最重要
- アンカリング不足が原因のことが多い

■ 事前説明なし：
- あらゆる反論が出る可能性
- 「そもそも何？」レベルの質問も含む
- 反論処理より先に信頼構築が必要

【カテゴリ別の反論と対応方針】
以下の7カテゴリを必ず含める：

1. 価格（money）💰：「高い」「予算がない」「お金がない」
   → 価値の再確認。分割・投資対効果の提示。押さない。

2. 時間（time）⏰：「忙しい」「時間がない」「今は無理」
   → 時間の使い方の確認。「忙しいからこそ」は禁句。

3. 自信（confidence）💪：「自分にできるか不安」「向いてないかも」
   → 過去の受講生の例。「できるかどうか」より「やりたいかどうか」。

4. 家族（family/spouse）👨‍👩‍👧：「家族に相談したい」「夫/妻に聞かないと」
   → 相手の意思を確認。家族への説明サポート提案。決して「今決めて」と言わない。

5. 検討（thinking about it）🤔：「ちょっと考えさせてください」「検討します」
   → 何を検討したいか具体化。「後で」の9割は戻らない現実を踏まえつつ、押さない。

6. 競合（competition）🔄：「他のも見てみたい」「○○と迷っている」
   → 比較ポイントの整理。自社の強みは伝えるが、他社を否定しない。

7. タイミング（timing）📅：「もう少し後で」「来月から」「今じゃない」
   → タイミングの本音を確認。「今じゃない理由」が明確かどうか。

【切り返しスクリプトの具体性ルール（超重要）】
スクリプトは「そのままコピペして面談で使えるレベル」で書くこと。
抽象的なガイドライン（「共感を示す」「価値を伝える」）は絶対に書かない。

■ ダメな例（抽象的すぎる）：
×「価格に見合う価値があることを伝える」
×「共感した上で、投資対効果を説明する」

■ 良い例（具体的・そのまま使える）：
○「そうですよね、○○万円って大きな金額ですよね。ちなみに○○さんは、この問題がこのまま1年続いたとしたら、その間に失うお金や時間ってどれくらいだと思いますか？」
○「なるほど、ありがとうございます。ちなみに、もし費用の面がクリアになったとしたら、やってみたい気持ちはありますか？」

スクリプトには必ず：
- 相手の名前を入れる箇所（○○さん）を含む
- 具体的な間の取り方や声のトーン指示を含む（例：「（3秒待つ）」「（穏やかに）」）
- 1つのresponseに2〜3往復の会話フロー（自分→相手の想定反応→自分の返し）を含む

【NGフレーズ（言ってはいけないセリフ）】
各反論に対して「つい言ってしまいがちだが絶対に言ってはいけないフレーズ」を2〜3個、理由付きで提示すること。

■ NGフレーズの例：
- 「でも考えてみてください」→ 理由：「でも」で始めると反論を否定している印象になる
- 「今だけ特別に」→ 理由：煽り表現は「売り込む面談」の特徴。信頼を損なう
- 「皆さんそうおっしゃいますが」→ 理由：相手の気持ちを軽視している印象になる

【出力形式】必ず以下のJSON形式で回答してください：
\`\`\`json
{
  "objections": [
    {
      "id": "category-number",
      "category": "カテゴリ名（日本語）",
      "categoryIcon": "絵文字",
      "objection": "お客様が実際に言うセリフ",
      "psychology": "この反論が出る本当の心理（なぜこう言うのか）を2-3文で具体的に",
      "responses": [
        {
          "situation": "この返答を使う具体的な場面",
          "script": "「○○さん、そうですよね。（穏やかに）ちなみに〜」のように、そのままコピペして使える具体的な会話スクリプト。○○さんの箇所、間の指示、2-3往復の会話フローを含む。",
          "tone": "empathetic/curious/calm のいずれか"
        }
      ],
      "ngPhrases": [
        {
          "phrase": "「つい言ってしまいがちなNGフレーズ」",
          "reason": "なぜこのフレーズがダメなのか（相手にどう伝わるか）"
        }
      ],
      "doNot": "この反論を聞いたときに絶対にやってはいけない行動（具体的に）",
      "followUp": "反論処理後に投げかける具体的なフォローアップ質問（「」付き）",
      "severity": "high/medium/low"
    }
  ],
  "principles": [
    "反論処理の重要原則1",
    "反論処理の重要原則2"
  ]
}
\`\`\`

各カテゴリにつき2個の反論パターンを作成すること（合計14個）。
各反論に対して2個のresponse（返答スクリプト）を含めること。
各responseのscriptは最低100文字以上の具体的な会話フロー（「」付き、間の指示付き、2-3往復）にすること。
各反論に対してngPhrasesを2個含めること（「」付きのNGフレーズとその理由）。
doNotは具体的な禁止行動を明記すること。
principlesは5個の重要原則を含めること。
重要: JSON内の文字列で改行が必要な場合は\\nを使うこと。生の改行文字を文字列値に含めないこと。`,
      messages: [
        {
          role: 'user',
          content: `以下の商品・サービス情報をもとに、反論処理辞典を作成してください。

===商品・サービス情報===
商品名: ${config.productName || '未設定'}
価格: ${config.productPrice || '未設定'}
商品概要: ${config.productDescription || '未設定'}
商品のベネフィット: ${config.productBenefits || '未設定'}
ターゲット: ${config.targetAudience || '未設定'}
===ここまで===

===事前教育レベル===
レベル: ${preEduLabel}
${config.preEducationDetail ? `詳細: ${config.preEducationDetail}` : ''}
※ このレベルに応じて、出やすい反論の種類と対応の深さを調整してください。
===ここまで===

===セールス環境===
競合・代替手段: ${config.competitors || '未設定'}
差別化ポイント: ${config.differentiators || '未設定'}
よくある断り文句: ${config.commonObjections || '特になし'}
===ここまで===

【必須要件】
- 7カテゴリ（価格・時間・自信・家族・検討・競合・タイミング）すべてを含めること
- 各カテゴリにつき2〜3個の反論パターンを作成すること
- 各反論に2〜3個の具体的な返答スクリプトを含めること（「」付きのセリフ）
- 事前教育レベル「${preEduLabel}」に応じて反論の出やすさと対応の深さを調整すること
${config.commonObjections ? `- 以下のよくある断り文句に対するカスタム反論処理を必ず含めること：${config.commonObjections}` : ''}
- すべてのスクリプトは「導く面談」の原則（押さない・追わない・丁寧にお見送り）に従うこと
- 「でも」「しかし」で始まる返答は絶対に含めないこと
- 各responseのscriptは抽象的なガイドラインではなく、「○○さん、〜」で始まるそのまま使える具体的な会話スクリプト（100文字以上）にすること
- scriptには（穏やかに）（3秒待つ）などの間やトーンの指示を含めること
- 各反論にngPhrases（言ってはいけないフレーズ）を2〜3個、理由付きで含めること`,
        },
      ],
    });

    const fullText = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = fullText.match(/```json\s*([\s\S]*?)```/) || fullText.match(/\{[\s\S]*"objections"[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json({ error: '反論処理辞典の生成に失敗しました' }, { status: 500 });
    }

    let jsonStr = jsonMatch[1] || jsonMatch[0];

    // Try to fix truncated JSON by closing open structures
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      // Attempt recovery: remove trailing incomplete entries and close brackets
      jsonStr = jsonStr
        .replace(/,\s*\{[^}]*$/, '')   // remove last incomplete object
        .replace(/,\s*"[^"]*$/, '')     // remove last incomplete string
        .replace(/,\s*$/, '');           // remove trailing comma

      // Count and close open brackets
      const openBraces = (jsonStr.match(/\{/g) || []).length - (jsonStr.match(/\}/g) || []).length;
      const openBrackets = (jsonStr.match(/\[/g) || []).length - (jsonStr.match(/\]/g) || []).length;
      jsonStr += ']'.repeat(Math.max(0, openBrackets)) + '}'.repeat(Math.max(0, openBraces));

      try {
        parsed = JSON.parse(jsonStr);
      } catch (e2) {
        console.error('JSON recovery failed:', e2);
        console.error('Raw text length:', fullText.length);
        return NextResponse.json({ error: '反論処理辞典の解析に失敗しました。もう一度お試しください。' }, { status: 500 });
      }
    }

    parsed.generatedAt = new Date().toISOString();
    // Ensure ngPhrases exists on all entries
    if (parsed.objections) {
      parsed.objections = parsed.objections.map((obj: Record<string, unknown>) => ({
        ...obj,
        ngPhrases: obj.ngPhrases || [],
      }));
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Generate objections API error:', error);
    const message = error instanceof Error ? error.message : '不明なエラー';
    return NextResponse.json({ error: `反論処理辞典の生成に失敗しました: ${message}` }, { status: 500 });
  }
}
