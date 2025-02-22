import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

interface TabScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  title?: string;
}

export const TabScreenWrapper = ({ children, style, title }: TabScreenWrapperProps) => {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.safeArea]} edges={['top']}>
      <View style={[styles.container, style]}>
        {title && (
          <View style={styles.headerContainer}>
            <Text variant="headlineMedium" style={styles.header}>
              {title}
            </Text>
          </View>
        )}
        <View style={styles.content}>
          {children}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  header: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
}); 