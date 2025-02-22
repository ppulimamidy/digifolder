import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ProgressBar, List, Button } from 'react-native-paper';
import { fileService } from '../../services/file';

interface StorageStats {
  used: number;
  total: number;
  fileTypes: {
    [key: string]: number;
  };
}

export const StorageSettings = () => {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStorageStats();
  }, []);

  const loadStorageStats = async () => {
    try {
      setLoading(true);
      const storageStats = await fileService.getStorageStats();
      setStats(storageStats);
    } catch (error) {
      console.error('Error loading storage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return <Text>Loading storage information...</Text>;
  }

  const usedPercentage = (stats.used / stats.total) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.usageContainer}>
        <Text variant="titleMedium">Storage Used</Text>
        <Text variant="displaySmall">
          {(stats.used / 1024 / 1024).toFixed(2)} MB / {(stats.total / 1024 / 1024).toFixed(2)} MB
        </Text>
        <ProgressBar 
          progress={usedPercentage / 100} 
          color={usedPercentage > 90 ? '#FF4444' : '#6200ee'}
          style={styles.progressBar}
        />
      </View>

      <List.Section>
        <List.Subheader>Storage by File Type</List.Subheader>
        {Object.entries(stats.fileTypes).map(([type, size]) => (
          <List.Item
            key={type}
            title={type.toUpperCase()}
            description={`${(size / 1024 / 1024).toFixed(2)} MB`}
            left={props => <List.Icon {...props} icon="file" />}
          />
        ))}
      </List.Section>

      <Button 
        mode="contained" 
        onPress={loadStorageStats}
        style={styles.button}
      >
        Refresh Storage Info
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  usageContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    marginTop: 8,
  },
  button: {
    marginTop: 16,
  },
}); 