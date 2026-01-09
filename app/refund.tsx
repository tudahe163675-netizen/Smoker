import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { RefundRequestCard } from '@/components/refund/RefundRequestCard';
import { useRefund } from '@/hooks/useRefund';
import { Colors } from '@/constants/colors';
import type { RefundRequest } from '@/services/refundApi';

export default function RefundScreen() {
  const router = useRouter();
  const { getRefundRequests, loading } = useRefund();
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RefundRequest['refundStatus']>('all');

  const loadRefundRequests = useCallback(async () => {
    try {
      const params: any = { limit: 50 };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const data = await getRefundRequests(params);
      setRefundRequests(data);
    } catch (error) {
      console.error('Failed to load refund requests:', error);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [getRefundRequests, statusFilter]);

  useEffect(() => {
    loadRefundRequests();
  }, [loadRefundRequests]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRefundRequests();
  }, [loadRefundRequests]);

  const handleRefundPress = (bookedScheduleId: string) => {
    router.push(`/refund/${bookedScheduleId}`);
  };

  const filteredRequests = refundRequests.filter((request) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        request.bookedScheduleId?.toLowerCase().includes(query) ||
        request.senderName?.toLowerCase().includes(query) ||
        request.receiverName?.toLowerCase().includes(query) ||
        request.bookingId?.toLowerCase().includes(query)
      );
    }
    return true;
  });

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
        <Text style={styles.headerTitle}>Yêu cầu hoàn tiền</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/refund/create')}
        >
          <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.filterSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.mutedForeground} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Tìm kiếm theo ID, tên..."
            placeholderTextColor={Colors.mutedForeground}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(['all', 'pending', 'approved', 'completed', 'rejected'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                statusFilter === status && styles.filterChipActive,
              ]}
              onPress={() => setStatusFilter(status)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === status && styles.filterChipTextActive,
                ]}
              >
                {status === 'all'
                  ? 'Tất cả'
                  : status === 'pending'
                  ? 'Đang chờ'
                  : status === 'approved'
                  ? 'Đã duyệt'
                  : status === 'completed'
                  ? 'Hoàn thành'
                  : 'Đã từ chối'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <View style={styles.content}>
          {filteredRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color={Colors.mutedForeground} />
              <Text style={styles.emptyTitle}>
                {searchQuery || statusFilter !== 'all'
                  ? 'Không tìm thấy yêu cầu nào'
                  : 'Chưa có yêu cầu hoàn tiền'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery || statusFilter !== 'all'
                  ? 'Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc'
                  : 'Tạo yêu cầu hoàn tiền mới từ booking của bạn'}
              </Text>
            </View>
          ) : (
            filteredRequests.map((request) => (
              <RefundRequestCard
                key={request.bookedScheduleId}
                refundRequest={request}
                onPress={() => handleRefundPress(request.bookedScheduleId)}
              />
            ))
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
  addButton: {
    padding: 4,
  },
  filterSection: {
    backgroundColor: Colors.card,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.foreground,
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.muted,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: Colors.mutedForeground,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: Colors.primaryForeground,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
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
    paddingHorizontal: 32,
  },
});

