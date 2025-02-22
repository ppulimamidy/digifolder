import React, { useState, useEffect } from 'react';
import { StyleSheet, Dimensions, ActivityIndicator, Text, View, Image, ScrollView } from 'react-native';
import { Portal, Dialog } from 'react-native-paper';
import WebView from 'react-native-webview';
import { Video, ResizeMode } from 'expo-av';
import * as FileSystem from 'expo-file-system';

interface FileViewerProps {
  visible: boolean;
  fileUrl: string;
  fileName: string;
  onDismiss: () => void;
}

export const FileViewer: React.FC<FileViewerProps> = ({
  visible,
  fileUrl,
  fileName,
  onDismiss
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'document' | 'other' | 'video'>('other');
  const [textContent, setTextContent] = useState<string>('');

  useEffect(() => {
    if (visible) {
      setLoading(true);
      setError(null);
      determineFileType();
    }
  }, [visible, fileName]);

  useEffect(() => {
    const loadTextContent = async () => {
      if (fileType === 'document' && fileUrl.startsWith('file://')) {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (ext === 'txt' || ext === 'csv') {
          try {
            const content = await FileSystem.readAsStringAsync(fileUrl);
            setTextContent(content);
            setLoading(false);
          } catch (error) {
            console.error('Error reading file:', error);
            setError('Failed to read file content');
            setLoading(false);
          }
        }
      }
    };

    loadTextContent();
  }, [fileType, fileUrl, fileName]);

  const determineFileType = () => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png'].includes(ext || '')) {
      setFileType('image');
    } else if (['mp4', 'mov', 'avi'].includes(ext || '')) {
      setFileType('video');
    } else if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) {
      setFileType('document');
    } else {
      setFileType('other');
    }
  };

  const getViewerContent = () => {
    if (fileType === 'image') {
      return (
        <Image
          source={{ uri: fileUrl }}
          style={styles.image}
          resizeMode="contain"
          onLoad={() => setLoading(false)}
          onError={() => {
            setError('Failed to load image');
            setLoading(false);
          }}
        />
      );
    }

    if (fileType === 'video') {
      return (
        <Video
          source={{ uri: fileUrl }}
          style={styles.video}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          onLoad={() => setLoading(false)}
          onError={(error) => {
            console.error('Video error:', error);
            setError('Failed to load video');
            setLoading(false);
          }}
        />
      );
    }

    // For text files
    if (fileType === 'document') {
      const ext = fileName.split('.').pop()?.toLowerCase();
      if ((ext === 'txt' || ext === 'csv') && fileUrl.startsWith('file://')) {
        return (
          <ScrollView style={styles.textContainer}>
            <Text style={styles.textContent}>{textContent}</Text>
          </ScrollView>
        );
      }

      // For other document types
      const viewerUrl = ext === 'pdf'
        ? `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`
        : ext === 'doc' || ext === 'docx'
          ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`
          : fileUrl;

      return (
        <WebView
          source={{ uri: viewerUrl }}
          style={styles.webview}
          onLoad={() => setLoading(false)}
          onError={(syntheticEvent: any) => {
            const { nativeEvent } = syntheticEvent;
            setError(nativeEvent.description || 'Failed to load file');
            setLoading(false);
          }}
          allowFileAccess={true}
          allowFileAccessFromFileURLs={true}
          allowUniversalAccessFromFileURLs={true}
        />
      );
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <View style={styles.viewerContainer}>
          {loading && <ActivityIndicator style={styles.loader} />}
          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            getViewerContent()
          )}
        </View>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: 'white',
    margin: 20,
    height: Dimensions.get('window').height * 0.8,
    borderRadius: 8,
    overflow: 'hidden'
  },
  viewerContainer: {
    flex: 1,
    overflow: 'hidden'
  },
  webview: {
    flex: 1
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }]
  },
  error: {
    color: 'red',
    textAlign: 'center',
    padding: 20
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  textContainer: {
    flex: 1,
    padding: 20
  },
  textContent: {
    fontSize: 16
  },
}); 