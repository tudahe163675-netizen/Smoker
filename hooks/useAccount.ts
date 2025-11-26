import { AccountApiService } from '@/services/accountApi';
import { Account, AccountType, CreateAccountRequestData } from '@/types/accountType';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './useAuth';

export const useAccounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentAccountId, setCurrentAccountId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { authState } = useAuth();
  const token = authState.token;

  // Initialize API service
  const accountApi = token ? new AccountApiService(token) : null;

  /**
   * Fetch all accounts
   */
  const fetchAccounts = useCallback(async () => {
    if (!accountApi) return;

    setLoading(true);
    setError(null);

    try {
      const response = await accountApi.getAccounts();

      if (response.data) {
        setAccounts(response.data.accounts);
        setCurrentAccountId(response.data.currentAccountId);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Không thể tải danh sách tài khoản');
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  }, [accountApi]);

  /**
   * Get current active account
   */
  const getCurrentAccount = useCallback(() => {
    return accounts.find(acc => acc.id === currentAccountId);
  }, [accounts, currentAccountId]);

  /**
   * Create a new account (DJ or Bar)
   */
  const createAccount = async (
    type: AccountType,
    accountData: Partial<CreateAccountRequestData>
  ): Promise<boolean> => {
    if (!accountApi) {
      Alert.alert('Lỗi', 'Không thể tạo tài khoản. Vui lòng đăng nhập lại.');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const createData: CreateAccountRequestData = {
        type,
        name: accountData.name || '',
        email: accountData.email || '',
        phone: accountData.phone,
        avatar: accountData.avatar,
        djName: accountData.djName,
        genre: accountData.genre,
        barName: accountData.barName,
        address: accountData.address,
        description: accountData.description,
      };

      const response = await accountApi.createAccount(createData);

      if (response.data) {
        // Refresh accounts list
        await fetchAccounts();
        Alert.alert('Thành công', `Đã tạo tài khoản ${getAccountTypeLabel(type)} thành công!`);
        return true;
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể tạo tài khoản');
        setError(response.message);
        return false;
      }
    } catch (err) {
      const errorMessage = 'Không thể tạo tài khoản. Vui lòng thử lại.';
      Alert.alert('Lỗi', errorMessage);
      setError(errorMessage);
      console.error('Error creating account:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Switch to another account
   */
  const switchAccount = async (accountId: string): Promise<boolean> => {
    if (!accountApi) {
      Alert.alert('Lỗi', 'Không thể chuyển tài khoản. Vui lòng đăng nhập lại.');
      return false;
    }

    const targetAccount = accounts.find(acc => acc.id === accountId);
    if (!targetAccount) {
      Alert.alert('Lỗi', 'Không tìm thấy tài khoản');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await accountApi.switchAccount({ accountId });

      if (response.data) {
        setCurrentAccountId(accountId);
        Alert.alert(
          'Đã chuyển tài khoản',
          `Bạn đang sử dụng tài khoản: ${targetAccount.name}`
        );
        return true;
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể chuyển tài khoản');
        setError(response.message);
        return false;
      }
    } catch (err) {
      const errorMessage = 'Không thể chuyển tài khoản. Vui lòng thử lại.';
      Alert.alert('Lỗi', errorMessage);
      setError(errorMessage);
      console.error('Error switching account:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete an account
   */
  const deleteAccount = async (accountId: string): Promise<boolean> => {
    if (!accountApi) {
      Alert.alert('Lỗi', 'Không thể xóa tài khoản. Vui lòng đăng nhập lại.');
      return false;
    }

    const targetAccount = accounts.find(acc => acc.id === accountId);
    if (!targetAccount) {
      Alert.alert('Lỗi', 'Không tìm thấy tài khoản');
      return false;
    }

    // Confirm deletion
    return new Promise((resolve) => {
      Alert.alert(
        'Xác nhận xóa',
        `Bạn có chắc chắn muốn xóa tài khoản "${targetAccount.name}"? Hành động này không thể hoàn tác.`,
        [
          {
            text: 'Hủy',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Xóa',
            style: 'destructive',
            onPress: async () => {
              setLoading(true);
              try {
                const response = await accountApi.deleteAccount(accountId);

                if (response.success) {
                  // Refresh accounts list
                  await fetchAccounts();
                  Alert.alert('Thành công', 'Đã xóa tài khoản');
                  resolve(true);
                } else {
                  Alert.alert('Lỗi', response.message || 'Không thể xóa tài khoản');
                  resolve(false);
                }
              } catch (err) {
                Alert.alert('Lỗi', 'Không thể xóa tài khoản. Vui lòng thử lại.');
                console.error('Error deleting account:', err);
                resolve(false);
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    });
  };

  /**
   * Get accounts by type
   */
  const getAccountsByType = useCallback(
    (type: AccountType) => {
      return accounts.filter(acc => acc.type === type);
    },
    [accounts]
  );

  /**
   * Check if user can create more accounts
   */
  const canCreateAccount = useCallback(
    (type: AccountType) => {
      const accountsOfType = getAccountsByType(type);
      // You can add limits here, e.g., max 5 DJ accounts, max 3 Bar accounts
      const limits: Record<AccountType, number> = {
        personal: 1, // Only one personal account
        dj: 5,
        bar: 3,
      };
      return accountsOfType.length < limits[type];
    },
    [getAccountsByType]
  );

  // Load accounts on mount
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return {
    accounts,
    currentAccountId,
    loading,
    error,
    fetchAccounts,
    getCurrentAccount,
    createAccount,
    switchAccount,
    deleteAccount,
    getAccountsByType,
    canCreateAccount,
  };
};

/**
 * Helper function to get account type label in Vietnamese
 */
function getAccountTypeLabel(type: AccountType): string {
  const labels: Record<AccountType, string> = {
    personal: 'Cá nhân',
    dj: 'DJ',
    bar: 'Quán Bar',
  };
  return labels[type];
}