import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { Text, FAB, Portal, Dialog, IconButton, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { fileService, FileType } from '../../../../src/services/file';
import { TabScreenWrapper } from '../../../../src/components/layout/TabScreenWrapper';

const { width } = Dimensions.get('window');
const VIDEO_SIZE = width / 2 - 12;

interface VideoFile {
  id: string;
  url: string;
  name: string;
  type: FileType;
  created_at: string;
  thumbnail?: string;
}

export default function Videos() {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const files = await fileService.getFiles();
      const videoFiles = files.filter(file => 
        file.type === 'mp4' || file.type === 'mov' || file.type === 'avi'
      );
      setVideos(videoFiles);
    } catch (error) {
      console.error('Error loading videos:', error);
      setError(error instanceof Error ? error.message : 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordVideo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 1,
        videoMaxDuration: 60, // 1 minute max
        allowsEditing: true,
      });

      if (!result.canceled && result.assets[0]) {
        const fileName = `video_${Date.now()}.mp4`;
        const savedFile = await fileService.uploadFile(
          result.assets[0].uri,
          'mp4',
          fileName
        );

        if (savedFile) {
          await loadVideos();
        }
      }
    } catch (error) {
      console.error('Error recording video:', error);
      setError(error instanceof Error ? error.message : 'Failed to record video');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoPress = (video: VideoFile) => {
    setSelectedVideo(video);
    setShowVideoPlayer(true);
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      setLoading(true);
      await fileService.deleteFiles([videoId]);
      await loadVideos();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TabScreenWrapper title="Videos">
      <View style={styles.container}>
        {error && (
          <Text style={styles.error} variant="bodyMedium">
            {error}
          </Text>
        )}

        <FlatList
          data={videos}
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.videoContainer}
              onPress={() => handleVideoPress(item)}
            >
              <Video
                source={{ uri: item.url }}
                style={styles.videoThumbnail}
                resizeMode={ResizeMode.COVER}
                useNativeControls={false}
                isLooping={false}
                shouldPlay={false}
              />
              <Text numberOfLines={1} style={styles.videoName}>
                {item.name}
              </Text>
              <IconButton
                icon="delete"
                size={20}
                style={styles.deleteButton}
                onPress={() => handleDeleteVideo(item.id)}
              />
            </TouchableOpacity>
          )}
          refreshing={loading}
          onRefresh={loadVideos}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No videos yet</Text>
          }
        />

        <Portal>
          <Dialog
            visible={showVideoPlayer}
            onDismiss={() => setShowVideoPlayer(false)}
            style={styles.dialog}
          >
            {selectedVideo && (
              <Video
                source={{ uri: selectedVideo.url }}
                style={styles.fullVideo}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls
                shouldPlay
                isLooping
              />
            )}
          </Dialog>
        </Portal>

        <FAB
          icon="video"
          style={styles.fab}
          onPress={handleRecordVideo}
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
  videoContainer: {
    width: VIDEO_SIZE,
    height: VIDEO_SIZE + 40,
    margin: 6,
    position: 'relative',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  videoThumbnail: {
    width: '100%',
    height: VIDEO_SIZE,
  },
  videoName: {
    padding: 8,
    fontSize: 12,
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
    backgroundColor: 'black',
    maxHeight: '80%',
    margin: 0,
  },
  fullVideo: {
    width: '100%',
    height: '100%',
  }
}); 