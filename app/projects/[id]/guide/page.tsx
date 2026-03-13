'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getProject } from '../../../lib/store';
import { ConsultationProject, PHASE_META, PhaseType, ScriptPhase, ScriptStep } from '../../../lib/types';

export default function GuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<ConsultationProject | null>(null);
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showAllPhases, setShowAllPhases] = useState(false);

  useEffect(() => {
    const p = getProject(id);
    if (!p || !p.script) { router.push(`/projects/${id}?tab=script`); return; }
    setProject(p);
  }, [id, router]);

  // Timer
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const phases = project?.script?.phases || [];
  const currentPhase: ScriptPhase | undefined = phases[currentPhaseIdx];
  const currentStep: ScriptStep | undefined = currentPhase?.steps[currentStepIdx];
  const totalSteps = phases.reduce((sum, p) => sum + p.steps.length, 0);

  // Calculate current global step number
  let globalStepNum = 0;
  for (let i = 0; i < currentPhaseIdx; i++) {
    globalStepNum += phases[i].steps.length;
  }
  globalStepNum += currentStepIdx + 1;

  const goNext = useCallback(() => {
    if (!currentPhase) return;
    if (currentStepIdx < currentPhase.steps.length - 1) {
      setCurrentStepIdx(s => s + 1);
    } else if (currentPhaseIdx < phases.length - 1) {
      setCurrentPhaseIdx(p => p + 1);
      setCurrentStepIdx(0);
    }
  }, [currentPhase, currentStepIdx, currentPhaseIdx, phases.length]);

  const goPrev = useCallback(() => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(s => s - 1);
    } else if (currentPhaseIdx > 0) {
      const prevPhase = phases[currentPhaseIdx - 1];
      setCurrentPhaseIdx(p => p - 1);
      setCurrentStepIdx(prevPhase.steps.length - 1);
    }
  }, [currentStepIdx, currentPhaseIdx, phases]);

  const jumpToPhase = (phaseIdx: number) => {
    setCurrentPhaseIdx(phaseIdx);
    setCurrentStepIdx(0);
    setShowAllPhases(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      if (e.key === 't') { setTimerRunning(r => !r); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev]);

  if (!project || !project.script || !currentPhase || !currentStep) return null;

  const meta = PHASE_META[currentPhase.phase as PhaseType];
  const isFirst = currentPhaseIdx === 0 && currentStepIdx === 0;
  const isLast = currentPhaseIdx === phases.length - 1 && currentStepIdx === currentPhase.steps.length - 1;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // Cumulative time target for current phase
  let phaseTimeTarget = 0;
  for (let i = 0; i <= currentPhaseIdx; i++) {
    phaseTimeTarget += phases[i].duration;
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: '#1a1a2e', color: '#eee' }}>
      {/* Top bar - compact */}
      <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: '#333', background: '#16162a' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/projects/${id}?tab=script`)}
            className="text-xs hover:opacity-70"
            style={{ color: '#888' }}
          >
            ← 戻る
          </button>
          <span className="text-xs font-medium truncate max-w-[200px]" style={{ color: '#aaa' }}>
            {project.name}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {/* Timer */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTimerRunning(r => !r)}
              className="text-xs px-2 py-1 rounded"
              style={{ background: timerRunning ? '#ef444440' : '#33333380', color: timerRunning ? '#ef4444' : '#888' }}
            >
              {timerRunning ? '⏸' : '▶'}
            </button>
            <span className="text-sm font-mono font-bold" style={{ color: timerRunning ? '#fff' : '#666' }}>
              {formatTime(elapsedSeconds)}
            </span>
            <span className="text-[10px]" style={{ color: '#666' }}>
              / 目安 {phaseTimeTarget}分
            </span>
            {elapsedSeconds > 0 && (
              <button
                onClick={() => { setElapsedSeconds(0); setTimerRunning(false); }}
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ color: '#666' }}
              >
                リセット
              </button>
            )}
          </div>
          {/* Progress */}
          <span className="text-xs" style={{ color: '#888' }}>
            {globalStepNum} / {totalSteps} ステップ
          </span>
          {/* Keyboard hint */}
          <span className="text-[10px] hidden md:block" style={{ color: '#555' }}>
            ← → キーで移動 ｜ T でタイマー
          </span>
        </div>
      </div>

      {/* Phase overview toggle */}
      {showAllPhases && (
        <div className="px-4 py-3 border-b overflow-x-auto" style={{ borderColor: '#333', background: '#16162a' }}>
          <div className="flex gap-2">
            {phases.map((phase, i) => {
              const pMeta = PHASE_META[phase.phase as PhaseType];
              const isActive = i === currentPhaseIdx;
              const isDone = i < currentPhaseIdx;
              return (
                <button
                  key={phase.id}
                  onClick={() => jumpToPhase(i)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
                  style={{
                    background: isActive ? `${pMeta?.color || '#555'}40` : isDone ? '#1a3a1a' : '#222',
                    color: isActive ? '#fff' : isDone ? '#4ade80' : '#888',
                    border: isActive ? `2px solid ${pMeta?.color || '#555'}` : '2px solid transparent',
                  }}
                >
                  <span>{isDone ? '✓' : pMeta?.icon}</span>
                  <span>{phase.label}</span>
                  <span className="text-[10px] opacity-60">{phase.duration}分</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Phase progress bar */}
      <div className="flex items-center gap-0" style={{ background: '#111' }}>
        {phases.map((phase, i) => {
          const pMeta = PHASE_META[phase.phase as PhaseType];
          const isActive = i === currentPhaseIdx;
          const isDone = i < currentPhaseIdx;
          return (
            <button
              key={phase.id}
              onClick={() => jumpToPhase(i)}
              className="flex-1 py-1.5 text-center transition-all relative"
              style={{
                background: isActive ? `${pMeta?.color || '#555'}30` : isDone ? '#1a2a1a' : 'transparent',
                borderBottom: isActive ? `3px solid ${pMeta?.color || '#555'}` : '3px solid transparent',
              }}
            >
              <span className="text-[10px] font-medium" style={{ color: isActive ? '#fff' : isDone ? '#4ade80' : '#555' }}>
                {pMeta?.icon} {phase.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="max-w-2xl mx-auto">
          {/* Phase & step header */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{meta?.icon}</span>
            <div>
              <h2 className="text-lg font-bold" style={{ color: meta?.color || '#fff' }}>
                {currentPhase.label}
              </h2>
              <p className="text-xs" style={{ color: '#888' }}>
                {currentPhase.purpose} ｜ 目安 {currentPhase.duration}分
              </p>
            </div>
            <button
              onClick={() => setShowAllPhases(v => !v)}
              className="ml-auto text-xs px-2 py-1 rounded"
              style={{ background: '#333', color: '#888' }}
            >
              全フェーズ
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex gap-1.5 mb-5">
            {currentPhase.steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStepIdx(i)}
                className="h-1.5 rounded-full flex-1 transition-all"
                style={{
                  background: i === currentStepIdx ? (meta?.color || '#fff') : i < currentStepIdx ? '#4ade80' : '#333',
                }}
              />
            ))}
          </div>

          {/* Step title */}
          <div className="flex items-center gap-3 mb-4">
            <span
              className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold"
              style={{ background: `${meta?.color || '#555'}40`, color: meta?.color || '#fff' }}
            >
              {currentStepIdx + 1}
            </span>
            <h3 className="text-base font-bold" style={{ color: '#fff' }}>
              {currentStep.title}
            </h3>
          </div>

          {/* Talk script - the main content, large and readable */}
          <div
            className="p-5 rounded-xl mb-4 text-base leading-relaxed whitespace-pre-wrap"
            style={{ background: '#222', color: '#f0f0f0', lineHeight: '1.8' }}
          >
            {currentStep.talkScript}
          </div>

          {/* Supporting info in compact cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentStep.keyQuestion && (
              <div className="p-3 rounded-lg" style={{ background: '#1a2a3a' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">❓</span>
                  <span className="text-[10px] font-bold" style={{ color: '#60a5fa' }}>キー質問</span>
                </div>
                <p className="text-sm" style={{ color: '#93c5fd' }}>{currentStep.keyQuestion}</p>
              </div>
            )}
            {currentStep.checkPoint && (
              <div className="p-3 rounded-lg" style={{ background: '#1a2a1a' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">✅</span>
                  <span className="text-[10px] font-bold" style={{ color: '#4ade80' }}>次へ進むサイン</span>
                </div>
                <p className="text-sm" style={{ color: '#86efac' }}>{currentStep.checkPoint}</p>
              </div>
            )}
            {currentStep.tips && (
              <div className="p-3 rounded-lg" style={{ background: '#2a2a1a' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">💡</span>
                  <span className="text-[10px] font-bold" style={{ color: '#fbbf24' }}>コツ</span>
                </div>
                <p className="text-sm" style={{ color: '#fcd34d' }}>{currentStep.tips}</p>
              </div>
            )}
            {currentStep.transition && (
              <div className="p-3 rounded-lg" style={{ background: '#2a1a2a' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">➡️</span>
                  <span className="text-[10px] font-bold" style={{ color: '#c084fc' }}>次への繋ぎ</span>
                </div>
                <p className="text-sm" style={{ color: '#d8b4fe' }}>{currentStep.transition}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom navigation - large touch targets */}
      <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: '#333', background: '#16162a' }}>
        <button
          onClick={goPrev}
          disabled={isFirst}
          className="px-6 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-20"
          style={{ background: '#333', color: '#fff' }}
        >
          ← 前へ
        </button>
        <div className="text-center">
          <span className="text-xs" style={{ color: '#666' }}>
            {currentPhase.label} - ステップ {currentStepIdx + 1}/{currentPhase.steps.length}
          </span>
        </div>
        <button
          onClick={goNext}
          disabled={isLast}
          className="px-6 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-20"
          style={{ background: meta?.color || '#555', color: '#fff' }}
        >
          次へ →
        </button>
      </div>
    </div>
  );
}
