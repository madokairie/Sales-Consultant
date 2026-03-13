import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 300;

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { config } = await req.json();

    const goalLabel = config.goalType === 'direct_sale' ? 'その場で成約'
      : config.goalType === 'next_step' ? '次のステップへ誘導'
      : '契約締結';

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: `あなたは個別セールスコンサルティングの専門家です。
成約率80-90%を実現するトップセールスの知見をもとに、個別相談（1on1セールス）のスクリプトを設計してください。

【個別相談の本質】
個別相談は「売り込む面談」ではなく「導く面談」。
相手が自分で「やりたい」と決断できる状態まで導くことが目的。
カウンセリングではない。ゴールはCTA完了。ヒアリングや雑談はその手段に過ぎない。

【成約率を決める3要素】
1. 事前教育の質（面談前に温度感を上げておく）
2. フィルタリングの精度（本気度の高い人だけが面談に来る設計）
3. 面談シナリオの完成度（CTAまで必ず到達する構成）

【4つの失敗パターン（絶対に設計に含めない）】
× ヒアリングを目的にする構成（聞くことが目的化し、CTA到達しない）
× その場でアドバイス・解決する流れ（満足されて講座が不要になる）
× 雑談に時間を使う設計（本題に入れないまま時間切れ）
× NOを押す・覆そうとする手順（キャンセル・クレーム・返金の原因）

【スクリプト設計の原則】
1. 「売る」のではなく「買いたくなる」状態を作る（「押された」ではなく「確認された」体験）
2. 相手の課題を深く理解し、自分で答えに気づかせる
3. 反論は事前に潰す（先回りトーク）
4. 沈黙を恐れない（考える時間を与える）
5. クロージングは「確認」であって「説得」ではない
6. 「後で検討します」を発生させない設計にする（「後で」の9割は戻らない。感情が冷める・周囲のネガティブ・比較検討が始まるため）
7. ゴール＝CTA完了をシナリオに明記する
8. 時間配分を明記する（ヒアリング15分以内・課題整理と提案20分・CTA10分が目安）
9. 解決策は「講座の中にある」と伝え、その場でアドバイスしすぎない（「詳しくは一緒に進めながら」で締める）

【決断確認ポイント（最重要）】
提案後、CTAに入る前に必ずこのフレーズを入れる：
「これからお申込みの手続きの説明に入らせていただきますが、よろしいですか？」
- YESの場合 → 利用規約の説明 → 申込フォームの入力・完了
- NOの場合 → 押さない・追わない・丁寧にお見送り
- 曖昧なまま終わらせない。YESかNOかを、その場で決める。

【NOへの対応原則】
NOと言われたら、追わない。押さない。丁寧にお見送り。
押すと→キャンセル・クレーム・返金要求になりやすい。
押さないと→「押されない」とわかった相手は安心して本音で話し、結果的に自分から「やりたい」と言ってくれる。

【フェーズ構成】
1. opening（オープニング）: 場を整え、ゴールを共有する。「本日は○分ほどお時間をいただきます。まずは現状を聞かせてください」
2. hearing（現状ヒアリング）: 課題・理想を引き出す。15分以内に収める。CTA到達に必要な情報収集と割り切る。
3. deepening（深掘り）: 課題の本質に迫り、痛みを明確化する。「このまま続けたらどうなりそうですか？」
4. vision（理想の未来）: 解決後の理想状態を一緒に描く。ロードマップ提示「この流れで進めると、○ヶ月でこうなります」
5. presentation（解決策提示）: 商品/サービスを課題解決の手段として自然に紹介。解決策の全体像を見せる。
6. proof（実績・証明）: 同じ悩みを持った人の成功事例。Before/Afterを具体的に。
7. offer（オファー）: 価格・条件の提示（アンカリング活用）
8. objection（反論処理）: 想定される断り文句への切り返し。ただし押さない。
9. closing（クロージング・決断確認）: 決断確認フレーズ→YES→利用規約説明→申込完了。NO→丁寧にお見送り。「ご検討ください」で終わらせない。

【面談前5点セット（スクリプトに事前準備として明記）】
1. 申込フォーム
2. 利用規約
3. 決済リンク
4. 面談シナリオ（このスクリプト）
5. 画面共有の段取り

【出力形式】必ず以下のJSON形式で回答してください：
\`\`\`json
{
  "phases": [
    {
      "phase": "opening",
      "label": "フェーズ名",
      "duration": 5,
      "purpose": "このフェーズの目的",
      "steps": [
        {
          "title": "ステップ名",
          "talkScript": "具体的なセリフ（「」付き）。複数のバリエーションを含む。",
          "keyQuestion": "キーとなる質問（ヒアリング・深掘りフェーズ）",
          "checkPoint": "この反応が得られたら次へ進むサイン",
          "tips": "コツ・注意点",
          "transition": "次のステップへの自然な繋ぎフレーズ"
        }
      ]
    }
  ]
}
\`\`\``,
      messages: [
        {
          role: 'user',
          content: `以下の商品・サービス情報をもとに、${config.consultationDuration || 60}分の個別相談スクリプトを作成してください。

===商品・サービス情報===
商品名: ${config.productName || '未設定'}
価格: ${config.productPrice || '未設定'}
商品概要: ${config.productDescription || '未設定'}
商品のベネフィット: ${config.productBenefits || '未設定'}
ターゲット: ${config.targetAudience || '未設定'}
相談形式: ${config.consultationType === 'online' ? 'オンライン（Zoom等）' : config.consultationType === 'offline' ? '対面' : '電話'}
===ここまで===

===セールス環境===
競合・代替手段: ${config.competitors || '未設定'}
差別化ポイント: ${config.differentiators || '未設定'}
よくある断り文句: ${config.commonObjections || '特になし'}
成約条件: ${config.closingConditions || '特になし'}
ゴール: ${goalLabel}${config.goalDescription ? `（${config.goalDescription}）` : ''}
===ここまで===

各フェーズの時間配分は${config.consultationDuration || 60}分に収まるようにしてください。
時間配分の目安: ヒアリング15分以内・課題整理と提案20分・CTA10分。ヒアリングに30分以上かけないこと。
すべてのstepにtalkScript（具体的なセリフ）を含めてください。
断り文句が提供されている場合、objectionフェーズでそれぞれに対する切り返しトークを必ず含めてください（ただし押さない・追わない原則を守る）。

【必須要素】
- closingフェーズに決断確認フレーズ「これからお申込みの手続きの説明に入らせていただきますが、よろしいですか？」を必ず含める
- closingフェーズにYES→手続きの流れ と NO→丁寧なお見送り の両方のシナリオを含める
- openingフェーズに「本日のゴール共有」（面談の目的と流れを先に伝える）を含める
- 「詳しくは一緒に進めながらお伝えしていきますね」等のフレーズで、その場でアドバイスしすぎない設計にする
- 各フェーズのtipsに「この反応が出たら次へ進む」サインを明記する`,
        },
      ],
    });

    const fullText = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = fullText.match(/```json\s*([\s\S]*?)```/) || fullText.match(/\{[\s\S]*"phases"[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json({ error: 'スクリプトの生成に失敗しました' }, { status: 500 });
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const parsed = JSON.parse(jsonStr);

    // Add IDs
    parsed.phases = parsed.phases.map((phase: Record<string, unknown>, pi: number) => ({
      ...phase,
      id: `phase-${pi}`,
      steps: (phase.steps as Record<string, unknown>[]).map((step: Record<string, unknown>, si: number) => ({
        ...step,
        id: `phase-${pi}-step-${si}`,
      })),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Generate script API error:', error);
    return NextResponse.json({ error: 'スクリプト生成に失敗しました' }, { status: 500 });
  }
}
