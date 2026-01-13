import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { FeedApiService } from '@/services/feedApi';

interface FollowButtonProps {
  followingId: string;
  followingType?: 'USER' | 'BAR' | 'BUSINESS';
  onChange?: (isFollowing: boolean) => void;
  compact?: boolean;
  style?: ViewStyle;
  disabled?: boolean;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  followingId,
  followingType = 'USER',
  onChange,
  compact = false,
  style,
  disabled = false,
}) => {
  const { authState } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const feedApi = new FeedApiService(authState.token || '');

  // Check follow status when component mounts or followingId changes
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!authState.token || !authState.EntityAccountId || !followingId) {
        setChecking(false);
        return;
      }

      // Prevent checking if trying to follow yourself
      if (authState.EntityAccountId.toLowerCase().trim() === followingId.toLowerCase().trim()) {
        setChecking(false);
        return;
      }

      try {
        setChecking(true);
        const response = await feedApi.checkFollow(authState.EntityAccountId, followingId);
        if (response.success && response.data) {
          setIsFollowing(response.data.isFollowing || false);
        }
      } catch (error) {
        console.error('[FollowButton] Error checking follow status:', error);
        setIsFollowing(false);
      } finally {
        setChecking(false);
      }
    };

    checkFollowStatus();
  }, [followingId, authState.token, authState.EntityAccountId]);

  const handleFollow = async () => {
    if (!authState.token || !authState.EntityAccountId || !followingId) {
      return;
    }

    // Prevent following yourself
    if (authState.EntityAccountId.toLowerCase().trim() === followingId.toLowerCase().trim()) {
      return;
    }

    try {
      setLoading(true);
      const response = await feedApi.followUser(
        authState.EntityAccountId,
        followingId,
        followingType
      );

      if (response.success) {
        setIsFollowing(true);
        onChange && onChange(true);
      } else {
        // Handle 409 Conflict (Already following)
        const errorMessage = response.message || response.error || '';
        if (
          errorMessage.toLowerCase().includes('already following') ||
          errorMessage.toLowerCase().includes('đã theo dõi')
        ) {
          setIsFollowing(true);
          onChange && onChange(true);
        }
      }
    } catch (error: any) {
      console.error('[FollowButton] Error following:', error);
      const errorMessage = error?.message || error?.error || '';
      if (
        errorMessage.toLowerCase().includes('already following') ||
        errorMessage.toLowerCase().includes('đã theo dõi') ||
        errorMessage.toLowerCase().includes('conflict')
      ) {
        setIsFollowing(true);
        onChange && onChange(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!authState.token || !authState.EntityAccountId || !followingId) {
      return;
    }

    try {
      setLoading(true);
      const response = await feedApi.unFollowUser(authState.EntityAccountId, followingId);

      if (response.success) {
        setIsFollowing(false);
        onChange && onChange(false);
      }
    } catch (error) {
      console.error('[FollowButton] Error unfollowing:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't render if checking status
  if (checking) {
    return (
      <TouchableOpacity style={[styles.button, styles.buttonDisabled, style]} disabled>
        <ActivityIndicator size="small" color="#fff" />
      </TouchableOpacity>
    );
  }

  // Don't render if not logged in
  if (!authState.token || !authState.EntityAccountId) {
    return (
      <TouchableOpacity style={[styles.button, styles.buttonDisabled, style]} disabled>
        <Text style={styles.buttonTextDisabled}>Đăng nhập</Text>
      </TouchableOpacity>
    );
  }

  // Don't render if trying to follow yourself
  if (authState.EntityAccountId.toLowerCase().trim() === followingId.toLowerCase().trim()) {
    return null;
  }

  const buttonStyle = isFollowing
    ? [styles.button, styles.buttonFollowing, compact && styles.buttonCompact, style]
    : [styles.button, styles.buttonFollow, compact && styles.buttonCompact, style];

  const textStyle = isFollowing ? styles.textFollowing : styles.textFollow;
  const iconName = isFollowing ? 'checkmark-circle' : 'person-add-outline';
  const iconColor = isFollowing ? '#6b7280' : '#fff';
  const buttonText = loading
    ? isFollowing
      ? 'Đang hủy...'
      : 'Đang theo dõi...'
    : isFollowing
    ? 'Đã theo dõi'
    : 'Theo dõi';

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={isFollowing ? handleUnfollow : handleFollow}
      disabled={loading || disabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <Ionicons name={iconName} size={18} color={iconColor} />
      )}
      <Text style={[textStyle, loading && styles.textLoading]}>{buttonText}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  buttonCompact: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buttonFollow: {
    backgroundColor: '#2563eb',
  },
  buttonFollowing: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  textFollow: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  textFollowing: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
  textLoading: {
    opacity: 0.7,
  },
  buttonTextDisabled: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

