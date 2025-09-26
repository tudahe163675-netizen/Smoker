import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import { Button, StyleSheet, Text, View } from "react-native";

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = () => {
    // TODO: clear token / session ở đây
    router.replace('/auth/login'); // điều hướng về màn login
  };
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile Screen</Text>

      <ThemedView style={styles.stepContainer}>
        <Button title="Logout" onPress={handleLogout} />
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 20, fontWeight: "bold" },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
});
