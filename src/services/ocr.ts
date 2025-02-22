import { Buffer } from 'buffer';
import * as FileSystem from 'expo-file-system';
import { OCRResult, OCROptions, OCRLanguage } from '../types/ocr';

// Use the environment variable
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY;
const GOOGLE_VISION_API_URL = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;

const CACHE_DIR = `${FileSystem.cacheDirectory}ocr/`;

const ensureCacheDir = async () => {
  const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
};

const getCacheKey = (imageUri: string, options: OCROptions): string => {
  const hash = imageUri.split('/').pop() || Date.now().toString();
  return `${CACHE_DIR}${hash}_${options.language || 'en'}.json`;
};

const detectLanguage = (result: any): OCRLanguage => {
  const languages = result.textAnnotations?.[0]?.locale;
  return (languages?.split('-')[0] as OCRLanguage) || 'en';
};

const detectHandwriting = (result: any): boolean => {
  const confidence = result.textAnnotations?.[0]?.confidence || 0;
  return confidence < 0.8;
};

const detectTables = (result: any): boolean => {
  const blocks = result.fullTextAnnotation?.pages?.[0]?.blocks || [];
  return blocks.some((block: any) => {
    const paragraphs = block.paragraphs || [];
    return paragraphs.length > 1 && hasTableStructure(paragraphs);
  });
};

const hasTableStructure = (paragraphs: any[]): boolean => {
  const xCoordinates = paragraphs.map(p => p.boundingBox?.vertices?.[0]?.x);
  const uniqueX = new Set(xCoordinates);
  return uniqueX.size > 1 && uniqueX.size < paragraphs.length;
};

export const ocrService = {
  async extractText(imageUri: string, options: OCROptions = {}): Promise<OCRResult> {
    try {
      const {
        language = 'en',
        detectTables: shouldDetectTables = true,
        detectHandwriting: shouldDetectHandwriting = true,
        useCache = true
      } = options;

      // Check cache
      if (useCache) {
        await ensureCacheDir();
        const cacheKey = getCacheKey(imageUri, options);
        const cacheExists = await FileSystem.getInfoAsync(cacheKey);
        
        if (cacheExists.exists) {
          const cachedResult = await FileSystem.readAsStringAsync(cacheKey);
          return JSON.parse(cachedResult);
        }
      }

      // Read the image file as base64
      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64
      });

      const response = await fetch(GOOGLE_VISION_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            image: {
              content: base64Image
            },
            features: [{
              type: 'TEXT_DETECTION',
              maxResults: 1
            }]
          }]
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to perform OCR');
      }

      // Extract the text from the response
      const text = data.responses[0]?.fullTextAnnotation?.text || '';
      const confidence = data.responses[0]?.textAnnotations?.[0]?.confidence || 0;

      const ocrResult: OCRResult = {
        text,
        confidence,
        language: 'en'
      };

      // Cache result
      if (useCache) {
        const cacheKey = getCacheKey(imageUri, options);
        await FileSystem.writeAsStringAsync(cacheKey, JSON.stringify(ocrResult));
      }

      return ocrResult;
    } catch (error) {
      console.error('OCR Error:', error);
      throw error;
    }
  },

  async clearCache(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(CACHE_DIR);
      }
    } catch (error) {
      console.error('Error clearing OCR cache:', error);
      throw error;
    }
  }
}; 