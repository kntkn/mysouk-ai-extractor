// Notion Database Schema Types
export interface NotionPropertySchema {
  物件名: string;
  サムネイル: File[];
  マイソク原本PDF: File[];
  物件写真アーカイブ: File[];
  物件種別: '賃貸マンション' | 'アパート' | '戸建' | 'テラスハウス' | '店舗/事務所';
  所在地: string;
  最寄り駅1: string;
  駅1徒歩分: number;
  最寄り駅2: string;
  間取り: '1K' | '1R' | '1DK' | '1LDK' | '2K' | '2DK' | '2LDK' | '3LDK以上';
  専有面積: number;
  築年月: string;
  構造: 'RC（鉄筋コンクリート）' | 'SRC（鉄骨鉄筋）' | '鉄骨造' | '木造';
  向き: '南' | '南東' | '南西' | '東' | '西' | '北';
  所在階建: string;
  賃料: number;
  管理費共益費: number;
  敷金月数: number;
  礼金月数: number;
  敷金礼金備考: string;
  鍵交換費用: number;
  火災保険料: number;
  その他初期費用合計: number;
  契約形態: '普通借家契約' | '定期借家契約';
  契約期間: string;
  更新料: string;
  保証会社条件: string;
  入居時期: string;
  設備タグ: string[];
  取引態様: '貸主' | '代理' | '専任媒介' | '一般媒介';
  AD: 'なし' | '0.5ヶ月' | '1ヶ月' | '100%' | '200%';
  管理会社元付業者名: string;
  業者電話番号: string;
  ステータス: '検討中' | '資料請求済' | '内見予約中' | '内見済' | '申込済' | '却下';
}

// Extraction Pipeline Types
export interface ExtractionResult<T = any> {
  value: T;
  confidence: number; // 0-1
  evidence: {
    pageIndex: number;
    snippet: string;
  };
}

export interface PropertyListing {
  [K in keyof NotionPropertySchema]: ExtractionResult<NotionPropertySchema[K]>;
}

export interface ListingCandidate {
  pageIndex: number;
  物件名: string;
  所在地: string;
  賃料: number;
  listingKey: string; // For deduplication
}

export interface ProcessingStep {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number; // 0-100
  details?: string;
  evidence?: string;
  startTime?: number;
  endTime?: number;
}

export interface ProcessingSession {
  id: string;
  steps: ProcessingStep[];
  files: ProcessedFile[];
  listings: PropertyListing[];
  status: 'uploading' | 'processing' | 'completed' | 'error';
  startTime: number;
  endTime?: number;
  reportUrl?: string;
  reportFileName?: string;
}

export interface ProcessedFile {
  id: string;
  name: string;
  url: string;
  pages: number;
  candidates: ListingCandidate[];
  images: ExtractedImage[];
}

export interface ExtractedImage {
  id: string;
  url: string;
  type: 'floorplan' | 'exterior' | 'interior' | 'bath' | 'kitchen' | 'view' | 'map' | 'logo' | 'other';
  confidence: number;
  pageIndex: number;
  bounds?: { x: number; y: number; width: number; height: number };
}

// UI Component Types
export interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export interface ProgressBarProps {
  steps: ProcessingStep[];
  currentStep?: string;
}

export interface StreamingLogProps {
  logs: LogEntry[];
  autoScroll?: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  details?: any;
}

// API Types
export interface UploadResponse {
  success: boolean;
  sessionId: string;
  files: ProcessedFile[];
  message?: string;
}

export interface ProcessResponse {
  success: boolean;
  sessionId: string;
  step: string;
  progress: number;
  data?: any;
  error?: string;
}

export interface NotionPageCreationResult {
  success: boolean;
  pageUrl: string;
  pageId: string;
  error?: string;
}