import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { scannerService, DocumentType } from './scanner';
import { Buffer } from 'buffer';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { ocrService } from './ocr';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export type FileType = 'pdf' | 'doc' | 'docx' | 'txt' | 'csv' | 'jpg' | 'jpeg' | 'png' | 'mp4' | 'mov' | 'avi';

interface FileMetadata {
  id: string;
  name: string;
  type: FileType;
  size: number;
  url: string;
  created_at: string;
  user_id: string;
}

export const isDocumentType = (type: FileType): boolean => {
  return ['pdf', 'doc', 'docx', 'txt', 'csv'].includes(type);
};

export const fileService = {
  async uploadFile(uri: string, type: FileType, fileName: string) {
    try {
      console.log('Starting upload process:', { uri, type, fileName });
      
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session) {
        throw new Error('Authentication error. Please try again.');
      }

      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      let fileContent: string | Uint8Array;
      let contentType: string;

      try {
        switch (type) {
          case 'pdf':
            // Convert image to PDF
            const pdfUri = await this.convertToPdf(uri);
            const pdfBase64 = await FileSystem.readAsStringAsync(pdfUri, {
              encoding: FileSystem.EncodingType.Base64
            });
            fileContent = Buffer.from(pdfBase64, 'base64');
            contentType = 'application/pdf';
            break;

          case 'txt':
            console.log('Processing text file...');
            // Extract text using OCR
            const ocrResult = await ocrService.extractText(uri);
            console.log('OCR Result:', ocrResult);
            if (!ocrResult.text) {
              throw new Error('No text could be extracted from the image');
            }
            fileContent = Buffer.from(ocrResult.text, 'utf-8');
            contentType = 'text/plain';
            break;

          case 'csv':
            // Extract text and convert to CSV
            const csvOcrResult = await ocrService.extractText(uri);
            const lines = csvOcrResult.text.split('\n').map(line => 
              line.split(/\s+/).join(',')
            );
            const csvContent = lines.join('\n');
            fileContent = Buffer.from(csvContent, 'utf-8');
            contentType = 'text/csv';
            break;

          default:
            const imageBase64 = await FileSystem.readAsStringAsync(uri, {
              encoding: FileSystem.EncodingType.Base64
            });
            fileContent = Buffer.from(imageBase64, 'base64');
            contentType = 'image/jpeg';
        }

        console.log('File content prepared, uploading to Supabase...');

        // Upload to Supabase
        const timestamp = Date.now();
        const path = `${session.user.id}/${timestamp}_${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('files')
          .upload(path, fileContent, {
            contentType,
            upsert: true
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        console.log('File uploaded successfully, getting public URL...');

        const { data: urlData } = supabase.storage
          .from('files')
          .getPublicUrl(path);

        if (!urlData?.publicUrl) {
          throw new Error('Failed to get public URL');
        }

        console.log('Got public URL, saving metadata...');

        // Save metadata
        const { data: fileData, error: dbError } = await supabase
          .from('files')
          .insert({
            name: fileName,
            type: type,
            size: fileInfo.size,
            url: urlData.publicUrl,
            user_id: session.user.id
          })
          .select()
          .single();

        if (dbError) {
          console.error('Database error:', dbError);
          await supabase.storage.from('files').remove([path]);
          throw dbError;
        }

        console.log('File saved successfully:', fileData);
        return fileData;

      } catch (error) {
        console.error('Conversion/Upload error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  async scanDocument() {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Camera permission not granted');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: true,
        aspect: [4, 3],
        base64: true,  // Request base64 data
        exif: false
      });

      if (!result.canceled && result.assets[0]) {
        // Return the captured image
        return {
          uri: result.assets[0].uri,
          type: 'jpeg',
          name: `scan_${Date.now()}.jpg`
        };
      }
    } catch (error) {
      console.error('Error scanning document:', error);
      throw error;
    }
  },

  async pickDocument() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'text/csv'],
        copyToCacheDirectory: true,
      });

      if ('uri' in result) {
        return result;
      }
    } catch (error) {
      console.error('Error picking document:', error);
      throw error;
    }
  },

  async getFiles() {
    console.log('fileService.getFiles called');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user?.id);
      
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FileMetadata[];
    } catch (error) {
      console.error('Error getting files:', error);
      throw error;
    }
  },

  async saveScannedDocument(uri: string, type: DocumentType, fileName: string) {
    try {
      // Convert the document to the requested format
      const convertedUri = await scannerService.convertToFormat(uri, type, '');
      
      // Upload to storage
      const filePath = `scanned/${fileName}`;
      const formData = new FormData();
      formData.append('file', {
        uri: convertedUri,
        type: `application/${type}`,
        name: fileName,
      } as any);

      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, formData);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      return { url: publicUrl, type };
    } catch (error) {
      console.error('Error saving document:', error);
      throw error;
    }
  },

  async deleteFiles(fileIds: string[]) {
    console.log('Deleting files:', fileIds);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get file paths from database
      const { data: files, error: fetchError } = await supabase
        .from('files')
        .select('*')
        .in('id', fileIds)
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;
      console.log('Files to delete:', JSON.stringify(files, null, 2));

      // Delete from storage first
      for (const file of (files as FileMetadata[])) {
        // Extract path from storage URL
        const storageUrl = new URL(file.url);
        const pathParts = storageUrl.pathname.split('/');
        const storagePath = pathParts.slice(pathParts.indexOf('files') + 1).join('/');
        
        console.log('Attempting to delete storage path:', storagePath);
        
        const { error: storageError } = await supabase.storage
          .from('files')
          .remove([storagePath]);
        
        if (storageError) {
          console.error('Storage delete error:', storageError);
          throw storageError;
        }
        console.log('Successfully deleted from storage:', storagePath);
      }

      // Then delete from database
      const { error: deleteError } = await supabase
        .from('files')
        .delete()
        .in('id', fileIds)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Database delete error:', deleteError);
        throw deleteError;
      }
      console.log('Successfully deleted from database');

      // Return fresh list
      const newFiles = await this.getFiles();
      console.log('Updated files list:', newFiles?.length);
      return newFiles;

    } catch (error) {
      console.error('Error in deleteFiles:', error);
      throw error;
    }
  },

  async downloadFile(url: string, fileName: string) {
    try {
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      
      const { uri: downloadedUri } = await FileSystem.downloadAsync(
        url,
        fileUri
      );
      
      return downloadedUri;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  },

  // Helper methods
  async convertToPdf(imageUri: string): Promise<string> {
    try {
      // First ensure we have a valid JPEG
      const processedImage = await manipulateAsync(
        imageUri,
        [{ resize: { width: 1700, height: 2200 } }],
        { 
          format: SaveFormat.JPEG,
          compress: 0.8,
          base64: true 
        }
      );

      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]); // US Letter size

      // Use the processed image's base64 directly
      const image = await pdfDoc.embedJpg(
        Buffer.from(processedImage.base64 || '', 'base64')
      );

      // Calculate dimensions to fit the page while maintaining aspect ratio
      const { width, height } = image.scale(1);
      const scaleFactor = Math.min(
        (page.getWidth() - 100) / width,
        (page.getHeight() - 100) / height
      );

      page.drawImage(image, {
        x: (page.getWidth() - width * scaleFactor) / 2,
        y: (page.getHeight() - height * scaleFactor) / 2,
        width: width * scaleFactor,
        height: height * scaleFactor
      });

      const pdfBytes = await pdfDoc.save();
      const pdfUri = `${FileSystem.cacheDirectory}temp.pdf`;
      await FileSystem.writeAsStringAsync(pdfUri, Buffer.from(pdfBytes).toString('base64'), {
        encoding: FileSystem.EncodingType.Base64
      });

      return pdfUri;
    } catch (error) {
      console.error('Error converting to PDF:', error);
      throw error;
    }
  },

  async performOCR(imageUri: string): Promise<string> {
    try {
      // For now, return a placeholder text since Tesseract.js is not working in React Native
      // In production, you would want to use:
      // 1. A cloud OCR service (Google Cloud Vision, Azure Computer Vision)
      // 2. Or a native OCR library (react-native-mlkit-ocr)
      
      return "Scanned Text Content\n" +
             "This is a placeholder text since OCR is not implemented yet.\n" +
             "In production, you would want to use a cloud OCR service or native OCR library.";
      
      // TODO: Implement one of these solutions:
      // Option 1: Google Cloud Vision API
      // const response = await fetch('https://vision.googleapis.com/v1/images:annotate?key=' + API_KEY, {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     requests: [{
      //       image: { content: base64Image },
      //       features: [{ type: 'TEXT_DETECTION' }]
      //     }]
      //   })
      // });
      
      // Option 2: React Native ML Kit
      // import MlkitOcr from 'react-native-mlkit-ocr';
      // const result = await MlkitOcr.detectFromUri(imageUri);
      // return result.text;
      
    } catch (error) {
      console.error('Error performing OCR:', error);
      throw error;
    }
  },

  base64ToBlob(base64: string, type: string): Blob {
    const byteCharacters = Buffer.from(base64, 'base64').toString('binary');
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type });
  },

  async saveMultiPageDocument(pageUris: string[], type: DocumentType, fileName: string): Promise<FileMetadata> {
    try {
      // For PDF documents
      if (type === 'document') {
        const pdfUri = await this.combineIntoPDF(pageUris);
        return await this.uploadFile(pdfUri, 'pdf', `${fileName}.pdf`);
      }
      
      // For text documents
      if (type === 'text') {
        const textContent = await this.extractTextFromPages(pageUris);
        const textUri = await this.saveTextToFile(textContent);
        return await this.uploadFile(textUri, 'txt', `${fileName}.txt`);
      }

      throw new Error('Unsupported document type');
    } catch (error) {
      console.error('Error saving multi-page document:', error);
      throw error;
    }
  },

  async combineIntoPDF(pageUris: string[]): Promise<string> {
    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();
    
    for (const uri of pageUris) {
      try {
        // Skip non-image files
        if (uri.endsWith('.txt') || uri.endsWith('.csv')) {
          console.log('Skipping text file:', uri);
          continue;
        }

        // Process image files
        const manipulateResult = await manipulateAsync(
          uri,
          [
            { resize: { width: 1700, height: 2200 } }
          ],
          { 
            format: SaveFormat.JPEG,
            compress: 0.8,
            base64: true
          }
        );

        const image = await pdfDoc.embedJpg(
          Buffer.from(manipulateResult.base64 || '', 'base64')
        );

        const page = pdfDoc.addPage([612, 792]);
        const { width, height } = image.scale(1);
        const scaleFactor = Math.min(
          (page.getWidth() - 100) / width,
          (page.getHeight() - 100) / height
        );

        page.drawImage(image, {
          x: (page.getWidth() - width * scaleFactor) / 2,
          y: (page.getHeight() - height * scaleFactor) / 2,
          width: width * scaleFactor,
          height: height * scaleFactor
        });
      } catch (error) {
        console.error(`Error processing page ${uri}:`, error);
        throw error;
      }
    }

    const pdfBytes = await pdfDoc.save();
    const pdfUri = `${FileSystem.cacheDirectory}combined.pdf`;
    await FileSystem.writeAsStringAsync(pdfUri, Buffer.from(pdfBytes).toString('base64'), {
      encoding: FileSystem.EncodingType.Base64
    });
    return pdfUri;
  },

  async extractTextFromPages(pageUris: string[]): Promise<string> {
    const texts = await Promise.all(
      pageUris.map(uri => ocrService.extractText(uri))
    );
    return texts.map(result => result.text).join('\n\n');
  },

  async saveTextToFile(content: string): Promise<string> {
    const textUri = `${FileSystem.cacheDirectory}combined.txt`;
    await FileSystem.writeAsStringAsync(textUri, content);
    return textUri;
  },

  async getStorageStats(): Promise<{ used: number; total: number; fileTypes: { [key: string]: number } }> {
    try {
      const files = await this.getFiles();
      
      const stats = {
        used: 0,
        total: 1024 * 1024 * 1024, // 1GB total storage
        fileTypes: {} as { [key: string]: number }
      };

      files.forEach(file => {
        stats.used += file.size;
        stats.fileTypes[file.type] = (stats.fileTypes[file.type] || 0) + file.size;
      });

      return stats;
    } catch (error) {
      console.error('Error getting storage stats:', error);
      throw error;
    }
  },
}; 