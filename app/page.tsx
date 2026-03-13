'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { listProjects, createProject, deleteProject } from './lib/store';
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

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    deleteProject(id);
    setProjects(listProjects());
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
              商品情報を入力するだけで、ゆきこ式メソッドに基づいた成約率80-90%の相談スクリプトを自動生成
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
                    <div className="flex items-center gap-3 mt-1.5">
                      {p.config.productName && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                          {p.config.productName}
                        </span>
                      )}
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>
                        {p.script ? 'スクリプト作成済み' : '未作成'}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>
                        商談記録: {p.sessions.length}件
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => router.push(`/projects/${p.id}?tab=config`)}
                      className="text-xs px-2.5 py-1.5 rounded-lg transition-colors hover:opacity-80"
                      style={{ background: `var(--primary)15`, color: 'var(--primary)' }}
                      title="設定"
                    >
                      ⚙️
                    </button>
                    <button
                      onClick={() => router.push(`/projects/${p.id}?tab=script`)}
                      className="text-xs px-2.5 py-1.5 rounded-lg transition-colors hover:opacity-80"
                      style={{ background: `var(--primary)15`, color: 'var(--primary)' }}
                      title="スクリプト"
                    >
                      📝
                    </button>
                    <button
                      onClick={() => router.push(`/projects/${p.id}?tab=sessions`)}
                      className="text-xs px-2.5 py-1.5 rounded-lg transition-colors hover:opacity-80"
                      style={{ background: `var(--accent)15`, color: 'var(--accent)' }}
                      title="商談分析"
                    >
                      📊
                    </button>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>
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
