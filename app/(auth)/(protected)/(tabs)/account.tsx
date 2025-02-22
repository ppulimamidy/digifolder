import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, Divider, Portal, Modal, Text, Button } from 'react-native-paper';
import { useAuth } from '../../../../src/context/AuthContext';
import { ProfileSettings } from '../../../../src/components/account/ProfileSettings';
import { SecuritySettings } from '../../../../src/components/account/SecuritySettings';
import { NotificationSettings } from '../../../../src/components/account/NotificationSettings';
import { StorageSettings } from '../../../../src/components/account/StorageSettings';
import { TabScreenWrapper } from '../../../../src/components/layout/TabScreenWrapper';
import { router } from 'expo-router';

export default function Account() {
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const { signOut } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/(auth)/welcome');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderSettingsModal = () => {
    if (!currentSection) return null;

    let SettingsComponent;
    let title;

    switch (currentSection) {
      case 'profile':
        SettingsComponent = ProfileSettings;
        title = 'Profile Settings';
        break;
      case 'security':
        SettingsComponent = SecuritySettings;
        title = 'Security';
        break;
      case 'notifications':
        SettingsComponent = NotificationSettings;
        title = 'Notifications';
        break;
      case 'storage':
        SettingsComponent = StorageSettings;
        title = 'Storage';
        break;
      default:
        return null;
    }

    return (
      <Portal>
        <Modal
          visible={true}
          onDismiss={() => setCurrentSection(null)}
          contentContainerStyle={styles.modalContent}
        >
          <ScrollView>
            <SettingsComponent />
          </ScrollView>
        </Modal>
      </Portal>
    );
  };

  const renderLogoutConfirmation = () => (
    <Portal>
      <Modal
        visible={showLogoutConfirm}
        onDismiss={() => setShowLogoutConfirm(false)}
        contentContainerStyle={styles.logoutModal}
      >
        <Text variant="titleLarge" style={styles.logoutTitle}>Confirm Logout</Text>
        <Text variant="bodyMedium" style={styles.logoutMessage}>
          Are you sure you want to log out?
        </Text>
        <View style={styles.logoutButtons}>
          <Button 
            mode="outlined" 
            onPress={() => setShowLogoutConfirm(false)}
            style={styles.logoutButton}
          >
            Cancel
          </Button>
          <Button 
            mode="contained" 
            onPress={handleLogout}
            style={styles.logoutButton}
            buttonColor="#FF4444"
          >
            Logout
          </Button>
        </View>
      </Modal>
    </Portal>
  );

  return (
    <TabScreenWrapper title="Account Settings">
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.listContainer}>
          <List.Section>
            <List.Item
              title="Profile Settings"
              left={props => <List.Icon {...props} icon="account" />}
              onPress={() => setCurrentSection('profile')}
              style={styles.listItem}
            />
            <Divider />
            <List.Item
              title="Security"
              left={props => <List.Icon {...props} icon="shield" />}
              onPress={() => setCurrentSection('security')}
              style={styles.listItem}
            />
            <Divider />
            <List.Item
              title="Notifications"
              left={props => <List.Icon {...props} icon="bell" />}
              onPress={() => setCurrentSection('notifications')}
              style={styles.listItem}
            />
            <Divider />
            <List.Item
              title="Storage"
              left={props => <List.Icon {...props} icon="database" />}
              onPress={() => setCurrentSection('storage')}
              style={styles.listItem}
            />
            <Divider />
            <List.Item
              title="Logout"
              left={props => <List.Icon {...props} icon="logout" color="#FF4444" />}
              onPress={() => setShowLogoutConfirm(true)}
              titleStyle={styles.logoutText}
              style={styles.listItem}
            />
          </List.Section>
        </View>
      </ScrollView>

      {renderSettingsModal()}
      {renderLogoutConfirmation()}
    </TabScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  listContainer: {
    backgroundColor: '#fff',
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  listItem: {
    paddingVertical: 12,
  },
  logoutText: {
    color: '#FF4444',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  logoutModal: {
    backgroundColor: 'white',
    padding: 24,
    margin: 20,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  logoutTitle: {
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  logoutMessage: {
    marginBottom: 24,
    textAlign: 'center',
    color: '#666',
  },
  logoutButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  logoutButton: {
    minWidth: 120,
  },
}); 