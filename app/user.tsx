// app/user/[id].tsx
import { Post } from '@/constants/feedData';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');
const imageSize = (screenWidth - 32 - 8) / 3;

export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, posts, loading, followUser } = useUserProfile(id!);
  const scrollY = useRef(new Animated.Value(0)).current;
  const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const handlePostPress = (postId: string) => {
    router.push({
      pathname: '/post',
      params: { id: postId }
    });
  };

  const handleFollowPress = () => {
    followUser();
  };

  const renderPostItem = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.postItem}
      onPress={() => handlePostPress(item.id)}
    >
      <Image
        source={{ uri: item.images[0] || 'https://picsum.photos/200/200?random=' + item.id }}
        style={styles.postImage}
        resizeMode="cover"
      />
      {item.images.length > 1 && (
        <View style={styles.multipleImagesIndicator}>
          <Ionicons name="copy-outline" size={16} color="#fff" />
        </View>
      )}
      <View style={styles.postStats}>
        <View style={styles.postStat}>
          <Ionicons name="heart" size={12} color="#fff" />
          <Text style={styles.postStatText}>{item.likes}</Text>
        </View>
        {item.commentsCount > 0 && (
          <View style={styles.postStat}>
            <Ionicons name="chatbubble" size={12} color="#fff" />
            <Text style={styles.postStatText}>{item.commentsCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.coverContainer}>
        <Image
          source={{ uri: user?.coverImage || 'https://picsum.photos/400/200?random=' + user?.id }}
          style={styles.coverImage}
          resizeMode="cover"
        />
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: user?.avatar }}
            style={styles.avatar}
          />
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userUsername}>{user?.username}</Text>
          {user?.bio && (
            <Text style={styles.userBio}>{user.bio}</Text>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{formatNumber(user?.posts || 0)}</Text>
            <Text style={styles.statLabel}>Bài viết</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{formatNumber(user?.followers || 0)}</Text>
            <Text style={styles.statLabel}>Người theo dõi</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{formatNumber(user?.following || 0)}</Text>
            <Text style={styles.statLabel}>Đang theo dõi</Text>
          </View>
        </View>

        {user?.id !== '10' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.followButton,
                user?.isFollowing && styles.followingButton
              ]}
              onPress={handleFollowPress}
            >
              <Ionicons
                name={user?.isFollowing ? "checkmark" : "person-add"}
                size={16}
                color={user?.isFollowing ? "#6b7280" : "#fff"}
              />
              <Text style={[
                styles.followButtonText,
                user?.isFollowing && styles.followingButtonText
              ]}>
                {user?.isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.messageButton}>
              <Ionicons name="chatbubble-outline" size={16} color="#2563eb" />
              <Text style={styles.messageButtonText}>Nhắn tin</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.postsHeader}>
          <View style={styles.postsHeaderItem}>
            <Ionicons name="grid-outline" size={20} color="#111827" />
            <Text style={styles.postsHeaderText}>Bài viết</Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hồ sơ</Text>
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
          <Text style={styles.headerTitle}>Hồ sơ</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={48} color="#6b7280" />
          <Text style={styles.errorText}>Không tìm thấy người dùng</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <Animated.View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{user.name}</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <AnimatedFlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
            <Text style={styles.emptySubtext}>
              {user.id === '10' ? 'Hãy chia sẻ khoảnh khắc đầu tiên!' : 'Người dùng chưa đăng bài viết nào.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  moreButton: {
    padding: 8,
    marginRight: -8,
  },
  flatListContent: {
    paddingBottom: 20,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  headerContainer: {
    backgroundColor: '#fff',
    marginBottom: 16,
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
    paddingHorizontal: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: -40,
    marginBottom: 16,
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
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  followButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 8,
  },
  followingButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  followingButtonText: {
    color: '#6b7280',
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 8,
  },
  messageButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  postsHeader: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  postsHeaderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  postsHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  postItem: {
    width: imageSize,
    height: imageSize,
    margin: 4,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  multipleImagesIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  postStats: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  postStatText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
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
});