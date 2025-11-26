import { ProfileHeader } from '@/components/ProfileHeader';
import { SidebarMenu } from '@/components/SidebarMenu';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');
const PHOTO_SIZE = (screenWidth - 4) / 3;

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

interface Account {
  id: string;
  name: string;
  email: string;
  avatar: string;
  type: 'personal' | 'dj' | 'bar';
  typeLabel: string;
}

// Mock accounts data
const mockAccounts: Account[] = [
  {
    id: '1',
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    avatar: 'https://i.pravatar.cc/150?img=1',
    type: 'personal',
    typeLabel: 'Cá nhân',
  },
  {
    id: '2',
    name: 'DJ Shadow',
    email: 'djshadow@example.com',
    avatar: 'https://i.pravatar.cc/150?img=2',
    type: 'dj',
    typeLabel: 'DJ',
  },
  {
    id: '3',
    name: 'The Moon Bar',
    email: 'themoonbar@example.com',
    avatar: 'https://i.pravatar.cc/150?img=3',
    type: 'bar',
    typeLabel: 'Quán Bar',
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = '1';
  const { authState, logout, updateAuthState } = useAuth();
  const {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfileField,
    updateProfileImage,
    setFullProfile,
  } = useProfile(userId);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<string>('');
  const [tempValue, setTempValue] = useState('');
  const [imageLoading, setImageLoading] = useState<'avatar' | 'coverImage' | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [menuVisible, setMenuVisible] = useState(false);
  const [currentAccountId, setCurrentAccountId] = useState('1');

  const scrollY = useRef(new Animated.Value(0)).current;
  const menuAnimation = useRef(new Animated.Value(-320)).current;
  const [refreshing, setRefreshing] = useState(false);

  const allPhotos = getAllPhotos(mockPosts);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [fetchProfile]);

  const toggleMenu = () => {
    if (menuVisible) {
      Animated.timing(menuAnimation, {
        toValue: -320,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setMenuVisible(false));
    } else {
      setMenuVisible(true);
      Animated.timing(menuAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleLogout = () => {
    toggleMenu();
    setTimeout(() => {
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
    }, 300);
  };

  const handleUpgradeAccount = () => {
    toggleMenu();
    setTimeout(() => {
      Alert.alert(
        'Nâng cấp tài khoản',
        'Nâng cấp lên tài khoản doanh nghiệp để trải nghiệm nhiều tính năng hơn!',
        [
          { text: 'Để sau', style: 'cancel' },
          {
            text: 'Nâng cấp ngay',
            onPress: () => {
              console.log('Navigate to upgrade');
            },
          },
        ]
      );
    }, 300);
  };

  const handleSwitchAccount = (accountId: string) => {
    setCurrentAccountId(accountId);
    toggleMenu();
    setTimeout(() => {
      Alert.alert('Chuyển tài khoản', `Đã chuyển sang tài khoản ${mockAccounts.find(a => a.id === accountId)?.name}`);
    }, 300);
  };

  const handleAddAccount = () => {
    toggleMenu();
    setTimeout(() => {
      Alert.alert(
        'Thêm tài khoản',
        'Bạn muốn tạo loại tài khoản nào?',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Tài khoản DJ',
            onPress: () => console.log('Create DJ account'),
          },
          {
            text: 'Tài khoản Quán Bar',
            onPress: () => console.log('Create Bar account'),
          },
        ]
      );
    }, 300);
  };

  const handlePostPress = (postId: string) => {
    // router.push({ pathname: '/post', params: { id: postId } });
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

  const renderPhotoItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.photoItem} onPress={() => handlePostPress(item.postId)}>
      <Image source={{ uri: item.uri }} style={styles.photoImage} />
    </TouchableOpacity>
  );

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
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Đang tải hồ sơ...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Floating Menu Button - positioned to avoid notch */}
      {!menuVisible && (
        <TouchableOpacity
          style={[styles.floatingMenuButton, { top: insets.top + 10 }]}
          onPress={toggleMenu}
        >
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      <SidebarMenu
        visible={menuVisible}
        menuAnimation={menuAnimation}
        profile={profile}
        onClose={toggleMenu}
        onLogout={handleLogout}
        onProfileRefresh={setFullProfile}
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
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
          })}
          scrollEventThrottle={16}
        >
          <ProfileHeader
            profile={profile}
            imageLoading={imageLoading}
            activeTab={activeTab}
            postsCount={mockPosts.length}
            onPickImage={pickImage}
            onTabChange={setActiveTab}
            onFollowersPress={handleFollowersPress}
            onFollowingPress={handleFollowingPress}
          />
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
          ListHeaderComponent={
            <ProfileHeader
              profile={profile}
              imageLoading={imageLoading}
              activeTab={activeTab}
              postsCount={mockPosts.length}
              onPickImage={pickImage}
              onTabChange={setActiveTab}
              onFollowersPress={handleFollowersPress}
              onFollowingPress={handleFollowingPress}
            />
          }
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
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
          })}
          scrollEventThrottle={16}
        />
      ) : (
        <Animated.FlatList
          key="photos-grid"
          data={allPhotos}
          renderItem={renderPhotoItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          ListHeaderComponent={
            <ProfileHeader
              profile={profile}
              imageLoading={imageLoading}
              activeTab={activeTab}
              postsCount={mockPosts.length}
              onPickImage={pickImage}
              onTabChange={setActiveTab}
              onFollowersPress={handleFollowersPress}
              onFollowingPress={handleFollowingPress}
            />
          }
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
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
          })}
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
                style={[styles.modalInput, editingField === 'bio' && styles.modalTextArea]}
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
    </View>
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

  // Floating Menu Button
  floatingMenuButton: {
    position: 'absolute',
    left: 16,
    zIndex: 1001,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
});