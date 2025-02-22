import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, FAB, Portal, Dialog, Button, List, IconButton, Checkbox, ActivityIndicator, MD2Colors } from 'react-native-paper';
import { DocumentScanner } from '../components/DocumentScanner';
import { DocumentList } from '../components/DocumentList';
import { fileService, FileType } from '../services/file';
import { DocumentType } from '../services/scanner';
import { useAuth } from '../context/AuthContext';
import { Document } from '../types/document';

export default function Files() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadDocuments = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const files = await fileService.getFiles();
      setDocuments(files);
    } catch (error) {
      console.error('Error loading documents:', error);
      setError(error instanceof Error ? error.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleDelete = useCallback(async (ids: string[]) => {
    try {
      setLoading(true);
      await fileService.deleteFiles(ids);
      await loadDocuments();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete documents');
    } finally {
      setLoading(false);
    }
  }, [loadDocuments]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleScan = async (uri: string, type: string, detectedType: DocumentType) => {
    try {
      setScanning(false);
      setLoading(true);
      
      const fileName = `Scan_${new Date().toISOString().replace(/[:.]/g, '-')}.${type}`;
      await fileService.uploadFile(uri, type as FileType, fileName);
      await loadDocuments();
    } catch (error) {
      console.error('Error saving scan:', error);
      setError(error instanceof Error ? error.message : 'Failed to save scan');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text>Please log in to view your files</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={MD2Colors.blue500} />
        </View>
      ) : (
        <DocumentList
          documents={documents}
          onDelete={handleDelete}
          onRefresh={loadDocuments}
        />
      )}

      <DocumentScanner
        visible={scanning}
        onScan={handleScan}
        onError={setError}
        onDismiss={() => setScanning(false)}
      />

      <FAB
        icon="camera"
        style={styles.fab}
        onPress={() => setScanning(true)}
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: 'red',
    padding: 10,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
}); 