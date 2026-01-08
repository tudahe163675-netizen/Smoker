import { AuthState } from '@/constants/authData';
import { useAccounts } from '@/hooks/useAccount';
import { useAuth } from '@/hooks/useAuth';
import { Account } from '@/types/accountType';
import { UserProfileData } from '@/types/profileType';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { BusinessRegistrationModal } from './BusinessRegistrationModal';

interface SidebarMenuProps {
  visible: boolean;
  menuAnimation: Animated.Value;
  profile: any;
  onClose: () => void;
  onLogout: () => void;
  onProfileRefresh: (profile: UserProfileData) => void;
  updateAuth: (
    updates: Partial<AuthState>,
    options?: { persist?: boolean }
  ) => void;
}

export const SidebarMenu: React.FC<SidebarMenuProps> = ({
  visible,
  menuAnimation,
  profile,
  onClose,
  onLogout,
  onProfileRefresh,
  updateAuth
}) => {
  const router = useRouter();
  const {
    currentAccountId,
    loading,
    registerBusiness,
  } = useAccounts();

  const { authState, fetchEntities } = useAuth();
  const accounts = authState.entities;

  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [switchingAccount, setSwitchingAccount] = useState(false);

  if (!visible && menuAnimation.__getValue() === -320) {
    return null;
  }

  // Handle switch account with loading state
  const handleSwitchAccount = async (account: Account) => {
    if (account.EntityAccountId === authState.EntityAccountId) {
      return;
    }
    try {
      setSwitchingAccount(true);

      const dataProfile: UserProfileData = {
        id: account.id!,
        userName: account.name || '',
        email: profile.email || '',
        avatar: account.Avatar || account.avatar,
        background: account.Background || '',
        coverImage: account.Background || '',
        phone: account.Phone || '',
        bio: account.Bio || '',
        role: account.role,
        gender: account.Gender,
        address: '',
        addressData: null,
        status: '',
        createdAt: account.created_at
      };

      // Update profile
      onProfileRefresh(dataProfile);

      // Update auth state
      updateAuth({
        avatar: account.Avatar || account.avatar,
        EntityAccountId: account.EntityAccountId,
        type: account.type,
        role: account.role,
        currentId: account.id
      });

      // Wait a bit to ensure all updates are complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Close sidebar after successful switch
      onClose();
    } catch (error) {
      console.error('Switch account error:', error);
      Alert.alert('Lỗi', 'Không thể chuyển tài khoản. Vui lòng thử lại.');
    } finally {
      setSwitchingAccount(false);
    }
  };

  // SIMPLE VERSION: Just open modals, don't close sidebar
  // Modal will render on top with higher zIndex
  const handleUpgradeAccount = () => {
    setShowBusinessModal(true);
  };

  // When modals closes, also close sidebar
  const handleModalClose = () => {
    setShowBusinessModal(false);
    onClose(); // Close sidebar when modals closes
  };

  // Handle business registration submit
  const handleBusinessRegistration = async (
    type: 'dj' | 'dancer',
    data: any
  ) => {
    try {
      const success = await registerBusiness(type, data);

      if (success) {
        // Refresh accounts list
        await fetchEntities();
        setShowBusinessModal(false);
        // Sidebar will be closed when modals closes
      }
    } catch (error) {
      console.error('Business registration error:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại.');
    }
  };

  const handleChangePassword = () => {
    onClose();
    router.push('/changePassword');
  };

  return (
    <>
      {visible && (
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={onClose}
          disabled={switchingAccount}
        />
      )}
      <Animated.View
        style={[
          styles.sidebarMenu,
          {
            transform: [{ translateX: menuAnimation }],
          },
        ]}
      >
        <View style={styles.menuHeader}>
          <View style={styles.menuUserInfo}>
            <Image source={{ uri: profile?.avatar }} style={styles.menuAvatar} />
            <View style={styles.menuUserText}>
              <Text style={styles.menuUserName}>{profile?.userName || 'Người dùng'}</Text>
              <Text style={styles.menuUserEmail}>{profile?.email || ''}</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.menuContent} showsVerticalScrollIndicator={false}>
          {/* Account Management Section */}
          <View style={styles.accountSection}>
            <Text style={styles.accountSectionTitle}>Tài khoản của bạn</Text>

            {/* Account list */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#2563eb" />
              </View>
            ) : (
              <>
                {accounts.map((account) => (
                  <TouchableOpacity
                    key={account.id}
                    style={[
                      styles.accountItem,
                      currentAccountId === account.id && styles.accountItemActive,
                    ]}
                    onPress={() => handleSwitchAccount(account)}
                    disabled={switchingAccount}
                  >
                    <Image source={{ uri: account.avatar }} style={styles.accountAvatar} />
                    <View style={styles.accountInfo}>
                      <Text style={styles.accountName}>{account.name}</Text>
                      <Text style={styles.accountType}>{account.role}</Text>
                      {account.status === 'pending' && (
                        <Text style={styles.accountStatus}>Đang chờ duyệt</Text>
                      )}
                    </View>

                    {account.EntityAccountId === authState.EntityAccountId && (
                      <Ionicons name="checkmark-circle" size={22} color="#2563eb" style={{ marginLeft: 'auto', marginRight: 8 }} />
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>

          <View style={styles.menuDivider} />

          {/* Upgrade Account */}
          {(authState.role === 'Customer' || authState.role === 'customer') && (
            <>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleUpgradeAccount}
                disabled={switchingAccount}
              >
                <View style={styles.menuItemIcon}>
                  <Ionicons name="business" size={24} color="#8b5cf6" />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>Nâng cấp tài khoản doanh nghiệp</Text>
                  <Text style={styles.menuItemSubtitle}>Mở khóa nhiều tính năng hơn</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              {/* MY BOOKING TẠI ĐÂY */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  router.push('/myBooking');
                }}
                disabled={switchingAccount}
              >
                <View style={styles.menuItemIcon}>
                  <Ionicons name="calendar-outline" size={24} color="#10b981" />
                </View>

                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>Lịch đặt của tôi</Text>
                  <Text style={styles.menuItemSubtitle}>Xem và quản lý các buổi đặt</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
              <View style={styles.menuDivider} />
            </>
          )}
          
          {/* Settings */}
          <TouchableOpacity style={styles.menuItem} disabled={switchingAccount}>
            <View style={styles.menuItemIcon}>
              <Ionicons name="settings-outline" size={24} color="#6b7280" />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Cài đặt</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          {/* Change Password */}
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={handleChangePassword}
            disabled={switchingAccount}
          >
            <View style={styles.menuItemIcon}>
              <Ionicons name="key-outline" size={24} color="#6b7280" />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Đổi mật khẩu</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          {/* Help & Support */}
          <TouchableOpacity style={styles.menuItem} disabled={switchingAccount}>
            <View style={styles.menuItemIcon}>
              <Ionicons name="help-circle-outline" size={24} color="#6b7280" />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Trợ giúp & hỗ trợ</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          {/* Privacy */}
          <TouchableOpacity style={styles.menuItem} disabled={switchingAccount}>
            <View style={styles.menuItemIcon}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#6b7280" />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Quyền riêng tư</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          {/* Logout */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={onLogout}
            disabled={switchingAccount}
          >
            <View style={styles.menuItemIcon}>
              <Ionicons name="log-out-outline" size={24} color="#ef4444" />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={[styles.menuItemTitle, { color: '#ef4444' }]}>Đăng xuất</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* Loading Overlay when switching account */}
        {switchingAccount && (
          <View style={styles.switchingOverlay}>
            <View style={styles.switchingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.switchingText}>Đang chuyển tài khoản...</Text>
            </View>
          </View>
        )}
      </Animated.View>

      {/* Business Registration Modal - Always render, control via visible prop */}
      <BusinessRegistrationModal
        visible={showBusinessModal}
        onClose={handleModalClose}
        onSubmit={handleBusinessRegistration}
        entities={accounts}
      />
    </>
  );
};

const styles = StyleSheet.create({
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  sidebarMenu: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 320,
    backgroundColor: '#fff',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  menuUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  menuUserText: {
    flex: 1,
  },
  menuUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  menuUserEmail: {
    fontSize: 13,
    color: '#6b7280',
  },
  menuContent: {
    flex: 1,
  },

  // Account Section
  accountSection: {
    paddingVertical: 8,
  },
  accountSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: 'uppercase',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  accountItemActive: {
    // backgroundColor: '#eff6ff',
  },
  accountAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  accountType: {
    fontSize: 13,
    color: '#6b7280',
  },
  accountStatus: {
    fontSize: 11,
    color: '#f59e0b',
    marginTop: 2,
  },
  addAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 4,
  },
  addAccountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addAccountText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2563eb',
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },

  // Switching Account Overlay
  switchingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  switchingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  switchingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
});