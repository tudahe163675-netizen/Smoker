import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, formatCurrency, formatAmount } from '@/constants/colors';
import { useAuthContext } from '@/contexts/AuthProvider';
import { createBankInfoApi } from '@/services/bankInfoApi';
import { createWalletApi } from '@/services/walletApi';
import type { Wallet, BankInfo } from '@/services/walletApi';

interface WithdrawModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableBalance: number;
  wallet: Wallet | null;
  onWithdraw: (amount: number, bankInfoId: string, pin: string) => Promise<void>;
}

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000, 200000, 500000];

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  visible,
  onClose,
  onSuccess,
  availableBalance,
  wallet,
  onWithdraw,
}) => {
  const { authState } = useAuthContext();
  const [amount, setAmount] = useState('');
  const [bankInfoId, setBankInfoId] = useState('');
  const [bankAccounts, setBankAccounts] = useState<BankInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [error, setError] = useState('');
  
  // PIN states
  const [pin, setPin] = useState('');
  const [showPinForm, setShowPinForm] = useState(false);
  const [pinError, setPinError] = useState('');
  const [needsSetPin, setNeedsSetPin] = useState(false);

  useEffect(() => {
    if (visible) {
      loadBankAccounts();
      if (wallet && !wallet.hasPin) {
        setNeedsSetPin(true);
      } else {
        setNeedsSetPin(false);
      }
    } else {
      // Reset form when modal closes
      setAmount('');
      setBankInfoId('');
      setPin('');
      setError('');
      setPinError('');
      setShowPinForm(false);
      setNeedsSetPin(false);
    }
  }, [visible, wallet]);

  const loadBankAccounts = async () => {
    if (!authState.token || !authState.currentId) {
      setError('Chưa đăng nhập');
      setLoadingBanks(false);
      return;
    }

    try {
      setLoadingBanks(true);
      const bankInfoApi = createBankInfoApi(authState.token);
      const response = await bankInfoApi.getByAccountId(authState.currentId);

      if (response.success && response.data) {
        const banks = Array.isArray(response.data) ? response.data : [response.data];
        setBankAccounts(banks.filter((b) => b && b.BankInfoId));
      } else {
        setError('Không thể tải danh sách tài khoản ngân hàng');
      }
    } catch (err) {
      console.error('Failed to load bank accounts:', err);
      setError('Không thể tải danh sách tài khoản ngân hàng');
    } finally {
      setLoadingBanks(false);
    }
  };

  const handlePinChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 6) {
      setPin(numericValue);
      setPinError('');
    }
  };

  const handleContinueToPin = (): boolean => {
    const amountNum = parseFloat(amount);
    if (!amount || amountNum <= 0) {
      setError('Số tiền phải lớn hơn 0');
      return false;
    }

    if (amountNum > availableBalance) {
      setError(
        `Số tiền không được vượt quá số dư khả dụng (${formatCurrency(availableBalance)})`
      );
      return false;
    }

    if (!bankInfoId) {
      setError('Vui lòng chọn tài khoản ngân hàng');
      return false;
    }

    setError('');
    setShowPinForm(true);
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    setPinError('');

    // Nếu đang ở form PIN
    if (showPinForm) {
      if (needsSetPin) {
        await handleSetPin();
      } else {
        await handleVerifyPin();
      }
      return;
    }

    // Nếu chưa nhập amount và bank, validate và chuyển sang form PIN
    handleContinueToPin();
  };

  const handleSetPin = async () => {
    if (!pin || pin.length !== 6) {
      setPinError('PIN phải là 6 chữ số');
      return;
    }

    try {
      setLoading(true);
      setPinError('');

      if (!authState.token) {
        setPinError('Chưa đăng nhập');
        return;
      }

      const walletApi = createWalletApi(authState.token);
      const res = await walletApi.setPin(pin);

      if (res.success) {
        setNeedsSetPin(false);
        setPin('');
        // Sau khi set PIN xong, hiển thị form verify PIN
        setShowPinForm(true);
      } else {
        setPinError(res.message || 'Set PIN thất bại');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Set PIN thất bại';
      setPinError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPin = async () => {
    if (!pin || pin.length !== 6) {
      setPinError('PIN phải là 6 chữ số');
      return;
    }

    try {
      setLoading(true);
      setPinError('');

      if (!authState.token) {
        setPinError('Chưa đăng nhập');
        return;
      }

      const walletApi = createWalletApi(authState.token);
      const res = await walletApi.verifyPin(pin);

      if (res.success) {
        // PIN đúng, tiếp tục với withdraw
        await handleWithdraw();
      } else {
        setPinError(res.message || 'PIN không đúng');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'PIN không đúng';
      setPinError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amountNum = parseFloat(amount);
    if (!amount || amountNum <= 0) {
      setError('Số tiền phải lớn hơn 0');
      return;
    }

    if (amountNum > availableBalance) {
      setError(
        `Số tiền không được vượt quá số dư khả dụng (${formatCurrency(availableBalance)})`
      );
      return;
    }

    if (!bankInfoId) {
      setError('Vui lòng chọn tài khoản ngân hàng');
      return;
    }

    if (!pin || pin.length !== 6) {
      setPinError('PIN phải là 6 chữ số');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setPinError('');

      await onWithdraw(amountNum, bankInfoId, pin);

      // Success
      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gửi yêu cầu rút tiền thất bại';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setAmount(numericValue);
    setError('');
  };

  const selectQuickAmount = (quickAmount: number) => {
    if (quickAmount <= availableBalance) {
      setAmount(quickAmount.toString());
      setError('');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.overlayInner}>
          <View style={styles.modalContainer}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Rút tiền</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.scrollView} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
            {/* Withdraw Form */}
            {!showPinForm && (
              <>
                <View style={styles.section}>
                  <Text style={styles.label}>Số tiền (đ)</Text>
                  <TextInput
                    style={styles.input}
                    value={amount}
                    onChangeText={handleAmountChange}
                    placeholder="Nhập số tiền muốn rút"
                    placeholderTextColor={Colors.mutedForeground}
                    keyboardType="numeric"
                    editable={!loading}
                  />
                  <Text style={styles.hint}>
                    Số dư khả dụng: {formatCurrency(availableBalance)}
                  </Text>

                  {/* Quick Amount Selection */}
                  <View style={styles.quickAmountContainer}>
                    <Text style={styles.quickAmountLabel}>Chọn mức giá nhanh:</Text>
                    <View style={styles.quickAmountGrid}>
                      {QUICK_AMOUNTS.map((quickAmount) => {
                        const isDisabled = quickAmount > availableBalance;
                        const isSelected = amount === quickAmount.toString();
                        return (
                          <TouchableOpacity
                            key={quickAmount}
                            style={[
                              styles.quickAmountButton,
                              isSelected && styles.quickAmountButtonSelected,
                              isDisabled && styles.quickAmountButtonDisabled,
                            ]}
                            onPress={() => selectQuickAmount(quickAmount)}
                            disabled={isDisabled || loading}
                          >
                            <Text
                              style={[
                                styles.quickAmountText,
                                isSelected && styles.quickAmountTextSelected,
                                isDisabled && styles.quickAmountTextDisabled,
                              ]}
                            >
                              {formatAmount(quickAmount)} đ
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>Tài khoản ngân hàng</Text>
                  {loadingBanks ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : bankAccounts.length === 0 ? (
                    <Text style={styles.hint}>
                      Bạn chưa có tài khoản ngân hàng. Vui lòng thêm tài khoản trước.
                    </Text>
                  ) : (
                    <View style={styles.bankList}>
                      {bankAccounts.map((bank) => (
                        <TouchableOpacity
                          key={bank.BankInfoId}
                          style={[
                            styles.bankItem,
                            bankInfoId === bank.BankInfoId && styles.bankItemSelected,
                          ]}
                          onPress={() => {
                            setBankInfoId(bank.BankInfoId);
                            setError('');
                          }}
                          disabled={loading}
                        >
                          <View style={styles.bankInfo}>
                            <Text style={styles.bankName}>{bank.BankName}</Text>
                            <Text style={styles.bankAccount}>
                              {bank.AccountNumber}
                              {bank.AccountHolderName && ` (${bank.AccountHolderName})`}
                            </Text>
                          </View>
                          {bankInfoId === bank.BankInfoId && (
                            <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}

            {/* PIN Form */}
            {showPinForm && (
              <View style={styles.section}>
                <Text style={styles.label}>
                  {needsSetPin
                    ? 'Thiết lập PIN bảo mật (6 chữ số)'
                    : 'Nhập PIN để xác thực (6 chữ số)'}
                </Text>
                <TextInput
                  style={[styles.input, styles.pinInput]}
                  value={pin}
                  onChangeText={handlePinChange}
                  placeholder="Nhập 6 chữ số"
                  placeholderTextColor={Colors.mutedForeground}
                  keyboardType="numeric"
                  maxLength={6}
                  secureTextEntry
                  editable={!loading}
                  autoFocus
                />
                {needsSetPin && (
                  <Text style={styles.hint}>
                    PIN này sẽ được dùng để xác thực khi rút tiền
                  </Text>
                )}
                {wallet?.isLocked && wallet?.lockedUntil && (
                  <Text style={styles.errorText}>
                    Ví đã bị khóa. Vui lòng thử lại sau{' '}
                    {Math.ceil(
                      (new Date(wallet.lockedUntil).getTime() - new Date().getTime()) /
                        (1000 * 60)
                    )}{' '}
                    phút
                  </Text>
                )}
                {pinError ? <Text style={styles.errorText}>{pinError}</Text> : null}
              </View>
            )}

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            {showPinForm ? (
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => {
                  setShowPinForm(false);
                  setPin('');
                  setPinError('');
                }}
                disabled={loading}
              >
                <Text style={styles.buttonSecondaryText}>Quay lại</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.buttonSecondaryText}>Hủy</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonPrimary,
                (loading ||
                  (showPinForm && (!pin || pin.length !== 6)) ||
                  (!showPinForm && (!amount || !bankInfoId || bankAccounts.length === 0))) &&
                  styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={
                loading ||
                (showPinForm && (!pin || pin.length !== 6)) ||
                (!showPinForm && (!amount || !bankInfoId || bankAccounts.length === 0))
              }
            >
              {loading ? (
                <ActivityIndicator color={Colors.primaryForeground} size="small" />
              ) : (
                <Text style={styles.buttonPrimaryText}>
                  {showPinForm && needsSetPin
                    ? 'Thiết lập PIN'
                    : showPinForm && !needsSetPin
                    ? 'Xác thực PIN'
                    : 'Tiếp tục'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  overlayInner: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.foreground,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    maxHeight: 500,
  },
  section: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.foreground,
    marginBottom: 8,
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
  pinInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
    fontFamily: 'monospace',
  },
  hint: {
    fontSize: 12,
    color: Colors.mutedForeground,
    marginTop: 4,
  },
  quickAmountContainer: {
    marginTop: 16,
  },
  quickAmountLabel: {
    fontSize: 12,
    color: Colors.mutedForeground,
    marginBottom: 8,
  },
  quickAmountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    minWidth: '30%',
  },
  quickAmountButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickAmountButtonDisabled: {
    opacity: 0.5,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.foreground,
    textAlign: 'center',
  },
  quickAmountTextSelected: {
    color: Colors.primaryForeground,
  },
  quickAmountTextDisabled: {
    color: Colors.mutedForeground,
  },
  bankList: {
    gap: 8,
  },
  bankItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.input,
  },
  bankItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.foreground,
    marginBottom: 4,
  },
  bankAccount: {
    fontSize: 14,
    color: Colors.mutedForeground,
  },
  errorContainer: {
    padding: 12,
    margin: 16,
    borderRadius: 8,
    backgroundColor: '#fee2e2', // red-100
  },
  errorText: {
    fontSize: 14,
    color: Colors.danger,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: Colors.primary,
  },
  buttonSecondary: {
    backgroundColor: Colors.muted,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPrimaryText: {
    color: Colors.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondaryText: {
    color: Colors.mutedForeground,
    fontSize: 16,
    fontWeight: '500',
  },
});

