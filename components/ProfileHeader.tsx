import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type TabType = 'info' | 'posts' | 'photos';

interface ProfileHeaderProps {
  profile: any;
  imageLoading: 'avatar' | 'coverImage' | null;
  activeTab: TabType;
  postsCount: number;
  followerCount: number;
  followingCount: number;
  onPickImage: (type: 'avatar' | 'coverImage') => void;
  onTabChange: (tab: TabType) => void;
  onFollowersPress: () => void;
  onFollowingPress: () => void;
  onEditPress?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  imageLoading,
  activeTab,
  postsCount,
    followerCount,
    followingCount,
  onPickImage,
  onTabChange,
  onFollowersPress,
  onFollowingPress,
  onEditPress,
}) => {
  const isPerformer =
    (profile?.role || '').toString().toUpperCase() === 'DJ' ||
    (profile?.role || '').toString().toUpperCase() === 'DANCER' ||
    (profile?.type || '').toString().toUpperCase() === 'DJ' ||
    (profile?.type || '').toString().toUpperCase() === 'DANCER';

  const parsePrice = (v: any) => {
    if (v === null || v === undefined) return 0;
    const cleaned = String(v).replace(/[^0-9.-]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  const pricePerHours = parsePrice(profile?.pricePerHours ?? profile?.PricePerHours);
  const pricePerSession = parsePrice(profile?.pricePerSession ?? profile?.PricePerSession);

  return (
    <>
      {/* Cover Image */}
      <TouchableOpacity
        style={styles.coverContainer}
        onPress={() => onPickImage('coverImage')}
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

      {/* Avatar */}
      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={() => onPickImage('avatar')}
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

      {/* Name & Bio */}
      <View style={styles.nameSection}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{profile?.userName || 'Người dùng'}</Text>
          {!!onEditPress && (
            <TouchableOpacity style={styles.editButton} onPress={onEditPress} activeOpacity={0.8}>
              <Ionicons name="create-outline" size={16} color="#111827" />
              <Text style={styles.editButtonText}>Chỉnh sửa</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.bio}>{profile?.bio || 'Chưa có tiểu sử'}</Text>
      </View>

      {/* Pricing (DJ/Dancer) */}
      {isPerformer && (pricePerHours > 0 || pricePerSession > 0) && (
        <View style={styles.priceSection}>
          <Text style={styles.priceTitle}>Bảng giá dịch vụ</Text>
          <View style={styles.priceRow}>
            <View style={styles.priceCard}>
              <Text style={styles.priceLabel}>Giá tiêu chuẩn</Text>
              <Text style={styles.priceValue}>{pricePerHours.toLocaleString('vi-VN')} đ</Text>
              <Text style={styles.priceUnit}>/ slot</Text>
            </View>
            <View style={[styles.priceCard, styles.priceCardPromo]}>
              <Text style={[styles.priceLabel, styles.priceLabelPromo]}>Giá ưu đãi khi đặt nhiều slot</Text>
              <Text style={[styles.priceValue, styles.priceValuePromo]}>
                {pricePerSession.toLocaleString('vi-VN')} đ
              </Text>
              <Text style={[styles.priceUnit, styles.priceUnitPromo]}>/ slot</Text>
            </View>
          </View>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{postsCount}</Text>
          <Text style={styles.statLabel}>Bài viết</Text>
        </View>

        <TouchableOpacity
          style={styles.statItem}
          onPress={onFollowersPress}
          activeOpacity={0.7}
        >
          <Text style={styles.statNumber}>{followerCount}</Text>
          <Text style={styles.statLabel}>Người theo dõi</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statItem}
          onPress={onFollowingPress}
          activeOpacity={0.7}
        >
          <Text style={styles.statNumber}>{followingCount}</Text>
          <Text style={styles.statLabel}>Đang theo dõi</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'info' && styles.activeTab]}
          onPress={() => onTabChange('info')}
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
          onPress={() => onTabChange('posts')}
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
          onPress={() => onTabChange('photos')}
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
};

const styles = StyleSheet.create({
  coverContainer: {
    position: 'relative',
    height: 200,
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
    paddingTop: 70,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  priceSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  priceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priceCard: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  priceCardPromo: {
    backgroundColor: '#fff7ed',
    borderColor: '#fed7aa',
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 6,
  },
  priceLabelPromo: {
    color: '#9a3412',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  priceValuePromo: {
    color: '#ea580c',
  },
  priceUnit: {
    marginTop: 2,
    fontSize: 12,
    color: '#6b7280',
  },
  priceUnitPromo: {
    color: '#9a3412',
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  editButtonText: {
    color: '#111827',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
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
});