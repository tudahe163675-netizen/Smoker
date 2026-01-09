import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, formatCurrency } from '@/constants/colors';
import type { RefundRequest } from '@/services/refundApi';

interface RefundRequestCardProps {
  refundRequest: RefundRequest;
  onPress: () => void;
}

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

export const RefundRequestCard: React.FC<RefundRequestCardProps> = ({ refundRequest, onPress }) => {
  const statusColor = getStatusColor(refundRequest.refundStatus);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Số tiền hoàn</Text>
          <Text style={styles.amount}>{formatCurrency(refundRequest.refundAmount)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {getStatusLabel(refundRequest.refundStatus)}
          </Text>
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color={Colors.mutedForeground} />
          <Text style={styles.infoText}>
            Người đặt: {refundRequest.senderName || 'N/A'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="person" size={16} color={Colors.mutedForeground} />
          <Text style={styles.infoText}>
            Người nhận: {refundRequest.receiverName || 'N/A'}
          </Text>
        </View>
        {refundRequest.bookingDate && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={Colors.mutedForeground} />
            <Text style={styles.infoText}>
              Ngày booking: {formatDate(refundRequest.bookingDate)}
            </Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color={Colors.mutedForeground} />
          <Text style={styles.infoText}>
            Tạo lúc: {formatDate(refundRequest.createdAt)}
          </Text>
        </View>
      </View>

      {refundRequest.refundReason && (
        <View style={styles.reasonContainer}>
          <Text style={styles.reasonLabel}>Lý do:</Text>
          <Text style={styles.reasonText} numberOfLines={2}>
            {refundRequest.refundReason}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <Ionicons name="chevron-forward" size={20} color={Colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  amountContainer: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 12,
    color: Colors.mutedForeground,
    marginBottom: 4,
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  info: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: Colors.foreground,
    flex: 1,
  },
  reasonContainer: {
    backgroundColor: Colors.muted,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: Colors.mutedForeground,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'flex-end',
  },
});

