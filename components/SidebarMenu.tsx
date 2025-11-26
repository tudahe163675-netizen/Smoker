import { useAccounts } from '@/hooks/useAccount';
import { Account } from '@/types/accountType';
import { UserProfileData } from '@/types/profileType';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
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

interface SidebarMenuProps {
  visible: boolean;
  menuAnimation: Animated.Value;
  profile: any;
  onClose: () => void;
  onLogout: () => void;
  onProfileRefresh: (profile: UserProfileData) => void;
}

export const SidebarMenu: React.FC<SidebarMenuProps> = ({
  visible,
  menuAnimation,
  profile,
  onClose,
  onLogout,
  onProfileRefresh,
}) => {
  const router = useRouter();
  const {
    accounts,
    currentAccountId,
    loading,
    canCreateAccount,
  } = useAccounts();

  if (!visible && menuAnimation.__getValue() === -320) {
    return null;
  }

  // Handle switch account
  const handleSwitchAccount = async (account: Account) => {
    // if (accountId === currentAccountId) {
    //   onClose();
    //   return;
    // }

    onClose();

    const dataProfile: UserProfileData = {
    id: account.id!,
    userName: account.name || '',
    email: profile.email || '', 
    avatar: account.Avatar,
    background: account.Background || '',
    coverImage: account.Background || '',
    phone: account.Phone || '',
    bio: account.Bio || '',
    role: account.Role,
    gender: account.Gender,
    address: '', 
    addressData: null, 
    status: '', 
    createdAt: account.created_at
  };

  onProfileRefresh(dataProfile)
  };

  // Handle add new account
  const handleAddAccount = () => {
    onClose();
    setTimeout(() => {
      Alert.alert(
        'Thêm tài khoản',
        'Bạn muốn tạo loại tài khoản nào?',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Tài khoản DJ',
            onPress: () => {
              if (!canCreateAccount('dj')) {
                Alert.alert('Thông báo', 'Bạn đã đạt giới hạn số lượng tài khoản DJ (tối đa 5)');
                return;
              }
              // router.push('/create-account?type=dj');
            },
          },
          {
            text: 'Tài khoản Quán Bar',
            onPress: () => {
              if (!canCreateAccount('bar')) {
                Alert.alert('Thông báo', 'Bạn đã đạt giới hạn số lượng tài khoản Quán Bar (tối đa 3)');
                return;
              }
              // router.push('/create-account?type=bar');
            },
          },
        ]
      );
    }, 300);
  };

  // Handle upgrade account
  const handleUpgradeAccount = () => {
    // onClose();
  };

  return (
    <>
      {visible && (
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={onClose} />
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
                  >
                    <Image source={{ uri: account.Avatar }} style={styles.accountAvatar} />
                    <View style={styles.accountInfo}>
                      <Text style={styles.accountName}>{account.name}</Text>
                      <Text style={styles.accountType}>{account.Role}</Text>
                      {account.Status === 'pending' && (
                        <Text style={styles.accountStatus}>Đang chờ duyệt</Text>
                      )}
                    </View>
                    {/* {currentAccountId === account.id && (
                      <Ionicons name="checkmark-circle" size={20} color="#2563eb" />
                    )} */}
                  </TouchableOpacity>
                ))}

                {/* <TouchableOpacity style={styles.addAccountButton} onPress={handleAddAccount}>
                  <View style={styles.addAccountIcon}>
                    <Ionicons name="add" size={24} color="#2563eb" />
                  </View>
                  <Text style={styles.addAccountText}>Thêm tài khoản</Text>
                </TouchableOpacity> */}
              </>
            )}
          </View>

          <View style={styles.menuDivider} />

          {/* Upgrade Account */}
          <TouchableOpacity style={styles.menuItem} onPress={handleUpgradeAccount}>
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

          {/* Settings */}
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemIcon}>
              <Ionicons name="settings-outline" size={24} color="#6b7280" />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Cài đặt</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          {/* Help & Support */}
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemIcon}>
              <Ionicons name="help-circle-outline" size={24} color="#6b7280" />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Trợ giúp & hỗ trợ</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          {/* Privacy */}
          <TouchableOpacity style={styles.menuItem}>
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
          <TouchableOpacity style={styles.menuItem} onPress={onLogout}>
            <View style={styles.menuItemIcon}>
              <Ionicons name="log-out-outline" size={24} color="#ef4444" />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={[styles.menuItemTitle, { color: '#ef4444' }]}>Đăng xuất</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
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

  // Upgrade Modal
  upgradeModalContent: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 60,
    borderRadius: 20,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  upgradeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  upgradeModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  upgradeModalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  upgradeButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Plan Cards
  planCard: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 8,
  },
  planCardSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2563eb',
  },
  planFeatures: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  accountStatus: {
  fontSize: 11,
  color: '#f59e0b',
  marginTop: 2,
},
});