import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useBar } from '@/hooks/useBar';
import { FeedApiService } from '@/services/feedApi';
import { ProfileHeader } from '@/components/ProfileHeader';
import { BarProfileHeader } from '@/components/BarProfileHeader';
import ProfileEditModal from '@/components/profile/ProfileEditModal';
import RenderPost from '@/components/post/PostContent';
import Review from '@/app/user/review';
import RenderReviewItem from '@/app/user/review/renderReviewItem';
import BarInfoTab from '@/app/barProfile/tabs/BarInfoTab';
import BarPostsTab from '@/app/barProfile/tabs/BarPostsTab';
import BarVideosTab from '@/app/barProfile/tabs/BarVideosTab';
import BarReviewsTab from '@/app/barProfile/tabs/BarReviewsTab';
import BarTablesTab from '@/app/barProfile/tabs/BarTablesTab';

type TabType = 'info' | 'posts' | 'photos';
type BarTabType = 'info' | 'posts' | 'videos' | 'reviews' | 'tables';

export default function OwnProfilePage() {
  const router = useRouter();
  const { authState } = useAuth();
  const insets = useSafeAreaInsets();
  const accountId = authState.EntityAccountId;

  // Get own profile using accountId
  const {
    user,
    posts,
    userReview,
    followers,
    following,
    loading,
    refreshComments,
  } = useUserProfile(accountId || '');

  // Bar hooks
  const {
    barDetail,
    tables,
    bookedTables,
    loadingDetail: loadingBarDetail,
    fetchBarDetail,
    fetchTables,
    fetchBookedTables,
  } = useBar();

  const feedApi = new FeedApiService(authState.token!);
  const scrollY = useRef(new Animated.Value(0)).current;
  const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [barActiveTab, setBarActiveTab] = useState<BarTabType>('info');
  const [showEditModal, setShowEditModal] = useState(false);
  const [postsCount, setPostsCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);

  // Determine profile type
  const type = (user?.type || user?.Type || user?.role || '').toString().toUpperCase();
  const isBarProfile =
    type === 'BAR' ||
    type === 'BARPAGE' ||
    type.includes('BARPAGE') ||
    type.includes('BAR') ||
    !!user?.barPageId ||
    !!user?.BarPageId ||
    !!user?.barPageID ||
    !!barDetail;

  const isPerformer = user?.role === 'DJ' || user?.role === 'Dancer';

  // Get profile type for edit modal
  const getProfileType = (): 'Account' | 'BarPage' | 'BusinessAccount' => {
    if (isBarProfile) return 'BarPage';
    if (isPerformer) return 'BusinessAccount';
    return 'Account';
  };

  // Get barPageId
  const barPageId = isBarProfile && user
    ? user.barPageId || user.BarPageId || user.barPageID || user.targetId || user.targetID || accountId
    : null;

  // Fetch bar detail if bar profile
  useEffect(() => {
    if (accountId && !loading && isBarProfile && barPageId) {
      fetchBarDetail(barPageId);
      fetchTables(barPageId);
    }
  }, [accountId, loading, isBarProfile, barPageId, fetchBarDetail, fetchTables]);

  // Fetch posts count
  useEffect(() => {
    if (user && user.entityAccountId) {
      const fetchPostsCount = async () => {
        try {
          const response = await feedApi.getPostByUserId(user.entityAccountId, 1, 1);
          if (response.success && response.data) {
            setPostsCount(response.data.total || 0);
          }
        } catch (error) {
          console.error('Error fetching posts count:', error);
        }
      };
      fetchPostsCount();
    }
  }, [user]);

  // Set follower count
  useEffect(() => {
    if (Array.isArray(followers)) {
      setFollowerCount(followers.length || 0);
    }
  }, [followers]);

  const showReview = user?.role === 'DJ' || user?.role === 'Dancer' || user?.type === 'BAR';

  // Render bar profile
  if (isBarProfile && user) {
    const barPageIdForBarData = barPageId || accountId || '';

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Hồ sơ của tôi</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setShowEditModal(true)}
            >
              <Ionicons name="create-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          >
            <BarProfileHeader
              barDetail={barDetail || user}
              barPageId={barPageIdForBarData}
              postsCount={postsCount}
              followerCount={followerCount}
              followingCount={following?.length || 0}
              activeTab={barActiveTab}
              onTabChange={(tab) => setBarActiveTab(tab as BarTabType)}
            />

            <View style={{ flex: 0 }}>
              {barActiveTab === 'info' && (
                <BarInfoTab barDetail={barDetail || user} barPageId={barPageIdForBarData} />
              )}
              {barActiveTab === 'posts' && <BarPostsTab barPageId={barPageIdForBarData} />}
              {barActiveTab === 'videos' && <BarVideosTab barPageId={barPageIdForBarData} />}
              {barActiveTab === 'reviews' && <BarReviewsTab barPageId={barPageIdForBarData} />}
              {barActiveTab === 'tables' && (
                <BarTablesTab
                  barPageId={barPageIdForBarData}
                  tables={tables}
                  bookedTables={bookedTables}
                  onRefreshTables={() => fetchTables(barPageIdForBarData)}
                />
              )}
            </View>
          </ScrollView>

          <ProfileEditModal
            visible={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSuccess={() => {
              // Refresh profile data
              if (barPageId) {
                fetchBarDetail(barPageId);
              }
              setShowEditModal(false);
            }}
            profile={barDetail || user}
            profileType="BarPage"
            token={authState.token!}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Render user profile (Account, DJ, Dancer)
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hồ sơ của tôi</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Đang tải hồ sơ...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hồ sơ của tôi</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={48} color="#6b7280" />
          <Text style={styles.errorText}>Không tìm thấy hồ sơ</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render DJ/Dancer Info Tab Content
  const renderDJDancerInfoTab = () => {
    const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);

    useEffect(() => {
      if (activeTab === 'info' && isPerformer) {
        const resolveAddress = async () => {
          if (user?.addressText && typeof user.addressText === 'string' && user.addressText.trim()) {
            setResolvedAddress(user.addressText.trim());
            return;
          }
          if (user?.address && typeof user.address === 'string') {
            const addressStr = user.address.trim();
            if (addressStr && !addressStr.startsWith('{') && (addressStr.includes(',') || addressStr.length > 10)) {
              setResolvedAddress(addressStr);
              return;
            }
          }
          setResolvedAddress(null);
        };
        resolveAddress();
      }
    }, [activeTab, user?.addressText, user?.address, isPerformer]);

    const displayGender = (gender: string | null | undefined): string => {
      if (!gender) return 'Chưa cập nhật';
      const genderLower = gender.toLowerCase();
      if (genderLower === 'male') return 'Nam';
      if (genderLower === 'female') return 'Nữ';
      if (genderLower === 'other') return 'Khác';
      return gender;
    };

    return (
      <View style={{ backgroundColor: '#fff', marginTop: 12, paddingHorizontal: 16, paddingVertical: 8 }}>
        {(user?.phoneNumber || user?.phone) && (
          <View style={styles.contactItemRow}>
            <View style={styles.contactIcon}>
              <Ionicons name="call" size={18} color="#10b981" />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>Số điện thoại</Text>
              <Text style={styles.contactValue} numberOfLines={1}>
                {user?.phoneNumber || user?.phone}
              </Text>
            </View>
          </View>
        )}

        {user?.email && (
          <View style={styles.contactItemRow}>
            <View style={styles.contactIcon}>
              <Ionicons name="mail" size={18} color="#f59e0b" />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue} numberOfLines={1}>{user?.email}</Text>
            </View>
          </View>
        )}

        {resolvedAddress && (
          <View style={styles.contactItemRow}>
            <View style={styles.contactIcon}>
              <Ionicons name="location" size={18} color="#3b82f6" />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>Địa chỉ</Text>
              <Text style={styles.contactValue} numberOfLines={2}>{resolvedAddress}</Text>
            </View>
          </View>
        )}

        {user?.gender && (
          <View style={styles.contactItemRow}>
            <View style={styles.contactIcon}>
              <Ionicons name="person" size={18} color="#8b5cf6" />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>Giới tính</Text>
              <Text style={styles.contactValue}>{displayGender(user?.gender)}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Render tab content
  const renderUserTabContent = () => {
    if (activeTab === 'info' && isPerformer) {
      return renderDJDancerInfoTab();
    }

    if (activeTab === 'reviews' && showReview) {
      return (
        <Review
          authState={authState}
          user={user}
          userReview={userReview}
          refreshComments={refreshComments}
        />
      );
    }

    return null;
  };

  // Render header
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.coverContainer}>
        <Image
          source={{ uri: user?.background || 'https://picsum.photos/400/200?random=' + user?._id }}
          style={styles.coverImage}
          resizeMode="cover"
        />
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: user?.avatar }} style={styles.avatar} />
        </View>

        <View style={styles.userInfo}>
          {user?.name && <Text style={styles.userName}>{user.name}</Text>}
          {user?.username && <Text style={styles.userUsername}>{user.username}</Text>}
          {user?.bio && <Text style={styles.userBio}>{user.bio}</Text>}
        </View>

        {/* Price Section - Only for DJ/Dancer */}
        {isPerformer && (user?.pricePerHours || user?.pricePerSession || user?.PricePerHours || user?.PricePerSession) && (
          <View
            style={{
              backgroundColor: '#eff6ff',
              borderRadius: 12,
              padding: 24,
              marginTop: 12,
              marginBottom: 12,
              borderWidth: 0.5,
              borderColor: '#bfdbfe',
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 16 }}>
              Bảng giá dịch vụ
            </Text>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              {(user?.pricePerHours || user?.PricePerHours) && (
                <View
                  style={{
                    flex: 1,
                    backgroundColor: '#f3f4f6',
                    borderRadius: 8,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 8 }}>
                    Giá tiêu chuẩn
                  </Text>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: '#111827' }}>
                    {Number.parseInt(user?.pricePerHours || user?.PricePerHours || 0, 10).toLocaleString('vi-VN')} đ
                  </Text>
                  <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>/ slot</Text>
                </View>
              )}
              {(user?.pricePerSession || user?.PricePerSession) && (
                <View
                  style={{
                    flex: 1,
                    backgroundColor: '#fff7ed',
                    borderRadius: 8,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: '#fed7aa',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#9a3412', marginBottom: 8 }}>
                    Giá ưu đãi khi đặt nhiều slot
                  </Text>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: '#ea580c' }}>
                    {Number.parseInt(user?.pricePerSession || user?.PricePerSession || 0, 10).toLocaleString('vi-VN')} đ
                  </Text>
                  <Text style={{ fontSize: 12, color: '#9a3412', marginTop: 4 }}>/ slot</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{postsCount}</Text>
            <Text style={styles.statLabel}>Bài viết</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{followerCount}</Text>
            <Text style={styles.statLabel}>Người theo dõi</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{following?.length || 0}</Text>
            <Text style={styles.statLabel}>Đang theo dõi</Text>
          </View>
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
            <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>Thông tin</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveTab('posts')}
          >
            <Ionicons name="documents" size={20} color={activeTab === 'posts' ? '#2563eb' : '#6b7280'} />
            <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>Bài viết</Text>
          </TouchableOpacity>

          {showReview && (
            <TouchableOpacity
              style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
              onPress={() => setActiveTab('reviews' as TabType)}
            >
              <Ionicons name="star" size={20} color={activeTab === 'reviews' ? '#2563eb' : '#6b7280'} />
              <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>Đánh giá</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        <Animated.View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hồ sơ của tôi</Text>
          <TouchableOpacity style={styles.editButton} onPress={() => setShowEditModal(true)}>
            <Ionicons name="create-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Render info tab content for DJ/Dancer */}
        {activeTab === 'info' && isPerformer ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {renderHeader()}
            {renderUserTabContent()}
          </ScrollView>
        ) : (
          <AnimatedFlatList
            data={activeTab === 'posts' ? posts : userReview.reviews}
            renderItem={({ item }) => {
              return activeTab === 'posts' ? (
                <RenderPost
                  item={item}
                  currentId={authState.currentId}
                  currentEntityAccountId={authState.EntityAccountId}
                  feedApiService={feedApi}
                />
              ) : (
                <RenderReviewItem item={item} />
              );
            }}
            keyExtractor={(item: any) => item.id ?? item._id}
            ListHeaderComponent={renderHeader}
            ItemSeparatorComponent={() => <View style={{ height: 8, backgroundColor: '#f0f2f5' }} />}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
              useNativeDriver: true,
            })}
            style={{ paddingBottom: 20 }}
            scrollEventThrottle={16}
            ListEmptyComponent={
              activeTab === 'posts' ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="images-outline" size={48} color="#d1d5db" />
                  <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
                  <Text style={styles.emptySubtext}>Hãy chia sẻ khoảnh khắc đầu tiên!</Text>
                </View>
              ) : (
                <></>
              )
            }
          />
        )}

        <ProfileEditModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            // Refresh profile - the useUserProfile hook should refetch
            setShowEditModal(false);
          }}
          profile={user}
          profileType={getProfileType()}
          token={authState.token!}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
  },
  headerContainer: {
    backgroundColor: '#fff',
  },
  coverContainer: {
    position: 'relative',
    height: 200,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: 70,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  avatarContainer: {
    position: 'absolute',
    top: -40,
    zIndex: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  userUsername: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  userBio: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 20,
    width: '100%',
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    width: '100%',
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#6b7280',
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  contactItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactContent: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
});



