'use client';

import { useRouter } from 'next/navigation';

export default function ManualPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <header className="border-b sticky top-0 z-40" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-sm hover:opacity-70" style={{ color: 'var(--muted)' }}>
            ← トップ
          </button>
          <span style={{ color: 'var(--border)' }}>|</span>
          <h1 className="text-sm font-bold" style={{ color: 'var(--primary)' }}>使い方マニュアル</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* TOC */}
        <nav className="mb-10 p-5 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--primary)' }}>目次</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              { id: 'start', icon: '🚀', label: '初めて使うとき' },
              { id: 'config', icon: '⚙️', label: '商品情報を設定する' },
              { id: 'script', icon: '📝', label: 'スクリプトを作る' },
              { id: 'guide', icon: '🎯', label: '面談中カンペ' },
              { id: 'objections', icon: '🛡️', label: '反論切り返し辞典' },
              { id: 'analysis', icon: '📊', label: '商談を分析する' },
              { id: 'pdf', icon: '📄', label: 'PDFダウンロード' },
              { id: 'backup', icon: '💾', label: 'バックアップ/復元' },
              { id: 'tips', icon: '💡', label: '活用のコツ' },
            ].map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:shadow-sm"
                style={{ background: 'var(--background)', color: 'var(--primary)' }}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        <div className="space-y-12">
          {/* Section 1 */}
          <Section id="start" icon="🚀" title="初めて使うとき">
            <P>トップページに2つの入口があります。</P>
            <CardGrid>
              <Card icon="📝" title="スクリプト設計" desc="商品情報を入力して、個別相談のスクリプトをAIに作ってもらう" />
              <Card icon="📊" title="商談分析" desc="商談の文字起こしをAIに分析してもらう" />
            </CardGrid>
            <P>どちらからでも始められます。プロジェクト名を入力して「作成して始める」を押してください。</P>
            <Tip>1つの商品・サービスに対して1つのプロジェクトを作るのがおすすめです。</Tip>
          </Section>

          {/* Section 2 */}
          <Section id="config" icon="⚙️" title="商品情報を設定する">
            <P>プロジェクトの「⚙️ 設定」タブで商品情報を入力します。入力方法は2つ：</P>
            <CardGrid>
              <Card icon="📋" title="項目ごとに入力" desc="各項目を1つずつ入力する方法。正確に設定したいときに" />
              <Card icon="📄" title="テキストから一括入力" desc="セールスページやLPのテキストを貼り付けると、AIが自動で情報を抽出" />
            </CardGrid>

            <H3>特に重要な設定</H3>
            <Table
              headers={['設定項目', '説明']}
              rows={[
                ['事前教育レベル', 'スクリプトの構成・分析基準・反論傾向が大きく変わる最重要設定'],
                ['よくある断り文句', '入力すると反論処理フェーズ＆反論辞典に反映される'],
                ['ゴール', '「その場で成約」「次のステップ」等でスクリプト構成が変わる'],
              ]}
            />

            <H3>事前教育レベルの違い</H3>
            <Table
              headers={['レベル', '面談での説明量', '成約率目安']}
              rows={[
                ['教育済み（価格まで公開）', '商品説明不要。確認メイン', '80-90%'],
                ['説明済み（価格未公開）', '軽く確認 + 価格提示が重要', '40-60%'],
                ['事前説明なし', 'フル説明が必要', '10-30%'],
              ]}
            />
          </Section>

          {/* Section 3 */}
          <Section id="script" icon="📝" title="スクリプトを作る">
            <P>設定画面の右上「📝 スクリプト生成」ボタンを押すと、AIが9フェーズのスクリプトを生成します（30秒〜1分）。</P>

            <H3>9フェーズ構成</H3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: '👋', name: 'オープニング', desc: '場を整える・ゴール共有' },
                { icon: '👂', name: 'ヒアリング', desc: '15分以内に課題を引き出す' },
                { icon: '🔍', name: '課題の深掘り', desc: '痛みの明確化' },
                { icon: '✨', name: '理想の未来', desc: '解決後のビジョン' },
                { icon: '💡', name: '解決策の提示', desc: '商品紹介' },
                { icon: '📊', name: '実績・証明', desc: 'Before/After' },
                { icon: '🎯', name: 'オファー提示', desc: '価格・条件' },
                { icon: '🛡️', name: '反論処理', desc: '断り文句への対応' },
                { icon: '🤝', name: 'クロージング', desc: '決断確認→申込 or お見送り' },
              ].map((phase, i) => (
                <div key={i} className="p-3 rounded-lg border text-center" style={{ borderColor: 'var(--border)' }}>
                  <div className="text-xl mb-1">{phase.icon}</div>
                  <p className="text-xs font-bold" style={{ color: 'var(--primary)' }}>{phase.name}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>{phase.desc}</p>
                </div>
              ))}
            </div>

            <Tip>各ステップのセリフ右上に「コピー」ボタンがあります。タップでクリップボードにコピーされます。</Tip>
          </Section>

          {/* Section 4 */}
          <Section id="guide" icon="🎯" title="面談中カンペ">
            <P>スクリプトタブの「🎯 面談カンペ」ボタンを押すと、面談中に使えるガイド画面が開きます。</P>

            <H3>使い方</H3>
            <Steps steps={[
              'ZoomやGoogleMeetの横にブラウザウィンドウを配置',
              '面談開始時に「▶」ボタンまたは「T」キーでタイマー開始',
              'セリフを読みながら「→」キーまたは「次へ →」ボタンで進む',
              'キー質問や「次へ進むサイン」を確認しながら進行',
            ]} />

            <H3>キーボードショートカット</H3>
            <Table
              headers={['キー', '動作']}
              rows={[
                ['→ or スペース', '次のステップ'],
                ['←', '前のステップ'],
                ['T', 'タイマー開始/停止'],
              ]}
            />

            <Tip>暗い背景なのでZoom映像と区別しやすくなっています。上部のフェーズバーをクリックすると任意のフェーズにジャンプできます。</Tip>
          </Section>

          {/* Section 5 */}
          <Section id="objections" icon="🛡️" title="反論切り返し辞典">
            <P>「🛡️ 反論辞典」タブで「反論辞典を生成」ボタンを押すと、7カテゴリの反論パターンが生成されます。</P>

            <H3>7カテゴリ</H3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { icon: '💰', name: '価格', ex: '「高いですね」' },
                { icon: '⏰', name: '時間', ex: '「忙しくて」' },
                { icon: '💪', name: '自信', ex: '「できるか不安」' },
                { icon: '👨‍👩‍👧', name: '家族', ex: '「相談したい」' },
                { icon: '🤔', name: '検討', ex: '「考えさせて」' },
                { icon: '🔄', name: '競合', ex: '「他も見たい」' },
                { icon: '📅', name: 'タイミング', ex: '「もう少し後で」' },
              ].map((cat, i) => (
                <div key={i} className="p-3 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-lg">{cat.icon}</span>
                  <p className="text-xs font-bold mt-1" style={{ color: 'var(--primary)' }}>{cat.name}</p>
                  <p className="text-[10px]" style={{ color: 'var(--muted)' }}>{cat.ex}</p>
                </div>
              ))}
            </div>

            <H3>各カードに含まれる情報</H3>
            <Table
              headers={['セクション', '内容']}
              rows={[
                ['本当の心理', 'この断り文句の裏にある本音'],
                ['切り返しフレーズ', 'そのまま使えるセリフ（間の指示付き）'],
                ['NGフレーズ', '絶対に言ってはいけない言葉と理由'],
                ['やってはいけない行動', 'その場でやりがちなNG行動'],
                ['フォローアップ質問', '反論処理後に投げかける質問'],
              ]}
            />

            <Important>
              大原則: <strong>押さない・追わない・丁寧にお見送り</strong><br />
              NOと言われたら追わない。押すとキャンセル・クレーム・返金になる。<br />
              押さないと、相手は安心して本音を話し、自分から「やりたい」と言う。
            </Important>
          </Section>

          {/* Section 6 */}
          <Section id="analysis" icon="📊" title="商談を分析する">
            <H3>商談を記録する</H3>
            <P>「📊 商談記録」タブで「+ 商談を記録」を押し、以下を入力します。</P>
            <Steps steps={[
              'お客様名と結果（成約/失注/保留）を選択',
              '文字起こしテキストを入力（YouTube URLからの字幕取得も可能）',
              '「保存」ボタンで記録',
              '「🔍 AI分析」ボタンで分析開始',
            ]} />

            <H3>AIが分析する項目</H3>
            <Table
              headers={['分析項目', '内容']}
              rows={[
                ['総合スコア', '100点満点の総合評価'],
                ['「導く面談」判定', '売り込みになっていないかチェック'],
                ['失敗パターン検出', '4つの致命的パターン（初回説明/雑談で終了/セールス/決断委ね）'],
                ['フェーズ別評価', '各フェーズごとのスコアとコメント'],
                ['改善点', '具体的な改善セリフ例付き'],
                ['見逃した機会', '「こう言えばよかった」セリフ付き'],
                ['次回のアクション', 'やるべきことリスト'],
              ]}
            />

            <Tip>商品情報を設定しておくと分析精度が上がります。未設定でも分析はできますが、ヒントが表示されます。</Tip>
          </Section>

          {/* Section 7 */}
          <Section id="pdf" icon="📄" title="PDFダウンロード">
            <P>各タブの「PDF保存」ボタンを押すと、プロ品質のPDFが生成されます。</P>
            <Table
              headers={['種類', '内容']}
              rows={[
                ['スクリプトPDF', '表紙 → タイムライン → 各フェーズ詳細'],
                ['反論辞典PDF', '表紙 → 基本原則 → 各反論詳細（NGフレーズ付き）'],
                ['分析レポートPDF', '表紙 → スコア・総評 → フェーズ評価 → 改善点'],
              ]}
            />
            <Steps steps={[
              '「PDF保存」ボタンをクリック',
              '印刷プレビューが開く',
              '「送信先」を「PDFとして保存」に変更',
              '「保存」をクリック',
            ]} />
            <Tip>Chromeの場合、「詳細設定」→「背景のグラフィック」にチェックを入れると色付きデザインが反映されます。</Tip>
          </Section>

          {/* Section 8 */}
          <Section id="backup" icon="💾" title="バックアップ / 復元">
            <P>データはブラウザのlocalStorageに保存されています。ブラウザのデータ消去で消えるため、定期的なバックアップをおすすめします。</P>

            <H3>バックアップ</H3>
            <P>トップページ右上の「バックアップ」ボタンをクリック → JSONファイルがダウンロードされます。</P>

            <H3>復元</H3>
            <Steps steps={[
              'トップページ右上の「復元」ボタンをクリック',
              'バックアップしたJSONファイルを選択',
              '「X件追加、Y件更新」と表示されれば成功',
            ]} />

            <H3>おすすめバックアップタイミング</H3>
            <ul className="list-disc list-inside text-xs space-y-1" style={{ color: 'var(--foreground)' }}>
              <li>週に1回</li>
              <li>大量の商談分析を行った後</li>
              <li>ブラウザのキャッシュをクリアする前</li>
              <li>別のPCで使い始めるとき</li>
            </ul>
          </Section>

          {/* Section 9 */}
          <Section id="tips" icon="💡" title="活用のコツ">
            <div className="space-y-3">
              <TipCard title="面談前の準備" items={[
                'スクリプトを面談カンペで開いておく',
                '反論辞典で頻出パターンを確認しておく',
                '申込フォーム・決済リンク・利用規約を手元に用意',
              ]} />
              <TipCard title="面談の振り返り" items={[
                '面談後すぐに文字起こしを入力して分析する（記憶が新しいうちに）',
                '改善点のセリフ例をコピーしてメモアプリに保存',
                '次回の面談前に前回の改善点を確認',
              ]} />
              <TipCard title="成約率を上げるために" items={[
                '事前教育レベルを正確に設定する（最もスクリプトに影響する項目）',
                '失注が続く場合 → 面談の問題か導線（事前教育・フィルタリング）の問題かを分析結果で確認',
                '成約した商談も分析して「再現性のあるパターン」を把握する',
              ]} />
            </div>
          </Section>
        </div>
      </main>
    </div>
  );
}

