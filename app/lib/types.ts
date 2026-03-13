// ===== 個別相談プロジェクト =====
export interface ConsultationProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  // 商品・サービス情報
  config: ConsultationConfig;
  // スクリプト
  script: ConsultationScript | null;
  // 反論切り返し辞典
  objectionDictionary: ObjectionDictionary | null;
  // 商談記録
  sessions: ConsultationSession[];
}

export interface ConsultationConfig {
  // 基本情報
  productName: string;
  productPrice: string;
  productDescription: string;
  productBenefits: string;
  targetAudience: string;
  // 相談形式
  consultationType: 'online' | 'offline' | 'phone';
  consultationDuration: string; // 分
  // 競合・差別化
  competitors: string;
  differentiators: string;
  // よくある断り文句
  commonObjections: string;
  // 成約条件
  closingConditions: string;
  // 事前教育レベル
  preEducationLevel: 'full' | 'partial' | 'none';
  preEducationDetail: string;
  // ゴール
  goalType: 'direct_sale' | 'next_step' | 'contract';
  goalDescription: string;
}

// ===== スクリプト =====
export interface ConsultationScript {
  generatedAt: string;
  phases: ScriptPhase[];
}

export interface ScriptPhase {
  id: string;
  phase: PhaseType;
  label: string;
  duration: number; // 分
  purpose: string;
  steps: ScriptStep[];
}

export type PhaseType =
  | 'opening'        // アイスブレイク・ラポール構築
  | 'hearing'        // ヒアリング・課題抽出
  | 'deepening'      // 課題の深掘り・痛みの明確化
  | 'vision'         // 理想の未来を描く
  | 'presentation'   // 解決策の提示
  | 'proof'          // 実績・社会的証明
  | 'offer'          // オファー・価格提示
  | 'objection'      // 反論処理
  | 'closing';       // クロージング

export const PHASE_META: Record<PhaseType, { label: string; icon: string; color: string; defaultDuration: number }> = {
  opening:      { label: 'アイスブレイク', icon: '👋', color: '#4ECDC4', defaultDuration: 5 },
  hearing:      { label: 'ヒアリング', icon: '👂', color: '#45B7D1', defaultDuration: 10 },
  deepening:    { label: '課題の深掘り', icon: '🔍', color: '#96CEB4', defaultDuration: 10 },
  vision:       { label: '理想の未来', icon: '✨', color: '#FFEAA7', defaultDuration: 5 },
  presentation: { label: '解決策の提示', icon: '💡', color: '#DDA0DD', defaultDuration: 10 },
  proof:        { label: '実績・証明', icon: '📊', color: '#98D8C8', defaultDuration: 5 },
  offer:        { label: 'オファー提示', icon: '🎯', color: '#F7DC6F', defaultDuration: 5 },
  objection:    { label: '反論処理', icon: '🛡️', color: '#F0B27A', defaultDuration: 5 },
  closing:      { label: 'クロージング', icon: '🤝', color: '#82E0AA', defaultDuration: 5 },
};

export interface ScriptStep {
  id: string;
  title: string;
  talkScript: string;       // 話す内容（セリフ）
  keyQuestion?: string;     // キー質問
  checkPoint?: string;      // チェックポイント（この反応なら次へ）
  tips?: string;            // コツ・注意点
  transition?: string;      // 次への切り返しフレーズ
}

// ===== 商談セッション（フィードバック用） =====
export interface ConsultationSession {
  id: string;
  date: string;
  clientName: string;
  result: 'closed' | 'lost' | 'pending';
  transcript: string;       // 文字起こしテキスト
  videoUrl?: string;         // 動画URL（任意）
  feedback: SessionFeedback | null;
}

export interface SessionFeedback {
  generatedAt: string;
  overallScore: number;      // 100点満点
  summary: string;           // 総評
  strengths: FeedbackItem[];  // 良かった点
  improvements: FeedbackItem[]; // 改善点
  missedOpportunities: FeedbackItem[]; // 見逃した機会
  phaseAnalysis: PhaseAnalysis[];
  nextActions: string[];      // 次回のアクション
  closingProbability: number; // 成約確率（%）
  lostReason?: string;        // 失注要因（resultがlostの場合）
}

export interface FeedbackItem {
  point: string;
  detail: string;
  timestamp?: string;        // 該当箇所の目安
  severity: 'high' | 'medium' | 'low';
  actionScript?: string;     // 次回使える具体的なセリフ例
}

export interface PhaseAnalysis {
  phase: string;
  score: number;
  comment: string;
  suggestion: string;
}

// ===== 反論切り返し辞典 =====
export interface ObjectionDictionary {
  generatedAt: string;
  objections: ObjectionEntry[];
  principles: string[];
}

export interface ObjectionEntry {
  id: string;
  category: string;
  categoryIcon: string;
  objection: string;
  psychology: string;
  responses: ObjectionResponse[];
  ngPhrases: NgPhrase[];
  doNot: string;
  followUp: string;
  severity: 'high' | 'medium' | 'low';
}

export interface NgPhrase {
  phrase: string;
  reason: string;
}

export interface ObjectionResponse {
  situation: string;
  script: string;
  tone: string;
}
