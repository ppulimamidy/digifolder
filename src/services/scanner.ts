import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { ocrService } from './ocr';
import { OCROptions } from '../types/ocr';
import { conversionService } from './conversion';
import { FileType } from './file';

export type DocumentType = 'document' | 'text' | 'spreadsheet' | 'other';
export type ContentType = 'text' | 'handwriting' | 'table' | 'mixed';

interface ScanResult {
  uri: string;
  type: DocumentType;
  detectedType: DocumentType;
  text?: string;
  contentType?: ContentType;
  confidence?: number;
  language: string;
}

interface TextDetectionResult {
  text: string;
  contentType: ContentType;
  confidence: number;
  language: string;
  uri: string;
}

// Text recognition using a mock for now
// In production, you would want to use a cloud OCR service like:
// - Google Cloud Vision API
// - Microsoft Azure Computer Vision
// - Amazon Textract
const extractText = async (imageUri: string, options?: OCROptions): Promise<TextDetectionResult> => {
  if (!FileSystem.cacheDirectory) {
    throw new Error('Cache directory not available');
  }

  try {
    // Preprocess image for better OCR
    const processedImage = await manipulateAsync(
      imageUri,
      [
        { resize: { width: 2000, height: 2000 } }, // Resize for better quality
        { rotate: 0 } // Ensure proper orientation
      ],
      { 
        compress: 0.9,
        format: SaveFormat.JPEG
      }
    );

    // Perform OCR
    const { text, confidence, isHandwritten, hasTable, language = 'en' } = 
      await ocrService.extractText(processedImage.uri, options);

    let contentType: ContentType = 'text';
    if (isHandwritten) contentType = 'handwriting';
    if (hasTable) contentType = contentType === 'handwriting' ? 'mixed' : 'table';

    // Save the extracted text to a file
    const textFile = `${FileSystem.cacheDirectory}scan_${Date.now()}.txt`;
    await FileSystem.writeAsStringAsync(textFile, text);

    return {
      text,
      contentType,
      confidence,
      language,
      uri: textFile
    };
  } catch (error) {
    console.error('Text extraction error:', error);
    throw error;
  }
};

// Rest of the helper functions remain the same
const analyzeForHandwriting = (text: string, confidence: number): boolean => {
  const confidenceThreshold = 80;
  const irregularSpacing = /\s{2,}|\n{2,}/.test(text);
  const connectedLetters = /([a-z]{3,})/gi.test(text);
  
  return confidence < confidenceThreshold || (irregularSpacing && connectedLetters);
};

const analyzeForTable = (text: string): boolean => {
  const columnPattern = /(\s{2,}|\t)/.test(text);
  const numberAlignments = /(\d+\s+){2,}/.test(text);
  const delimiters = /[|,;]\s*\w+/.test(text);

  return columnPattern && (numberAlignments || delimiters);
};

// Format conversion functions
const convertToPDF = async (uri: string, text: string): Promise<string> => {
  return await conversionService.textToPDF(text, {
    title: `Scanned Document ${new Date().toLocaleDateString()}`,
    fontSize: 12,
    lineSpacing: 1.2
  });
};

const convertToDoc = async (uri: string, text: string): Promise<string> => {
  return await conversionService.textToDoc(text, {
    title: `Scanned Document ${new Date().toLocaleDateString()}`,
    fontSize: 12,
    lineSpacing: 1.2
  });
};

const convertToText = async (uri: string, text: string): Promise<string> => {
  const textFile = `${FileSystem.cacheDirectory}extracted_text.txt`;
  await FileSystem.writeAsStringAsync(textFile, text);
  return textFile;
};

const convertToCSV = async (uri: string, text: string): Promise<string> => {
  if (analyzeForTable(text)) {
    const csvContent = text
      .split('\n')
      .map(line => line.split(/\s{2,}|\t/).join(','))
      .join('\n');
    const csvFile = `${FileSystem.cacheDirectory}converted.csv`;
    await FileSystem.writeAsStringAsync(csvFile, csvContent);
    return csvFile;
  }
  throw new Error('Content is not suitable for CSV conversion');
};

export const scannerService = {
  async scanDocument(options?: OCROptions): Promise<ScanResult> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Camera permission is required');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        aspect: [4, 3]
      });

      if (result.canceled || !result.assets[0]) {
        throw new Error('Scanning cancelled');
      }

      const scannedImage = result.assets[0];
      
      // Extract and analyze text with options
      const { text, contentType, confidence, language, uri: textUri } = 
        await extractText(scannedImage.uri, options);
      
      // Save both the image and the text
      const imageFile = `${FileSystem.cacheDirectory}scan_${Date.now()}.jpg`;
      await FileSystem.copyAsync({
        from: scannedImage.uri,
        to: imageFile
      });

      // Suggest best format based on content
      const detectedType = await this.detectDocumentType(text, contentType);
      
      // Convert to the detected type
      const convertedUri = await this.convertToFormat(textUri, detectedType, text);
      
      return {
        uri: convertedUri,
        type: detectedType,
        detectedType: detectedType,
        text,
        contentType,
        confidence,
        language
      };
    } catch (error) {
      console.error('Scanning error:', error);
      throw error;
    }
  },

  async detectDocumentType(text: string, contentType: ContentType): Promise<DocumentType> {
    if (contentType === 'table') return 'spreadsheet';
    if (contentType === 'handwriting') return 'document';
    if (text.length < 1000) return 'text';
    return 'document';
  },

  async convertToFormat(uri: string, type: DocumentType, text: string): Promise<string> {
    try {
      switch (type) {
        case 'document':
          return await convertToPDF(uri, text);
        case 'text':
          return await convertToText(uri, text);
        case 'spreadsheet':
          return await convertToCSV(uri, text);
        default:
          return uri;
      }
    } catch (error) {
      console.error('Error converting document:', error);
      throw error;
    }
  },

  async performOCR(uri: string): Promise<string> {
    // For now, return a placeholder
    return "Scanned text content";
  },

  async convertToPDF(uri: string): Promise<string> {
    // Implement PDF conversion - you might want to use a library like react-native-pdf-lib
    // For now, returning original URI
    return uri;
  },

  async convertToDoc(uri: string): Promise<string> {
    // Implement DOC conversion
    // For now, returning original URI
    return uri;
  },

  convertToCSV(text: string): string {
    return text;
  }
}; 