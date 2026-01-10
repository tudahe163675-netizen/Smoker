import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAuthContext } from '@/contexts/AuthProvider';
import { createBankInfoApi } from '@/services/bankInfoApi';
import { Colors } from '@/constants/colors';
import type { BankInfo } from '@/services/bankInfoApi';

// Danh sách ngân hàng phổ biến ở Việt Nam (giống web)
const POPULAR_BANKS = [
  'Vietcombank (VCB)',
  'VietinBank (CTG)',
  'BIDV (BID)',
  'Techcombank (TCB)',
  'VPBank (VPB)',
  'ACB',
  'Sacombank (STB)',
  'MBBank (MBB)',
  'TPBank (TPB)',
  'SHB',
  'VIB',
  'MSB',
  'HD Bank',
  'SeABank',
  'Eximbank',
  'Agribank',
  'PVcomBank',
  'OceanBank',
  'DongABank',
  'Khác',
];

export default function AddBankScreen() {
  const router = useRouter();
  const { authState } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [customBankInput, setCustomBankInput] = useState(false);
  const [existingBankInfo, setExistingBankInfo] = useState<BankInfo | null>(null);

  useEffect(() => {
    loadExistingBankInfo();
  }, []);

  const loadExistingBankInfo = async () => {
    if (!authState.token || !authState.currentId) {
      setLoadingExisting(false);
      return;
    }

    try {
      setLoadingExisting(true);
      const bankInfoApi = createBankInfoApi(authState.token);
      const response = await bankInfoApi.getByAccountId(authState.currentId);

      if (response.success && response.data) {
        const bankData = Array.isArray(response.data) ? response.data[0] : response.data;
        if (bankData && bankData.BankInfoId) {
          setExistingBankInfo(bankData);
          setBankName(bankData.BankName || '');
          setAccountNumber(bankData.AccountNumber || '');
          setAccountHolderName(bankData.AccountHolderName || '');
          
          // Kiểm tra xem bankName có trong danh sách popular không
          const isInPopularBanks = POPULAR_BANKS.includes(bankData.BankName || '');
          setCustomBankInput(!isInPopularBanks && bankData.BankName !== '');
          setSelectedBank(isInPopularBanks ? bankData.BankName : 'Khác');
        }
      }
    } catch (error: any) {
      // 404 là bình thường nếu chưa có bank info
      if (error.response?.status !== 404) {
        console.error('Failed to load bank info:', error);
      }
    } finally {
      setLoadingExisting(false);
    }
  };

  const handleBankSelect = (bank: string) => {
    setSelectedBank(bank);
    const isOther = bank === 'Khác';
    setCustomBankInput(isOther);
    setBankName(isOther ? '' : bank);
  };

  const handleSubmit = async () => {
    if (customBankInput && !bankName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên ngân hàng');
      return;
    }

    if (!customBankInput && (!selectedBank || selectedBank === 'Khác')) {
      Alert.alert('Lỗi', 'Vui lòng chọn ngân hàng');
      return;
    }

    if (!accountNumber.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tài khoản');
      return;
    }

    // Validate số tài khoản chỉ chứa số
    if (!/^\d+$/.test(accountNumber.trim())) {
      Alert.alert('Lỗi', 'Số tài khoản chỉ được chứa số');
      return;
    }

    if (!accountHolderName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên chủ tài khoản');
      return;
    }

    if (!authState.token || !authState.currentId) {
      Alert.alert('Lỗi', 'Chưa đăng nhập');
      return;
    }

    try {
      setLoading(true);
      const bankInfoApi = createBankInfoApi(authState.token);
      
      let response;
      if (existingBankInfo && existingBankInfo.BankInfoId) {
        // Update existing - chỉ gửi các field cần update, không gửi AccountId
        // Backend expect camelCase (giống web)
        const updatePayload = {
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          accountHolderName: accountHolderName.trim(),
        };
        response = await bankInfoApi.update(existingBankInfo.BankInfoId, updatePayload);
      } else {
        // Create new - cần AccountId
        const createPayload = {
          AccountId: authState.currentId,
          BankName: bankName.trim(),
          AccountNumber: accountNumber.trim(),
          AccountHolderName: accountHolderName.trim(),
        };
        response = await bankInfoApi.create(createPayload);
      }

      if (response.success) {
        Alert.alert(
          'Thành công',
          existingBankInfo ? 'Cập nhật thông tin ngân hàng thành công!' : 'Thêm thông tin ngân hàng thành công!',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Lỗi', response.message || 'Thao tác thất bại');
      }
    } catch (error: any) {
      console.error('Bank info error:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Có lỗi xảy ra khi thêm thông tin ngân hàng';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingExisting) {
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {existingBankInfo ? 'Cập nhật thông tin ngân hàng' : 'Thêm thông tin ngân hàng'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Bank Name */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Tên ngân hàng <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.bankSelectContainer}>
              {POPULAR_BANKS.map((bank) => (
                <TouchableOpacity
                  key={bank}
                  style={[
                    styles.bankOption,
                    selectedBank === bank && styles.bankOptionSelected,
                  ]}
                  onPress={() => handleBankSelect(bank)}
                >
                  <Text
                    style={[
                      styles.bankOptionText,
                      selectedBank === bank && styles.bankOptionTextSelected,
                    ]}
                  >
                    {bank}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {customBankInput && (
              <TextInput
                style={[styles.input, styles.customBankInput]}
                value={bankName}
                onChangeText={setBankName}
                placeholder="Nhập tên ngân hàng"
                placeholderTextColor={Colors.mutedForeground}
              />
            )}
          </View>

          {/* Account Number */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Số tài khoản <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={accountNumber}
              onChangeText={(text) => {
                // Chỉ cho phép số
                const numericValue = text.replace(/[^0-9]/g, '');
                setAccountNumber(numericValue);
              }}
              placeholder="Nhập số tài khoản (chỉ số)"
              placeholderTextColor={Colors.mutedForeground}
              keyboardType="numeric"
              maxLength={20}
            />
            <Text style={styles.hint}>
              Chỉ nhập số, không có khoảng trắng hoặc ký tự đặc biệt
            </Text>
          </View>

          {/* Account Holder Name */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Tên chủ tài khoản <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={accountHolderName}
              onChangeText={setAccountHolderName}
              placeholder="Nhập tên chủ tài khoản"
              placeholderTextColor={Colors.mutedForeground}
              maxLength={150}
            />
            <Text style={styles.hint}>
              Tên chủ tài khoản ngân hàng (tên đầy đủ như trên thẻ/tài khoản)
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={Colors.primary} />
            <Text style={styles.infoText}>
              Thông tin ngân hàng sẽ được dùng để nhận tiền hoàn lại và rút tiền từ ví. Vui lòng
              nhập chính xác thông tin.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.cancelButton]}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (loading ||
              (!customBankInput && (!selectedBank || selectedBank === 'Khác')) ||
              (customBankInput && !bankName.trim()) ||
              !accountNumber.trim() ||
              !accountHolderName.trim()) &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={
            loading ||
            (!customBankInput && (!selectedBank || selectedBank === 'Khác')) ||
            (customBankInput && !bankName.trim()) ||
            !accountNumber.trim() ||
            !accountHolderName.trim()
          }
        >
          {loading ? (
            <ActivityIndicator color={Colors.primaryForeground} size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={Colors.primaryForeground} />
              <Text style={styles.submitButtonText}>
                {existingBankInfo ? 'Cập nhật' : 'Thêm mới'}
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
    flex: 1,
    textAlign: 'center',
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
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.foreground,
    marginBottom: 8,
  },
  required: {
    color: Colors.danger,
  },
  bankSelectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bankOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.input,
    minWidth: '30%',
  },
  bankOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  bankOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.foreground,
    textAlign: 'center',
  },
  bankOptionTextSelected: {
    color: Colors.primaryForeground,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: Colors.input,
    color: Colors.foreground,
  },
  customBankInput: {
    marginTop: 8,
  },
  hint: {
    fontSize: 12,
    color: Colors.mutedForeground,
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.primaryLight,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.foreground,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: Colors.mutedForeground,
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: Colors.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
});
