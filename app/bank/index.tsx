import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAuthContext } from '@/contexts/AuthProvider';
import { createBankInfoApi } from '@/services/bankInfoApi';
import { Colors } from '@/constants/colors';
import type { BankInfo } from '@/services/bankInfoApi';

export default function BankListScreen() {
  const router = useRouter();
  const { authState } = useAuthContext();
  const [banks, setBanks] = useState<BankInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBanks = useCallback(async () => {
    if (!authState.token || !authState.currentId) {
      setLoading(false);
      return;
    }

    try {
      const bankInfoApi = createBankInfoApi(authState.token);
      const response = await bankInfoApi.getByAccountId(authState.currentId);

      if (response.success && response.data) {
        const bankList = Array.isArray(response.data) ? response.data : [response.data];
        setBanks(bankList.filter((b) => b && b.BankInfoId));
      }
    } catch (error) {
      console.error('Failed to load banks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authState.token, authState.currentId]);

  useEffect(() => {
    loadBanks();
  }, [loadBanks]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadBanks();
  }, [loadBanks]);

  const handleDelete = (bankInfoId: string, bankName: string) => {
    Alert.alert('Xác nhận', `Bạn có chắc muốn xóa tài khoản ${bankName}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          if (!authState.token) return;

          try {
            const bankInfoApi = createBankInfoApi(authState.token);
            const response = await bankInfoApi.delete(bankInfoId);

            if (response.success) {
              Alert.alert('Thành công', 'Đã xóa tài khoản ngân hàng');
              loadBanks();
            } else {
              Alert.alert('Lỗi', response.message || 'Xóa tài khoản thất bại');
            }
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể xóa tài khoản ngân hàng');
          }
        },
      },
    ]);
  };

  if (loading) {
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
        <Text style={styles.headerTitle}>Tài khoản ngân hàng</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/bank/add')}
        >
          <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <View style={styles.content}>
          {banks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="card-outline" size={64} color={Colors.mutedForeground} />
              <Text style={styles.emptyTitle}>Chưa có tài khoản ngân hàng</Text>
              <Text style={styles.emptyText}>
                Thêm tài khoản ngân hàng để nhận tiền hoàn lại và rút tiền từ ví
              </Text>
              <TouchableOpacity
                style={styles.addFirstButton}
                onPress={() => router.push('/bank/add')}
              >
                <Ionicons name="add-circle" size={20} color={Colors.primaryForeground} />
                <Text style={styles.addFirstButtonText}>Thêm tài khoản đầu tiên</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {banks.map((bank) => (
                <View key={bank.BankInfoId} style={styles.bankCard}>
                  <View style={styles.bankHeader}>
                    <View style={styles.bankIcon}>
                      <Ionicons name="card" size={24} color={Colors.primary} />
                    </View>
                    <View style={styles.bankInfo}>
                      <Text style={styles.bankName}>{bank.BankName}</Text>
                      <Text style={styles.accountNumber}>{bank.AccountNumber}</Text>
                      {bank.AccountHolderName && (
                        <Text style={styles.accountHolder}>{bank.AccountHolderName}</Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(bank.BankInfoId, bank.BankName)}
                  >
                    <Ionicons name="trash-outline" size={20} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                style={styles.addMoreButton}
                onPress={() => router.push('/bank/add')}
              >
                <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                <Text style={styles.addMoreButtonText}>Thêm tài khoản khác</Text>
              </TouchableOpacity>
            </>
          )}
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
  addButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.foreground,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: Colors.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
  bankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  bankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  bankIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 14,
    color: Colors.mutedForeground,
    marginBottom: 2,
  },
  accountHolder: {
    fontSize: 12,
    color: Colors.mutedForeground,
  },
  deleteButton: {
    padding: 8,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  addMoreButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

