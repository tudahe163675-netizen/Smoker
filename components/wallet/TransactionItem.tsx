import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, formatCurrency, formatAmount } from '@/constants/colors';
import type { Transaction } from '@/services/walletApi';

interface TransactionItemProps {
  transaction: Transaction;
}

const getTransactionTypeLabel = (type: Transaction['type']): string => {
  const typeMap: Record<Transaction['type'], string> = {
    booking_income: 'Tiền nhận từ booking',
    refund: 'Hoàn tiền',
    withdraw: 'Rút tiền',
    withdraw_reject: 'Yêu cầu rút bị từ chối',
    system_adjust: 'Điều chỉnh hệ thống',
  };
  return typeMap[type] || type;
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

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
  const isIncome =
    transaction.type === 'booking_income' ||
    transaction.type === 'refund' ||
    transaction.type === 'withdraw_reject';
  
  const isWithdrawSuccess =
    transaction.type === 'withdraw' &&
    (transaction.status === 'completed' ||
      transaction.description?.toLowerCase().includes('thành công') ||
      transaction.description?.toLowerCase().includes('success'));

  return (
    <View
      style={[
        styles.container,
        isWithdrawSuccess && styles.containerSuccess,
      ]}
    >
      <View style={styles.leftSection}>
        <View
          style={[
            styles.iconContainer,
            isWithdrawSuccess
              ? styles.iconContainerSuccess
              : isIncome
              ? styles.iconContainerIncome
              : styles.iconContainerExpense,
          ]}
        >
          {isWithdrawSuccess ? (
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          ) : isIncome ? (
            <Ionicons name="arrow-down" size={20} color={Colors.success} />
          ) : (
            <Ionicons name="arrow-up" size={20} color={Colors.danger} />
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.typeLabel}>
            {getTransactionTypeLabel(transaction.type)}
          </Text>
          {transaction.description && (
            <Text style={styles.description} numberOfLines={1}>
              {transaction.description}
            </Text>
          )}
          <Text style={styles.date}>{formatDate(transaction.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <Text
          style={[
            styles.amount,
            isIncome || isWithdrawSuccess ? styles.amountIncome : styles.amountExpense,
          ]}
        >
          {isIncome || isWithdrawSuccess ? '+' : '-'}
          {formatAmount(transaction.amount)} đ
        </Text>
        <Text style={styles.balanceAfter}>
          Số dư: {formatAmount(transaction.balanceAfter)} đ
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  containerSuccess: {
    backgroundColor: Colors.primaryLight,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconContainerIncome: {
    backgroundColor: Colors.primaryLight,
  },
  iconContainerExpense: {
    backgroundColor: '#fee2e2', // red-100 equivalent
  },
  iconContainerSuccess: {
    backgroundColor: Colors.primaryLight,
  },
  infoContainer: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.foreground,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.mutedForeground,
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: Colors.mutedForeground,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  amountIncome: {
    color: Colors.success,
  },
  amountExpense: {
    color: Colors.danger,
  },
  balanceAfter: {
    fontSize: 12,
    color: Colors.mutedForeground,
  },
});

