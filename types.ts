export enum AppMode {
  OBJECT_RECOGNITION = 'OBJECT_RECOGNITION',
  TEXT_READING = 'TEXT_READING',
  SAFE_MODE = 'SAFE_MODE',
  LIVE_ASSISTANT = 'LIVE_ASSISTANT',
}

export interface AnalysisResult {
  text: string;
  timestamp: number;
}

export enum TTSVoice {
  KORE = 'Kore',
  PUCK = 'Puck',
  CHARON = 'Charon',
  FENRIR = 'Fenrir',
  ZEPHYR = 'Zephyr',
}

export type Language = 'English' | 'Hindi' | 'Marathi' | 'Spanish' | 'French';

export interface CameraDevice {
  deviceId: string;
  label: string;
}

export interface AppSettings {
  speechRate: number; // 0.5 to 2.0, default 1.0
  voicePitch: number; // -12 to 12 semitones, default 0
}
