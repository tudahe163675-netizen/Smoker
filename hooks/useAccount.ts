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
  const userId = authState.currentId; // Assuming you have userId in authState

  // Initialize API service
  const accountApi = token ? new AccountApiService(token) : null;

  /**
   * Fetch all accounts
   */
  const fetchAccounts = useCallback(async () => {
    if (!accountApi || !userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await accountApi.getAccounts(userId);

      if (response.data) {
        setAccounts(response.data);

        // Set current account (first active or first in list)
        const activeAccount = response.data.find(acc => acc.isActive);
        const firstAccount = response.data[0];
        setCurrentAccountId(activeAccount?.id || firstAccount?.id || '');
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Không thể tải danh sách tài khoản');
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  }, [accountApi, userId]);

  /**
   * Get current active account
   */
  const getCurrentAccount = useCallback(() => {
    return accounts.find(acc => acc.id === currentAccountId);
  }, [accounts, currentAccountId]);

  /**
   * Create a new account (DJ, Bar, or Dancer)
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
        background: accountData.background,
        gender: accountData.gender,
        address: accountData.address,
        bio: accountData.bio,
        pricePerHours: accountData.pricePerHours,
        pricePerSession: accountData.pricePerSession,
        djName: accountData.djName,
        genre: accountData.genre,
        barName: accountData.barName,
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
   * Register business account (DJ or Dancer)
   */
  const registerBusiness = async (
    type: 'dj' | 'dancer',
    businessData: {
      name: string;
      phone: string;
      email: string;
      address: string;
      bio?: string;
      gender?: string;
      genre?: string;
      pricePerHours?: string;
      pricePerSession?: string;
      avatar?: {
        uri: string;
        name: string;
        type: string;
      };
      background?: {
        uri: string;
        name: string;
        type: string;
      };
    }
  ): Promise<boolean> => {
    if (!accountApi || !userId) {
      Alert.alert('Lỗi', 'Không thể đăng ký. Vui lòng đăng nhập lại.');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const requestData = {
        ownerAccountId: userId,
        name: businessData.name,
        phone: businessData.phone,
        email: businessData.email,
        address: businessData.address,
        bio: businessData.bio,
        gender: businessData.gender,
        genre: businessData.genre,
        pricePerHours: businessData.pricePerHours ? parseFloat(businessData.pricePerHours) : undefined,
        pricePerSession: businessData.pricePerSession ? parseFloat(businessData.pricePerSession) : undefined,
      };

      // Register business
      const response = type === 'dj'
        ? await accountApi.registerDJ(requestData)
        : await accountApi.registerDancer(requestData);

      if (!response.success || !response.data) {
        Alert.alert('Lỗi', response.message || 'Không thể đăng ký tài khoản');
        setError(response.message);
        return false;
      }

      // Upload images if provided
      if ((businessData.avatar || businessData.background) && response.data.id) {


        const uploadResponse = await accountApi.uploadBusinessImages(response.data.id, {
          avatar: businessData.avatar,
          background: businessData.background,
        });

        console.log(uploadResponse);
        if (!uploadResponse.success) {
          console.warn('Failed to upload images:', uploadResponse.message);
          // Don't fail the whole process if image upload fails
        }
      }

      // Refresh accounts list
      await fetchAccounts();

      Alert.alert(
        'Đăng ký thành công!',
        `Tài khoản ${type === 'dj' ? 'DJ' : 'Dancer'} của bạn đã được tạo và đang chờ phê duyệt.`
      );

      return true;
    } catch (err) {
      const errorMessage = 'Không thể đăng ký tài khoản. Vui lòng thử lại.';
      Alert.alert('Lỗi', errorMessage);
      setError(errorMessage);
      console.error('Error registering business:', err);
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
      const limits: Record<AccountType, number> = {
        personal: 1,
        dj: 5,
        bar: 3,
        dancer: 5,
      };
      return accountsOfType.length < limits[type];
    },
    [getAccountsByType]
  );

  // Load accounts on mount
  useEffect(() => {
    if (userId) {
      fetchAccounts();
    }
  }, [userId]);

  return {
    accounts,
    currentAccountId,
    loading,
    error,
    fetchAccounts,
    getCurrentAccount,
    createAccount,
    registerBusiness,
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
    dancer: 'Vũ công',
  };
  return labels[type];
}