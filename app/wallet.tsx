import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { WalletCard } from '@/components/wallet/WalletCard';
import { TransactionItem } from '@/components/wallet/TransactionItem';
import { WithdrawModal } from '@/components/wallet/WithdrawModal';
import { useWallet } from '@/hooks/useWallet';
import { Colors, formatCurrency, formatAmount } from '@/constants/colors';
import type { Wallet, Transaction, WithdrawRequest } from '@/services/walletApi';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
    case 'paid':
      return <Ionicons name="checkmark-circle" size={16} color={Colors.success} />;
    case 'pending':
    case 'approved':
      return <Ionicons name="time" size={16} color={Colors.warning} />;
    case 'rejected':
      return <Ionicons name="close-circle" size={16} color={Colors.danger} />;
    default:
      return null;
  }
};

const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: 'Đang chờ',
    approved: 'Đã duyệt',
    rejected: 'Đã từ chối',
    paid: 'Đã chuyển tiền',
    completed: 'Hoàn thành',
  };
  return statusMap[status] || status;
};

const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  // SQL Server trả về datetime string dạng 'YYYY-MM-DD HH:mm:ss.mmm'
  // Database đã lưu đúng giờ Việt Nam (GMT+7), cần parse thủ công để không bị convert timezone
  if (typeof dateString === 'string') {
    // Kiểm tra format datetime từ SQL Server
    const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?/);
    if (match) {
      const [, year, month, day, hour, minute, second] = match;
      // Tạo date object với timezone local (không dùng timeZone option để tránh double conversion)
      const localDate = new Date(
        Number.parseInt(year, 10),
        Number.parseInt(month, 10) - 1,
        Number.parseInt(day, 10),
        Number.parseInt(hour, 10),
        Number.parseInt(minute, 10),
        Number.parseInt(second || '0', 10)
      );
      // Format không dùng timeZone để giữ nguyên giờ đã parse
      return localDate.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
  
  // Fallback: parse như bình thường
  try {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

export default function WalletScreen() {
  const router = useRouter();
  const { getWallet, getTransactions, getWithdrawRequests, createWithdrawRequest, setPin, verifyPin, loading } = useWallet();
  
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Pagination states
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [withdrawRequestsPage, setWithdrawRequestsPage] = useState(1);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true);
  const [hasMoreWithdrawRequests, setHasMoreWithdrawRequests] = useState(true);
  const [loadingMoreTransactions, setLoadingMoreTransactions] = useState(false);
  const [loadingMoreWithdrawRequests, setLoadingMoreWithdrawRequests] = useState(false);

  const TRANSACTIONS_PER_PAGE = 5;
  const WITHDRAW_REQUESTS_PER_PAGE = 5;

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setTransactionsPage(1);
        setWithdrawRequestsPage(1);
        setHasMoreTransactions(true);
        setHasMoreWithdrawRequests(true);
      }

      // Chỉ load khi refresh, không load lại khi scroll
      if (!isRefresh) {
        return; // Không load lại nếu không phải refresh
      }

      const [walletData, transactionsData, withdrawRequestsData] = await Promise.all([
        getWallet(),
        getTransactions({ offset: 0, limit: TRANSACTIONS_PER_PAGE }),
        getWithdrawRequests({ offset: 0, limit: WITHDRAW_REQUESTS_PER_PAGE }),
      ]);

      if (walletData) setWallet(walletData);
      
      if (transactionsData) {
        setTransactions(transactionsData);
        setHasMoreTransactions(transactionsData.length === TRANSACTIONS_PER_PAGE);
      }
      
      if (withdrawRequestsData) {
        setWithdrawRequests(withdrawRequestsData);
        setHasMoreWithdrawRequests(withdrawRequestsData.length === WITHDRAW_REQUESTS_PER_PAGE);
      }
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [getWallet, getTransactions, getWithdrawRequests]);

  useEffect(() => {
    loadData(true); // Gọi với isRefresh=true để load lần đầu
  }, []); // Empty dependency array - chỉ gọi một lần khi mount

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true);
  }, [loadData]);

  const loadMoreTransactions = useCallback(async () => {
    if (loadingMoreTransactions || !hasMoreTransactions) return;
    
    setLoadingMoreTransactions(true);
    try {
      const nextPage = transactionsPage + 1;
      const offset = (nextPage - 1) * TRANSACTIONS_PER_PAGE;
      const transactionsData = await getTransactions({ offset, limit: TRANSACTIONS_PER_PAGE });
      
      if (transactionsData && transactionsData.length > 0) {
        setTransactions(prev => [...prev, ...transactionsData]);
        setHasMoreTransactions(transactionsData.length === TRANSACTIONS_PER_PAGE);
        setTransactionsPage(nextPage);
      } else {
        setHasMoreTransactions(false);
      }
    } catch (error) {
      console.error('Failed to load more transactions:', error);
    } finally {
      setLoadingMoreTransactions(false);
    }
  }, [getTransactions, transactionsPage, hasMoreTransactions, loadingMoreTransactions]);

  const loadMoreWithdrawRequests = useCallback(async () => {
    if (loadingMoreWithdrawRequests || !hasMoreWithdrawRequests) return;
    
    setLoadingMoreWithdrawRequests(true);
    try {
      const nextPage = withdrawRequestsPage + 1;
      const offset = (nextPage - 1) * WITHDRAW_REQUESTS_PER_PAGE;
      const withdrawRequestsData = await getWithdrawRequests({ offset, limit: WITHDRAW_REQUESTS_PER_PAGE });
      
      if (withdrawRequestsData && withdrawRequestsData.length > 0) {
        setWithdrawRequests(prev => [...prev, ...withdrawRequestsData]);
        setHasMoreWithdrawRequests(withdrawRequestsData.length === WITHDRAW_REQUESTS_PER_PAGE);
        setWithdrawRequestsPage(nextPage);
      } else {
        setHasMoreWithdrawRequests(false);
      }
    } catch (error) {
      console.error('Failed to load more withdraw requests:', error);
    } finally {
      setLoadingMoreWithdrawRequests(false);
    }
  }, [getWithdrawRequests, withdrawRequestsPage, hasMoreWithdrawRequests, loadingMoreWithdrawRequests]);

  const handleWithdrawSuccess = useCallback(() => {
    setShowWithdrawModal(false);
    loadData();
  }, [loadData]);

  const handleWithdraw = useCallback(
    async (amount: number, bankInfoId: string, pin: string) => {
      // Tạo yêu cầu rút tiền (PIN đã được verify trong WithdrawModal)
      const result = await createWithdrawRequest(amount, bankInfoId, pin);
      if (!result) {
        throw new Error('Tạo yêu cầu rút tiền thất bại');
      }
    },
    [createWithdrawRequest]
  );

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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ví của tôi</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Wallet Card */}
        <View style={styles.content}>
          <WalletCard wallet={wallet} onWithdraw={() => setShowWithdrawModal(true)} />

          {/* PIN Status */}
          {wallet && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bảo mật ví</Text>
              <View style={styles.pinStatusContainer}>
                <Text style={styles.pinStatusLabel}>Trạng thái PIN:</Text>
                <Text
                  style={[
                    styles.pinStatusValue,
                    wallet.hasPin ? styles.pinStatusValueActive : styles.pinStatusValueInactive,
                  ]}
                >
                  {wallet.hasPin ? 'Đã thiết lập' : 'Chưa thiết lập'}
                </Text>
              </View>
              {wallet.isLocked && wallet.lockedUntil && (
                <View style={styles.lockedWarning}>
                  <Ionicons name="warning" size={16} color={Colors.danger} />
                  <Text style={styles.lockedText}>
                    Ví đã bị khóa. Vui lòng thử lại sau{' '}
                    {Math.ceil(
                      (new Date(wallet.lockedUntil).getTime() - new Date().getTime()) / (1000 * 60)
                    )}{' '}
                    phút
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Withdraw Requests */}
          {withdrawRequests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Yêu cầu rút tiền</Text>
              {withdrawRequests.map((request) => (
                <View key={request.id} style={styles.withdrawRequestItem}>
                  <View style={styles.withdrawRequestLeft}>
                    <View style={styles.withdrawRequestHeader}>
                      <Text style={styles.withdrawRequestAmount}>
                        {formatCurrency(request.amount)}
                      </Text>
                      {getStatusIcon(request.status)}
                    </View>
                    <Text style={styles.withdrawRequestBank}>
                      {request.bankName} - {request.accountNumber}
                      {(request.accountHolderName || (request as any).AccountHolderName) && ` - ${request.accountHolderName || (request as any).AccountHolderName}`}
                    </Text>
                    <Text style={styles.withdrawRequestDate}>
                      {formatDate(request.requestedAt)}
                    </Text>
                  </View>
                  <Text style={styles.withdrawRequestStatus}>
                    {getStatusLabel(request.status)}
                  </Text>
                </View>
              ))}
              {hasMoreWithdrawRequests ? (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={loadMoreWithdrawRequests}
                  disabled={loadingMoreWithdrawRequests}
                >
                  {loadingMoreWithdrawRequests ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <Text style={styles.loadMoreText}>Xem thêm</Text>
                  )}
                </TouchableOpacity>
              ) : withdrawRequests.length > 0 && (
                <View style={styles.endMessage}>
                  <Text style={styles.endText}>Hết</Text>
                </View>
              )}
            </View>
          )}

          {/* Transaction History */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lịch sử giao dịch</Text>
            {transactions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={48} color={Colors.mutedForeground} />
                <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
              </View>
            ) : (
              <>
                {transactions.map((transaction) => (
                  <TransactionItem key={transaction.id} transaction={transaction} />
                ))}
                {hasMoreTransactions ? (
                  <TouchableOpacity
                    style={styles.loadMoreButton}
                    onPress={loadMoreTransactions}
                    disabled={loadingMoreTransactions}
                  >
                    {loadingMoreTransactions ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <Text style={styles.loadMoreText}>Xem thêm</Text>
                    )}
                  </TouchableOpacity>
                ) : transactions.length > 0 && (
                  <View style={styles.endMessage}>
                    <Text style={styles.endText}>Hết</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Withdraw Modal */}
      <WithdrawModal
        visible={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        onSuccess={handleWithdrawSuccess}
        availableBalance={Math.max(0, (wallet?.balance || 0) - (wallet?.lockedBalance || 0))}
        wallet={wallet}
        onWithdraw={handleWithdraw}
      />
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
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: 16,
  },
  pinStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  pinStatusLabel: {
    fontSize: 14,
    color: Colors.foreground,
  },
  pinStatusValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  pinStatusValueActive: {
    color: Colors.success,
  },
  pinStatusValueInactive: {
    color: Colors.warning,
  },
  lockedWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fee2e2', // red-100
    marginTop: 12,
  },
  lockedText: {
    fontSize: 14,
    color: Colors.danger,
    flex: 1,
  },
  withdrawRequestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    backgroundColor: Colors.input,
  },
  withdrawRequestLeft: {
    flex: 1,
  },
  withdrawRequestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  withdrawRequestAmount: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.foreground,
  },
  withdrawRequestBank: {
    fontSize: 14,
    color: Colors.mutedForeground,
    marginBottom: 4,
  },
  withdrawRequestDate: {
    fontSize: 12,
    color: Colors.mutedForeground,
  },
  withdrawRequestStatus: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.foreground,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.mutedForeground,
    marginTop: 12,
  },
  loadMoreButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.input,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  endMessage: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endText: {
    fontSize: 14,
    color: Colors.mutedForeground,
    fontStyle: 'italic',
  },
});

