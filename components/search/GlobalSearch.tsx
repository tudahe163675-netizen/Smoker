import { createSearchService, SearchResult, SearchUser } from '@/services/searchApi';
import { createFollowService } from '@/services/followApi';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface GlobalSearchProps {
  visible: boolean;
  onClose: () => void;
}

const TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'users', label: 'Người dùng' },
  { key: 'bars', label: 'Bar' },
  { key: 'djs', label: 'DJ' },
  { key: 'dancers', label: 'Dancer' },
];

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ visible, onClose }) => {
  const router = useRouter();
  const { authState } = useAuth();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchResult>({
    users: [],
    bars: [],
    djs: [],
    dancers: [],
    posts: [],
  });

  const debouncedQuery = useDebounce(query, 300);
  const searchService = useMemo(
    () => createSearchService(authState.token || null),
    [authState.token]
  );
  const followService = useMemo(
    () => createFollowService(authState.token || null),
    [authState.token]
  );

  useEffect(() => {
    let alive = true;

    const search = async () => {
      if (!debouncedQuery || !debouncedQuery.trim()) {
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
        const result = await searchService.searchAll(debouncedQuery, 5);
        if (alive) {
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
        }
      } catch (error) {
        console.error('Search error:', error);
        if (alive) {
          setData({
            users: [],
            bars: [],
            djs: [],
            dancers: [],
            posts: [],
          });
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    search();

    return () => {
      alive = false;
    };
  }, [debouncedQuery, searchService]);

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
    return data[activeTab as keyof SearchResult] || [];
  }, [activeTab, data, allItems]);

  const handleItemPress = useCallback((item: SearchUser) => {
    const itemEntityAccountId = item.raw?.EntityAccountId || item.raw?.entityAccountId || item.id;
    if (!itemEntityAccountId) return;

    // Check if this is current user's own profile
    if (authState.EntityAccountId && 
        String(authState.EntityAccountId).toLowerCase() === String(itemEntityAccountId).toLowerCase()) {
      router.push('/(tabs)/profile');
    } else {
      router.push({
        pathname: '/user',
        params: { id: itemEntityAccountId },
      });
    }
    onClose();
  }, [authState.EntityAccountId, router, onClose]);

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

  const handleSearchSubmit = useCallback(() => {
    if (query.trim()) {
      router.push({
        pathname: '/search',
        params: { q: query.trim() },
      });
      onClose();
    }
  }, [query, router, onClose]);

  const renderItem = useCallback(({ item }: { item: SearchUser }) => {
    const isOwnProfile = authState.EntityAccountId && 
      String(authState.EntityAccountId).toLowerCase() === String(item.id).toLowerCase();

    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: item.avatar || 'https://i.pravatar.cc/150?img=10' }}
          style={styles.avatar}
        />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.itemType} numberOfLines={1}>
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.container} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="Tìm người, bar, DJ, dancer..."
                placeholderTextColor="#9ca3af"
                value={query}
                onChangeText={setQuery}
                autoFocus
                onSubmitEditing={handleSearchSubmit}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Hủy</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
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
          </View>

          {/* Results */}
          <View style={styles.resultsContainer}>
            {loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Đang tìm...</Text>
              </View>
            ) : list.length === 0 ? (
              <View style={styles.centerContainer}>
                <Ionicons name="search-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyText}>
                  {query.trim() ? 'Không có kết quả' : 'Nhập từ khóa để tìm kiếm'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={list}
                renderItem={renderItem}
                keyExtractor={item => `${item.type}-${item.id}`}
                contentContainerStyle={styles.listContent}
              />
            )}
          </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  closeButton: {
    paddingVertical: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#f3f4f6',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemType: {
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

