import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Button, Portal, Dialog, Text, IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { fileService, FileType } from '../services/file';
import { router } from 'expo-router';

interface QuickUploadProps {
  onUploadComplete?: () => void;
}

export const QuickUpload: React.FC<QuickUploadProps> = ({ onUploadComplete }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<FileType | null>(null);
  const [showTypeDialog, setShowTypeDialog] = useState(false);

  const handleNavigation = (route: string) => {
    router.push(`/(auth)/(protected)/(tabs)/${route}`);
  };

  const handleUploadPress = async () => {
    try {
      console.log('Opening document picker...');
      setLoading(true);
      setError(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: ['*/*'], // Accept all file types
        copyToCacheDirectory: true,
        multiple: false
      });

      console.log('Document picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        console.log('File selected:', file);
        setCapturedUri(file.uri);
        setSelectedType('pdf'); // Default to PDF, will be changed in type dialog
        setShowTypeDialog(true);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload');
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = async (type: FileType) => {
    try {
      console.log('Starting capture for type:', type);
      setLoading(true);
      setError(null);
      setSelectedType(type);

      if (type === 'mp4') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Camera permission not granted');
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          quality: 1,
          allowsEditing: true,
          videoMaxDuration: 60,
        });

        console.log('Video capture result:', result);
        if (!result.canceled && result.assets[0]) {
          setCapturedUri(result.assets[0].uri);
          setShowDialog(true);
        }
      } else {
        const result = await fileService.scanDocument();
        console.log('Document scan result:', result);
        if (result && result.uri) {
          setCapturedUri(result.uri);
          setShowDialog(true);
        }
      }
    } catch (error) {
      console.error('Capture error:', error);
      setError(error instanceof Error ? error.message : 'Failed to capture');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (type: FileType) => {
    if (!capturedUri) return;

    try {
      setLoading(true);
      setError(null);

      const fileName = `quick_${Date.now()}.${type}`;
      const savedFile = await fileService.uploadFile(capturedUri, type, fileName);

      if (savedFile) {
        setShowDialog(false);
        setShowTypeDialog(false);
        setCapturedUri(null);
        setSelectedType(null);
        onUploadComplete?.(); // Call the callback after successful upload
        
        const route = type === 'jpg' || type === 'jpeg' || type === 'png'
          ? '/(auth)/(protected)/(tabs)/photos'
          : type === 'mp4' || type === 'mov' || type === 'avi'
            ? '/(auth)/(protected)/(tabs)/videos'
            : '/(auth)/(protected)/(tabs)/scan';
        
        router.push(route);
      }
    } catch (error) {
      console.error('Save error:', error);
      setError(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <View style={styles.buttonGroup}>
          <IconButton
            icon="file-document-scan"
            mode="contained"
            size={40}
            onPress={() => handleNavigation('files')}
            containerColor="#4CAF50"
            iconColor="white"
          />
          <Text style={styles.buttonLabel}>Scan</Text>
        </View>

        <View style={styles.buttonGroup}>
          <IconButton
            icon="camera"
            mode="contained"
            size={40}
            onPress={() => handleNavigation('photos')}
            containerColor="#2196F3"
            iconColor="white"
          />
          <Text style={styles.buttonLabel}>Photo</Text>
        </View>

        <View style={styles.buttonGroup}>
          <IconButton
            icon="video"
            mode="contained"
            size={40}
            onPress={() => handleNavigation('videos')}
            containerColor="#F44336"
            iconColor="white"
          />
          <Text style={styles.buttonLabel}>Video</Text>
        </View>
      </View>

      <Button
        mode="contained"
        onPress={handleUploadPress}
        style={styles.uploadButton}
        loading={loading}
        disabled={loading}
        contentStyle={styles.uploadButtonContent}
      >
        {loading ? 'Uploading...' : 'Upload File'}
      </Button>

      {error && (
        <Text style={styles.error}>
          {error}
        </Text>
      )}

      {/* Capture confirmation dialog */}
      <Portal>
        <Dialog 
          visible={showDialog} 
          onDismiss={() => !loading && setShowDialog(false)}
        >
          <Dialog.Title>Confirm Save</Dialog.Title>
          <Dialog.Content>
            <Text>Save {selectedType === 'mp4' ? 'video' : 'captured file'} as {selectedType?.toUpperCase()}?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => setShowDialog(false)} 
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={() => selectedType && handleSave(selectedType)}
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* File type selection dialog */}
        <Dialog
          visible={showTypeDialog}
          onDismiss={() => !loading && setShowTypeDialog(false)}
        >
          <Dialog.Title>Select File Type</Dialog.Title>
          <Dialog.Content>
            <View style={styles.typeButtons}>
              {['pdf', 'doc', 'txt', 'csv'].map((type) => (
                <Button
                  key={type}
                  mode="outlined"
                  onPress={() => handleSave(type as FileType)}
                  style={styles.typeButton}
                  disabled={loading}
                >
                  {type.toUpperCase()}
                </Button>
              ))}
            </View>
          </Dialog.Content>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonGroup: {
    alignItems: 'center',
  },
  buttonLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  uploadButton: {
    marginTop: 8,
    padding: 8,
  },
  uploadButtonContent: {
    height: 40,
  },
  error: {
    color: 'red',
    marginTop: 8,
    textAlign: 'center',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 8,
  },
  typeButton: {
    marginVertical: 4,
    minWidth: '45%',
  }
}); 