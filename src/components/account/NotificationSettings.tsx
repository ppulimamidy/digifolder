import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { List, Switch, Divider } from 'react-native-paper';

export const NotificationSettings = () => {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [uploadNotifs, setUploadNotifs] = useState(true);
  const [shareNotifs, setShareNotifs] = useState(true);
  const [updateNotifs, setUpdateNotifs] = useState(true);

  return (
    <View style={styles.container}>
      <List.Section>
        <List.Subheader>Notification Channels</List.Subheader>
        <List.Item
          title="Push Notifications"
          right={() => (
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
            />
          )}
        />
        <Divider />
        <List.Item
          title="Email Notifications"
          right={() => (
            <Switch
              value={emailEnabled}
              onValueChange={setEmailEnabled}
            />
          )}
        />
      </List.Section>

      <List.Section>
        <List.Subheader>Notification Types</List.Subheader>
        <List.Item
          title="File Uploads"
          right={() => (
            <Switch
              value={uploadNotifs}
              onValueChange={setUploadNotifs}
            />
          )}
        />
        <Divider />
        <List.Item
          title="File Shares"
          right={() => (
            <Switch
              value={shareNotifs}
              onValueChange={setShareNotifs}
            />
          )}
        />
        <Divider />
        <List.Item
          title="App Updates"
          right={() => (
            <Switch
              value={updateNotifs}
              onValueChange={setUpdateNotifs}
            />
          )}
        />
      </List.Section>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 