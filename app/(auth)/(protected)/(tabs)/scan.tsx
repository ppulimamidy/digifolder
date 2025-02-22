import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ScrollView, Image } from 'react-native';
import { Text, FAB, Portal, Dialog, Button, List, IconButton, Checkbox, Card } from 'react-native-paper';
import { DocumentScanner } from '../../../../src/components/DocumentScanner';
import { FileViewer } from '../../../../src/components/FileViewer';
import { fileService, FileType } from '../../../../src/services/file';
import { useAuth } from '../../../../src/context/AuthContext';
import { DocumentType } from '../../../../src/services/scanner';
import { TabScreenWrapper } from '../../../../src/components/layout/TabScreenWrapper';

// Define document types
const DOCUMENT_TYPES: FileType[] = ['pdf', 'doc', 'docx', 'txt', 'csv'];

interface ScannedPage {
  uri: string;
  timestamp: number;
}

export default function Scan() {
  const [scanning, setScanning] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [scannedUri, setScannedUri] = useState<string | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [scannedPages, setScannedPages] = useState<ScannedPage[]>([]);
  const [showFormatDialog, setShowFormatDialog] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const files = await fileService.getFiles();
      // Filter only document files
      const documentFiles = files.filter(file => 
        DOCUMENT_TYPES.includes(file.type as FileType)
      );
      setFiles(documentFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      setError(error instanceof Error ? error.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    try {
      setLoading(true);
      const result = await fileService.scanDocument();
      if (result && result.uri) {
        setScannedUri(result.uri);
        setShowDialog(true);
      }
    } catch (error) {
      console.error('Scan error:', error);
      setError(error instanceof Error ? error.message : 'Failed to scan document');
    } finally {
      setLoading(false);
    }
  };

  const handleError = (error: string) => {
    setError(error);
  };

  const handleSave = async (type: FileType) => {
    if (!scannedUri) return;

    try {
      setLoading(true);
      setError(null);
      console.log('Starting save process for:', type);

      const fileName = `scan_${Date.now()}.${type}`;
      
      // Show saving indicator
      setError('Saving file...');
      
      const savedFile = await fileService.uploadFile(scannedUri, type, fileName);
      console.log('File saved:', savedFile);

      if (savedFile) {
        setError(null);
        setShowDialog(false);
        setScannedUri(null);
        
        // Refresh files list
        const updatedFiles = await fileService.getFiles();
        setFiles(updatedFiles);
      }
    } catch (error) {
      console.error('Save error:', error);
      setError(error instanceof Error ? error.message : 'Failed to save file');
    } finally {
      setLoading(false);
    }
  };

  const handlePickDocument = async () => {
    try {
      setLoading(true);
      const result = await fileService.pickDocument();
      if (result) {
        setScannedUri((result as { uri: string }).uri);
        setShowDialog(true);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to pick document');
    } finally {
      setLoading(false);
    }
  };

  const handleFilePress = async (file: any) => {
    try {
      setLoading(true);
      setError(null);
      
      // For local viewing, we might need to download the file first
      const localUri = await fileService.downloadFile(file.url, file.name);
      
      setSelectedFile({
        ...file,
        localUri // Add local URI if needed
      });
      setShowFileViewer(true);
    } catch (error) {
      console.error('Error opening file:', error);
      setError(error instanceof Error ? error.message : 'Failed to open file');
    } finally {
      setLoading(false);
    }
  };

  const handleDismissScanner = () => {
    setScanning(false);
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDelete = async (ids: string[]) => {
    try {
      setLoading(true);
      console.log('Deleting files with IDs:', ids);
      const updatedFiles = await fileService.deleteFiles(ids);
      console.log('Files after deletion:', updatedFiles?.length);
      setFiles(updatedFiles || []);
    } catch (error) {
      console.error('Error in handleDelete:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete files');
    } finally {
      setLoading(false);
    }
  };

  const handlePageScan = async (uri: string) => {
    try {
      setScannedPages(prev => [...prev, { uri, timestamp: Date.now() }]);
      setScanning(false);
    } catch (error) {
      console.error('Error saving scan:', error);
      setError(error instanceof Error ? error.message : 'Failed to save scan');
    }
  };

  const handleSaveDocument = async (type: DocumentType) => {
    try {
      setLoading(true);
      setError(null);
      setShowFormatDialog(false);

      if (scannedPages.length === 0) {
        throw new Error('No pages scanned');
      }

      // Combine all pages into a single document
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `scan_${timestamp}`;
      
      await fileService.saveMultiPageDocument(
        scannedPages.map(page => page.uri),
        type,
        fileName
      );

      // Clear scanned pages after successful save
      setScannedPages([]);
    } catch (error) {
      console.error('Error saving document:', error);
      setError(error instanceof Error ? error.message : 'Failed to save document');
    } finally {
      setLoading(false);
    }
  };

  const removePage = (timestamp: number) => {
    setScannedPages(prev => prev.filter(page => page.timestamp !== timestamp));
  };

  const reorderPages = (fromIndex: number, toIndex: number) => {
    setScannedPages(prev => {
      const result = [...prev];
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return result;
    });
  };

  return (
    <TabScreenWrapper title="Scan Document">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineMedium">Files</Text>
          <IconButton
            icon="file-upload"
            mode="contained"
            onPress={handlePickDocument}
            disabled={loading}
          />
        </View>

        {error && (
          <Text style={styles.error} variant="bodyMedium">
            {error}
          </Text>
        )}

        <FlatList
          data={files}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <List.Item
              title={item.name}
              description={`${item.type.toUpperCase()} • ${new Date(
                item.created_at
              ).toLocaleDateString()}`}
              left={(props) => (
                <View style={styles.leftContent}>
                  <Checkbox.Android
                    status={selectedIds.has(item.id) ? 'checked' : 'unchecked'}
                    onPress={() => toggleSelection(item.id)}
                  />
                  <List.Icon {...props} icon="file" />
                </View>
              )}
              right={(props) => (
                <IconButton
                  icon="delete"
                  iconColor="red"
                  onPress={() => handleDelete([item.id])}
                />
              )}
              onPress={() => handleFilePress(item)}
            />
          )}
          refreshing={loading}
          onRefresh={loadFiles}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No files yet</Text>
          }
        />

        {selectedIds.size > 0 && (
          <View style={styles.bottomBar}>
            <Text>{selectedIds.size} selected</Text>
            <Button 
              mode="contained" 
              onPress={() => handleDelete(Array.from(selectedIds))}
              style={styles.deleteButton}
            >
              Delete Selected
            </Button>
          </View>
        )}

        <Portal>
          <Dialog 
            visible={showDialog} 
            onDismiss={() => !loading && setShowDialog(false)}
            dismissable={!loading}
          >
            <Dialog.Title>Save as</Dialog.Title>
            <Dialog.Content>
              <View style={styles.dialogButtons}>
                {['pdf', 'doc', 'txt', 'csv'].map((type) => (
                  <Button
                    key={type}
                    mode="outlined"
                    onPress={() => handleSave(type as FileType)}
                    loading={loading}
                    disabled={loading}
                  >
                    {type.toUpperCase()}
                  </Button>
                ))}
              </View>
            </Dialog.Content>
          </Dialog>
        </Portal>

        {selectedFile && (
          <FileViewer
            visible={showFileViewer}
            fileUrl={selectedFile.url}
            fileName={selectedFile.name}
            onDismiss={() => {
              setShowFileViewer(false);
              setSelectedFile(null);
            }}
          />
        )}

        {scannedPages.length > 0 && (
          <>
            <Text variant="titleMedium" style={styles.subtitle}>
              Scanned Pages ({scannedPages.length})
            </Text>
            <ScrollView style={styles.pageList}>
              {scannedPages.map((page, index) => (
                <Card key={page.timestamp} style={styles.pageCard}>
                  <Card.Content style={styles.pageContent}>
                    <Image source={{ uri: page.uri }} style={styles.thumbnail} />
                    <View style={styles.pageActions}>
                      <Text>Page {index + 1}</Text>
                      <View style={styles.pageButtons}>
                        {index > 0 && (
                          <Button
                            onPress={() => reorderPages(index, index - 1)}
                            icon="arrow-up"
                          >
                            Move Up
                          </Button>
                        )}
                        {index < scannedPages.length - 1 && (
                          <Button
                            onPress={() => reorderPages(index, index + 1)}
                            icon="arrow-down"
                          >
                            Move Down
                          </Button>
                        )}
                        <Button
                          onPress={() => removePage(page.timestamp)}
                          icon="delete"
                          textColor="red"
                        >
                          Remove
                        </Button>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </ScrollView>
          </>
        )}

        <DocumentScanner
          visible={scanning}
          onScan={handlePageScan}
          onError={setError}
          onDismiss={() => setScanning(false)}
        />

        <Portal>
          <Dialog visible={showFormatDialog} onDismiss={() => setShowFormatDialog(false)}>
            <Dialog.Title>Save Document As</Dialog.Title>
            <Dialog.Content>
              <List.Item
                title="PDF Document"
                description="Best for documents and text"
                left={props => <List.Icon {...props} icon="file-pdf-box" />}
                onPress={() => handleSaveDocument('document')}
              />
              <List.Item
                title="Text File"
                description="Plain text format"
                left={props => <List.Icon {...props} icon="text-box" />}
                onPress={() => handleSaveDocument('text')}
              />
            </Dialog.Content>
          </Dialog>
        </Portal>

        <View style={styles.fabContainer}>
          <FAB
            icon="camera"
            label="Add Page"
            onPress={() => setScanning(true)}
            style={styles.fab}
          />
          {scannedPages.length > 0 && (
            <FAB
              icon="content-save"
              label="Save Document"
              onPress={() => setShowFormatDialog(true)}
              style={[styles.fab, styles.saveFab]}
              loading={loading}
            />
          )}
        </View>
      </View>
    </TabScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  dialogButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    opacity: 0.5,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 4,
  },
  deleteButton: {
    backgroundColor: '#FF4444',
  },
  subtitle: {
    marginBottom: 10,
  },
  pageList: {
    flex: 1,
  },
  pageCard: {
    marginBottom: 8,
  },
  pageContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 60,
    height: 80,
    marginRight: 16,
    borderRadius: 4,
  },
  pageActions: {
    flex: 1,
  },
  pageButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    flexDirection: 'row',
  },
  saveFab: {
    backgroundColor: '#4CAF50',
  },
}); 