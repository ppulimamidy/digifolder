import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { List, Button, Text, Surface, useTheme } from 'react-native-paper';
import { Document, DocumentListProps } from '../types/document';

export const DocumentList: React.FC<DocumentListProps> = ({ 
  documents, 
  onDelete, 
  onRefresh 
}) => {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  console.log('Documents in list:', documents.length, documents);

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        {documents.map((doc) => (
          <Surface key={doc.id} style={styles.item}>
            <List.Item
              title={doc.name}
              description={`Type: ${doc.type}`}
              right={() => (
                <View style={styles.actions}>
                  <Button
                    mode="text"
                    textColor={theme.colors.error}
                    onPress={() => onDelete([doc.id])}
                  >
                    Delete
                  </Button>
                </View>
              )}
            />
          </Surface>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  item: {
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
    elevation: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  }
}); 