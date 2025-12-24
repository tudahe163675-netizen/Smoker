import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const PaymentScreen = () => {
  const { url, bookingId } = useLocalSearchParams<{
    url: string;
    bookingId: string;
  }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  const handleNavigationStateChange = (navState: any) => {
    const { url: currentUrl } = navState;
    console.log("Current URL:", currentUrl);

    // Check if payment is successful
    if (currentUrl.includes("success") || currentUrl.includes("payment-success")) {
      Alert.alert(
        "Thanh toán thành công",
        "Bạn đã đặt cọc thành công!",
        [
          {
            text: "OK",
            onPress: () => router.back(), // Quay lại Index
          },
        ]
      );
    }

    // Check if payment is cancelled
    if (currentUrl.includes("cancel") || currentUrl.includes("payment-cancel")) {
      Alert.alert(
        "Đã hủy thanh toán",
        "Bạn có thể thanh toán sau trong mục đơn đặt bàn",
        [
          {
            text: "OK",
            onPress: () => router.back(), // Quay lại Index
          },
        ]
      );
    }
  };

  const handleClose = () => {
    Alert.alert(
      "Xác nhận",
      "Bạn có muốn hủy thanh toán không?\n\nĐặt bàn đã được tạo, bạn có thể thanh toán sau.",
      [
        { text: "Tiếp tục thanh toán", style: "cancel" },
        {
          text: "Để sau",
          onPress: () => router.back(), // Quay lại Index
          style: "destructive",
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={24} color="#0f172a" />
        </Pressable>
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* WebView */}
      {url ? (
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          style={styles.webview}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={handleNavigationStateChange}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
          )}
        />
      ) : (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text style={styles.errorText}>Không có link thanh toán</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Quay lại</Text>
          </Pressable>
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      )}
    </SafeAreaView>
  );
};

export default PaymentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
    fontWeight: "600",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    color: "#64748b",
    marginTop: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  backButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: "#3b82f6",
    borderRadius: 24,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});