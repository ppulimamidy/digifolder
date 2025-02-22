import React, { useState, useCallback } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { Link, router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  useFocusEffect(
    useCallback(() => {
      setEmail('');
      setPassword('');
      setError('');
      setLoading(false);
      
      return () => {
        setError('');
        setLoading(false);
      };
    }, [])
  );

  const validateEmail = (email: string) => {
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const validateForm = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email');
      return false;
    }
    if (!password.trim()) {
      setError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    try {
      if (!validateForm()) return;

      setLoading(true);
      setError('');
      
      const { data, error: authError } = await signIn({ 
        email: email.trim(), 
        password 
      });
      
      if (authError) {
        setError(authError.message);
        return;
      }

      if (data) {
        router.replace('/(auth)/(protected)/(tabs)/home');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToRegister = () => {
    setEmail('');
    setPassword('');
    setError('');
    setLoading(false);
    router.push('/register');
  };

  const handleNavigateToForgotPassword = () => {
    setEmail('');
    setPassword('');
    setError('');
    setLoading(false);
    router.push('/forgot-password');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <View style={styles.header}>
              <Text variant="displaySmall" style={styles.title}>
                Welcome Back
              </Text>
              <Text variant="bodyLarge" style={styles.subtitle}>
                Sign in to continue
              </Text>
            </View>

            <View style={styles.form}>
              <TextInput
                label="Email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError('');
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                error={!!error && error.includes('email')}
                disabled={loading}
                mode="outlined"
                style={styles.input}
              />
              
              <TextInput
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError('');
                }}
                secureTextEntry
                error={!!error && error.includes('password')}
                disabled={loading}
                mode="outlined"
                style={styles.input}
              />

              {error ? (
                <HelperText type="error" visible={!!error}>
                  {error}
                </HelperText>
              ) : null}

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={styles.loginButton}
                contentStyle={styles.loginButtonContent}
              >
                Log In
              </Button>

              <View style={styles.footer}>
                <Text variant="bodyMedium" style={styles.footerText}>
                  Don't have an account?{' '}
                </Text>
                <Button
                  mode="text"
                  compact
                  style={styles.linkButton}
                  onPress={handleNavigateToRegister}
                >
                  Sign Up
                </Button>
              </View>

              <Button
                mode="text"
                compact
                style={styles.forgotButton}
                onPress={handleNavigateToForgotPassword}
              >
                Forgot Password?
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    color: '#1a1a1a',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#fff',
  },
  loginButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  loginButtonContent: {
    paddingVertical: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    color: '#666',
  },
  linkButton: {
    marginLeft: -8,
  },
  forgotButton: {
    alignSelf: 'center',
  },
}); 