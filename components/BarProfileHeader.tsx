import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { parseAddressFromString, buildAddressFromIds } from '@/utils/addressFormatter';
import { FollowButton } from '@/components/common/FollowButton';

// Format address function (similar to web)
const formatAddress = (address: any): string | null => {
    if (!address) return null;

    if (typeof address === 'string') {
        const trimmed = address.trim();
        // If it's a non-empty string and not JSON, return it directly
        if (trimmed && !trimmed.startsWith('{')) {
            return trimmed;
        }
        // If it's a JSON string, try to parse it
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
                return formatAddress(JSON.parse(trimmed));
            } catch {
                return null; // Return null if parsing fails, don't show raw JSON
            }
        }
        return trimmed || null;
    }

    if (typeof address === 'object') {
        const {
            fullAddress,
            detail,
            addressDetail,
            wardName,
            ward,
            districtName,
            district,
            provinceName,
            province
        } = address;

        // If fullAddress exists, use it
        if (fullAddress) return fullAddress;

        // Build address from parts
        const parts = [
            detail || addressDetail,
            wardName || ward,
            districtName || district,
            provinceName || province
        ].filter(Boolean);

        if (parts.length > 0) return parts.join(', ');
        
        // If object only has IDs but no names, return null
        return null;
    }

    return null;
};

type BarTabType = 'info' | 'posts' | 'videos' | 'reviews' | 'tables';

interface BarProfileHeaderProps {
  barDetail: any;
  activeTab: BarTabType;
  postsCount: number;
  followerCount: number;
  followingCount: number;
  onTabChange: (tab: BarTabType) => void;
  onFollowersPress: () => void;
  onFollowingPress: () => void;
  onFollowPress?: () => void;
  onMessagePress?: () => void;
  onBookTablePress?: () => void;
  isFollowing?: boolean;
  followingId?: string;
  followingType?: 'USER' | 'BAR' | 'BUSINESS';
  onFollowChange?: (isFollowing: boolean) => void;
}

