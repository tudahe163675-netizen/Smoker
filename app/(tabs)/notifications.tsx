import { StyleSheet, Text, View } from "react-native";

export default function NotificationScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Notification Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 20, fontWeight: "bold" },
});
