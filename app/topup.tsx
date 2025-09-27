// app/topup.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface TopUpOption {
  id: string;
  amount: number;
  bonus?: number;
  popular?: boolean;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
  enabled: boolean;
}

const topUpOptions: TopUpOption[] = [
  { id: '1', amount: 50000 },
  { id: '2', amount: 100000 },
  { id: '3', amount: 200000, bonus: 10000, popular: true },
  { id: '4', amount: 500000, bonus: 50000 },
  { id: '5', amount: 1000000, bonus: 150000 },
  { id: '6', amount: 2000000, bonus: 400000 },
];

const paymentMethods: PaymentMethod[] = [
  {
    id: 'bank_transfer',
    name: 'Chuyển khoản ngân hàng',
    icon: 'card-outline',
    description: 'Chuyển khoản qua ATM hoặc Internet Banking',
    enabled: true,
  },
  {
    id: 'momo',
    name: 'Ví MoMo',
    icon: 'wallet-outline',
    description: 'Thanh toán qua ví điện tử MoMo',
    enabled: true,
  },
  {
    id: 'zalopay',
    name: 'ZaloPay',
    icon: 'phone-portrait-outline',
    description: 'Thanh toán qua ví điện tử ZaloPay',
    enabled: true,
  },
  {
    id: 'vnpay',
    name: 'VNPay',
    icon: 'credit-card-outline',
    description: 'Thanh toán qua VNPay',
    enabled: true,
  },
];

