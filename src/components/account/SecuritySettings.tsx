import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Switch, List, Text } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';

export const SecuritySettings = () => {
  const { user, updatePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      // Show error
      return;
    }

    try {
      setLoading(true);
      await updatePassword(currentPassword, newPassword);
      // Show success message
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      // Show error message
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <List.Section>
        <List.Subheader>Password</List.Subheader>
        <TextInput
          label="Current Password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          style={styles.input}
        />
        <TextInput
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          style={styles.input}
        />
        <TextInput
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          style={styles.input}
        />
        <Button 
          mode="contained" 
          onPress={handleUpdatePassword}
          loading={loading}
          style={styles.button}
        >
          Update Password
        </Button>
      </List.Section>

      <List.Section>
        <List.Subheader>Two-Factor Authentication</List.Subheader>
        <List.Item
          title="Enable 2FA"
          right={() => (
            <Switch
              value={twoFactorEnabled}
              onValueChange={setTwoFactorEnabled}
            />
          )}
        />
      </List.Section>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
  },
}); 