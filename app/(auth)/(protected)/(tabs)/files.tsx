import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, List, ActivityIndicator, Searchbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fileService, FileType } from '../../../../src/services/file';
import { FileViewer } from '../../../../src/components/FileViewer';
import { TabScreenWrapper } from '../../../../src/components/layout/TabScreenWrapper';

interface RecentFile {
  id: string;
  name: string;
  type: FileType;
  url: string;
  created_at: string;
}

const FileTypeIcon = ({ type }: { type: FileType }) => {
  const getIconName = (type: FileType) => {
    switch (type) {
      case 'pdf':
        return 'file-document' as const;
      case 'doc':
      case 'docx':
        return 'microsoft-word' as const;
      case 'txt':
        return 'text-box' as const;
      case 'csv':
        return 'microsoft-excel' as const;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'image' as const;
      case 'mp4':
      case 'mov':
      case 'avi':
        return 'video' as const;
      default:
        return 'file-document' as const;
    }
  };

  return (
    <MaterialCommunityIcons 
      name={getIconName(type)}
      size={24} 
      color="#6200ee"
    />
  );
};

export default function Files() {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<RecentFile | null>(null);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Intelligent search function
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) {
      return recentFiles.slice(0, 5); // Show only 5 most recent when not searching
    }

    const query = searchQuery.toLowerCase();
    return recentFiles
      .map(file => {
        // Calculate relevance score
        let score = 0;
        
        // Exact match in name
        if (file.name.toLowerCase() === query) score += 10;
        
        // Starts with query
        if (file.name.toLowerCase().startsWith(query)) score += 8;
        
        // Contains query
        if (file.name.toLowerCase().includes(query)) score += 5;
        
        // Type matches
        if (file.type.toLowerCase().includes(query)) score += 3;
        
        // Recent files get a small boost
        const daysOld = (Date.now() - new Date(file.created_at).getTime()) / (1000 * 60 * 60 * 24);
        score += Math.max(0, 2 - (daysOld / 7)); // Boost for files less than 2 weeks old

        return { ...file, score };
      })
      .filter(file => file.score > 0) // Only include files with some relevance
      .sort((a, b) => b.score - a.score); // Sort by relevance score
  }, [recentFiles, searchQuery]);

  const loadRecentFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const files = await fileService.getFiles();
      
      // Sort by date and get 5 most recent files
      const sortedFiles = files
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5); // Only take the first 5 files
      
      setRecentFiles(sortedFiles);
    } catch (error) {
      console.error('Error loading recent files:', error);
      setError(error instanceof Error ? error.message : 'Failed to load recent files');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadRecentFiles();
  }, [loadRecentFiles]);

  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRecentFiles();
  }, [loadRecentFiles]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadRecentFiles();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadRecentFiles]);

  return (
    <TabScreenWrapper title="Files">
      <View style={styles.container}>
        <Searchbar
          placeholder="Search files..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />

        <FlatList
          data={filteredFiles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.fileCard}>
              <List.Item
                title={item.name}
                description={`${item.type.toUpperCase()} • ${new Date(item.created_at).toLocaleDateString()}`}
                left={() => <FileTypeIcon type={item.type} />}
                onPress={() => {
                  setSelectedFile(item);
                  setShowFileViewer(true);
                }}
              />
            </Card>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator style={styles.loader} />
            ) : error ? (
              <Text style={styles.error}>{error}</Text>
            ) : (
              <Text style={styles.emptyText}>
                {searchQuery ? 'No matching files found' : 'No recent files'}
              </Text>
            )
          }
        />

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
      </View>
    </TabScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    marginBottom: 20,
  },
  fileCard: {
    marginBottom: 8,
    elevation: 2,
    backgroundColor: 'white',
  },
  listContent: {
    paddingBottom: 16,
  },
  loader: {
    marginTop: 20,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.5,
    marginTop: 20,
  },
  listItem: {
    paddingLeft: 16,
  },
  cardWrapper: {
    padding: 8,
  },
  cardContent: {
    padding: 8,
  },
  searchBar: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: 'white',
  },
});