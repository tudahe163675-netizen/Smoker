// hooks/useUserProfile.ts
import { Post, User } from '@/constants/feedData';
import { useAuth } from "@/hooks/useAuth";
import { useCallback, useEffect, useState } from 'react';
import {FeedApiService} from "@/services/feedApi";
import {ProfileApiService} from "@/services/profileApi";

export const useUserProfile = (userId: string) => {
    const [user, setUser] = useState<User | null>(null);
    const [userReview, setUserReview] = useState<any>();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(false);
    const [followers, setFollowers] = useState<any[]>([]);
    const [following, setFollowing] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    const {authState} = useAuth();
    const accountId = authState.EntityAccountId!;
    const token = authState.token!;
    const feedApi = new FeedApiService(token);
    const profileApi = new ProfileApiService(token);
    const fetchUserProfile = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [userResponse, postsResponse, followersResponse, followingResponse] = await Promise.all([
                feedApi.getViewInformation(userId),
                feedApi.getUserPosts(userId),
                feedApi.getFollowers(userId),
                feedApi.getFollowing(userId),
            ]);            

            if (userResponse.success && userResponse.data) {
                const response = await feedApi.checkFollow(accountId, userResponse.data.entityAccountId);
                setUser({
                    ...userResponse.data,
                    isFollowing: response.data?.isFollowing ?? false
                });

               const userReview= await profileApi.getUserReviewsBusiness(userResponse.data.targetId!)
                if (userReview.data) {
                    setUserReview(userReview.data);
                }
            } else {
                setError('Không tìm thấy người dùng');
            }
            if (postsResponse.success && postsResponse.data) {
                setPosts(postsResponse.data);
            }

            if (followingResponse?.data) {
                setFollowing(followingResponse.data);
            }
            if (followersResponse?.data) {
                setFollowers(followersResponse.data);
            }
        } catch (err) {
            console.error('Error fetching user profile:', err);
            setError('Không thể tải thông tin người dùng');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const followUser = async (): Promise<void> => {
        if (!user) return;
        try {
            const response = await feedApi.followUser(accountId, user.entityAccountId, user.type);
            if (!response.success) {
                setUser(prev => prev ? {
                    ...prev,
                    isFollowing: !prev.isFollowing,
                    followers: prev.isFollowing ? prev.followers - 1 : prev.followers + 1
                } : null);
            }
        } catch (err) {
            console.error('Error following user:', err);
        }
    };
    const unFollowUser = async (): Promise<void> => {
        if (!user) return;
        try {
            const response = await feedApi.unFollowUser(accountId, user.entityAccountId);

            if (!response.success) {
                setUser(prev => prev ? {
                    ...prev,
                    isFollowing: !prev.isFollowing,
                    followers: prev.isFollowing ? prev.followers - 1 : prev.followers + 1
                } : null);
            }
        } catch (err) {
            console.error('Error following user:', err);
        }
    };

    const refreshComments = async () => {
        const userReview= await profileApi.getUserReviewsBusiness(user?.targetId!)
        if (userReview.data) {
            setUserReview(userReview.data);
        }
    }

    useEffect(() => {
        fetchUserProfile();
    }, [fetchUserProfile]);

    return {
        user,
        posts,
        userReview,
        followers,
        following,
        loading,
        error,
        fetchUserProfile,
        followUser,
        unFollowUser,
        refreshComments
    };
};