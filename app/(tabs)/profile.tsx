import AnimatedHeader from '@/components/ui/AnimatedHeader';
import { fieldLabels, mockPosts } from '@/constants/profileData';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
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

const { width: screenWidth } = Dimensions.get('window');
const PHOTO_SIZE = (screenWidth - 4) / 3; // 3 ảnh 1 hàng với khoảng cách 2px

// Lấy tất cả ảnh từ các bài viết
const getAllPhotos = (posts: any[]) => {
  const photos: any[] = [];
  posts.forEach((post) => {
    post.images.forEach((image: string) => {
      photos.push({
        id: `${post.id}-${image}`,
        uri: image,
        postId: post.id,
      });
    });
  });
  return photos;
};

type TabType = 'info' | 'posts' | 'photos';

export default function ProfileScreen() {
  const router = useRouter();
  const userId = '1';
  const { authState, logout } = useAuth();
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
  const [imageLoading, setImageLoading] = useState<'avatar' | 'coverImage' | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('info');

  const scrollY = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);

  const allPhotos = getAllPhotos(mockPosts);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [fetchProfile]);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => {
          logout();
        },
      },
    ]);
  };

  const handleTopUp = () => {
    router.push('/topup');
  };

  const handlePostPress = (postId: string) => {
    router.push({
      pathname: '/post',
      params: { id: postId },
    });
  };

  const handleUpgradeAccount = () => {
    router.push('/role');
  };

  const handleFollowersPress = () => {
    router.push({
      pathname: '/follow',
      params: { type: 'followers', userId: userId },
    });
  };

  const handleFollowingPress = () => {
    router.push({
      pathname: '/follow',
      params: { type: 'following', userId: userId },
    });
  };

  const pickImage = useCallback(
    async (type: 'avatar' | 'coverImage') => {
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
    },
    [updateProfileImage]
  );

  const openEditModal = (field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue);
    setEditModalVisible(true);
  };

  const saveEdit = async () => {
    if (!tempValue.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập giá trị');
      return;
    }

    setEditModalVisible(false);
    
    const success = await updateProfileField(editingField, tempValue);

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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Vừa xong';
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    return `${Math.floor(diffInHours / 24)} ngày trước`;
  };

  const ProfileItem = ({
    label,
    value,
    icon,
    onPress,
    editable = true,
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
          <Text style={styles.profileItemValue}>{value || 'Chưa cập nhật'}</Text>
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

  // Render Post Item
  const renderPostItem = ({ item }: { item: any }) => (
    <View style={styles.postCard}>
      <TouchableOpacity onPress={() => handlePostPress(item.id)}>
        <Text style={styles.postContent}>{item.content}</Text>
      </TouchableOpacity>

      {item.images.length > 0 && (
        <FlatList
          data={item.images}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(image, index) => `${item.id}-img-${index}`}
          renderItem={({ item: image }) => (
            <Image source={{ uri: image }} style={styles.postImage} />
          )}
          style={styles.postImages}
        />
      )}

      <TouchableOpacity onPress={() => handlePostPress(item.id)}>
        <View style={styles.postFooter}>
          <View style={styles.postStats}>
            <View style={styles.postStat}>
              <Ionicons name="heart" size={16} color="#ef4444" />
              <Text style={styles.postStatText}>{item.likes}</Text>
            </View>
            <View style={styles.postStat}>
              <Ionicons name="chatbubble" size={16} color="#6b7280" />
              <Text style={styles.postStatText}>{item.comments}</Text>
            </View>
          </View>
          <Text style={styles.postTime}>{formatTime(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  // Render Photo Item
  const renderPhotoItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.photoItem} onPress={() => handlePostPress(item.postId)}>
      <Image source={{ uri: item.uri }} style={styles.photoImage} />
    </TouchableOpacity>
  );

  // Header Component
  const ProfileHeader = () => (
    <>
      <TouchableOpacity
        style={styles.coverContainer}
        onPress={() => pickImage('coverImage')}
        disabled={imageLoading === 'coverImage'}
      >
        <Image 
          source={{ uri: profile?.background || profile?.coverImage }} 
          style={styles.coverImage} 
        />
        <View style={styles.coverOverlay}>
          {imageLoading === 'coverImage' ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="camera" size={24} color="#fff" />
              <Text style={styles.coverText}>Đổi ảnh bìa</Text>
            </>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={() => pickImage('avatar')}
        disabled={imageLoading === 'avatar'}
      >
        <Image source={{ uri: profile?.avatar }} style={styles.avatar} />
        <View style={styles.avatarOverlay}>
          {imageLoading === 'avatar' ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="camera" size={16} color="#fff" />
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.nameSection}>
        <Text style={styles.name}>{profile?.userName || 'Người dùng'}</Text>
        <Text style={styles.bio}>{profile?.bio || 'Chưa có tiểu sử'}</Text>
      </View>

      <View style={styles.balanceSection}>
        <View style={styles.balanceContainer}>
          <View style={styles.balanceLeft}>
            <Ionicons name="wallet-outline" size={24} color="#10b981" />
            <View style={styles.balanceText}>
              <Text style={styles.balanceLabel}>Số dư hiện tại</Text>
              <Text style={styles.balanceAmount}>
                {profile ? formatCurrency(0) : '0 ₫'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.topUpButton} onPress={handleTopUp}>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.topUpText}>Nạp tiền</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Nâng cấp tài khoản - uncomment nếu cần */}
      {/* {authState.role === Role.USER && (
        <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgradeAccount}>
          <Ionicons name="arrow-up-circle" size={20} color="#fff" />
          <Text style={styles.upgradeText}>Nâng cấp tài khoản</Text>
        </TouchableOpacity>
      )} */}

      {/* <View style={styles.statsContainer}>
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
      </View> */}

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{mockPosts.length}</Text>
          <Text style={styles.statLabel}>Bài viết</Text>
        </View>

        <TouchableOpacity
          style={styles.statItem}
          onPress={handleFollowersPress}
          activeOpacity={0.7}
        >
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Người theo dõi</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statItem}
          onPress={handleFollowingPress}
          activeOpacity={0.7}
        >
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Đang theo dõi</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'info' && styles.activeTab]}
          onPress={() => setActiveTab('info')}
        >
          <Ionicons
            name="information-circle"
            size={20}
            color={activeTab === 'info' ? '#2563eb' : '#6b7280'}
          />
          <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
            Thông tin
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => setActiveTab('posts')}
        >
          <Ionicons
            name="documents"
            size={20}
            color={activeTab === 'posts' ? '#2563eb' : '#6b7280'}
          />
          <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
            Bài viết
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'photos' && styles.activeTab]}
          onPress={() => setActiveTab('photos')}
        >
          <Ionicons
            name="images"
            size={20}
            color={activeTab === 'photos' ? '#2563eb' : '#6b7280'}
          />
          <Text style={[styles.tabText, activeTab === 'photos' && styles.activeTabText]}>
            Ảnh
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // Info Tab Content
  const InfoContent = () => (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
        <ProfileItem
          label="Tên"
          value={profile?.userName || ''}
          icon="person-outline"
          onPress={() => openEditModal('name', profile?.userName || '')}
        />
        <ProfileItem
          label="Số điện thoại"
          value={profile?.phone || ''}
          icon="call-outline"
          onPress={() => openEditModal('phone', profile?.phone || '')}
        />
        <ProfileItem
          label="Tiểu sử"
          value={profile?.bio || ''}
          icon="document-text-outline"
          onPress={() => openEditModal('bio', profile?.bio || '')}
        />
        <ProfileItem
          label="Email"
          value={profile?.email || ''}
          icon="mail-outline"
          editable={false}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mạng xã hội</Text>
        <ProfileItem
          label="TikTok"
          value="http://tiktok.com"
          icon="logo-tiktok"
          editable={false}
        />
        <ProfileItem
          label="Facebook"
          value="http://facebook.com"
          icon="logo-facebook"
          editable={false}
        />
        <ProfileItem
          label="Instagram"
          value="http://instagram.com"
          icon="logo-instagram"
          editable={false}
        />
      </View>
    </>
  );

  if (loading && !profile?.userName) {
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

      {activeTab === 'info' ? (
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
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
          <ProfileHeader />
          <InfoContent />

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="warning-outline" size={20} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </Animated.ScrollView>
      ) : activeTab === 'posts' ? (
        <Animated.FlatList
          key="posts-list"
          data={mockPosts}
          renderItem={renderPostItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ProfileHeader}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
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
        />
      ) : (
        <Animated.FlatList
          key="photos-grid"
          data={allPhotos}
          renderItem={renderPhotoItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          ListHeaderComponent={ProfileHeader}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
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
        />
      )}

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
                  editingField === 'bio' && styles.modalTextArea,
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
    height: 200,
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
    top: 150,
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
    paddingBottom: 16,
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
    marginTop: 8,
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    paddingVertical: 12,
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

  // Tab Navigation
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginTop: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2563eb',
    fontWeight: '600',
  },

  // Posts
  postCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  postContent: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
  },
  postImages: {
    marginBottom: 12,
  },
  postImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginRight: 8,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postStatText: {
    fontSize: 14,
    color: '#6b7280',
  },
  postTime: {
    fontSize: 12,
    color: '#9ca3af',
  },

  // Photos Grid
  photoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    margin: 1,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },

  // Info Section
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

  // Modal
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
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  upgradeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});