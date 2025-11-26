import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Animated,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Account {
  id: string;
  name: string;
  email: string;
  avatar: string;
  type: 'personal' | 'dj' | 'bar';
  typeLabel: string;
}

interface SidebarMenuProps {
  visible: boolean;
  menuAnimation: Animated.Value;
  profile: any;
  accounts: Account[];
  currentAccountId: string;
  onClose: () => void;
  onLogout: () => void;
  onUpgradeAccount: () => void;
  onSwitchAccount: (accountId: string) => void;
}

export const SidebarMenu: React.FC<SidebarMenuProps> = ({
  visible,
  menuAnimation,
  profile,
  accounts,
  currentAccountId,
  onClose,
  onLogout,
  onUpgradeAccount,
  onSwitchAccount,
}) => {
  if (!visible && menuAnimation.__getValue() === -300) {
    return null;
  }

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
            {accounts.map((account) => (
              <TouchableOpacity
                key={account.id}
                style={[
                  styles.accountItem,
                  currentAccountId === account.id && styles.accountItemActive,
                ]}
                onPress={() => onSwitchAccount(account.id)}
              >
                <Image source={{ uri: account.avatar }} style={styles.accountAvatar} />
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{account.name}</Text>
                  <Text style={styles.accountType}>{account.typeLabel}</Text>
                </View>
                {currentAccountId === account.id && (
                  <Ionicons name="checkmark-circle" size={20} color="#2563eb" />
                )}
              </TouchableOpacity>
            ))}

          </View>

          <View style={styles.menuDivider} />

          {/* Upgrade Account */}
          <TouchableOpacity style={styles.menuItem} onPress={onUpgradeAccount}>
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
  closeMenuButton: {
    padding: 4,
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
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  accountItemActive: {
    backgroundColor: '#eff6ff',
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
});