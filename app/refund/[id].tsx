import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRefund } from '@/hooks/useRefund';
import { Colors, formatCurrency } from '@/constants/colors';
import type { RefundRequest } from '@/services/refundApi';

const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

const getStatusColor = (status: RefundRequest['refundStatus']) => {
  switch (status) {
    case 'pending':
      return Colors.warning;
    case 'approved':
      return Colors.primary;
    case 'completed':
      return Colors.success;
    case 'rejected':
      return Colors.danger;
    default:
      return Colors.mutedForeground;
  }
};

const getStatusLabel = (status: RefundRequest['refundStatus']): string => {
  const statusMap: Record<RefundRequest['refundStatus'], string> = {
    pending: 'Đang chờ',
    approved: 'Đã duyệt',
    completed: 'Hoàn thành',
    rejected: 'Đã từ chối',
  };
  return statusMap[status] || status;
};

export default function RefundDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getRefundRequestDetail, loading } = useRefund();
  const [refundRequest, setRefundRequest] = useState<RefundRequest | null>(null);

  useEffect(() => {
    if (id) {
      loadRefundRequest();
    }
  }, [id]);

  const loadRefundRequest = async () => {
    if (!id) return;

    try {
      const data = await getRefundRequestDetail(id);
      if (data) {
        setRefundRequest(data);
      } else {
        Alert.alert('Lỗi', 'Không thể tải thông tin yêu cầu hoàn tiền');
        router.back();
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải thông tin yêu cầu hoàn tiền');
      router.back();
    }
  };

  if (loading || !refundRequest) {
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

  const statusColor = getStatusColor(refundRequest.refundStatus);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết hoàn tiền</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusLabel(refundRequest.refundStatus)}
            </Text>
          </View>

          {/* Amount Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin số tiền</Text>
            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>Số tiền hoàn</Text>
              <Text style={styles.amount}>{formatCurrency(refundRequest.refundAmount)}</Text>
            </View>
            {refundRequest.totalAmount && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tổng số tiền booking:</Text>
                <Text style={styles.infoValue}>{formatCurrency(refundRequest.totalAmount)}</Text>
              </View>
            )}
            {refundRequest.depositAmount && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tiền cọc:</Text>
                <Text style={styles.infoValue}>{formatCurrency(refundRequest.depositAmount)}</Text>
              </View>
            )}
          </View>

          {/* Booking Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin booking</Text>
            {refundRequest.bookingId && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Booking ID:</Text>
                <Text style={styles.infoValue}>{refundRequest.bookingId}</Text>
              </View>
            )}
            {refundRequest.bookedScheduleId && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Schedule ID:</Text>
                <Text style={styles.infoValue}>{refundRequest.bookedScheduleId}</Text>
              </View>
            )}
            {refundRequest.bookingDate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ngày booking:</Text>
                <Text style={styles.infoValue}>{formatDate(refundRequest.bookingDate)}</Text>
              </View>
            )}
            {refundRequest.bookingTime && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Giờ booking:</Text>
                <Text style={styles.infoValue}>{refundRequest.bookingTime}</Text>
              </View>
            )}
          </View>

          {/* User Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin người dùng</Text>
            <View style={styles.userCard}>
              <Ionicons name="person-outline" size={20} color={Colors.primary} />
              <View style={styles.userInfo}>
                <Text style={styles.userLabel}>Người đặt</Text>
                <Text style={styles.userName}>{refundRequest.senderName || 'N/A'}</Text>
              </View>
            </View>
            <View style={styles.userCard}>
              <Ionicons name="person" size={20} color={Colors.primary} />
              <View style={styles.userInfo}>
                <Text style={styles.userLabel}>Người nhận</Text>
                <Text style={styles.userName}>{refundRequest.receiverName || 'N/A'}</Text>
              </View>
            </View>
          </View>

          {/* Refund Reason */}
          {refundRequest.refundReason && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lý do hoàn tiền</Text>
              <View style={styles.reasonCard}>
                <Text style={styles.reasonText}>{refundRequest.refundReason}</Text>
              </View>
            </View>
          )}

          {/* Refund Images */}
          {refundRequest.refundImages && refundRequest.refundImages.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hình ảnh chứng từ</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.imagesContainer}>
                  {refundRequest.refundImages.map((imageUri, index) => (
                    <Image key={index} source={{ uri: imageUri }} style={styles.refundImage} />
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Bank Info */}
          {refundRequest.bankInfo && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông tin ngân hàng</Text>
              <View style={styles.bankCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Ngân hàng:</Text>
                  <Text style={styles.infoValue}>{refundRequest.bankInfo.bankName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Số tài khoản:</Text>
                  <Text style={styles.infoValue}>{refundRequest.bankInfo.accountNumber}</Text>
                </View>
                {refundRequest.bankInfo.accountHolderName && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Chủ tài khoản:</Text>
                    <Text style={styles.infoValue}>
                      {refundRequest.bankInfo.accountHolderName}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Timestamps */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thời gian</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tạo lúc:</Text>
              <Text style={styles.infoValue}>{formatDate(refundRequest.createdAt)}</Text>
            </View>
            {refundRequest.updatedAt && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Cập nhật:</Text>
                <Text style={styles.infoValue}>{formatDate(refundRequest.updatedAt)}</Text>
              </View>
            )}
          </View>
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.foreground,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 24,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: 12,
  },
  amountCard: {
    backgroundColor: Colors.primaryLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.mutedForeground,
    marginBottom: 4,
  },
  amount: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.mutedForeground,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.foreground,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.muted,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  userLabel: {
    fontSize: 12,
    color: Colors.mutedForeground,
    marginBottom: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.foreground,
  },
  reasonCard: {
    backgroundColor: Colors.muted,
    padding: 12,
    borderRadius: 8,
  },
  reasonText: {
    fontSize: 14,
    color: Colors.foreground,
    lineHeight: 20,
  },
  imagesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  refundImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    backgroundColor: Colors.muted,
  },
  bankCard: {
    backgroundColor: Colors.muted,
    padding: 12,
    borderRadius: 8,
  },
});

