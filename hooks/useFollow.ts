import { FollowUser } from '@/constants/followData';
import { createFollowService } from '@/services/followApi';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';

export type FollowType = 'followers' | 'following';

export const useFollow = (userId: string, type: FollowType) => {
  const { authState } = useAuth();
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const followService = useMemo(
    () => createFollowService(authState.token || null),
    [authState.token]
  );

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setError(null);
      let data =
        type === 'followers'
          ? await followService.getFollowers(userId)
          : await followService.getFollowing(userId);
      
      // For followers list, check follow status for each user if we have current user's EntityAccountId
      // This ensures accurate follow status display, similar to web version
      if (type === 'followers' && authState.EntityAccountId && data.length > 0) {
        const checkPromises = data.map(async (user) => {
          try {
            const isFollowing = await followService.checkFollowing(
              authState.EntityAccountId!,
              user.userId || user.id
            );
            return { ...user, isFollowing };
          } catch (err) {
            // If check fails, keep the original isFollowing from API response
            return user;
          }
        });
        data = await Promise.all(checkPromises);
      }
      
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      setError('Không thể tải danh sách. Vui lòng thử lại.');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, type, followService, authState.EntityAccountId]);

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Search users
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);

      if (!query.trim()) {
        setFilteredUsers(users);
        return;
      }

      const lowercaseQuery = query.toLowerCase();
      const filtered = users.filter(
        user =>
          user.name.toLowerCase().includes(lowercaseQuery) ||
          user.username.toLowerCase().includes(lowercaseQuery) ||
          user.bio.toLowerCase().includes(lowercaseQuery)
      );
      setFilteredUsers(filtered);
    },
    [users]
  );

  // Follow user
  const handleFollow = useCallback(async (targetUserId: string) => {
    if (!authState.EntityAccountId) {
      setError('Vui lòng đăng nhập để theo dõi');
      return;
    }

    try {
      setActionLoading(targetUserId);
      const success = await followService.followUser(authState.EntityAccountId, targetUserId, 'USER');

      if (success) {
        setUsers(prev =>
          prev.map(user =>
            user.userId === targetUserId ? { ...user, isFollowing: true } : user
          )
        );
        setFilteredUsers(prev =>
          prev.map(user =>
            user.userId === targetUserId ? { ...user, isFollowing: true } : user
          )
        );
      } else {
        setError('Không thể theo dõi người dùng này');
      }
    } catch (err) {
      console.error('Error following user:', err);
      setError('Không thể theo dõi người dùng này');
    } finally {
      setActionLoading(null);
    }
  }, [authState.EntityAccountId, followService]);

  // Unfollow user
  const handleUnfollow = useCallback(async (targetUserId: string) => {
    if (!authState.EntityAccountId) {
      setError('Vui lòng đăng nhập để bỏ theo dõi');
      return;
    }

    try {
      setActionLoading(targetUserId);
      const success = await followService.unfollowUser(authState.EntityAccountId, targetUserId);

      if (success) {
        if (type === 'following') {
          // Remove from following list
          setUsers(prev => prev.filter(user => user.userId !== targetUserId));
          setFilteredUsers(prev => prev.filter(user => user.userId !== targetUserId));
        } else {
          // Just update isFollowing status in followers list
          setUsers(prev =>
            prev.map(user =>
              user.userId === targetUserId ? { ...user, isFollowing: false } : user
            )
          );
          setFilteredUsers(prev =>
            prev.map(user =>
              user.userId === targetUserId ? { ...user, isFollowing: false } : user
            )
          );
        }
      }
    } catch (err) {
      console.error('Error unfollowing user:', err);
      setError('Không thể bỏ theo dõi người dùng này');
    } finally {
      setActionLoading(null);
    }
  }, [type, authState.EntityAccountId, followService]);

  // Remove follower
  const handleRemoveFollower = useCallback(async (targetUserId: string) => {
    if (!authState.EntityAccountId) {
      setError('Vui lòng đăng nhập để xóa người theo dõi');
      return;
    }

    try {
      setActionLoading(targetUserId);
      const success = await followService.removeFollower(authState.EntityAccountId, targetUserId);

      if (success) {
        setUsers(prev => prev.filter(user => user.userId !== targetUserId));
        setFilteredUsers(prev => prev.filter(user => user.userId !== targetUserId));
      }
    } catch (err) {
      console.error('Error removing follower:', err);
      setError('Không thể xóa người theo dõi này');
    } finally {
      setActionLoading(null);
    }
  }, [authState.EntityAccountId, followService]);

  // Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsers();
  }, [fetchUsers]);

  return {
    users: filteredUsers,
    loading,
    refreshing,
    error,
    searchQuery,
    actionLoading,
    handleSearch,
    handleFollow,
    handleUnfollow,
    handleRemoveFollower,
    onRefresh,
  };
};