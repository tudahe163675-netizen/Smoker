import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, formatCurrency } from '@/constants/colors';
import type { Wallet } from '@/services/walletApi';

interface WalletCardProps {
  wallet: Wallet | null;
  onWithdraw: () => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({ wallet, onWithdraw }) => {
  const availableBalance = Math.max(0, (wallet?.balance || 0) - (wallet?.lockedBalance || 0));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="wallet" size={24} color={Colors.primary} />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.titleLabel}>Ví của tôi</Text>
          <Text style={styles.balance}>
            {formatCurrency(wallet?.balance || 0)}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <View style={styles.detailLeft}>
            <Ionicons name="lock-closed" size={16} color={Colors.mutedForeground} />
            <Text style={styles.detailLabel}>Đang khóa</Text>
          </View>
          <Text style={styles.detailValue}>
            {formatCurrency(wallet?.lockedBalance || 0)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Khả dụng</Text>
          <Text style={styles.availableBalance}>
            {formatCurrency(availableBalance)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.withdrawButton,
          availableBalance <= 0 && styles.withdrawButtonDisabled,
        ]}
        onPress={onWithdraw}
        disabled={availableBalance <= 0}
      >
        <Text style={styles.withdrawButtonText}>Rút tiền</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  titleLabel: {
    fontSize: 14,
    color: Colors.mutedForeground,
    marginBottom: 4,
  },
  balance: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.foreground,
  },
  details: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.mutedForeground,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.foreground,
  },
  availableBalance: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.foreground,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  withdrawButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawButtonDisabled: {
    backgroundColor: Colors.muted,
    opacity: 0.5,
  },
  withdrawButtonText: {
    color: Colors.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
});

