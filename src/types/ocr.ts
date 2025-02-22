export type OCRLanguage = 'en' | 'es' | 'fr' | 'de' | 'it' | string;

export interface OCRResult {
  text: string;
  confidence: number;
  isHandwritten?: boolean;
  hasTable?: boolean;
  language: OCRLanguage;
}

export interface OCROptions {
  language?: OCRLanguage;
  detectTables?: boolean;
  detectHandwriting?: boolean;
  useCache?: boolean;
} 