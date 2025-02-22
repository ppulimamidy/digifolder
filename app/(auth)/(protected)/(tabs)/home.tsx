import { View, StyleSheet } from 'react-native';
import { Text, Card, IconButton } from 'react-native-paper';
import { useAuth } from '../../../../src/context/AuthContext';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabScreenWrapper } from '../../../../src/components/layout/TabScreenWrapper';
import { useState, useEffect } from 'react';
import { supabase } from '../../../../src/lib/supabase';

interface Profile {
  id: string;
  name: string;
  avatar_url: string;
  updated_at: string;
}

export default function Home() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TabScreenWrapper title="Home">
      <View style={styles.container}>
        <Text variant="titleLarge" style={styles.welcome}>
          Welcome back,
        </Text>
        <Text variant="headlineMedium" style={styles.username}>
          {loading ? 'Loading...' : profile?.name || user?.email?.split('@')[0] || 'User'}
        </Text>

        <View style={styles.cards}>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">Quick Upload</Text>
              <Text variant="bodyMedium">Choose your upload type</Text>
              <View style={styles.iconRow}>
                <View style={styles.iconGroup}>
                  <IconButton
                    icon="file-document-scan"
                    mode="contained"
                    size={36}
                    onPress={() => router.push('/(auth)/(protected)/(tabs)/scan')}
                    containerColor="#4CAF50"
                    iconColor="white"
                  />
                  <Text style={styles.iconLabel}>Scan</Text>
                </View>

                <View style={styles.iconGroup}>
                  <IconButton
                    icon="camera"
                    mode="contained"
                    size={36}
                    onPress={() => router.push('/(auth)/(protected)/(tabs)/photos')}
                    containerColor="#2196F3"
                    iconColor="white"
                  />
                  <Text style={styles.iconLabel}>Photo</Text>
                </View>

                <View style={styles.iconGroup}>
                  <IconButton
                    icon="video"
                    mode="contained"
                    size={36}
                    onPress={() => router.push('/(auth)/(protected)/(tabs)/videos')}
                    containerColor="#F44336"
                    iconColor="white"
                  />
                  <Text style={styles.iconLabel}>Video</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">Recent Files</Text>
              <Text variant="bodyMedium">Access your latest uploads</Text>
            </Card.Content>
            <Card.Actions>
              <IconButton
                icon="folder"
                mode="contained"
                onPress={() => router.push('/(auth)/(protected)/(tabs)/files')}
              />
            </Card.Actions>
          </Card>
        </View>
      </View>
    </TabScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  welcome: {
    color: '#666',
    marginBottom: 4,
  },
  username: {
    color: '#1a1a1a',
    fontWeight: '600',
    marginBottom: 24,
  },
  cards: {
    gap: 15,
  },
  card: {
    marginBottom: 10,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 16,
  },
  iconGroup: {
    alignItems: 'center',
  },
  iconLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
}); 