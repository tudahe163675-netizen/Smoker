import React, { useRef } from 'react';
import { ScrollView, StyleSheet, View, Dimensions } from 'react-native';
import { BookingHero } from '@/components/landing/BookingHero';
import { AnimatedSearchBar } from '@/components/landing/AnimatedSearchBar';
import { BookingFeatures } from '@/components/landing/BookingFeatures';
import { BookingCTA } from '@/components/landing/BookingCTA';
import { Colors } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';

const { height } = Dimensions.get('window');

export default function LandingScreen() {
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScrollToSearch = (offsetY: number) => {
    scrollViewRef.current?.scrollTo({ y: offsetY, animated: true });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <BookingHero onScroll={handleScrollToSearch} />

        {/* Search Section */}
        <AnimatedSearchBar />

        {/* Features Section */}
        <BookingFeatures />

        {/* CTA Section */}
        <BookingCTA />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
});

