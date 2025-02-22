import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, Dimensions } from 'react-native';
import { Text, FAB, Portal, Dialog, IconButton, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { fileService, FileType } from '../../../../src/services/file';
import { TabScreenWrapper } from '../../../../src/components/layout/TabScreenWrapper';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = width / 3 - 8;

interface Photo {
  id: string;
  url: string;
  name: string;
  type: FileType;
  created_at: string;
}

export default function Photos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      setError(null);
      const files = await fileService.getFiles();
      // Filter only image files
      const imageFiles = files.filter(file => 
        file.type === 'jpg' || file.type === 'jpeg' || file.type === 'png'
      );
      setPhotos(imageFiles);
    } catch (error) {
      console.error('Error loading photos:', error);
      setError(error instanceof Error ? error.message : 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        const fileName = `photo_${Date.now()}.jpg`;
        const savedFile = await fileService.uploadFile(
          result.assets[0].uri,
          'jpg' as any,
          fileName
        );

        if (savedFile) {
          await loadPhotos(); // Refresh the photos list
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      setError(error instanceof Error ? error.message : 'Failed to take photo');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoPress = (photo: Photo) => {
    setSelectedPhoto(photo);
    setShowPhotoViewer(true);
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      setLoading(true);
      await fileService.deleteFiles([photoId]);
      await loadPhotos();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete photo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TabScreenWrapper title="Photos">
      <View style={styles.container}>
        {error && (
          <Text style={styles.error} variant="bodyMedium">
            {error}
          </Text>
        )}

        <FlatList
          data={photos}
          numColumns={3}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.photoContainer}>
              <Image
                source={{ uri: item.url }}
                style={styles.photo}
                onError={() => console.log('Error loading image:', item.url)}
              />
              <IconButton
                icon="delete"
                size={20}
                style={styles.deleteButton}
                onPress={() => handleDeletePhoto(item.id)}
              />
            </View>
          )}
          refreshing={loading}
          onRefresh={loadPhotos}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No photos yet</Text>
          }
        />

        <Portal>
          <Dialog
            visible={showPhotoViewer}
            onDismiss={() => setShowPhotoViewer(false)}
            style={styles.dialog}
          >
            {selectedPhoto && (
              <Image
                source={{ uri: selectedPhoto.url }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            )}
          </Dialog>
        </Portal>

        <FAB
          icon="camera"
          style={styles.fab}
          onPress={handleTakePhoto}
          loading={loading}
          disabled={loading}
        />
      </View>
    </TabScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  photoContainer: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    margin: 4,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  deleteButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    margin: 0,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
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
  dialog: {
    backgroundColor: 'transparent',
    maxHeight: '80%',
  },
  fullImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
  }
}); 