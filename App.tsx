import React from 'react';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { Stack } from 'expo-router';

const theme = {
  ...MD3LightTheme,
  // You can customize your theme here
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2196F3',
    secondary: '#1976D2',
  },
};

export default function App() {
  console.log('App rendering');
  return (
    <AuthProvider>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <Stack />
        </SafeAreaProvider>
      </PaperProvider>
    </AuthProvider>
  );
} 