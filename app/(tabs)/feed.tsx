import { useAuth } from '@/hooks/useAuth';
import { BarApiService } from '@/services/barApi';
import { BarItem } from '@/types/barType';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get("window");

// ============================
// 🎨 SKELETON LOADER COMPONENT
// ============================
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
    <Animated.View style={[styles.barCard, { opacity }]}>
      <View style={[styles.barImage, styles.skeleton]} />
      <View style={styles.barInfo}>
        <View style={[styles.skeletonText, { width: '70%', height: 20 }]} />
        <View style={[styles.skeletonText, { width: '50%', height: 14, marginTop: 8 }]} />
        <View style={[styles.skeletonText, { width: '40%', height: 14, marginTop: 8 }]} />
      </View>
    </Animated.View>
  );
};

// ============================
// 🎭 EMPTY STATE COMPONENT
// ============================
const EmptyState = () => (
  <View style={styles.emptyContainer}>
    <Ionicons name="beer-outline" size={80} color="#cbd5e1" />
    <Text style={styles.emptyTitle}>Không tìm thấy quán bar</Text>
    <Text style={styles.emptySubtitle}>Hãy thử lại sau nhé!</Text>
  </View>
);

// ============================
// 🎨 ANIMATED BAR CARD COMPONENT
// ============================
interface BarCardProps {
  item: BarItem;
  index: number;
  onPress: (bar: BarItem) => void;
}

const BarCard: React.FC<BarCardProps> = React.memo(({ item, index, onPress }) => {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, [index]);

  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  // ============================
  // 📊 DATA HELPERS
  // ============================
  const hasRating = item.averageRating !== null && item.reviewCount > 0;
  const displayAddress = item.address || item.addressData?.fullAddress || 'Chưa cập nhật địa chỉ';
  const hasPhone = !!item.phoneNumber;

  return (
    <AnimatedTouchable
      style={[styles.barCard, { transform: [{ scale }] }]}
      activeOpacity={0.9}
      onPress={() => onPress(item)}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.background || item.avatar }}
          style={styles.barImage}
          resizeMode="cover"
          // defaultSource={require('@/assets/images/default-bar.png')} // Add default image
        />
        
        {/* Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.4)']}
          style={styles.imageGradient}
        />

        {/* Role Badge - hiển thị nếu có */}
        {item.role && (
          <View style={styles.roleBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#fff" style={{ marginRight: 4 }} />
            <Text style={styles.roleText}>{item.role}</Text>
          </View>
        )}
      </View>

      <View style={styles.barInfo}>
        {/* Bar Name */}
        <Text style={styles.barName} numberOfLines={1}>
          {item.barName}
        </Text>

        {/* Address */}
        <View style={styles.barMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="location" size={14} color="#64748b" />
            <Text style={styles.barAddress} numberOfLines={2}>
              {displayAddress}
            </Text>
          </View>
        </View>

        {/* Phone Number - chỉ hiển thị nếu có */}
        {hasPhone && (
          <View style={styles.phoneContainer}>
            <Ionicons name="call-outline" size={14} color="#64748b" />
            <Text style={styles.phoneText}>{item.phoneNumber}</Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.barFooter}>
          {/* Rating - chỉ hiển thị nếu có đánh giá */}
          {hasRating ? (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#fbbf24" />
              <Text style={styles.ratingText}>{item.averageRating?.toFixed(1)}</Text>
              <Text style={styles.ratingSubtext}>({item.reviewCount})</Text>
            </View>
          ) : (
            <View style={styles.noRatingContainer}>
              <Ionicons name="star-outline" size={16} color="#cbd5e1" />
              <Text style={styles.noRatingText}>Chưa có đánh giá</Text>
            </View>
          )}

          {/* Email - hiển thị icon */}
          {item.email && (
            <View style={styles.emailContainer}>
              <Ionicons name="mail-outline" size={14} color="#64748b" />
            </View>
          )}

          {/* Created Date */}
          <View style={styles.dateContainer}>
            <Ionicons name="time-outline" size={14} color="#94a3b8" />
            <Text style={styles.dateText}>
              {new Date(item.createdAt).toLocaleDateString('vi-VN')}
            </Text>
          </View>
        </View>
      </View>
    </AnimatedTouchable>
  );
});

