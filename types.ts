export enum ViewMode {
  SPLIT = 'SPLIT',
  UNIFIED = 'UNIFIED',
}

export interface DiffSegment {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export interface DiffLine {
  type: 'added' | 'removed' | 'neutral' | 'empty';
  content: string;
  lineNumberLeft?: number;
  lineNumberRight?: number;
  segments?: DiffSegment[];
}

export interface DiffResult {
  leftLines: DiffLine[];
  rightLines: DiffLine[];
  unifiedLines: DiffLine[];
}

export interface AIAnalysisResult {
  summary: string;
  keyChanges: string[];
}
