import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      const isLoggedIn = true; 
      if (isLoggedIn) {
        router.replace('/(tabs)');
      } else {
        router.replace('/auth/login');
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MyApp</Text>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 20 },
});
