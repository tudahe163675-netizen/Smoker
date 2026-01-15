import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PaymentSummaryProps {
  selectedSlots: number[];
  priceCalculation: {
    unitPrice: number;
    totalPrice: number;
    priceType: 'pricePerHour' | 'pricePerSession';
  };
  maxConsecutiveSlots: number;
  depositAmount: number;
  onShowDetails?: () => void;
}

/**
 * PaymentSummary Component - Receipt Card Style for App
 * Hiển thị thông tin thanh toán theo phong cách hóa đơn thu gọn
 */
export default function PaymentSummary({
  selectedSlots,
  priceCalculation,
  maxConsecutiveSlots,
  depositAmount,
  onShowDetails
}: PaymentSummaryProps) {
  if (!selectedSlots || selectedSlots.length === 0 || !priceCalculation || priceCalculation.unitPrice <= 0) {
    return null;
  }

  const { unitPrice, totalPrice, priceType } = priceCalculation;
  const remaining = totalPrice > depositAmount ? totalPrice - depositAmount : 0;
  
  // Determine price label
  const priceLabel = priceType === 'pricePerSession' 
    ? 'Ưu đãi' 
    : 'Tiêu chuẩn';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="receipt-outline" size={18} color="#374151" />
        <Text style={styles.headerText}>Thông tin thanh toán</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Số slot đã chọn */}
        <View style={styles.row}>
          <Text style={styles.label}>Số slot đã chọn:</Text>
          <Text style={styles.value}>{selectedSlots.length} slot</Text>
        </View>

        {/* Đơn giá */}
        <View style={styles.priceRow}>
          <Text style={styles.label}>
            {selectedSlots.length} slot ({priceLabel})
          </Text>
          <View style={styles.dottedLineContainer}>
            <View style={styles.dottedLine} />
            <Text style={styles.priceValue}>
              {unitPrice.toLocaleString('vi-VN')} đ
            </Text>
          </View>
        </View>

        {/* Divider - Giống web: border-t với padding */}
        <View style={styles.dividerContainer}>
          {/* Tổng tiền */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TỔNG TIỀN</Text>
            <View style={styles.dottedLineContainer}>
              <View style={styles.dottedLine} />
              <Text style={styles.totalValue}>
                {totalPrice.toLocaleString('vi-VN')} đ
              </Text>
            </View>
          </View>

          {/* Đặt cọc */}
          <View style={styles.row}>
            <Text style={styles.mutedLabel}>Đặt cọc</Text>
            <View style={styles.dottedLineContainer}>
              <View style={styles.dottedLine} />
              <Text style={styles.mutedValue}>
                {depositAmount.toLocaleString('vi-VN')} đ
              </Text>
            </View>
          </View>

          {/* Còn lại */}
          {remaining > 0 && (
            <View style={styles.row}>
              <Text style={styles.mutedLabel}>Còn lại</Text>
              <View style={styles.dottedLineContainer}>
                <View style={styles.dottedLine} />
                <Text style={styles.mutedValue}>
                  {remaining.toLocaleString('vi-VN')} đ
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827'
  },
  content: {
    gap: 12
  },
  dividerContainer: {
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
    paddingTop: 12,
    marginTop: 12,
    gap: 8
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  label: {
    fontSize: 14,
    color: '#111827'
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827'
  },
  mutedLabel: {
    fontSize: 14,
    color: '#6b7280'
  },
  mutedValue: {
    fontSize: 14,
    color: '#6b7280'
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827'
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3b82f6'
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827'
  },
  dottedLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    maxWidth: 200,
    marginLeft: 8
  },
  dottedLine: {
    flex: 1,
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    borderStyle: 'dashed',
    marginRight: 8
  },
});

