import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList, RefreshControl } from 'react-native';
import { Text, Card, List, ActivityIndicator } from 'react-native-paper';
import { QuickUpload } from '../../../src/components/QuickUpload';
import { FileViewer } from '../../../src/components/FileViewer';
import { fileService, FileType } from '../../../src/services/file';
import { useAuth } from '../../../src/context/AuthContext';

interface RecentFile {
  id: string;
  name: string;
  type: FileType;
  url: string;
  created_at: string;
}

export default function Home() {
  const { user } = useAuth();
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<RecentFile | null>(null);
  const [showFileViewer, setShowFileViewer] = useState(false);

  useEffect(() => {
    console.log('Home component mounted');
    loadRecentFiles();
    return () => {
      console.log('Home component unmounted');
    };
  }, []);

  const loadRecentFiles = async () => {
    try {
      console.log('Loading recent files...');
      setLoading(true);
      setError(null);
      const files = await fileService.getFiles();
      console.log('Files fetched:', files?.length);
      // Get most recent 5 files, sorted by date
      const recent = files
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      console.log('Recent files:', recent);
      setRecentFiles(recent);
    } catch (error) {
      console.error('Error loading recent files:', error);
      setError(error instanceof Error ? error.message : 'Failed to load recent files');
    } finally {
      setLoading(false);
    }
  };

  const handleFilePress = async (file: RecentFile) => {
    try {
      console.log('Opening file:', file);
      setLoading(true);
      setError(null);
      const localUri = await fileService.downloadFile(file.url, file.name);
      console.log('File downloaded to:', localUri);
      setSelectedFile({
        ...file,
        url: localUri
      });
      setShowFileViewer(true);
    } catch (error) {
      console.error('Error opening file:', error);
      setError(error instanceof Error ? error.message : 'Failed to open file');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = () => {
    console.log('Upload completed, refreshing recent files...');
    loadRecentFiles();
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadRecentFiles}
          />
        }
      >
        <Text variant="headlineMedium" style={styles.welcome}>
          Welcome, {user?.email}
        </Text>

        <Card style={styles.section}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Quick Upload
            </Text>
            <QuickUpload onUploadComplete={handleUploadComplete} />
          </Card.Content>
        </Card>

        <Card style={styles.section}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Recent Files
            </Text>
            {loading ? (
              <ActivityIndicator style={styles.loader} />
            ) : error ? (
              <Text style={styles.error}>{error}</Text>
            ) : recentFiles.length === 0 ? (
              <Text style={styles.emptyText}>No recent files</Text>
            ) : (
              <FlatList
                data={recentFiles}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <List.Item
                    title={item.name}
                    description={new Date(item.created_at).toLocaleDateString()}
                    left={props => <List.Icon {...props} icon={getFileIcon(item.type)} />}
                    onPress={() => handleFilePress(item)}
                  />
                )}
                scrollEnabled={false}
              />
            )}
          </Card.Content>
        </Card>

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
      </ScrollView>
    </View>
  );
}

const getFileIcon = (type: FileType): string => {
  switch (type) {
    case 'pdf':
      return 'file-pdf-box';
    case 'doc':
    case 'docx':
      return 'file-word-box';
    case 'txt':
      return 'file-document-box';
    case 'csv':
      return 'file-excel-box';
    case 'jpg':
    case 'jpeg':
    case 'png':
      return 'file-image-box';
    case 'mp4':
    case 'mov':
    case 'avi':
      return 'file-video-box';
    default:
      return 'file-box';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  welcome: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  loader: {
    marginVertical: 20,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 10,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.5,
    marginVertical: 10,
  }
}); 