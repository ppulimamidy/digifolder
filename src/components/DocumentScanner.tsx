import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { scannerService, DocumentType } from '../services/scanner';

interface DocumentScannerProps {
  visible: boolean;
  onScan: (uri: string, type: string, detectedType: DocumentType) => void;
  onError: (error: string) => void;
  onDismiss: () => void;
}

export function DocumentScanner({ visible, onScan, onError, onDismiss }: DocumentScannerProps) {
  const [scanning, setScanning] = useState(false);

  const handleScan = async () => {
    try {
      setScanning(true);
      const result = await scannerService.scanDocument();
      if (result && result.uri && result.type) {
        onScan(result.uri, result.type, result.type as DocumentType);
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to scan document');
    } finally {
      setScanning(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        mode="contained"
        onPress={handleScan}
        loading={scanning}
        disabled={scanning}
        icon="camera"
      >
        Scan Document
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
}); 