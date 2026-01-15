import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface PaymentStickyBarProps {
  totalPrice: number;
  deposit: number;
  remaining: number;
  onContinue: () => void;
  onShowDetails?: () => void;
  disabled?: boolean;
}

/**
 * PaymentStickyBar Component
 * Bottom sticky bar hiển thị tổng tiền và nút tiếp tục
 * Luôn visible khi có slot được chọn
 */
export default function PaymentStickyBar({
  totalPrice,
  deposit,
  remaining,
  onContinue,
  onShowDetails,
  disabled = false
}: PaymentStickyBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.container,
      {
        paddingBottom: Math.max(insets.bottom, 8)
      }
    ]}>
      {/* Left: Summary */}
      <TouchableOpacity
        style={styles.summaryContainer}
        onPress={onShowDetails}
        activeOpacity={onShowDetails ? 0.7 : 1}
        disabled={!onShowDetails}
      >
        <View style={styles.summaryContent}>
          <Text style={styles.summaryLabel}>Tổng:</Text>
          <Text style={styles.summaryTotal}>{totalPrice.toLocaleString('vi-VN')} đ</Text>
          <Text style={styles.summarySeparator}>|</Text>
          <Text style={styles.summaryLabel}>Cọc:</Text>
          <Text style={styles.summaryDeposit}>{deposit.toLocaleString('vi-VN')} đ</Text>
        </View>
        {onShowDetails && (
          <Ionicons name="chevron-up" size={16} color="#6b7280" style={styles.chevronIcon} />
        )}
      </TouchableOpacity>

      {/* Right: Continue Button */}
      <TouchableOpacity
        style={[
          styles.continueButton,
          disabled && styles.continueButtonDisabled
        ]}
        onPress={onContinue}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text style={styles.continueButtonText}>Tiếp tục</Text>
        <Ionicons name="arrow-forward" size={16} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000
  },
  summaryContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12
  },
  summaryContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280'
  },
  summaryTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3b82f6'
  },
  summarySeparator: {
    fontSize: 12,
    color: '#d1d5db',
    marginHorizontal: 4
  },
  summaryDeposit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151'
  },
  chevronIcon: {
    marginLeft: 4
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
    minWidth: 120
  },
  continueButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.6
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff'
  }
});

