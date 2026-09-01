export type WorkspaceTab = 'orchestra' | 'models' | 'runs' | 'files' | 'settings' | 'usage';

export type WorkspaceDensity = 'compact' | 'comfortable' | 'spacious';

export type CouncilMode = 'single' | 'multi' | 'deep' | 'auto';

export type PresetColor = 'white' | 'blue' | 'purple' | 'cyan' | 'green' | 'orange' | 'red';
export type MovementMode = 'subtle' | 'smooth' | 'dynamic' | 'cinematic' | 'extreme';
export type GlowStyle = 'none' | 'static' | 'breathing' | 'pulse' | 'flow' | 'scan' | 'orbit' | 'aurora';
export type ConnectionStyle = 'none' | 'flow' | 'pulse' | 'particle_flow';
export type BackgroundMotion = 'off' | 'subtle' | 'medium' | 'dynamic';
export type ToastPosition = 'bottom-right' | 'top-right' | 'bottom-left';

export type AgentRole = 
  | 'Solver' 
  | 'Independent Solver' 
  | 'Alternative Solver' 
  | 'Critic' 
  | 'Fact Checker' 
  | 'Code Reviewer' 
  | 'Mathematical Verifier' 
  | 'Edge Case Specialist'
  | 'Refinement Specialist'
  | 'Synthesizer' 
  | 'Executive Synthesizer';

export interface AgentRunDetails {
  agentId: string;
  modelName: string;
  role: AgentRole;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  executionTimeSec?: number;
  resultSummary?: string;
  error?: string;
}

export interface PanelConfig {
  agentActivity: boolean;
  executionGraph: boolean;
  modelCouncil: boolean;
  runDetails: boolean;
  sources: boolean;
  files: boolean;
  systemStatus: boolean;
}

export interface EffectsConfig {
  enableGlow: boolean;
  enableAnimations: boolean;
  enableToasts: boolean;
  reduceMotion: boolean;
  presetColorName: PresetColor;
  colorPreset?: PresetColor;
  accentColor: string; // e.g. '#ffffff', '#3b82f6'
  glowIntensity: number; // 0 - 100
  glowRadius: number; // 4 - 24
  animationSpeed: number; // 0.5 - 2.0
  connectionSpeed: number; // 0.5 - 2.0
  particleDensity: 'low' | 'medium' | 'high';
  movementMode: MovementMode;
  glowStyle: GlowStyle;
  connectionStyle: ConnectionStyle;
  backgroundMotion: BackgroundMotion;
  extremeVisualMode: boolean;
  toastPosition: ToastPosition;
}

export interface AgentToast {
  id: string;
  agentName: string;
  message: string;
  status: 'info' | 'active' | 'success' | 'failed';
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: number;
}

export interface StepLog {
  step: 'analysis' | 'research' | 'parallel_execution' | 'sandbox' | 'critic' | 'refinement' | 'synthesizing';
  status: 'pending' | 'running' | 'completed' | 'failed';
  message: string;
  data?: any;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  models_used?: string[];
  step_logs?: StepLog[];
  cost?: number;
  timestamp: number;
}

export interface HardwareInfo {
  totalRamGB: number;
  cpuCores: number;
  cpuModel: string;
  gpuDetected: boolean;
  gpuName: string;
  gpuVramGB: number;
  recommendedModelSize: string;
  recommendations: string[];
}

export interface RunItem {
  id: string;
  timestamp: number;
  query: string;
  status: 'Completed' | 'Failed';
  durationSec: number;
  modelsCount: number;
  verificationPasses: number;
  tokens: number;
}

