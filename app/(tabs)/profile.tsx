import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
  avatar: string;
  coverImage: string;
  location: string;
  website: string;
  birthday: string;
  gender: string;
  relationship: string;
  posts: number;
  followers: number;
  following: number;
  isPrivate: boolean;
  notifications: boolean;
}

const initialProfile: UserProfile = {
  id: '1',
  name: 'Nguyễn Văn A',
  email: 'nguyenvana@email.com',
  phone: '0123456789',
  bio: 'Yêu thích công nghệ và du lịch. Đam mê khám phá những điều mới mẻ.',
  avatar: 'https://i.pravatar.cc/150?img=10',
  coverImage: 'https://picsum.photos/400/200?random=1',
  location: 'Hà Nội, Việt Nam',
  website: 'https://mywebsite.com',
  birthday: '15/01/1990',
  gender: 'Nam',
  relationship: 'Độc thân',
  posts: 42,
  followers: 1205,
  following: 356,
  isPrivate: false,
  notifications: true,
};

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<string>('');
  const [tempValue, setTempValue] = useState('');

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

  const pickImage = useCallback(async (type: 'avatar' | 'cover') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'avatar' ? [1, 1] : [2, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProfile(prev => ({
          ...prev,
          [type === 'avatar' ? 'avatar' : 'coverImage']: result.assets[0].uri,
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  }, []);

  const openEditModal = (field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue);
    setEditModalVisible(true);
  };

  const saveEdit = () => {
    setProfile(prev => ({
      ...prev,
      [editingField]: tempValue,
    }));
    setEditModalVisible(false);
    Alert.alert('Thành công', 'Đã cập nhật thông tin');
  };

  const getFieldLabel = (field: string) => {
    const labels: { [key: string]: string } = {
      name: 'Tên',
      bio: 'Tiểu sử',
      location: 'Địa điểm',
      website: 'Website',
      phone: 'Số điện thoại',
      birthday: 'Ngày sinh',
      gender: 'Giới tính',
      relationship: 'Tình trạng hôn nhân',
    };
    return labels[field] || field;
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hồ sơ</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* Cover Image */}
        <TouchableOpacity 
          style={styles.coverContainer}
          onPress={() => pickImage('cover')}
        >
          <Image source={{ uri: profile.coverImage }} style={styles.coverImage} />
          <View style={styles.coverOverlay}>
            <Ionicons name="camera" size={24} color="#fff" />
            <Text style={styles.coverText}>Đổi ảnh bìa</Text>
          </View>
        </TouchableOpacity>

        {/* Avatar - Overlapping cover image */}
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={() => pickImage('avatar')}
        >
          <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          <View style={styles.avatarOverlay}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Name and Bio Section */}
        <View style={styles.nameSection}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.bio}>{profile.bio}</Text>
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
            label="Email"
            value={profile.email}
            icon="mail-outline"
            editable={false}
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
          
          <ProfileItem
            label="Ngày sinh"
            value={profile.birthday}
            icon="calendar-outline"
            onPress={() => openEditModal('birthday', profile.birthday)}
          />
          
          <ProfileItem
            label="Giới tính"
            value={profile.gender}
            icon="person"
            onPress={() => openEditModal('gender', profile.gender)}
          />
          
          <ProfileItem
            label="Tình trạng hôn nhân"
            value={profile.relationship}
            icon="heart-outline"
            onPress={() => openEditModal('relationship', profile.relationship)}
          />
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cài đặt</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.profileItemLeft}>
              <Ionicons name="lock-closed-outline" size={20} color="#6b7280" />
              <View style={styles.profileItemText}>
                <Text style={styles.profileItemLabel}>Tài khoản riêng tư</Text>
                <Text style={styles.settingDescription}>
                  Chỉ những người theo dõi mới có thể xem bài viết của bạn
                </Text>
              </View>
            </View>
            <Switch
              value={profile.isPrivate}
              onValueChange={(value) => 
                setProfile(prev => ({ ...prev, isPrivate: value }))
              }
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.profileItemLeft}>
              <Ionicons name="notifications-outline" size={20} color="#6b7280" />
              <View style={styles.profileItemText}>
                <Text style={styles.profileItemLabel}>Thông báo</Text>
                <Text style={styles.settingDescription}>
                  Nhận thông báo về hoạt động mới
                </Text>
              </View>
            </View>
            <Switch
              value={profile.notifications}
              onValueChange={(value) => 
                setProfile(prev => ({ ...prev, notifications: value }))
              }
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.editProfileButton}>
            <Ionicons name="create-outline" size={20} color="#2563eb" />
            <Text style={styles.editProfileText}>Chỉnh sửa hồ sơ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalCancel}>Hủy</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                Chỉnh sửa {getFieldLabel(editingField)}
              </Text>
              <TouchableOpacity onPress={saveEdit}>
                <Text style={styles.modalSave}>Lưu</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              <TextInput
                style={[
                  styles.modalInput,
                  editingField === 'bio' && styles.modalTextArea
                ]}
                value={tempValue}
                onChangeText={setTempValue}
                placeholder={`Nhập ${getFieldLabel(editingField).toLowerCase()}`}
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  logoutButton: {
    padding: 8,
  },
  coverContainer: {
    position: 'relative',
    height: 300,
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
  avatarSection: {
    backgroundColor: '#fff',
    paddingTop: 0,
    paddingHorizontal: 16,
    paddingBottom: 20,
    alignItems: 'center',
    marginTop: -40,
  },
  avatarContainer: {
    position: 'absolute',
    top: 250, // Position to overlap the cover image
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
    paddingTop: 20, // Space for overlapped avatar
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  bio: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
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
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingDescription: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  actionSection: {
    padding: 16,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  editProfileText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
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
    maxHeight: '70%',
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
    maxHeight: 150, // Limit height to prevent keyboard issues
  },
  modalInput: {
    margin: 16,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  modalTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
});