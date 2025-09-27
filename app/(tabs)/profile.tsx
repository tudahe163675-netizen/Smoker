import AnimatedHeader from '@/components/ui/AnimatedHeader';
import { fieldLabels } from '@/constants/profileData';
import { useProfile } from '@/hooks/useProfile';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const router = useRouter();
  const userId = '1'; // TODO: Get from auth context
  
  const {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfileField,
    updateProfileImage,
    refreshBalance,
  } = useProfile(userId);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<string>('');
  const [tempValue, setTempValue] = useState('');
  const [imageLoading, setImageLoading] = useState<'avatar' | 'cover' | null>(null);

  const scrollY = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchProfile(),
      refreshBalance(),
    ]);
    setRefreshing(false);
  }, [fetchProfile, refreshBalance]);

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: () => {
            // TODO: clear token / session ở đây
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  const handleTopUp = () => {
    router.push('/topup');
  };

  const pickImage = useCallback(async (type: 'avatar' | 'cover') => {
    try {
      setImageLoading(type);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'avatar' ? [1, 1] : [2, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const success = await updateProfileImage(type, result.assets[0].uri);
        
        if (success) {
          Alert.alert('Thành công', 'Đã cập nhật ảnh');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    } finally {
      setImageLoading(null);
    }
  }, [updateProfileImage]);

  const openEditModal = (field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue);
    setEditModalVisible(true);
  };

  const saveEdit = async () => {
    const success = await updateProfileField(editingField, tempValue);
    setEditModalVisible(false);
    
    if (success) {
      Alert.alert('Thành công', 'Đã cập nhật thông tin');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const ProfileItem = ({
    label,
    value,
    icon,
    onPress,
    editable = true
  }: {
    label: string;
    value: string;
    icon: string;
    onPress?: () => void;
    editable?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.profileItem}
      onPress={editable ? onPress : undefined}
      disabled={!editable}
    >
      <View style={styles.profileItemLeft}>
        <Ionicons name={icon as any} size={20} color="#6b7280" />
        <View style={styles.profileItemText}>
          <Text style={styles.profileItemLabel}>{label}</Text>
          <Text style={styles.profileItemValue}>{value}</Text>
        </View>
      </View>
      {editable && <Ionicons name="chevron-forward" size={16} color="#6b7280" />}
    </TouchableOpacity>
  );

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -100],
    extrapolate: 'clamp',
  });

  if (loading && !profile.name) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Đang tải hồ sơ...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1f2937" />

      <AnimatedHeader
        title="Hồ Sơ"
        iconName="log-out-outline"
        onIconPress={handleLogout}
        headerTranslateY={headerTranslateY}
      />
      
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Cover Image */}
        <TouchableOpacity
          style={styles.coverContainer}
          onPress={() => pickImage('cover')}
          disabled={imageLoading === 'cover'}
        >
          <Image source={{ uri: profile.coverImage }} style={styles.coverImage} />
          <View style={styles.coverOverlay}>
            {imageLoading === 'cover' ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="camera" size={24} color="#fff" />
                <Text style={styles.coverText}>Đổi ảnh bìa</Text>
              </>
            )}
          </View>
        </TouchableOpacity>

        {/* Avatar */}
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={() => pickImage('avatar')}
          disabled={imageLoading === 'avatar'}
        >
          <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          <View style={styles.avatarOverlay}>
            {imageLoading === 'avatar' ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="camera" size={16} color="#fff" />
            )}
          </View>
        </TouchableOpacity>

        {/* Name and Bio Section */}
        <View style={styles.nameSection}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.bio}>{profile.bio}</Text>
        </View>

        {/* Balance Section */}
        <View style={styles.balanceSection}>
          <View style={styles.balanceContainer}>
            <View style={styles.balanceLeft}>
              <Ionicons name="wallet-outline" size={24} color="#10b981" />
              <View style={styles.balanceText}>
                <Text style={styles.balanceLabel}>Số dư hiện tại</Text>
                <Text style={styles.balanceAmount}>{formatCurrency(profile.balance)}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.topUpButton} onPress={handleTopUp}>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.topUpText}>Nạp tiền</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.posts}</Text>
            <Text style={styles.statLabel}>Bài viết</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.followers.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Người theo dõi</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.following}</Text>
            <Text style={styles.statLabel}>Đang theo dõi</Text>
          </View>
        </View>

        {/* Profile Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

          <ProfileItem
            label="Tên"
            value={profile.name}
            icon="person-outline"
            onPress={() => openEditModal('name', profile.name)}
          />

          <ProfileItem
            label="Số điện thoại"
            value={profile.phone}
            icon="call-outline"
            onPress={() => openEditModal('phone', profile.phone)}
          />

          <ProfileItem
            label="Tiểu sử"
            value={profile.bio}
            icon="document-text-outline"
            onPress={() => openEditModal('bio', profile.bio)}
          />

          <ProfileItem
            label="Địa điểm"
            value={profile.location}
            icon="location-outline"
            onPress={() => openEditModal('location', profile.location)}
          />

          <ProfileItem
            label="Website"
            value={profile.website}
            icon="globe-outline"
            onPress={() => openEditModal('website', profile.website)}
          />
        </View>

        {/* Social Media Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mạng xã hội</Text>

          <ProfileItem
            label="TikTok"
            value={profile.tiktok}
            icon="logo-tiktok"
            onPress={() => openEditModal('tiktok', profile.tiktok)}
          />

          <ProfileItem
            label="Facebook"
            value={profile.facebook}
            icon="logo-facebook"
            onPress={() => openEditModal('facebook', profile.facebook)}
          />

          <ProfileItem
            label="Instagram"
            value={profile.instagram}
            icon="logo-instagram"
            onPress={() => openEditModal('instagram', profile.instagram)}
          />
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={20} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </Animated.ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalCancel}>Hủy</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                Chỉnh sửa {fieldLabels[editingField] || editingField}
              </Text>
              <TouchableOpacity onPress={saveEdit}>
                <Text style={styles.modalSave}>Lưu</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <TextInput
                style={[
                  styles.modalInput,
                  editingField === 'bio' && styles.modalTextArea
                ]}
                value={tempValue}
                onChangeText={setTempValue}
                placeholder={`Nhập ${(fieldLabels[editingField] || editingField).toLowerCase()}`}
                multiline={editingField === 'bio'}
                numberOfLines={editingField === 'bio' ? 4 : 1}
                autoFocus
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  coverContainer: {
    position: 'relative',
    height: 300,
    marginTop: 30,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  coverText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  avatarContainer: {
    position: 'absolute',
    top: 250,
    alignSelf: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#2563eb',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  nameSection: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    marginTop: 16
  },
  bio: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  balanceSection: {
    backgroundColor: '#fff',
    marginTop: 12,
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  balanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  balanceText: {
    marginLeft: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
  },
  topUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  topUpText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemText: {
    marginLeft: 12,
    flex: 1,
  },
  profileItemLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  profileItemValue: {
    fontSize: 16,
    color: '#111827',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#dc2626',
    flex: 1,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
    minHeight: 250,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  modalSave: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  modalScrollView: {
    flex: 1,
    maxHeight: 200,
  },
  modalInput: {
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 16,
  },
  modalTextArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
});