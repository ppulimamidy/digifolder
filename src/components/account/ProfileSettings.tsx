import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { TextInput, Button, Text, Avatar, Snackbar, Portal, Modal } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import * as FileSystem from 'expo-file-system';

interface Profile {
  id: string;
  name: string;
  avatar_url: string;
  updated_at: string;
}

export const ProfileSettings = () => {
  const { user, updateUser, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);

  useEffect(() => {
    console.log('Auth state:', { 
      loading: authLoading, 
      userId: user?.id,
      userEmail: user?.email 
    });
    
    if (!authLoading && user?.id) {
      fetchProfile();
    }
  }, [user?.id, authLoading]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      console.log('Fetching profile for user:', user?.id);
      
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      console.log('Profile fetch response:', { profile, error });

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, create one
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([
              { 
                id: user?.id,
                name: user?.user_metadata?.name || '',
                avatar_url: user?.user_metadata?.avatar_url || '',
                updated_at: new Date().toISOString()
              }
            ])
            .select()
            .single();

          if (insertError) throw insertError;
          profile = newProfile;
        } else {
          throw error;
        }
      }

      if (profile) {
        console.log('Setting profile data:', {
          name: profile.name,
          avatar: profile.avatar_url
        });
        setName(profile.name || '');
        setAvatar(profile.avatar_url || '');
        setEmail(user?.email || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      await updateUser({ name, avatar_url: avatar });
      
      // Refresh profile data after successful update
      await fetchProfile();
      
      setSuccess(true);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      const fileName = `${user?.id}/${Date.now()}.jpg`;
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      await updateUser({ name, avatar_url: publicUrl });
      // Refresh profile data after avatar update
      await fetchProfile();

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setError('Camera permission is required to take a photo');
        return;
      }

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
      };

      setLoading(true);

      let result;
      try {
        result = await ImagePicker.launchCameraAsync(options);
        console.log('Camera result:', result);
      } catch (e) {
        console.error('Camera error:', e);
        setError('Failed to capture photo');
        setLoading(false);
        return;
      }

      if (result.canceled || !result.assets || !result.assets[0]) {
        console.log('Photo capture cancelled or no image');
        setLoading(false);
        return;
      }

      try {
        const uri = result.assets[0].uri;
        console.log('Photo captured:', uri);

        const fileName = `${user?.id}/${Date.now()}.jpg`;
        console.log('Uploading as:', fileName);

        const fileContent = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        console.log('File read complete, size:', fileContent.length);

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, decode(fileContent), {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        console.log('Generated public URL:', publicUrl);

        // Update profile
        await updateUser({
          name,
          avatar_url: publicUrl
        });

        // Update local state
        setAvatar(publicUrl);
        setShowImageOptions(false);
        setSuccess(true);

        // Refresh profile data
        await fetchProfile();

      } catch (error) {
        console.error('Processing error:', error);
        setError(error instanceof Error ? error.message : 'Failed to process photo');
      }

    } catch (error) {
      console.error('Overall error:', error);
      setError(error instanceof Error ? error.message : 'Failed to take photo');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to decode base64
  const decode = (base64: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return byteArray;
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setLoading(true);
        const publicUrl = await uploadAvatar(result.assets[0].uri);
        setAvatar(publicUrl);
        setShowImageOptions(false);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upload avatar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        {loading ? (
          <Avatar.Icon
            size={100}
            icon="sync"
            color="#fff"
            style={{ backgroundColor: '#6200ee' }}
          />
        ) : avatar ? (
          <Avatar.Image 
            size={100} 
            source={{ uri: avatar }}
          />
        ) : (
          <Avatar.Icon
            size={100}
            icon="account"
            color="#fff"
            style={{ backgroundColor: '#6200ee' }}
          />
        )}
        <Text style={styles.name}>
          {loading ? 'Loading...' : name || 'Add your name'}
        </Text>
        <Button 
          mode="outlined" 
          onPress={() => setShowImageOptions(true)}
          style={styles.photoButton}
          disabled={loading}
        >
          Change Photo
        </Button>
      </View>
      
      <TextInput
        label="Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        label="Email"
        value={email}
        disabled
        style={styles.input}
      />
      <Button 
        mode="contained" 
        onPress={handleUpdateProfile}
        loading={loading}
        style={styles.button}
      >
        Save Changes
      </Button>

      <Portal>
        <Modal
          visible={showImageOptions}
          onDismiss={() => setShowImageOptions(false)}
          contentContainerStyle={styles.modal}
        >
          <Button 
            icon="camera" 
            mode="outlined" 
            onPress={takePhoto}
            style={styles.modalButton}
          >
            Take Photo
          </Button>
          <Button 
            icon="image" 
            mode="outlined" 
            onPress={pickImage}
            style={styles.modalButton}
          >
            Choose from Gallery
          </Button>
          <Button 
            onPress={() => setShowImageOptions(false)}
            style={styles.modalButton}
          >
            Cancel
          </Button>
        </Modal>
      </Portal>

      <Snackbar
        visible={error !== null}
        onDismiss={() => setError(null)}
        duration={3000}
        style={styles.errorSnackbar}
      >
        {error}
      </Snackbar>

      <Snackbar
        visible={success}
        onDismiss={() => setSuccess(false)}
        duration={3000}
        style={styles.successSnackbar}
      >
        Profile updated successfully
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  photoButton: {
    marginTop: 8,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalButton: {
    marginBottom: 8,
  },
  errorSnackbar: {
    backgroundColor: '#FF4444',
  },
  successSnackbar: {
    backgroundColor: '#4CAF50',
  },
}); 