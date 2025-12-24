import RenderPost from '@/components/post/PostContent';
import { createSearchService, SearchResult, SearchUser } from '@/services/searchApi';
import { createFollowService } from '@/services/followApi';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {FeedApiService} from "@/services/feedApi";

const TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'users', label: 'Người dùng' },
  { key: 'bars', label: 'Bar' },
  { key: 'djs', label: 'DJ' },
  { key: 'dancers', label: 'Dancer' },
  { key: 'posts', label: 'Bài viết' },
];

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const query = (params.q as string) || '';
  const { authState } = useAuth();

  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<SearchResult>({
    users: [],
    bars: [],
    djs: [],
    dancers: [],
    posts: [],
  });

  const searchService = useMemo(
    () => createSearchService(authState.token || null),
    [authState.token]
  );
  const followService = useMemo(
    () => createFollowService(authState.token || null),
    [authState.token]
  );

  const fetchResults = useCallback(async () => {
    if (!query || !query.trim()) {
      setData({
        users: [],
        bars: [],
        djs: [],
        dancers: [],
        posts: [],
      });
      return;
    }

    setLoading(true);
    try {
      const result = await searchService.searchAll(query, 50);
      
      // Check follow status for each user if current user is logged in
      if (authState.EntityAccountId) {
        const checkFollowStatus = async (items: SearchUser[]) => {
          const itemsWithStatus = await Promise.all(
            items.map(async (item) => {
              try {
                const isFollowing = await followService.checkFollowing(
                  authState.EntityAccountId!,
                  item.id
                );
                return { ...item, isFollowing };
              } catch (error) {
                console.error('Error checking follow status:', error);
                return { ...item, isFollowing: false };
              }
            })
          );
          return itemsWithStatus;
        };

        const [usersWithStatus, barsWithStatus, djsWithStatus, dancersWithStatus] = await Promise.all([
          checkFollowStatus(result.users),
          checkFollowStatus(result.bars),
          checkFollowStatus(result.djs),
          checkFollowStatus(result.dancers),
        ]);

        setData({
          ...result,
          users: usersWithStatus,
          bars: barsWithStatus,
          djs: djsWithStatus,
          dancers: dancersWithStatus,
        });
      } else {
        setData(result);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [query, searchService]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const allItems = useMemo(() => {
    return [
      ...(data.users || []).map(x => ({ ...x, _group: 'users' })),
      ...(data.bars || []).map(x => ({ ...x, _group: 'bars' })),
      ...(data.djs || []).map(x => ({ ...x, _group: 'djs' })),
      ...(data.dancers || []).map(x => ({ ...x, _group: 'dancers' })),
    ];
  }, [data]);

  const list = useMemo(() => {
    if (activeTab === 'all') return allItems;
    if (activeTab === 'users') {
      return [
        ...(data.users || []),
        ...(data.djs || []),
        ...(data.dancers || []),
      ];
    }
    if (activeTab === 'posts') return data.posts || [];
    return data[activeTab as keyof SearchResult] || [];
  }, [activeTab, data, allItems]);

  const handleItemPress = useCallback((item: SearchUser) => {
    const itemEntityAccountId = item.raw?.EntityAccountId || item.raw?.entityAccountId || item.id;
    if (!itemEntityAccountId) return;

    if (authState.EntityAccountId && 
        String(authState.EntityAccountId).toLowerCase() === String(itemEntityAccountId).toLowerCase()) {
      router.push('/(tabs)/profile');
    } else {
      router.push({
        pathname: '/user',
        params: { id: itemEntityAccountId },
      });
    }
  }, [authState.EntityAccountId, router]);

  const handlePostPress = useCallback((post: any) => {
    const postId = post.id || post._id;
    if (postId) {
      router.push({
        pathname: '/post',
        params: { id: postId },
      });
    }
  }, [router]);

  const handleFollowPress = useCallback(async (item: SearchUser) => {
    if (!authState.EntityAccountId) {
      Alert.alert('Thông báo', 'Vui lòng đăng nhập để theo dõi');
      return;
    }

    const targetUserId = item.id;
    const isFollowing = item.isFollowing || false;

    try {
      let success = false;
      if (isFollowing) {
        success = await followService.unfollowUser(authState.EntityAccountId, targetUserId);
      } else {
        const followingType = item.type === 'BarPage' ? 'BAR' : 'USER';
        success = await followService.followUser(authState.EntityAccountId, targetUserId, followingType);
      }

      if (success) {
        // Update local state
        setData(prev => {
          const updateItems = (items: SearchUser[]) =>
            items.map(user =>
              user.id === targetUserId
                ? { ...user, isFollowing: !isFollowing }
                : user
            );

          return {
            ...prev,
            users: updateItems(prev.users),
            bars: updateItems(prev.bars),
            djs: updateItems(prev.djs),
            dancers: updateItems(prev.dancers),
          };
        });
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
      Alert.alert('Lỗi', 'Không thể thực hiện thao tác này');
    }
  }, [authState.EntityAccountId, followService]);

  const renderUserItem = useCallback(({ item }: { item: SearchUser }) => {
    const isOwnProfile = authState.EntityAccountId && 
      String(authState.EntityAccountId).toLowerCase() === String(item.id).toLowerCase();

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: item.avatar || 'https://i.pravatar.cc/150?img=10' }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.userType} numberOfLines={1}>
            {item.type}
          </Text>
        </View>
        {!isOwnProfile && authState.EntityAccountId && (
          <TouchableOpacity
            style={[
              styles.followButton,
              item.isFollowing && styles.followingButton,
            ]}
            onPress={(e) => {
              e.stopPropagation();
              handleFollowPress(item);
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.followButtonText,
                item.isFollowing && styles.followingButtonText,
              ]}
            >
              {item.isFollowing ? 'Đang follow' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }, [handleItemPress, handleFollowPress, authState.EntityAccountId]);

  const renderPostItem = useCallback(({ item }: { item: any }) => {
    return (
      <RenderPost
        item={item}
        currentId={authState.currentId ?? ''}
        currentEntityAccountId={authState.EntityAccountId}
        feedApiService={new FeedApiService(authState.token!)}
      />
    );
  }, [authState.currentId, authState.token]);

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
        </View>
      );
    }

    if (activeTab === 'posts') {
      return (
        <FlatList
          data={list}
          renderItem={renderPostItem}
          keyExtractor={item => item.id || item._id || String(Math.random())}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchResults();
              }}
              colors={['#2563eb']}
              tintColor="#2563eb"
            />
          }
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>Không có bài viết nào</Text>
            </View>
          }
        />
      );
    }

    return (
      <FlatList
        data={list}
        renderItem={renderUserItem}
        keyExtractor={item => `${item.type}-${item.id}`}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchResults();
            }}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Ionicons name="search-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>Không có kết quả</Text>
          </View>
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tìm kiếm</Text>
        <View style={styles.backButton} />
      </View>

      {/* Search Query */}
      {query && (
        <View style={styles.queryContainer}>
          <Text style={styles.queryText}>
            Kết quả cho: <Text style={styles.queryBold}>"{query}"</Text>
          </Text>
        </View>
      )}

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScrollView}
        contentContainerStyle={styles.tabsContainer}
      >
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      <View style={styles.resultsContainer}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  queryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  queryText: {
    fontSize: 14,
    color: '#6b7280',
  },
  queryBold: {
    fontWeight: '600',
    color: '#111827',
  },
  tabsScrollView: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  activeTab: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    backgroundColor: '#f3f4f6',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  userType: {
    fontSize: 14,
    color: '#6b7280',
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    marginLeft: 8,
  },
  followingButton: {
    backgroundColor: '#f3f4f6',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  followingButtonText: {
    color: '#6b7280',
  },
});

