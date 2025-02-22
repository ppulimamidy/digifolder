import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { Link } from 'expo-router';

export default function Welcome() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="displayMedium" style={styles.title}>
          Personal Digital Library
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Organize and secure your digital content
        </Text>
      </View>
      
      <View style={styles.buttons}>
        <Link href="/(auth)/login" asChild>
          <Button mode="contained" style={styles.button}>
            Log In
          </Button>
        </Link>
        
        <Link href="/(auth)/register" asChild>
          <Button mode="outlined" style={styles.button}>
            Sign Up
          </Button>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  buttons: {
    gap: 10,
  },
  button: {
    width: '100%',
  },
}); 