export default function FeedScreen() {
  const { authState } = useAuth();
  const [bars, setBars] = useState<BarItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const barApi = new BarApiService(authState.token!!);
  const scrollY = useRef(new Animated.Value(0)).current;

  // ============================
  // 📡 FETCH BARS
  // ============================
  const fetchBars = useCallback(async (pageNum = 1, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const res = await barApi.getBars(pageNum, 10);
console.log(res);

      if ( res.data) {
        const newBars = res.data;
        
        if (pageNum === 1 || isRefresh) {
          setBars(newBars);
        } else {
          setBars(prev => [...prev, ...newBars]);
        }

        setPage(pageNum);
        setHasMore(newBars.length === 10);
      }
    } catch (err) {
      console.error("ERROR FETCH BARS:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  // ============================
  // 🔄 HANDLERS
  // ============================
  const onLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchBars(page + 1);
    }
  }, [loadingMore, hasMore, page, fetchBars]);

  const onRefresh = useCallback(() => {
    fetchBars(1, true);
  }, [fetchBars]);

  const handleBarPress = useCallback((bar: BarItem) => {
    router.push({
      pathname: "/barDetail",
      params: { id: bar.barPageId }
    });
  }, []);

  // ============================
  // 🎬 INITIAL LOAD
  // ============================
  useEffect(() => {
    fetchBars(1, false);
  }, []);

  // ============================
  // 🎨 RENDER ITEM
  // ============================
  const renderBarItem = useCallback(({ item, index }: { item: BarItem; index: number }) => (
    <BarCard item={item} index={index} onPress={handleBarPress} />
  ), [handleBarPress]);

  // ============================
  // 🎨 ANIMATED HEADER
  // ============================
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  const headerScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.98],
    extrapolate: 'clamp',
  });

  // ============================
  // 🎬 MAIN RENDER
  // ============================
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* ANIMATED HEADER */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: headerOpacity,
            transform: [{ scale: headerScale }]
          }
        ]}
      >
        <View>
          <Text style={styles.headerTitle}>Khám phá Bar</Text>
          <Text style={styles.headerSubtitle}>
            {bars.length > 0 ? `${bars.length} quán bar` : 'Đang tải...'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => router.push("/booking")}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={22} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* LOADING STATE */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <FlatList
            data={[1, 2, 3, 4]}
            renderItem={() => <SkeletonCard />}
            keyExtractor={(item) => item.toString()}
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      ) : bars.length === 0 ? (
        <EmptyState />
      ) : (
        <Animated.FlatList
          data={bars}
          renderItem={renderBarItem}
          keyExtractor={(item) => item.barPageId}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3b82f6"
              colors={['#3b82f6']}
            />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator size="small" color="#3b82f6" />
                <Text style={styles.loadingText}>Đang tải thêm...</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

// ============================
// 🎨 STYLES
// ============================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },

  // ===== HEADER =====
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ===== LOADING =====
  loadingContainer: {
    flex: 1,
  },

  // ===== EMPTY STATE =====
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#475569',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },

  // ===== LIST =====
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // ===== BAR CARD =====
  barCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },

  imageContainer: {
    position: 'relative',
  },
  barImage: {
    width: "100%",
    height: 200,
    backgroundColor: '#e2e8f0',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },

  roleBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#10b981',
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  roleText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // ===== BAR INFO =====
  barInfo: {
    padding: 16,
  },
  barName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 10,
    letterSpacing: 0.3,
  },

  barMeta: {
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  barAddress: {
    fontSize: 14,
    color: "#64748b",
    marginLeft: 6,
    flex: 1,
    lineHeight: 20,
  },

  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  phoneText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 6,
    fontWeight: '500',
  },

  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },

  barFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },

  // Rating có review
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  ratingSubtext: {
    fontSize: 12,
    color: "#64748b",
    marginLeft: 3,
  },

  // No rating
  noRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  noRatingText: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 4,
  },

  emailContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  dateText: {
    fontSize: 11,
    color: "#94a3b8",
    marginLeft: 4,
  },

  // ===== SKELETON =====
  skeleton: {
    backgroundColor: '#e2e8f0',
  },
  skeletonText: {
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    marginBottom: 8,
  },

  // ===== FOOTER LOADING =====
  footerLoading: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
});