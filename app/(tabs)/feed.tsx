import ComboCard from '@/components/bar/ComboCard';
import { bannerData, categories, ComboItem, combosData } from '@/constants/barData';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const { width } = Dimensions.get("window");

export default function FeedScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const carouselRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleScrollEnd = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  };

  const getFilteredCombos = () => {
    if (selectedCategory === 'all') {
      return combosData;
    }
    return combosData.filter(combo => combo.category === selectedCategory);
  };

  const handleComboPress = (combo: ComboItem) => {
    // Navigate to booking screen with selected combo
    router.push({
      pathname: '/booking',
      params: { selectedCombo: combo.id }
    });
  };

  const handleBookingPress = () => {
    router.push('/booking');
  };

  const BannerItem = ({ item, index }: any) => (
    <View style={styles.bannerSlide}>
      <LinearGradient
        colors={['#1f2937', '#3b82f6']}
        style={styles.bannerBackground}
      >
        <View style={styles.bannerContent}>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{item.discount}</Text>
          </View>
          <Text style={styles.bannerTitle}>{item.title}</Text>
          <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const CategoryTab = ({ item, isSelected, onPress }: any) => (
    <TouchableOpacity
      style={[styles.categoryTab, isSelected && styles.activeCategoryTab]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={item.icon} 
        size={18} 
        color={isSelected ? '#fff' : '#6b7280'} 
      />
      <Text style={[styles.categoryText, isSelected && styles.activeCategoryText]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -100],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1f2937" />

      {/* <AnimatedHeader
        title="Combo Hot"
        headerTranslateY={headerTranslateY}
      /> */}

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Banner Carousel */}
        <View style={styles.carouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            ref={carouselRef}
            onMomentumScrollEnd={handleScrollEnd}
          >
            {bannerData.map((item, index) => (
              <BannerItem key={item.id} item={item} index={index} />
            ))}
          </ScrollView>

          {/* Pagination Dots */}
          <View style={styles.pagination}>
            {bannerData.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.dot, index === activeIndex && styles.activeDot]}
                onPress={() => {
                  carouselRef.current?.scrollTo({ x: index * width, animated: true });
                  setActiveIndex(index);
                }}
              />
            ))}
          </View>
        </View>

        {/* Category Tabs */}
        <View style={styles.categoriesContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          >
            {categories.map((category) => (
              <CategoryTab
                key={category.id}
                item={category}
                isSelected={selectedCategory === category.id}
                onPress={() => setSelectedCategory(category.id)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Combos Section */}
        <View style={styles.combosSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Combo Đặc Biệt {selectedCategory !== 'all' && `- ${categories.find(c => c.id === selectedCategory)?.name}`}
            </Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={getFilteredCombos()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.combosList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ComboCard item={item} onPress={handleComboPress} />
            )}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard} onPress={handleBookingPress}>
            <LinearGradient colors={['#3b82f6', '#1d4ed8']} style={styles.actionGradient}>
              <Ionicons name="calendar-outline" size={28} color="#fff" />
              <Text style={styles.actionText}>Đặt bàn</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <LinearGradient colors={['#10b981', '#059669']} style={styles.actionGradient}>
              <Ionicons name="gift-outline" size={28} color="#fff" />
              <Text style={styles.actionText}>Ưu đãi</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.actionGradient}>
              <Ionicons name="location-outline" size={28} color="#fff" />
              <Text style={styles.actionText}>Chi nhánh</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>

      {/* Floating Book Button */}
      <TouchableOpacity style={styles.floatingButton} activeOpacity={0.8} onPress={handleBookingPress}>
        <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.floatingGradient}>
          <Ionicons name="calendar" size={20} color="#fff" />
          <Text style={styles.floatingText}>Đặt bàn ngay</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  
  // Banner Styles
  carouselContainer: {
    height: 200,
  },
  bannerSlide: {
    width,
    height: 200,
    position: 'relative',
  },
  bannerBackground: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  bannerContent: {
    alignItems: 'flex-start',
  },
  discountBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  discountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 16,
    color: '#e5e7eb',
    marginTop: 4,
  },

  // Pagination
  pagination: {
    position: 'absolute',
    bottom: 15,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 20,
  },

  // Categories
  categoriesContainer: {
    marginVertical: 20,
  },
  categoriesList: {
    paddingHorizontal: 20,
    paddingRight: 40,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activeCategoryTab: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 6,
  },
  activeCategoryText: {
    color: '#fff',
  },

  // Combos Section
  combosSection: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  seeAll: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  combosList: {
    paddingHorizontal: 20,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionGradient: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },

  // Floating Button
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  floatingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  floatingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});