export default function TopUpScreen() {
  const router = useRouter();
  const [selectedAmount, setSelectedAmount] = useState<TopUpOption | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const setCustomAmountValue = (amount: string) => {
    // Only allow numbers
    const numericAmount = amount.replace(/[^0-9]/g, '');
    setCustomAmount(numericAmount);
    setSelectedAmount(null);
  };

  const getFinalAmount = (): number => {
    if (selectedAmount) {
      return selectedAmount.amount + (selectedAmount.bonus || 0);
    }
    return parseInt(customAmount) || 0;
  };

  const getBaseAmount = (): number => {
    if (selectedAmount) {
      return selectedAmount.amount;
    }
    return parseInt(customAmount) || 0;
  };

  const getBonusAmount = (): number => {
    if (selectedAmount) {
      return selectedAmount.bonus || 0;
    }
    return 0;
  };

  const handleTopUp = async () => {
    const baseAmount = getBaseAmount();

    // Validation
    if (!baseAmount || baseAmount < 10000) {
      Alert.alert('Lỗi', 'Số tiền nạp tối thiểu là 10.000 VND');
      return;
    }

    if (baseAmount > 10000000) {
      Alert.alert('Lỗi', 'Số tiền nạp tối đa là 10.000.000 VND');
      return;
    }

    if (!selectedPaymentMethod) {
      Alert.alert('Lỗi', 'Vui lòng chọn phương thức thanh toán');
      return;
    }

    setIsProcessing(true);

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay

      const finalAmount = getFinalAmount();
      
      Alert.alert(
        'Thành công',
        `Nạp tiền thành công!\nSố tiền: ${formatCurrency(finalAmount)}`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi xử lý giao dịch');
    } finally {
      setIsProcessing(false);
    }
  };

  const AmountCard = ({ option }: { option: TopUpOption }) => {
    const isSelected = selectedAmount?.id === option.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.amountCard,
          isSelected && styles.amountCardSelected,
          option.popular && styles.amountCardPopular,
        ]}
        onPress={() => {
          setSelectedAmount(option);
          setCustomAmount('');
        }}
      >
        {option.popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>Phổ biến</Text>
          </View>
        )}
        
        <Text style={[
          styles.amountText,
          isSelected && styles.amountTextSelected,
        ]}>
          {formatCurrency(option.amount)}
        </Text>
        
        {option.bonus && (
          <Text style={styles.bonusText}>
            +{formatCurrency(option.bonus)} thưởng
          </Text>
        )}
        
        {isSelected && (
          <View style={styles.selectedIcon}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const PaymentMethodCard = ({ method }: { method: PaymentMethod }) => {
    const isSelected = selectedPaymentMethod?.id === method.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.paymentCard,
          isSelected && styles.paymentCardSelected,
          !method.enabled && styles.paymentCardDisabled,
        ]}
        onPress={() => method.enabled && setSelectedPaymentMethod(method)}
        disabled={!method.enabled}
      >
        <View style={styles.paymentLeft}>
          <View style={[
            styles.paymentIcon,
            isSelected && styles.paymentIconSelected,
          ]}>
            <Ionicons 
              name={method.icon as any} 
              size={24} 
              color={isSelected ? '#fff' : '#6b7280'} 
            />
          </View>
          
          <View style={styles.paymentInfo}>
            <Text style={[
              styles.paymentName,
              !method.enabled && styles.paymentNameDisabled,
            ]}>
              {method.name}
            </Text>
            <Text style={[
              styles.paymentDescription,
              !method.enabled && styles.paymentDescriptionDisabled,
            ]}>
              {method.description}
            </Text>
          </View>
        </View>
        
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
        )}
      </TouchableOpacity>
    );
  };

  const baseAmount = getBaseAmount();
  const bonusAmount = getBonusAmount();
  const finalAmount = getFinalAmount();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nạp tiền</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Amount Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chọn số tiền nạp</Text>
          
          <View style={styles.amountGrid}>
            {topUpOptions.map((option) => (
              <AmountCard key={option.id} option={option} />
            ))}
          </View>
          
          {/* Custom Amount */}
          <View style={styles.customAmountContainer}>
            <Text style={styles.customAmountLabel}>Hoặc nhập số tiền khác:</Text>
            <TextInput
              style={[
                styles.customAmountInput,
                customAmount && styles.customAmountInputActive,
              ]}
              value={customAmount}
              onChangeText={setCustomAmountValue}
              placeholder="Nhập số tiền (VND)"
              keyboardType="numeric"
              maxLength={10}
            />
            {customAmount && (
              <Text style={styles.customAmountFormatted}>
                = {formatCurrency(parseInt(customAmount) || 0)}
              </Text>
            )}
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          
          {paymentMethods.map((method) => (
            <PaymentMethodCard key={method.id} method={method} />
          ))}
        </View>

        {/* Summary */}
        {(baseAmount > 0) && (
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Tóm tắt giao dịch</Text>
            
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Số tiền nạp:</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(baseAmount)}
                </Text>
              </View>
              
              {bonusAmount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tiền thưởng:</Text>
                  <Text style={styles.summaryBonus}>
                    +{formatCurrency(bonusAmount)}
                  </Text>
                </View>
              )}
              
              <View style={styles.summaryDivider} />
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotalLabel}>Tổng nhận được:</Text>
                <Text style={styles.summaryTotalValue}>
                  {formatCurrency(finalAmount)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.topUpButton,
            (!selectedPaymentMethod || baseAmount < 10000) && styles.topUpButtonDisabled,
          ]}
          onPress={handleTopUp}
          disabled={!selectedPaymentMethod || baseAmount < 10000 || isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="card" size={20} color="#fff" />
              <Text style={styles.topUpButtonText}>
                Nạp {formatCurrency(finalAmount)}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  amountCard: {
    width: '48%',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    margin: '1%',
    position: 'relative',
    minHeight: 80,
  },
  amountCardSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  amountCardPopular: {
    borderColor: '#f59e0b',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  popularText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  amountTextSelected: {
    color: '#2563eb',
  },
  bonusText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  selectedIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  customAmountContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  customAmountLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  customAmountInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  customAmountInputActive: {
    borderColor: '#2563eb',
  },
  customAmountFormatted: {
    fontSize: 14,
    color: '#10b981',
    marginTop: 4,
    fontWeight: '500',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  paymentCardSelected: {
    backgroundColor: '#f0f9ff',
  },
  paymentCardDisabled: {
    opacity: 0.5,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentIconSelected: {
    backgroundColor: '#2563eb',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  paymentNameDisabled: {
    color: '#9ca3af',
  },
  paymentDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  paymentDescriptionDisabled: {
    color: '#d1d5db',
  },
  summarySection: {
    backgroundColor: '#fff',
    marginTop: 12,
    paddingVertical: 16,
  },
  summaryContainer: {
    paddingHorizontal: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  summaryBonus: {
    fontSize: 16,
    fontWeight: '500',
    color: '#10b981',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  summaryTotalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  bottomContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  topUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
  },
  topUpButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  topUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});