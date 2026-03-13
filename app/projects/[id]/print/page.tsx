'use client';

import { useEffect, useState, use, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getProject } from '../../../lib/store';
import { ConsultationProject, PHASE_META, PhaseType } from '../../../lib/types';

export default function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-gray-400">読み込み中...</div>}>
      <PrintPageInner params={params} />
    </Suspense>
  );
}

function PrintPageInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') as 'script' | 'analysis';
  const sessionId = searchParams.get('session');
  const [project, setProject] = useState<ConsultationProject | null>(null);

  useEffect(() => {
    const p = getProject(id);
    if (p) setProject(p);
  }, [id]);

  useEffect(() => {
    if (project) {
      // Auto-trigger print after render
      const timer = setTimeout(() => window.print(), 600);
      return () => clearTimeout(timer);
    }
  }, [project]);

  if (!project) return null;

  const session = sessionId ? project.sessions.find(s => s.id === sessionId) : null;

  if (mode === 'analysis' && session?.feedback) {
    return <AnalysisPDF project={project} session={session} />;
  }

  if (mode === 'script' && project.script) {
    return <ScriptPDF project={project} />;
  }

  return <div className="p-10 text-center">データが見つかりません</div>;
}

// ===== Script PDF =====
function ScriptPDF({ project }: { project: ConsultationProject }) {
  const script = project.script!;
  const totalDuration = script.phases.reduce((sum, p) => sum + p.duration, 0);

  return (
    <div className="print-page">
      <style>{printStyles}</style>

      {/* Cover */}
      <div className="cover-page">
        <div className="cover-accent" />
        <div className="cover-content">
          <p className="cover-label">個別相談スクリプト</p>
          <h1 className="cover-title">{project.config.productName || project.name}</h1>
          <div className="cover-meta">
            {project.config.targetAudience && (
              <p>対象: {project.config.targetAudience}</p>
            )}
            <p>所要時間: {totalDuration}分</p>
            <p>作成日: {new Date(script.generatedAt).toLocaleDateString('ja-JP')}</p>
          </div>
        </div>
        <div className="cover-footer">
          <p>Confidential — {project.name}</p>
        </div>
      </div>

      {/* Timeline Overview */}
      <div className="page">
        <h2 className="section-title">全体フロー</h2>
        <div className="timeline">
          {script.phases.map((phase, i) => {
            const meta = PHASE_META[phase.phase as PhaseType];
            return (
              <div key={phase.id} className="timeline-item">
                <div className="timeline-number">{i + 1}</div>
                <div className="timeline-body">
                  <div className="timeline-header">
                    <span className="timeline-icon">{meta?.icon}</span>
                    <strong>{phase.label}</strong>
                    <span className="timeline-duration">{phase.duration}分</span>
                  </div>
                  <p className="timeline-purpose">{phase.purpose}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Phase Details */}
      {script.phases.map((phase, pi) => {
        const meta = PHASE_META[phase.phase as PhaseType];
        return (
          <div key={phase.id} className="page phase-page">
            <div className="phase-header" style={{ borderLeftColor: meta?.color || '#ccc' }}>
              <div className="phase-header-top">
                <span className="phase-icon">{meta?.icon}</span>
                <div>
                  <h2 className="phase-title">
                    Phase {pi + 1}: {phase.label}
                  </h2>
                  <p className="phase-purpose">{phase.purpose}</p>
                </div>
                <span className="phase-duration">{phase.duration}分</span>
              </div>
            </div>

            {phase.steps.map((step, si) => (
              <div key={step.id} className="step">
                <div className="step-number" style={{ background: meta?.color || '#ccc' }}>
                  {si + 1}
                </div>
                <div className="step-body">
                  <h3 className="step-title">{step.title}</h3>
                  <div className="step-script">{step.talkScript}</div>

                  <div className="step-meta-grid">
                    {step.keyQuestion && (
                      <div className="step-meta step-meta-question">
                        <span className="step-meta-label">Key Question</span>
                        <p>{step.keyQuestion}</p>
                      </div>
                    )}
                    {step.checkPoint && (
                      <div className="step-meta step-meta-check">
                        <span className="step-meta-label">Next Signal</span>
                        <p>{step.checkPoint}</p>
                      </div>
                    )}
                    {step.tips && (
                      <div className="step-meta step-meta-tips">
                        <span className="step-meta-label">Tips</span>
                        <p>{step.tips}</p>
                      </div>
                    )}
                    {step.transition && (
                      <div className="step-meta step-meta-transition">
                        <span className="step-meta-label">Transition</span>
                        <p>{step.transition}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ===== Analysis PDF =====
function AnalysisPDF({ project, session }: { project: ConsultationProject; session: ConsultationProject['sessions'][0] }) {
  const fb = session.feedback!;

  const scoreColor = fb.overallScore >= 80 ? '#27AE60' : fb.overallScore >= 60 ? '#F39C12' : '#E74C3C';

  return (
    <div className="print-page">
      <style>{printStyles}</style>

      {/* Cover */}
      <div className="cover-page cover-analysis">
        <div className="cover-accent cover-accent-analysis" />
        <div className="cover-content">
          <p className="cover-label">商談分析レポート</p>
          <h1 className="cover-title">{session.clientName}</h1>
          <div className="cover-meta">
            <p>商品: {project.config.productName || '—'}</p>
            <p>結果: {session.result === 'closed' ? '成約' : session.result === 'lost' ? '失注' : '保留'}</p>
            <p>分析日: {fb.generatedAt ? new Date(fb.generatedAt).toLocaleDateString('ja-JP') : '—'}</p>
          </div>
        </div>
        <div className="cover-footer">
          <p>Confidential — {project.name}</p>
        </div>
      </div>

      {/* Score Overview */}
      <div className="page">
        <h2 className="section-title">総合評価</h2>

        <div className="score-hero">
          <div className="score-circle" style={{ borderColor: scoreColor, color: scoreColor }}>
            {fb.overallScore}
          </div>
          <div className="score-summary">
            <p className="score-text">{fb.summary}</p>
            {fb.lostReason && (
              <div className="lost-reason">
                <strong>失注要因:</strong> {fb.lostReason}
              </div>
            )}
            <div className="score-stats">
              <div className="stat">
                <span className="stat-label">成約確率</span>
                <span className="stat-value">{fb.closingProbability}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Phase Analysis */}
        {fb.phaseAnalysis.length > 0 && (
          <>
            <h2 className="section-title mt-section">フェーズ別評価</h2>
            <div className="phase-grid">
              {fb.phaseAnalysis.map((pa, i) => (
                <div key={i} className="phase-card">
                  <div className="phase-card-header">
                    <span>{pa.phase}</span>
                    <span className="phase-card-score" style={{
                      color: pa.score >= 80 ? '#27AE60' : pa.score >= 60 ? '#F39C12' : '#E74C3C'
                    }}>{pa.score}</span>
                  </div>
                  <p className="phase-card-comment">{pa.comment}</p>
                  {pa.suggestion && <p className="phase-card-suggest">{pa.suggestion}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Strengths */}
      {fb.strengths.length > 0 && (
        <div className="page">
          <h2 className="section-title section-green">良かった点</h2>
          {fb.strengths.map((item, i) => (
            <div key={i} className="feedback-card feedback-green">
              <h3>{item.point}</h3>
              <p>{item.detail}</p>
              {item.timestamp && <p className="feedback-quote">「{item.timestamp}」</p>}
            </div>
          ))}
        </div>
      )}

      {/* Improvements */}
      {fb.improvements.length > 0 && (
        <div className="page">
          <h2 className="section-title section-orange">改善点 ＆ 実践アクション</h2>
          {fb.improvements.map((item, i) => (
            <div key={i} className="feedback-card feedback-orange">
              <div className="feedback-header">
                <span className={`severity severity-${item.severity}`}>
                  {item.severity === 'high' ? '重要' : item.severity === 'medium' ? '中' : '低'}
                </span>
                <h3>{item.point}</h3>
              </div>
              <p>{item.detail}</p>
              {item.timestamp && <p className="feedback-quote">「{item.timestamp}」</p>}
              {item.actionScript && (
                <div className="action-script">
                  <p className="action-label">次回使えるセリフ</p>
                  <p className="action-text">{item.actionScript}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Missed Opportunities */}
      {fb.missedOpportunities.length > 0 && (
        <div className="page">
          <h2 className="section-title section-purple">見逃した機会</h2>
          {fb.missedOpportunities.map((item, i) => (
            <div key={i} className="feedback-card feedback-purple">
              <h3>{item.point}</h3>
              <p>{item.detail}</p>
              {item.timestamp && <p className="feedback-quote">「{item.timestamp}」</p>}
              {item.actionScript && (
                <div className="action-script action-script-purple">
                  <p className="action-label">こう言えばよかった</p>
                  <p className="action-text">{item.actionScript}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Next Actions */}
      {fb.nextActions.length > 0 && (
        <div className="page">
          <h2 className="section-title">次回のアクションプラン</h2>
          <div className="actions-list">
            {fb.nextActions.map((action, i) => (
              <div key={i} className="action-item">
                <span className="action-number">{i + 1}</span>
                <p>{action}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Print Styles =====
const printStyles = `
  @page {
    size: A4;
    margin: 0;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #1A1A1A;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .print-page {
    width: 210mm;
    margin: 0 auto;
  }

  /* Cover */
  .cover-page {
    height: 297mm;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
    background: linear-gradient(135deg, #2C3E50 0%, #34495E 100%);
    color: white;
    page-break-after: always;
  }
  .cover-analysis {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  }
  .cover-accent {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 8px;
    background: linear-gradient(90deg, #E74C3C, #F39C12, #27AE60);
  }
  .cover-accent-analysis {
    background: linear-gradient(90deg, #6C5CE7, #A29BFE, #FD79A8);
  }
  .cover-content {
    text-align: center;
    padding: 0 40mm;
  }
  .cover-label {
    font-size: 14px;
    letter-spacing: 4px;
    text-transform: uppercase;
    opacity: 0.7;
    margin-bottom: 16px;
  }
  .cover-title {
    font-size: 32px;
    font-weight: 700;
    line-height: 1.3;
    margin: 0 0 24px 0;
  }
  .cover-meta {
    font-size: 13px;
    opacity: 0.8;
    line-height: 2;
  }
  .cover-footer {
    position: absolute;
    bottom: 30px;
    font-size: 10px;
    opacity: 0.5;
  }

  /* Pages */
  .page {
    padding: 20mm 25mm;
    page-break-after: always;
    min-height: 257mm;
  }
  .phase-page {
    page-break-inside: avoid;
  }

  /* Section titles */
  .section-title {
    font-size: 18px;
    font-weight: 700;
    color: #2C3E50;
    margin: 0 0 20px 0;
    padding-bottom: 8px;
    border-bottom: 3px solid #2C3E50;
  }
  .section-green { border-color: #27AE60; color: #27AE60; }
  .section-orange { border-color: #E67E22; color: #E67E22; }
  .section-purple { border-color: #8E44AD; color: #8E44AD; }
  .mt-section { margin-top: 30px; }

  /* Timeline */
  .timeline { display: flex; flex-direction: column; gap: 12px; }
  .timeline-item {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }
  .timeline-number {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #2C3E50;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .timeline-body {
    flex: 1;
    padding-bottom: 12px;
    border-bottom: 1px solid #E0DDD5;
  }
  .timeline-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }
  .timeline-icon { font-size: 16px; }
  .timeline-duration {
    margin-left: auto;
    font-size: 12px;
    color: #95A5A6;
    font-weight: 500;
  }
  .timeline-purpose {
    font-size: 11px;
    color: #7F8C8D;
    margin: 4px 0 0 0;
  }

  /* Phase header */
  .phase-header {
    border-left: 5px solid;
    padding: 12px 16px;
    margin-bottom: 20px;
    background: #F8F9FA;
    border-radius: 0 8px 8px 0;
  }
  .phase-header-top {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .phase-icon { font-size: 24px; }
  .phase-title {
    font-size: 16px;
    font-weight: 700;
    margin: 0;
    color: #2C3E50;
  }
  .phase-purpose {
    font-size: 11px;
    color: #7F8C8D;
    margin: 2px 0 0 0;
  }
  .phase-duration {
    margin-left: auto;
    font-size: 13px;
    font-weight: 600;
    color: #95A5A6;
    white-space: nowrap;
  }

  /* Steps */
  .step {
    display: flex;
    gap: 12px;
    margin-bottom: 18px;
    page-break-inside: avoid;
  }
  .step-number {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .step-body { flex: 1; }
  .step-title {
    font-size: 13px;
    font-weight: 700;
    margin: 0 0 6px 0;
    color: #2C3E50;
  }
  .step-script {
    font-size: 12px;
    line-height: 1.7;
    color: #333;
    white-space: pre-wrap;
    margin-bottom: 10px;
  }
  .step-meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .step-meta {
    padding: 8px 10px;
    border-radius: 6px;
    font-size: 11px;
    line-height: 1.5;
  }
  .step-meta-label {
    display: block;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-bottom: 3px;
  }
  .step-meta p { margin: 0; }
  .step-meta-question { background: #E8F4FD; }
  .step-meta-question .step-meta-label { color: #2980B9; }
  .step-meta-check { background: #E8F8F0; }
  .step-meta-check .step-meta-label { color: #27AE60; }
  .step-meta-tips { background: #FFF8E1; }
  .step-meta-tips .step-meta-label { color: #F39C12; }
  .step-meta-transition { background: #F3E8FF; }
  .step-meta-transition .step-meta-label { color: #8E44AD; }

  /* Score */
  .score-hero {
    display: flex;
    align-items: flex-start;
    gap: 24px;
    margin-bottom: 20px;
  }
  .score-circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 5px solid;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .score-summary { flex: 1; }
  .score-text {
    font-size: 13px;
    line-height: 1.8;
    margin: 0 0 10px 0;
  }
  .lost-reason {
    font-size: 12px;
    background: #FDE8E8;
    color: #C0392B;
    padding: 8px 12px;
    border-radius: 6px;
    margin-bottom: 10px;
  }
  .score-stats { display: flex; gap: 20px; }
  .stat { display: flex; flex-direction: column; }
  .stat-label { font-size: 10px; color: #95A5A6; }
  .stat-value { font-size: 18px; font-weight: 700; color: #2C3E50; }

  /* Phase grid */
  .phase-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
  }
  .phase-card {
    border: 1px solid #E0DDD5;
    border-radius: 8px;
    padding: 10px;
  }
  .phase-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 6px;
  }
  .phase-card-score { font-size: 16px; font-weight: 700; }
  .phase-card-comment { font-size: 10px; color: #7F8C8D; margin: 0; }
  .phase-card-suggest { font-size: 10px; color: #2980B9; margin: 4px 0 0 0; font-style: italic; }

  /* Feedback cards */
  .feedback-card {
    padding: 14px 16px;
    border-radius: 8px;
    margin-bottom: 12px;
    page-break-inside: avoid;
  }
  .feedback-green { background: #E8F8F0; border-left: 4px solid #27AE60; }
  .feedback-orange { background: #FFF3E0; border-left: 4px solid #E67E22; }
  .feedback-purple { background: #F3E8FF; border-left: 4px solid #8E44AD; }
  .feedback-card h3 {
    font-size: 13px;
    font-weight: 700;
    margin: 0 0 4px 0;
    color: #2C3E50;
  }
  .feedback-card p {
    font-size: 12px;
    line-height: 1.6;
    margin: 0;
    color: #555;
  }
  .feedback-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .feedback-quote {
    font-size: 10px;
    color: #999;
    margin-top: 6px !important;
    font-style: italic;
  }

  /* Severity */
  .severity {
    font-size: 9px;
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 600;
  }
  .severity-high { background: #FECACA; color: #DC2626; }
  .severity-medium { background: #FED7AA; color: #EA580C; }
  .severity-low { background: #FEF3C7; color: #CA8A04; }

  /* Action script */
  .action-script {
    margin-top: 10px;
    padding: 10px 14px;
    background: white;
    border: 2px solid #F39C12;
    border-radius: 8px;
  }
  .action-script-purple { border-color: #A855F7; }
  .action-label {
    font-size: 10px;
    font-weight: 700;
    color: #92400E;
    margin: 0 0 4px 0 !important;
  }
  .action-script-purple .action-label { color: #6B21A8; }
  .action-text {
    font-size: 12px;
    color: #333 !important;
    white-space: pre-wrap;
  }

  /* Next actions */
  .actions-list { display: flex; flex-direction: column; gap: 10px; }
  .action-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 16px;
    background: #F0F7FF;
    border-radius: 8px;
    border-left: 4px solid #3B82F6;
  }
  .action-number {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #3B82F6;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .action-item p {
    font-size: 13px;
    margin: 0;
    line-height: 1.6;
  }

  /* Print-specific */
  @media print {
    .print-page { width: 100%; }
    .page { padding: 15mm 20mm; }
    .cover-page { height: 100vh; }
  }

  /* Screen preview */
  @media screen {
    body { background: #E5E5E5; }
    .print-page {
      max-width: 210mm;
      margin: 0 auto;
      background: white;
      box-shadow: 0 2px 20px rgba(0,0,0,0.1);
    }
  }
`;
