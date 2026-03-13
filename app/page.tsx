'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { listProjects, createProject, deleteProject } from './lib/store';
import { ConsultationProject } from './lib/types';

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<ConsultationProject[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    setProjects(listProjects());
  }, []);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const p = createProject(newName.trim());
    router.push(`/projects/${p.id}`);
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
          <button
            onClick={() => setShowNew(true)}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all hover:opacity-90"
            style={{ background: 'var(--primary)' }}
          >
            + 新しいプロジェクト
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* New project modal */}
        {showNew && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowNew(false)}>
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--primary)' }}>新しいプロジェクト</h2>
              <input
                type="text"
                placeholder="例：コーチングプログラム個別相談"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: 'var(--border)' }}
                autoFocus
              />
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowNew(false)} className="flex-1 px-4 py-2.5 text-sm border rounded-lg" style={{ borderColor: 'var(--border)' }}>
                  キャンセル
                </button>
                <button onClick={handleCreate} className="flex-1 px-4 py-2.5 text-sm text-white rounded-lg font-medium" style={{ background: 'var(--primary)' }}>
                  作成
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Projects list */}
        {projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🎯</div>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--primary)' }}>個別相談の成約率を最大化しよう</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
              AIがスクリプト設計・商談分析・改善提案をサポートします
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
              <div className="p-4 rounded-xl border text-left" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                <div className="text-2xl mb-2">📝</div>
                <h3 className="text-sm font-bold mb-1">スクリプト設計</h3>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>商品情報を入力するだけで、成約率の高い相談スクリプトを自動生成</p>
              </div>
              <div className="p-4 rounded-xl border text-left" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                <div className="text-2xl mb-2">📊</div>
                <h3 className="text-sm font-bold mb-1">商談分析</h3>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>商談の文字起こしをAIが分析し、改善点と次のアクションを提案</p>
              </div>
            </div>
            <button
              onClick={() => setShowNew(true)}
              className="px-6 py-3 text-sm font-medium text-white rounded-lg transition-all hover:opacity-90"
              style={{ background: 'var(--primary)' }}
            >
              最初のプロジェクトを作成
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map(p => (
              <div
                key={p.id}
                onClick={() => router.push(`/projects/${p.id}`)}
                className="flex items-center justify-between p-5 rounded-xl border cursor-pointer transition-all hover:shadow-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
              >
                <div className="flex-1 min-w-0">
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
        )}
      </main>
    </div>
  );
}
