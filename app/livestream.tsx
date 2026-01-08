import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LivestreamCard } from '@/components/livestream/LivestreamCard';
import { useLivestream } from '@/hooks/useLivestream';
import { Colors } from '@/constants/colors';
import type { Livestream } from '@/services/livestreamApi';

export default function LivestreamScreen() {
  const router = useRouter();
  const { getActiveLivestreams, loading } = useLivestream();
  const [livestreams, setLivestreams] = useState<Livestream[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadLivestreams = useCallback(async () => {
    try {
      const data = await getActiveLivestreams();
      setLivestreams(data);
    } catch (error) {
      console.error('Failed to load livestreams:', error);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [getActiveLivestreams]);

  useEffect(() => {
    loadLivestreams();
  }, [loadLivestreams]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadLivestreams();
  }, [loadLivestreams]);

  const handleLivestreamPress = (livestreamId: string) => {
    router.push(`/livestream/${livestreamId}`);
  };

  const handleCreateLivestream = () => {
    router.push('/livestream/create');
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Livestream</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/livestream/scheduled')}
          >
            <Ionicons name="calendar-outline" size={24} color={Colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleCreateLivestream}>
            <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <View style={styles.content}>
          {livestreams.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="videocam-outline" size={64} color={Colors.mutedForeground} />
              <Text style={styles.emptyTitle}>Không có livestream nào đang phát</Text>
              <Text style={styles.emptyText}>
                Hãy tạo livestream mới hoặc xem các livestream đã lên lịch
              </Text>
              <TouchableOpacity style={styles.createButton} onPress={handleCreateLivestream}>
                <Ionicons name="add-circle" size={20} color={Colors.primaryForeground} />
                <Text style={styles.createButtonText}>Tạo livestream</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Đang phát trực tiếp</Text>
              {livestreams.map((livestream) => (
                <LivestreamCard
                  key={livestream.id}
                  livestream={livestream}
                  onPress={() => handleLivestreamPress(livestream.id)}
                />
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.mutedForeground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.foreground,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.foreground,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: Colors.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
});

