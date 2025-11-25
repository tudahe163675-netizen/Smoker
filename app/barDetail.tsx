import { useBar } from "@/hooks/useBar";
import { ComboItem } from "@/types/barType";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// Combo Card Component (separate to use hooks properly)
const ComboCard: React.FC<{ item: ComboItem; index: number }> = ({ item, index }) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: 1,
      delay: index * 100,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.comboCard,
        {
          opacity: animValue,
          transform: [
            {
              translateY: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
            {
              scale: animValue,
            },
          ],
        },
      ]}
    >
      <View style={styles.comboHeader}>
        <View style={styles.comboIconContainer}>
          <Ionicons name="beer-outline" size={24} color="#3b82f6" />
        </View>
      </View>
      <Text style={styles.comboName} numberOfLines={2}>
        {item.comboName}
      </Text>
      <Text style={styles.comboPrice}>{item.price.toLocaleString()}₫</Text>
      {item.voucherApplyId && (
        <View style={styles.voucherBadge}>
          <Ionicons name="pricetag" size={12} color="#fff" />
          <Text style={styles.voucherText}>Voucher</Text>
        </View>
      )}
    </Animated.View>
  );
};

// Skeleton Loading Component
const SkeletonCard = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Skeleton Header */}
      <Animated.View style={[styles.skeletonHeader, { opacity }]} />

      {/* Skeleton Info Card */}
      <View style={styles.skeletonInfoCard}>
        <Animated.View
          style={[styles.skeletonText, { width: "70%", height: 28, opacity }]}
        />
        <Animated.View
          style={[
            styles.skeletonText,
            { width: "90%", height: 16, marginTop: 16, opacity },
          ]}
        />
        <Animated.View
          style={[
            styles.skeletonText,
            { width: "60%", height: 16, marginTop: 8, opacity },
          ]}
        />
        <Animated.View
          style={[
            styles.skeletonText,
            { width: "50%", height: 16, marginTop: 8, opacity },
          ]}
        />

        {/* Skeleton Stats */}
        <View style={styles.skeletonStatsContainer}>
          {[1, 2, 3].map((i) => (
            <Animated.View
              key={i}
              style={[styles.skeletonStat, { opacity }]}
            />
          ))}
        </View>
      </View>

      {/* Skeleton Combos */}
      <View style={styles.section}>
        <Animated.View
          style={[styles.skeletonText, { width: 150, height: 24, opacity }]}
        />
        <View style={styles.skeletonComboList}>
          {[1, 2].map((i) => (
            <Animated.View
              key={i}
              style={[styles.skeletonCombo, { opacity }]}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const BarDetail: React.FC<any> = ({}) => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    barDetail,
    combos,
    loadingDetail,
    loadingCombo,
    fetchBarDetail,
    fetchCombos,
  } = useBar();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchBarDetail(id);
    fetchCombos(id);
  }, [id]);

  useEffect(() => {
    if (!loadingDetail && barDetail) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loadingDetail, barDetail]);

  const handleBackPress = () => {
    router.back();
  };

  const handleBookingPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    handleBookTable();
  };

  const handleBookTable = async () => {
    try {
      Alert.alert(
        "Đặt bàn",
        `Bạn muốn đặt bàn tại ${barDetail?.barName}?`,
        [
          {
            text: "Hủy",
            style: "cancel",
          },
          {
            text: "Xác nhận",
            onPress: async () => {
              // TODO: Thay bằng API call thực tế
              // Ví dụ:
              // const bookingData = {
              //   barId: id,
              //   date: selectedDate,
              //   time: selectedTime,
              //   numberOfGuests: guestCount,
              //   customerName: userName,
              //   phoneNumber: userPhone,
              // };
              // 
              // const response = await bookingApi.createBooking(bookingData);
              // 
              // if (response.success) {
              //   Alert.alert("Thành công", "Đặt bàn thành công!");
              //   router.push("/bookings");
              // } else {
              //   Alert.alert("Lỗi", response.message);
              // }

              Alert.alert("Thành công", "Đặt bàn thành công!");
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Lỗi", "Không thể đặt bàn. Vui lòng thử lại!");
    }
  };

  const renderComboItem = ({ item, index }: { item: ComboItem; index: number }) => (
    <ComboCard item={item} index={index} />
  );

  if (loadingDetail) {
    return <SkeletonCard />;
  }

  if (!barDetail) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Ionicons name="sad-outline" size={64} color="#cbd5e1" />
        <Text style={styles.emptyText}>Không tìm thấy quán bar</Text>
        <Pressable style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Header with Back Button - Fixed positioning for notch */}
      <SafeAreaView style={styles.headerSafeArea} edges={["top"]}>
        <View style={styles.headerOverlay}>
          <Pressable
            style={styles.backButtonCircle}
            onPress={handleBackPress}
            android_ripple={{ color: "rgba(255,255,255,0.3)", borderless: true }}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Pressable style={styles.favoriteButton}>
            <Ionicons name="heart-outline" size={24} color="#fff" />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Bar Image */}
        <Animated.View
          style={[
            styles.imageContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Image
            source={{ uri: barDetail.background || barDetail.avatar }}
            style={styles.barImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={styles.imageGradient}
          />
          {barDetail.role && (
            <View style={styles.roleBadge}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color="#fff"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.roleText}>{barDetail.role}</Text>
            </View>
          )}
        </Animated.View>

        {/* Bar Info */}
        <Animated.View
          style={[
            styles.barInfoCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.barName}>{barDetail.barName}</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="location" size={18} color="#3b82f6" />
            </View>
            <Text style={styles.infoText}>
              {barDetail.address ||
                barDetail.addressData?.fullAddress ||
                "Chưa cập nhật địa chỉ"}
            </Text>
          </View>

          {barDetail.phoneNumber && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="call" size={18} color="#10b981" />
              </View>
              <Text style={styles.infoText}>{barDetail.phoneNumber}</Text>
            </View>
          )}

          {barDetail.email && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="mail" size={18} color="#f59e0b" />
              </View>
              <Text style={styles.infoText}>{barDetail.email}</Text>
            </View>
          )}

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={20} color="#64748b" />
              <Text style={styles.statText}>18:00 - 02:00</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="star" size={20} color="#fbbf24" />
              <Text style={styles.statText}>4.5</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={20} color="#64748b" />
              <Text style={styles.statText}>250+</Text>
            </View>
          </View>
        </Animated.View>

        {/* Combos Section */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Combo đặc biệt</Text>
            <Ionicons name="flame" size={20} color="#f97316" />
          </View>

          {loadingCombo ? (
            <View style={styles.loadingComboContainer}>
              <ActivityIndicator size="small" color="#3b82f6" />
            </View>
          ) : combos.length === 0 ? (
            <View style={styles.emptyComboContainer}>
              <Ionicons name="beer-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyComboText}>Chưa có combo nào</Text>
            </View>
          ) : (
            <FlatList
              data={combos}
              renderItem={renderComboItem}
              keyExtractor={(item) => item.comboId}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.comboList}
            />
          )}
        </Animated.View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Book Button */}
      <Animated.View
        style={[
          styles.bookingButtonContainer,
          {
            transform: [{ scale: buttonScale }],
          },
        ]}
      >
        <Pressable
          style={styles.bookingButton}
          onPress={handleBookingPress}
          android_ripple={{ color: "rgba(255,255,255,0.3)" }}
        >
          <LinearGradient
            colors={["#3b82f6", "#2563eb"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bookingButtonGradient}
          >
            <Ionicons name="calendar" size={24} color="#fff" />
            <Text style={styles.bookingButtonText}>Đặt bàn ngay</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
};

export default BarDetail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#f8fafc",
  },
  emptyText: {
    fontSize: 18,
    color: "#64748b",
    marginTop: 16,
    fontWeight: "600",
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
  headerSafeArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "transparent",
  },
  headerOverlay: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButtonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    position: "relative",
    height: 300,
  },
  barImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e2e8f0",
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  roleBadge: {
    position: "absolute",
    top: 70,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: "#10b981",
    shadowColor: "#10b981",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  roleText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  barInfoCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: -40,
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 8,
  },
  barName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoText: {
    fontSize: 15,
    color: "#475569",
    flex: 1,
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  statItem: {
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#e2e8f0",
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
  },
  loadingComboContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyComboContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyComboText: {
    fontSize: 15,
    color: "#94a3b8",
    marginTop: 12,
    fontWeight: "500",
  },
  comboList: {
    paddingVertical: 8,
  },
  comboCard: {
    backgroundColor: "#fff",
    padding: 18,
    marginRight: 14,
    borderRadius: 20,
    width: 220,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 5,
  },
  comboHeader: {
    marginBottom: 12,
  },
  comboIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  comboName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
    lineHeight: 22,
  },
  comboPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: "#3b82f6",
  },
  voucherBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#f97316",
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  voucherText: {
    fontSize: 12,
    color: "#fff",
    marginLeft: 4,
    fontWeight: "600",
  },
  bookingButtonContainer: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
  },
  bookingButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#3b82f6",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 10,
  },
  bookingButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 10,
  },
  bookingButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  // Skeleton Styles
  skeletonHeader: {
    width: "100%",
    height: 300,
    backgroundColor: "#e2e8f0",
  },
  skeletonInfoCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: -40,
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 8,
  },
  skeletonText: {
    backgroundColor: "#e2e8f0",
    borderRadius: 8,
  },
  skeletonStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  skeletonStat: {
    width: 60,
    height: 40,
    backgroundColor: "#e2e8f0",
    borderRadius: 12,
  },
  skeletonComboList: {
    flexDirection: "row",
    marginTop: 16,
    gap: 14,
  },
  skeletonCombo: {
    width: 220,
    height: 180,
    backgroundColor: "#e2e8f0",
    borderRadius: 20,
  },
});