'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { listProjects, createProject, deleteProject, exportAllData, importAllData } from './lib/store';
import { ConsultationProject } from './lib/types';

type CreateMode = 'script' | 'sessions' | null;

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<ConsultationProject[]>([]);
  const [createMode, setCreateMode] = useState<CreateMode>(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    setProjects(listProjects());
  }, []);

  const handleCreate = (mode: 'script' | 'sessions') => {
    if (!newName.trim()) return;
    const p = createProject(newName.trim());
    router.push(`/projects/${p.id}?tab=${mode}`);
  };

  const handleQuickCreate = (mode: 'script' | 'sessions') => {
    setCreateMode(mode);
    setNewName('');
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    deleteProject(id);
    setProjects(listProjects());
  };

  const handleExport = () => {
    const json = exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-consultant-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = importAllData(reader.result as string);
        setProjects(listProjects());
        alert(`インポート完了: ${result.added}件追加、${result.updated}件更新`);
      } catch (err) {
        alert(`インポートに失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--primary)' }}>
              Sales Consultant
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              個別相談スクリプト設計 ＆ 商談分析AI
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/manual')}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors hover:opacity-80 flex items-center gap-1"
              style={{ background: '#FEF3C7', color: '#B45309' }}
            >
              📖 使い方
            </button>
            <button
              onClick={handleExport}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors hover:opacity-80 flex items-center gap-1"
              style={{ background: '#F0F4FF', color: 'var(--primary)' }}
            >
              バックアップ
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors hover:opacity-80 flex items-center gap-1"
              style={{ background: '#F0FDF4', color: '#059669' }}
            >
              復元
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Create modal */}
        {createMode && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setCreateMode(null)}>
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--primary)' }}>
                {createMode === 'script' ? '📝 スクリプト設計を始める' : '📊 商談分析を始める'}
              </h2>
              <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
                {createMode === 'script'
                  ? '商品情報を入力して、成約率の高い相談スクリプトをAIが自動生成します'
                  : '商談の文字起こしをAIが分析し、改善点と次のアクションを提案します'}
              </p>
              <input
                type="text"
                placeholder="プロジェクト名（例：コーチングプログラム個別相談）"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate(createMode)}
                className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: 'var(--border)' }}
                autoFocus
              />
              <div className="flex gap-3 mt-5">
                <button onClick={() => setCreateMode(null)} className="flex-1 px-4 py-2.5 text-sm border rounded-lg" style={{ borderColor: 'var(--border)' }}>
                  キャンセル
                </button>
                <button
                  onClick={() => handleCreate(createMode)}
                  className="flex-1 px-4 py-2.5 text-sm text-white rounded-lg font-medium"
                  style={{ background: createMode === 'script' ? 'var(--primary)' : 'var(--accent)' }}
                >
                  作成して始める
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Two main entry points */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <button
            onClick={() => handleQuickCreate('script')}
            className="group p-6 rounded-2xl border text-left transition-all hover:shadow-md hover:border-[var(--primary)]"
            style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
          >
            <div className="text-3xl mb-3">📝</div>
            <h2 className="text-base font-bold mb-1" style={{ color: 'var(--primary)' }}>
              スクリプト設計
            </h2>
            <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--muted)' }}>
              商品情報を入力するだけで、成約率80-90%の相談スクリプトを自動生成
            </p>
            <span className="text-xs font-medium px-3 py-1.5 rounded-full transition-all group-hover:opacity-90"
              style={{ background: 'var(--primary)', color: '#fff' }}>
              新しいスクリプトを作る →
            </span>
          </button>

          <button
            onClick={() => handleQuickCreate('sessions')}
            className="group p-6 rounded-2xl border text-left transition-all hover:shadow-md hover:border-[var(--accent)]"
            style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
          >
            <div className="text-3xl mb-3">📊</div>
            <h2 className="text-base font-bold mb-1" style={{ color: 'var(--primary)' }}>
              商談分析
            </h2>
            <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--muted)' }}>
              商談の文字起こしをAIが分析。「導く面談」vs「売り込む面談」の判定、失敗パターン検出、改善提案
            </p>
            <span className="text-xs font-medium px-3 py-1.5 rounded-full transition-all group-hover:opacity-90"
              style={{ background: 'var(--accent)', color: '#fff' }}>
              商談を分析する →
            </span>
          </button>
        </div>

        {/* Projects list */}
        {projects.length > 0 && (
          <>
            <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--primary)' }}>プロジェクト一覧</h2>
            <div className="space-y-3">
              {projects.map(p => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-5 rounded-xl border cursor-pointer transition-all hover:shadow-sm"
                  style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
                >
                  <div className="flex-1 min-w-0" onClick={() => router.push(`/projects/${p.id}`)}>
                    <h3 className="font-bold text-sm truncate" style={{ color: 'var(--primary)' }}>{p.name}</h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {p.config.productName && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                          {p.config.productName}
                        </span>
                      )}
                      {p.script && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                          📝 スクリプト済
                        </span>
                      )}
                      {p.sessions.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
                          📊 分析 {p.sessions.length}件
                          {p.sessions.filter(s => s.feedback).length > 0 && (
                            <>（{(() => {
                              const analyzed = p.sessions.filter(s => s.feedback);
                              const avgScore = Math.round(analyzed.reduce((sum, s) => sum + (s.feedback?.overallScore || 0), 0) / analyzed.length);
                              return `平均${avgScore}点`;
                            })()}）</>
                          )}
                        </span>
                      )}
                      {p.sessions.length > 0 && (
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>
                          {(() => {
                            const closed = p.sessions.filter(s => s.result === 'closed').length;
                            const total = p.sessions.length;
                            return `成約 ${closed}/${total}件`;
                          })()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => router.push(`/projects/${p.id}?tab=config`)}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors hover:opacity-80 flex items-center gap-1"
                      style={{ background: '#F0F4FF', color: 'var(--primary)' }}
                    >
                      <span className="text-sm">⚙️</span> 設定
                    </button>
                    <button
                      onClick={() => router.push(`/projects/${p.id}?tab=script`)}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors hover:opacity-80 flex items-center gap-1"
                      style={{ background: '#EFF6FF', color: '#2563EB' }}
                    >
                      <span className="text-sm">📝</span> スクリプト
                    </button>
                    <button
                      onClick={() => router.push(`/projects/${p.id}?tab=objections`)}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors hover:opacity-80 flex items-center gap-1"
                      style={{ background: '#FEF3C7', color: '#B45309' }}
                    >
                      <span className="text-sm">🛡️</span> 反論辞典
                    </button>
                    <button
                      onClick={() => router.push(`/projects/${p.id}?tab=sessions`)}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors hover:opacity-80 flex items-center gap-1"
                      style={{ background: '#F5F3FF', color: '#7C3AED' }}
                    >
                      <span className="text-sm">📊</span> 分析
                    </button>
                    <span className="text-xs ml-1" style={{ color: 'var(--muted)' }}>
                      {new Date(p.updatedAt).toLocaleDateString('ja-JP')}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(p.id, p.name); }}
                      className="text-xs px-2 py-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
