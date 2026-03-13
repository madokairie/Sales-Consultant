'use client';

import { useState, useEffect, use, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getProject, updateProject } from '../../lib/store';
import {
  ConsultationProject,
  ConsultationConfig,
  ConsultationSession,
  SessionFeedback,
  PHASE_META,
  PhaseType,
} from '../../lib/types';

type Tab = 'config' | 'script' | 'sessions';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <ProjectPageInner params={params} />
    </Suspense>
  );
}

function ProjectPageInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab) || 'config';
  const [project, setProject] = useState<ConsultationProject | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [generating, setGenerating] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);

  // Session form
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    clientName: '',
    result: 'pending' as 'closed' | 'lost' | 'pending',
    transcript: '',
    videoUrl: '',
  });

  useEffect(() => {
    const p = getProject(id);
    if (!p) { router.push('/'); return; }
    setProject(p);
  }, [id, router]);

  if (!project) return null;

  // ===== Config helpers =====
  const updateConfig = (field: keyof ConsultationConfig, value: string) => {
    const updated = updateProject(id, {
      config: { ...project.config, [field]: value },
    });
    if (updated) setProject(updated);
  };

  // ===== Generate script =====
  const handleGenerateScript = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: project.config }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      const updated = updateProject(id, {
        script: { generatedAt: new Date().toISOString(), phases: data.phases },
      });
      if (updated) setProject(updated);
      setActiveTab('script');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'スクリプト生成に失敗しました。もう一度お試しください。');
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  // ===== Transcribe from video URL =====
  const handleTranscribe = async () => {
    if (!sessionForm.videoUrl.trim()) {
      alert('動画URLを入力してください');
      return;
    }
    setTranscribing(true);
    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sessionForm.videoUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '文字起こしに失敗しました');
      setSessionForm(f => ({ ...f, transcript: data.transcript }));
    } catch (e) {
      alert(e instanceof Error ? e.message : '文字起こしに失敗しました');
    } finally {
      setTranscribing(false);
    }
  };

  // ===== Add session =====
  const handleAddSession = () => {
    if (!sessionForm.transcript.trim()) {
      alert('文字起こしテキストを入力してください');
      return;
    }
    const session: ConsultationSession = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      clientName: sessionForm.clientName || '名前未設定',
      result: sessionForm.result,
      transcript: sessionForm.transcript,
      videoUrl: sessionForm.videoUrl || undefined,
      feedback: null,
    };
    const updated = updateProject(id, {
      sessions: [...project.sessions, session],
    });
    if (updated) setProject(updated);
    setSessionForm({ clientName: '', result: 'pending', transcript: '', videoUrl: '' });
    setShowSessionForm(false);
  };

  // ===== Analyze session =====
  const handleAnalyzeSession = async (sessionId: string) => {
    const session = project.sessions.find(s => s.id === sessionId);
    if (!session) return;
    setAnalyzing(sessionId);
    try {
      const scriptPhases = project.script
        ? project.script.phases.map(p => `${p.label}（${p.duration}分）`).join(' → ')
        : undefined;
      const res = await fetch('/api/analyze-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: project.config,
          transcript: session.transcript,
          result: session.result,
          scriptPhases,
        }),
      });
      const feedback = await res.json();
      if (!res.ok) throw new Error(feedback.error || 'Failed');
      const updatedSessions = project.sessions.map(s =>
        s.id === sessionId ? { ...s, feedback: feedback as SessionFeedback } : s
      );
      const updated = updateProject(id, { sessions: updatedSessions });
      if (updated) setProject(updated);
    } catch (e) {
      alert(e instanceof Error ? e.message : '分析に失敗しました。もう一度お試しください。');
      console.error(e);
    } finally {
      setAnalyzing(null);
    }
  };

  // ===== Delete session =====
  const handleDeleteSession = (sessionId: string) => {
    if (!confirm('この商談記録を削除しますか？')) return;
    const updated = updateProject(id, {
      sessions: project.sessions.filter(s => s.id !== sessionId),
    });
    if (updated) setProject(updated);
  };

  // ===== Config fields =====
  const configFields: { key: keyof ConsultationConfig; label: string; placeholder: string; type?: string; options?: { value: string; label: string }[] }[] = [
    { key: 'productName', label: '商品・サービス名', placeholder: '例：ビジネスコーチングプログラム' },
    { key: 'productPrice', label: '価格', placeholder: '例：498,000円（税込）' },
    { key: 'productDescription', label: '商品概要', placeholder: '例：6ヶ月間のマンツーマンコーチング。月2回のセッション＋チャットサポート', type: 'textarea' },
    { key: 'productBenefits', label: 'ベネフィット（得られる結果）', placeholder: '例：売上2倍、集客の自動化、自由な時間の確保', type: 'textarea' },
    { key: 'targetAudience', label: 'ターゲット', placeholder: '例：月商50万〜200万の個人起業家。集客に課題を感じている方' },
    { key: 'consultationType', label: '相談形式', placeholder: '', options: [{ value: 'online', label: 'オンライン（Zoom等）' }, { value: 'offline', label: '対面' }, { value: 'phone', label: '電話' }] },
    { key: 'consultationDuration', label: '相談時間（分）', placeholder: '60' },
    { key: 'competitors', label: '競合・代替手段', placeholder: '例：他のコーチング、独学、オンライン講座', type: 'textarea' },
    { key: 'differentiators', label: '差別化ポイント', placeholder: '例：実績1000名以上、独自メソッド、返金保証', type: 'textarea' },
    { key: 'commonObjections', label: 'よくある断り文句', placeholder: '例：高い、時間がない、自分にできるか不安、家族に相談したい', type: 'textarea' },
    { key: 'closingConditions', label: '成約条件', placeholder: '例：その場で決済、3日以内の振込', type: 'textarea' },
    { key: 'goalType', label: 'ゴール', placeholder: '', options: [{ value: 'direct_sale', label: 'その場で成約' }, { value: 'next_step', label: '次のステップへ誘導' }, { value: 'contract', label: '契約締結' }] },
    { key: 'goalDescription', label: 'ゴールの詳細', placeholder: '例：Zoom上でクレジットカード決済まで完了させる' },
  ];

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'config', label: '設定', icon: '⚙️' },
    { key: 'script', label: 'スクリプト', icon: '📝' },
    { key: 'sessions', label: '商談記録', icon: '📊' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="border-b sticky top-0 z-40" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="text-sm hover:opacity-70" style={{ color: 'var(--muted)' }}>
              ← 一覧
            </button>
            <span style={{ color: 'var(--border)' }}>|</span>
            <h1 className="text-sm font-bold truncate max-w-[300px]" style={{ color: 'var(--primary)' }}>
              {project.name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="px-3 py-1.5 text-xs rounded-lg transition-all font-medium"
                style={{
                  background: activeTab === tab.key ? 'var(--primary)' : 'transparent',
                  color: activeTab === tab.key ? '#fff' : 'var(--muted)',
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* ===== CONFIG TAB ===== */}
        {activeTab === 'config' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold" style={{ color: 'var(--primary)' }}>商品・サービス設定</h2>
              <button
                onClick={handleGenerateScript}
                disabled={generating || !project.config.productName}
                className="px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--accent)' }}
              >
                {generating ? '生成中...' : project.script ? '🔄 スクリプト再生成' : '📝 スクリプト生成'}
              </button>
            </div>

            {configFields.map(field => (
              <div key={field.key}>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--primary)' }}>
                  {field.label}
                </label>
                {field.options ? (
                  <select
                    value={project.config[field.key]}
                    onChange={e => updateConfig(field.key, e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    {field.options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={project.config[field.key]}
                    onChange={e => updateConfig(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: 'var(--border)' }}
                  />
                ) : (
                  <input
                    type="text"
                    value={project.config[field.key]}
                    onChange={e => updateConfig(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: 'var(--border)' }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ===== SCRIPT TAB ===== */}
        {activeTab === 'script' && (
          <div className="max-w-3xl mx-auto">
            {!project.script ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">📝</div>
                <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--primary)' }}>
                  スクリプトを生成しましょう
                </h3>
                <p className="text-xs mb-5" style={{ color: 'var(--muted)' }}>
                  {project.config.productName
                    ? `「${project.config.productName}」のスクリプトを生成できます`
                    : '商品情報を設定してからスクリプトを生成してください'}
                </p>
                <div className="flex items-center justify-center gap-3">
                  {project.config.productName ? (
                    <button
                      onClick={handleGenerateScript}
                      disabled={generating}
                      className="px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: 'var(--accent)' }}
                    >
                      {generating ? '生成中...' : '📝 スクリプト生成'}
                    </button>
                  ) : null}
                  <button
                    onClick={() => setActiveTab('config')}
                    className="px-4 py-2 text-sm border rounded-lg"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    ⚙️ 商品情報を設定
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-base font-bold" style={{ color: 'var(--primary)' }}>個別相談スクリプト</h2>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      生成日: {new Date(project.script.generatedAt).toLocaleString('ja-JP')}
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateScript}
                    disabled={generating}
                    className="px-4 py-2 text-xs font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'var(--accent)' }}
                  >
                    {generating ? '生成中...' : '🔄 再生成'}
                  </button>
                </div>

                {/* Timeline */}
                <div className="flex items-center gap-1 overflow-x-auto pb-2">
                  {project.script.phases.map((phase, i) => {
                    const meta = PHASE_META[phase.phase as PhaseType];
                    return (
                      <div key={phase.id} className="flex items-center">
                        <div
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                          style={{ background: `${meta?.color || '#ccc'}25`, color: 'var(--primary)' }}
                        >
                          <span>{meta?.icon || '📌'}</span>
                          <span>{phase.label}</span>
                          <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{phase.duration}分</span>
                        </div>
                        {i < project.script!.phases.length - 1 && (
                          <span className="mx-0.5 text-xs" style={{ color: 'var(--border)' }}>→</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Phases */}
                {project.script.phases.map(phase => {
                  const meta = PHASE_META[phase.phase as PhaseType];
                  return (
                    <div
                      key={phase.id}
                      className="border rounded-xl overflow-hidden"
                      style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
                    >
                      {/* Phase header */}
                      <div
                        className="px-5 py-3 flex items-center justify-between"
                        style={{ background: `${meta?.color || '#ccc'}15`, borderBottom: `2px solid ${meta?.color || '#ccc'}40` }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{meta?.icon || '📌'}</span>
                          <div>
                            <h3 className="text-sm font-bold" style={{ color: 'var(--primary)' }}>{phase.label}</h3>
                            <p className="text-[10px]" style={{ color: 'var(--muted)' }}>{phase.purpose}</p>
                          </div>
                        </div>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${meta?.color || '#ccc'}30` }}>
                          {phase.duration}分
                        </span>
                      </div>

                      {/* Steps */}
                      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                        {phase.steps.map((step, si) => (
                          <div key={step.id} className="px-5 py-4">
                            <div className="flex items-start gap-3">
                              <span className="text-xs font-bold mt-0.5 w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0"
                                style={{ background: `${meta?.color || '#ccc'}25`, color: 'var(--primary)' }}>
                                {si + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--primary)' }}>{step.title}</h4>

                                {/* Talk script */}
                                <div className="text-sm leading-relaxed mb-3 whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>
                                  {step.talkScript}
                                </div>

                                {/* Meta info */}
                                <div className="space-y-2">
                                  {step.keyQuestion && (
                                    <div className="flex items-start gap-2 p-2.5 rounded-lg" style={{ background: '#E8F4FD' }}>
                                      <span className="text-xs">❓</span>
                                      <div>
                                        <span className="text-[10px] font-medium" style={{ color: '#2980B9' }}>キー質問</span>
                                        <p className="text-xs mt-0.5">{step.keyQuestion}</p>
                                      </div>
                                    </div>
                                  )}
                                  {step.checkPoint && (
                                    <div className="flex items-start gap-2 p-2.5 rounded-lg" style={{ background: '#E8F8F0' }}>
                                      <span className="text-xs">✅</span>
                                      <div>
                                        <span className="text-[10px] font-medium" style={{ color: '#27AE60' }}>次へ進むサイン</span>
                                        <p className="text-xs mt-0.5">{step.checkPoint}</p>
                                      </div>
                                    </div>
                                  )}
                                  {step.tips && (
                                    <div className="flex items-start gap-2 p-2.5 rounded-lg" style={{ background: '#FFF8E1' }}>
                                      <span className="text-xs">💡</span>
                                      <div>
                                        <span className="text-[10px] font-medium" style={{ color: '#F39C12' }}>コツ</span>
                                        <p className="text-xs mt-0.5">{step.tips}</p>
                                      </div>
                                    </div>
                                  )}
                                  {step.transition && (
                                    <div className="flex items-start gap-2 p-2.5 rounded-lg" style={{ background: '#F3E8FF' }}>
                                      <span className="text-xs">➡️</span>
                                      <div>
                                        <span className="text-[10px] font-medium" style={{ color: '#8E44AD' }}>次への繋ぎ</span>
                                        <p className="text-xs mt-0.5">{step.transition}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===== SESSIONS TAB ===== */}
        {activeTab === 'sessions' && (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold" style={{ color: 'var(--primary)' }}>商談記録 ＆ 分析</h2>
              <button
                onClick={() => setShowSessionForm(true)}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90"
                style={{ background: 'var(--primary)' }}
              >
                + 商談を記録
              </button>
            </div>

            {/* Add session form */}
            {showSessionForm && (
              <div className="border rounded-xl p-5 mb-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--primary)' }}>新しい商談を記録</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium block mb-1">お客様名</label>
                      <input
                        type="text"
                        value={sessionForm.clientName}
                        onChange={e => setSessionForm(f => ({ ...f, clientName: e.target.value }))}
                        placeholder="例：田中様"
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        style={{ borderColor: 'var(--border)' }}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1">結果</label>
                      <select
                        value={sessionForm.result}
                        onChange={e => setSessionForm(f => ({ ...f, result: e.target.value as 'closed' | 'lost' | 'pending' }))}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        <option value="closed">成約</option>
                        <option value="lost">失注</option>
                        <option value="pending">保留</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">動画URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={sessionForm.videoUrl}
                        onChange={e => setSessionForm(f => ({ ...f, videoUrl: e.target.value }))}
                        placeholder="YouTube URLを入力（例：https://youtube.com/watch?v=...）"
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                        style={{ borderColor: 'var(--border)' }}
                      />
                      <button
                        onClick={handleTranscribe}
                        disabled={transcribing || !sessionForm.videoUrl.trim()}
                        className="px-4 py-2 text-xs font-medium text-white rounded-lg whitespace-nowrap disabled:opacity-50 transition-all hover:opacity-90"
                        style={{ background: 'var(--primary)' }}
                      >
                        {transcribing ? '取得中...' : '字幕を取得'}
                      </button>
                    </div>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--muted)' }}>
                      YouTube動画のURLから字幕を自動取得できます
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">
                      文字起こしテキスト <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={sessionForm.transcript}
                      onChange={e => setSessionForm(f => ({ ...f, transcript: e.target.value }))}
                      placeholder="商談の文字起こしテキストを貼り付けてください。&#10;&#10;Zoom録画の文字起こし、議事録、メモなどを入力できます。&#10;詳細であるほど正確な分析ができます。"
                      rows={10}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      style={{ borderColor: 'var(--border)' }}
                    />
                    <p className="text-[10px] mt-1" style={{ color: 'var(--muted)' }}>
                      ※ 50文字以上の入力が必要です（現在: {sessionForm.transcript.length}文字）
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowSessionForm(false)}
                      className="flex-1 px-4 py-2.5 text-sm border rounded-lg"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleAddSession}
                      className="flex-1 px-4 py-2.5 text-sm text-white rounded-lg font-medium"
                      style={{ background: 'var(--primary)' }}
                    >
                      保存
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sessions list */}
            {/* Config hint for analysis accuracy */}
            {!project.config.productName && (
              <div className="flex items-center gap-3 p-3 mb-4 rounded-lg border" style={{ borderColor: 'var(--warning)', background: '#FFF8E1' }}>
                <span className="text-sm">💡</span>
                <div className="flex-1">
                  <p className="text-xs" style={{ color: '#795548' }}>
                    商品情報を設定すると、分析の精度が向上します
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('config')}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap"
                  style={{ background: 'var(--warning)', color: '#fff' }}
                >
                  設定する
                </button>
              </div>
            )}

            {project.sessions.length === 0 && !showSessionForm ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">📊</div>
                <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--primary)' }}>
                  商談を分析しましょう
                </h3>
                <p className="text-xs mb-2" style={{ color: 'var(--muted)' }}>
                  商談の文字起こしを入力すると、高成約メソッドに基づいてAIが分析
                </p>
                <p className="text-xs mb-5" style={{ color: 'var(--muted)' }}>
                  「導く面談」度合い・失敗パターン検出・決断確認ポイント評価など
                </p>
                <button
                  onClick={() => setShowSessionForm(true)}
                  className="px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-all hover:opacity-90"
                  style={{ background: 'var(--accent)' }}
                >
                  📊 商談を分析する
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {project.sessions.map(session => (
                  <div
                    key={session.id}
                    className="border rounded-xl overflow-hidden"
                    style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
                  >
                    {/* Session header */}
                    <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid var(--border)` }}>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          session.result === 'closed' ? 'bg-green-50 text-green-600'
                          : session.result === 'lost' ? 'bg-red-50 text-red-500'
                          : 'bg-yellow-50 text-yellow-600'
                        }`}>
                          {session.result === 'closed' ? '成約' : session.result === 'lost' ? '失注' : '保留'}
                        </span>
                        <span className="text-sm font-medium" style={{ color: 'var(--primary)' }}>{session.clientName}</span>
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>
                          {new Date(session.date).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.videoUrl && (
                          <a
                            href={session.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 rounded hover:bg-blue-50 text-blue-500"
                          >
                            動画を見る
                          </a>
                        )}
                        <button
                          onClick={() => handleAnalyzeSession(session.id)}
                          disabled={analyzing === session.id}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium text-white disabled:opacity-50"
                          style={{ background: 'var(--accent)' }}
                        >
                          {analyzing === session.id ? '分析中...' : session.feedback ? '🔄 再分析' : '🔍 AI分析'}
                        </button>
                        <button
                          onClick={() => handleDeleteSession(session.id)}
                          className="text-xs px-2 py-1 rounded hover:bg-red-50 text-red-400"
                        >
                          削除
                        </button>
                      </div>
                    </div>

                    {/* Transcript preview */}
                    {!session.feedback && (
                      <div className="px-5 py-3">
                        <p className="text-xs line-clamp-3" style={{ color: 'var(--muted)' }}>
                          {session.transcript.slice(0, 200)}...
                        </p>
                      </div>
                    )}

                    {/* Feedback */}
                    {session.feedback && (
                      <div className="px-5 py-4 space-y-4">
                        {/* Score & summary */}
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center">
                            <div
                              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white"
                              style={{
                                background: session.feedback.overallScore >= 80 ? 'var(--success)'
                                  : session.feedback.overallScore >= 60 ? 'var(--warning)'
                                  : 'var(--accent)',
                              }}
                            >
                              {session.feedback.overallScore}
                            </div>
                            <span className="text-[10px] mt-1" style={{ color: 'var(--muted)' }}>総合スコア</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm leading-relaxed">{session.feedback.summary}</p>
                            {session.feedback.lostReason && (
                              <div className="mt-2 p-2 rounded-lg bg-red-50">
                                <span className="text-xs font-medium text-red-600">失注要因: </span>
                                <span className="text-xs text-red-600">{session.feedback.lostReason}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                                成約確率: <strong>{session.feedback.closingProbability}%</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Phase analysis */}
                        {session.feedback.phaseAnalysis.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold mb-2" style={{ color: 'var(--primary)' }}>フェーズ別評価</h4>
                            <div className="grid grid-cols-3 gap-2">
                              {session.feedback.phaseAnalysis.map((pa, i) => (
                                <div key={i} className="p-2.5 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium">{pa.phase}</span>
                                    <span className={`text-xs font-bold ${
                                      pa.score >= 80 ? 'text-green-600' : pa.score >= 60 ? 'text-yellow-600' : 'text-red-500'
                                    }`}>{pa.score}</span>
                                  </div>
                                  <p className="text-[10px]" style={{ color: 'var(--muted)' }}>{pa.comment}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Strengths */}
                        {session.feedback.strengths.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold mb-2 text-green-600">良かった点</h4>
                            <div className="space-y-2">
                              {session.feedback.strengths.map((item, i) => (
                                <div key={i} className="p-3 rounded-lg bg-green-50">
                                  <p className="text-xs font-medium text-green-700">{item.point}</p>
                                  <p className="text-xs text-green-600 mt-0.5">{item.detail}</p>
                                  {item.timestamp && <p className="text-[10px] text-green-400 mt-1">「{item.timestamp}」</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Improvements */}
                        {session.feedback.improvements.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold mb-2 text-orange-600">改善点</h4>
                            <div className="space-y-2">
                              {session.feedback.improvements.map((item, i) => (
                                <div key={i} className="p-3 rounded-lg bg-orange-50">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                      item.severity === 'high' ? 'bg-red-100 text-red-600'
                                      : item.severity === 'medium' ? 'bg-orange-100 text-orange-600'
                                      : 'bg-yellow-100 text-yellow-600'
                                    }`}>{item.severity === 'high' ? '重要' : item.severity === 'medium' ? '中' : '低'}</span>
                                    <p className="text-xs font-medium text-orange-700">{item.point}</p>
                                  </div>
                                  <p className="text-xs text-orange-600 mt-1">{item.detail}</p>
                                  {item.timestamp && <p className="text-[10px] text-orange-400 mt-1">「{item.timestamp}」</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Missed opportunities */}
                        {session.feedback.missedOpportunities.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold mb-2 text-purple-600">見逃した機会</h4>
                            <div className="space-y-2">
                              {session.feedback.missedOpportunities.map((item, i) => (
                                <div key={i} className="p-3 rounded-lg bg-purple-50">
                                  <p className="text-xs font-medium text-purple-700">{item.point}</p>
                                  <p className="text-xs text-purple-600 mt-0.5">{item.detail}</p>
                                  {item.timestamp && <p className="text-[10px] text-purple-400 mt-1">「{item.timestamp}」</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Next actions */}
                        {session.feedback.nextActions.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold mb-2" style={{ color: 'var(--primary)' }}>次回のアクション</h4>
                            <div className="p-3 rounded-lg" style={{ background: '#F0F7FF' }}>
                              {session.feedback.nextActions.map((action, i) => (
                                <div key={i} className="flex items-start gap-2 mb-1 last:mb-0">
                                  <span className="text-xs">▶</span>
                                  <p className="text-xs">{action}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