export const BarProfileHeader: React.FC<BarProfileHeaderProps> = ({
  barDetail,
  activeTab,
  postsCount,
  followerCount,
  followingCount,
  onTabChange,
  onFollowersPress,
  onFollowingPress,
  onFollowPress,
  onMessagePress,
  onBookTablePress,
  isFollowing = false,
  followingId,
  followingType = 'BAR',
  onFollowChange,
}) => {
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);

  // Resolve address (similar to web version)
  useEffect(() => {
    const resolveAddress = async () => {
      // Priority 1: addressText (already formatted)
      if (barDetail?.addressText && typeof barDetail.addressText === 'string' && barDetail.addressText.trim()) {
        setResolvedAddress(barDetail.addressText.trim());
        return;
      }

      // Priority 2: address field (if it's a formatted string)
      if (barDetail?.address && typeof barDetail.address === 'string') {
        const addressStr = barDetail.address.trim();
        // Only use if it's not a JSON string and has more than just a number
        if (addressStr && !addressStr.startsWith('{') && (addressStr.includes(',') || addressStr.length > 10)) {
          setResolvedAddress(addressStr);
          return;
        }

        // If it's a JSON string with IDs, parse and build full address
        if (addressStr.startsWith('{') && addressStr.endsWith('}')) {
          try {
            const parsed = parseAddressFromString(addressStr);
            if (parsed) {
              const fullAddress = await buildAddressFromIds(parsed);
              if (fullAddress) {
                setResolvedAddress(fullAddress);
                return;
              }
            }
          } catch (e) {
            console.error('[BarProfileHeader] Error parsing address:', e);
          }
        }
      }

      // Priority 3: addressData or addressObject
      const addressData = barDetail?.addressData || barDetail?.addressObject;
      if (addressData) {
        // If it has IDs but no names, fetch names
        if (addressData.provinceId && addressData.districtId && addressData.wardId && addressData.detail) {
          const fullAddress = await buildAddressFromIds({
            detail: addressData.detail || addressData.addressDetail || '',
            provinceId: addressData.provinceId || '',
            districtId: addressData.districtId || '',
            wardId: addressData.wardId || ''
          });
          if (fullAddress) {
            setResolvedAddress(fullAddress);
            return;
          }
        }
        
        // Otherwise, try to format with existing names
        const formatted = formatAddress(addressData);
        if (formatted) {
          setResolvedAddress(formatted);
          return;
        }
      }

      // Priority 4: address field (try to format)
      if (barDetail?.address) {
        const formatted = formatAddress(barDetail.address);
        if (formatted) {
          setResolvedAddress(formatted);
          return;
        }
      }

      setResolvedAddress(null);
    };

    resolveAddress();
  }, [barDetail?.addressText, barDetail?.address, barDetail?.addressData, barDetail?.addressObject]);

  return (
    <>
      {/* Cover Image */}
      <View style={styles.coverContainer}>
        <Image
          source={{ 
            uri: barDetail?.background || barDetail?.coverImage || 'https://via.placeholder.com/400x200'
          }}
          style={styles.coverImage}
        />
      </View>

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <Image 
          source={{ 
            uri: barDetail?.avatar || barDetail?.logo || 'https://via.placeholder.com/100'
          }} 
          style={styles.avatar} 
        />
      </View>

      {/* Name & Info */}
      <View style={styles.nameSection}>
        <Text style={styles.name}>{barDetail?.barName || barDetail?.name || 'Quán bar'}</Text>
        {resolvedAddress && (
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={14} color="#6b7280" />
            <Text style={styles.address}>{resolvedAddress}</Text>
          </View>
        )}
        {barDetail?.phoneNumber && (
          <View style={styles.addressRow}>
            <Ionicons name="call-outline" size={14} color="#6b7280" />
            <Text style={styles.address}>{barDetail.phoneNumber}</Text>
          </View>
        )}
      </View>

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

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        {followingId && onFollowChange && (
          <FollowButton
            followingId={followingId}
            followingType={followingType}
            onChange={onFollowChange}
            style={styles.followButtonInHeader}
          />
        )}

        {onMessagePress && (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={onMessagePress}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-outline" size={18} color="#1f2937" />
            <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
              Nhắn tin
            </Text>
          </TouchableOpacity>
        )}

        {onBookTablePress && (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonBookTable]}
            onPress={onBookTablePress}
            activeOpacity={0.8}
          >
            <Ionicons name="restaurant" size={18} color="#fff" />
            <Text style={[styles.actionButtonText, styles.actionButtonTextBookTable]}>
              Đặt bàn
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Navigation */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
        contentContainerStyle={styles.tabContentContainer}
      >
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
          style={[styles.tab, activeTab === 'videos' && styles.activeTab]}
          onPress={() => onTabChange('videos')}
        >
          <Ionicons
            name="videocam"
            size={20}
            color={activeTab === 'videos' ? '#2563eb' : '#6b7280'}
          />
          <Text style={[styles.tabText, activeTab === 'videos' && styles.activeTabText]}>
            Video
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
          onPress={() => onTabChange('reviews')}
        >
          <Ionicons
            name="star"
            size={20}
            color={activeTab === 'reviews' ? '#2563eb' : '#6b7280'}
          />
          <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
            Đánh giá
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'tables' && styles.activeTab]}
          onPress={() => onTabChange('tables')}
        >
          <Ionicons
            name="restaurant"
            size={20}
            color={activeTab === 'tables' ? '#2563eb' : '#6b7280'}
          />
          <Text style={[styles.tabText, activeTab === 'tables' && styles.activeTabText]}>
            Đặt bàn
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  coverContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#e5e7eb',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarContainer: {
    alignSelf: 'center',
    marginTop: -50,
    marginBottom: 12,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 46,
    resizeMode: 'cover',
  },
  nameSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  address: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    alignItems: 'center',
  },
  followButtonInHeader: {
    flex: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonFollow: {
    backgroundColor: '#3b82f6',
  },
  actionButtonFollowing: {
    backgroundColor: '#10b981',
  },
  actionButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionButtonBookTable: {
    backgroundColor: '#10b981',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  actionButtonTextFollow: {
    color: '#fff',
  },
  actionButtonTextFollowing: {
    color: '#fff',
  },
  actionButtonTextSecondary: {
    color: '#1f2937',
  },
  actionButtonTextBookTable: {
    color: '#fff',
  },
  tabContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  tabContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    minWidth: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2563eb',
    fontWeight: '600',
  },
});

