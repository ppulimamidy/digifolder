import React, { useState } from 'react';
import { fileService, FileType } from '../services/file';
import { DocumentType } from '../services/scanner';

interface ScanProps {
  setScanning: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  setError: (value: string | null) => void;
  loadDocuments: () => Promise<void>;
}

export const handleScan = async (
  uri: string, 
  type: string, 
  detectedType: DocumentType,
  { setScanning, setLoading, setError, loadDocuments }: ScanProps
) => {
  try {
    setScanning(false);
    setLoading(true);
    
    // Determine file type based on detected document type
    let fileType: FileType;
    switch (detectedType) {
      case 'document':
        fileType = 'pdf';
        break;
      case 'text':
        fileType = 'txt';
        break;
      case 'spreadsheet':
        fileType = 'csv';
        break;
      default:
        fileType = type as FileType;
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `scan_${timestamp}.${fileType}`;
    await fileService.uploadFile(uri, fileType, fileName);
    await loadDocuments();
  } catch (error) {
    console.error('Error saving scan:', error);
    setError(error instanceof Error ? error.message : 'Failed to save scan');
  } finally {
    setLoading(false);
  }
}; 