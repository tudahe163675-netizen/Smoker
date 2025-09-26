import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");
const POSTER_WIDTH = width * 0.56;
const POSTER_HEIGHT = POSTER_WIDTH * 1.6;

const posters = [
  {
    id: "1",
    title: "TỬ CHIẾN TRÊN KHÔNG",
    img: require("@/assets/images/android-icon-background.png"),
  },
  { id: "2", title: "Poster 2", img: require("@/assets/images/android-icon-background.png") },
  { id: "3", title: "Poster 3", img: require("@/assets/images/android-icon-background.png") },
];

export default function NewFeedScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<ScrollView>(null);

  const handleScrollEnd = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* ScrollView chính */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Banner */}
        <View style={styles.carouselOuter}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            ref={carouselRef}
            onMomentumScrollEnd={handleScrollEnd}
          >
            {posters.map((p) => (
              <View key={p.id} style={{ width }}>
                <Image source={p.img} style={styles.bannerImage} resizeMode="cover" />
              </View>
            ))}
          </ScrollView>

          {/* Dots */}
          <View style={styles.dotsRow}>
            {posters.map((p, idx) => (
              <View
                key={p.id}
                style={[styles.dot, idx === activeIndex && styles.dotActive]}
              />
            ))}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tabButton, styles.tabActive]}>
            <Text style={styles.tabTextActive}>Đang Chiếu</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabButton}>
            <Text style={styles.tabText}>Sắp Chiếu</Text>
          </TouchableOpacity>
        </View>

        {/* Poster List */}
        <FlatList
          data={posters}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={item.img} style={styles.poster} resizeMode="cover" />
              <Text style={styles.title}>{item.title}</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaLeft}>
                  <Ionicons name="time-outline" size={14} color="#555" />
                  <Text style={styles.metaText}> 118 phút</Text>
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>T16</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        />
      </Animated.ScrollView>

      {/* Nút Đặt vé cố định */}
      <TouchableOpacity style={styles.bookButton}>
        <Ionicons name="ticket-outline" size={18} color="#fff" />
        <Text style={styles.bookText}> Đặt vé</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  carouselOuter: { height: 160 },
  bannerImage: { width, height: 160, opacity: 0.95 },

  dotsRow: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },
  dotActive: { backgroundColor: "#333", width: 16 },

  tabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    backgroundColor: "#eaeaea",
    borderRadius: 8,
    paddingVertical: 10,
    marginRight: 8,
    alignItems: "center",
  },
  tabActive: { backgroundColor: "#ccc" },
  tabText: { color: "#666", fontWeight: "600" },
  tabTextActive: { color: "#000", fontWeight: "700" },

  card: {
    width: POSTER_WIDTH + 24,
    marginRight: 14,
    alignItems: "center",
  },
  poster: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
    borderRadius: 10,
    marginBottom: 14,
  },
  title: {
    color: "#000",
    fontWeight: "700",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 8,
  },
  metaRow: {
    width: "100%",
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaLeft: { flexDirection: "row", alignItems: "center" },
  metaText: { color: "#555", fontSize: 13 },
  ratingBadge: {
    marginLeft: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#ff6b6b",
  },
  ratingText: { color: "#ff6b6b", fontWeight: "700", fontSize: 12 },

  bookButton: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    backgroundColor: "#61c74d",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  bookText: { color: "#fff", fontWeight: "700" },
});