// ===== Components =====
function Section({ id, icon, title, children }: { id: string; icon: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id}>
      <div className="flex items-center gap-3 mb-4 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="text-2xl">{icon}</span>
        <h2 className="text-lg font-bold" style={{ color: 'var(--primary)' }}>{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-bold mt-4 mb-2" style={{ color: 'var(--primary)' }}>{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>{children}</p>;
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg mt-3" style={{ background: '#FFF8E1' }}>
      <span className="text-sm flex-shrink-0">💡</span>
      <p className="text-xs leading-relaxed" style={{ color: '#795548' }}>{children}</p>
    </div>
  );
}

function Important({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-lg mt-3 border" style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>
      <p className="text-xs leading-relaxed" style={{ color: '#991B1B' }}>{children}</p>
    </div>
  );
}

function Card({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <div className="text-2xl mb-2">{icon}</div>
      <h4 className="text-sm font-bold mb-1" style={{ color: 'var(--primary)' }}>{title}</h4>
      <p className="text-xs" style={{ color: 'var(--muted)' }}>{desc}</p>
    </div>
  );
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function Steps({ steps }: { steps: string[] }) {
  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-3">
          <span className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold text-white flex-shrink-0"
            style={{ background: 'var(--primary)' }}>
            {i + 1}
          </span>
          <p className="text-xs leading-relaxed pt-1" style={{ color: 'var(--foreground)' }}>{step}</p>
        </div>
      ))}
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border)' }}>
      <table className="w-full text-xs">
        <thead>
          <tr style={{ background: 'var(--background)' }}>
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-bold" style={{ color: 'var(--primary)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-t" style={{ borderColor: 'var(--border)' }}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2" style={{ color: 'var(--foreground)' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TipCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <h4 className="text-xs font-bold mb-2" style={{ color: 'var(--primary)' }}>{title}</h4>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-xs mt-0.5" style={{ color: 'var(--accent)' }}>▶</span>
            <p className="text-xs" style={{ color: 'var(--foreground)' }}>{item}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
