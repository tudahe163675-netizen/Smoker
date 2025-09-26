import AnimatedHeader from "@/components/ui/AnimatedHeader";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get("window");
const POSTER_WIDTH = width * 0.42;
const POSTER_HEIGHT = POSTER_WIDTH * 1.5;

const bannerData = [
  {
    id: "1",
    title: "Avengers: Endgame",
    image: "https://picsum.photos/400/250?random=1",
    rating: 9.2,
  },
  {
    id: "2",
    title: "Spider-Man: No Way Home",
    image: "https://picsum.photos/400/250?random=2",
    rating: 8.8,
  },
  {
    id: "3",
    title: "Top Gun: Maverick",
    image: "https://picsum.photos/400/250?random=3",
    rating: 8.9,
  },
];

const moviesData = [
  {
    id: "1",
    title: "THE BATMAN",
    poster: "https://picsum.photos/300/450?random=10",
    duration: "176 phút",
    rating: "T16",
    genre: "Hành động, Phiêu lưu",
    releaseDate: "04/03/2024",
    score: 8.5,
  },
  {
    id: "2",
    title: "DOCTOR STRANGE 2",
    poster: "https://picsum.photos/300/450?random=11",
    duration: "126 phút",
    rating: "T13",
    genre: "Viễn tưởng, Hành động",
    releaseDate: "06/05/2024",
    score: 7.8,
  },
  {
    id: "3",
    title: "JURASSIC WORLD 3",
    poster: "https://picsum.photos/300/450?random=12",
    duration: "147 phút",
    rating: "T13",
    genre: "Phiêu lưu, Khoa học viễn tưởng",
    releaseDate: "10/06/2024",
    score: 7.2,
  },
  {
    id: "4",
    title: "MINIONS 2",
    poster: "https://picsum.photos/300/450?random=13",
    duration: "87 phút",
    rating: "P",
    genre: "Hoạt hình, Hài",
    releaseDate: "01/07/2024",
    score: 8.1,
  },
  {
    id: "5",
    title: "THOR: LOVE & THUNDER",
    poster: "https://picsum.photos/300/450?random=14",
    duration: "119 phút",
    rating: "T13",
    genre: "Hành động, Hài",
    releaseDate: "08/07/2024",
    score: 7.5,
  },
];

export default function NewFeedScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedTab, setSelectedTab] = useState('current');
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

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'P': return '#10b981';
      case 'T13': return '#f59e0b';
      case 'T16': return '#ef4444';
      case 'T18': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const BannerItem = ({ item, index }: any) => (
    <View style={styles.bannerSlide}>
      <Image source={{ uri: item.image }} style={styles.bannerImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.bannerOverlay}
      >
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>{item.title}</Text>
          <View style={styles.bannerRating}>
            <Ionicons name="star" size={16} color="#fbbf24" />
            <Text style={styles.bannerRatingText}>{item.rating}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const MovieCard = ({ item }: any) => (
    <TouchableOpacity style={styles.movieCard} activeOpacity={0.8}>
      <View style={styles.posterContainer}>
        <Image source={{ uri: item.poster }} style={styles.moviePoster} />
        <View style={styles.scoreContainer}>
          <Ionicons name="star" size={12} color="#fbbf24" />
          <Text style={styles.scoreText}>{item.score}</Text>
        </View>
      </View>

      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.movieGenre} numberOfLines={1}>{item.genre}</Text>

        <View style={styles.movieMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={12} color="#6b7280" />
            <Text style={styles.metaText}>{item.duration}</Text>
          </View>

          <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(item.rating) }]}>
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>

        <Text style={styles.releaseDate}>{item.releaseDate}</Text>
      </View>
    </TouchableOpacity>
  );

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -100],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1f2937" />

      <AnimatedHeader
        title="Smoker App"
        subtitle="Khám phá ngay"
        iconName="search-outline"
        onIconPress={() => Alert.alert('Search')}
        headerTranslateY={headerTranslateY}
      />

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
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'current' && styles.activeTab]}
            onPress={() => setSelectedTab('current')}
          >
            <Text style={[styles.tabText, selectedTab === 'current' && styles.activeTabText]}>
              Đang Chiếu
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, selectedTab === 'upcoming' && styles.activeTab]}
            onPress={() => setSelectedTab('upcoming')}
          >
            <Text style={[styles.tabText, selectedTab === 'upcoming' && styles.activeTabText]}>
              Sắp Chiếu
            </Text>
          </TouchableOpacity>
        </View>

        {/* Movies Section */}
        <View style={styles.moviesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Phim Hot</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={moviesData}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moviesList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MovieCard item={item} />}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard}>
            <LinearGradient colors={['#3b82f6', '#1d4ed8']} style={styles.actionGradient}>
              <Ionicons name="ticket-outline" size={28} color="#fff" />
              <Text style={styles.actionText}>Đặt vé nhanh</Text>
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
              <Text style={styles.actionText}>Rạp gần nhất</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>

      {/* Floating Book Button */}
      <TouchableOpacity style={styles.floatingButton} activeOpacity={0.8}>
        <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.floatingGradient}>
          <Ionicons name="ticket" size={20} color="#fff" />
          <Text style={styles.floatingText}>Đặt vé ngay</Text>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  // Banner Styles
  carouselContainer: {
    height: 280,
    marginTop: 40,
  },
  bannerSlide: {
    width,
    height: 280,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  bannerContent: {
    alignItems: 'flex-start',
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  bannerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  bannerRatingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
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

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 20,
    backgroundColor: '#e5e7eb',
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#1f2937',
  },

  // Movies Section
  moviesSection: {
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  seeAll: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  moviesList: {
    paddingHorizontal: 20,
  },

  // Movie Card
  movieCard: {
    width: POSTER_WIDTH,
    marginRight: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  posterContainer: {
    position: 'relative',
  },
  moviePoster: {
    width: '100%',
    height: POSTER_HEIGHT,
  },
  scoreContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  movieInfo: {
    padding: 12,
  },
  movieTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  movieGenre: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  movieMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 11,
    color: '#6b7280',
    marginLeft: 4,
  },
  ratingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  ratingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  releaseDate: {
    fontSize: 11,
    color: '#9ca3af',
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