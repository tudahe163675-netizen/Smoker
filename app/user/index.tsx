import BookingModal from "@/app/user/modals/bookingModal";
import Review from "@/app/user/review";
import RenderReviewItem from "@/app/user/review/renderReviewItem";
import RenderPost from "@/components/post/PostContent";
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useBar } from '@/hooks/useBar';
import { FeedApiService } from "@/services/feedApi";
import { MessageApiService } from '@/services/messageApi';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Linking, Platform,
    StatusBar, StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView,
    RefreshControl
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarProfileHeader } from '@/components/BarProfileHeader';
import { FollowButton } from '@/components/common/FollowButton';
import BarInfoTab from '@/app/barProfile/tabs/BarInfoTab';
import BarPostsTab from '@/app/barProfile/tabs/BarPostsTab';
import BarVideosTab from '@/app/barProfile/tabs/BarVideosTab';
import BarReviewsTab from '@/app/barProfile/tabs/BarReviewsTab';
import BarTablesTab from '@/app/barProfile/tabs/BarTablesTab';

const {width: screenWidth} = Dimensions.get('window');
const imageSize = (screenWidth - 32 - 8) / 3;

type BarTabType = 'info' | 'posts' | 'videos' | 'reviews' | 'tables';

export default function Index() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<string>('posts');
    const [barActiveTab, setBarActiveTab] = useState<BarTabType>('info');
    const params = useLocalSearchParams<{ id: string | string[] }>();
    // Handle id as string or array (expo-router can return array)
    const id = Array.isArray(params.id) ? params.id[0] : (params.id || '');
    const {authState} = useAuth();
    const {
        user,
        posts,
        userReview,
        followers,
        following,
        loading,
        followUser,
        unFollowUser,
        refreshComments
    } = useUserProfile(id!);
    
    // Bar hooks - fetch bar detail using entityAccountId (id from params)
    const {
        barDetail,
        tables,
        bookedTables,
        loadingDetail: loadingBarDetail,
        fetchBarDetail,
        fetchTables,
        fetchBookedTables,
    } = useBar();
    
    const scrollY = useRef(new Animated.Value(0)).current;
    const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
    const feedApi = new FeedApiService(authState.token!);
    const [visible, setVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [postsCount, setPostsCount] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const showReview = user?.role === 'DJ' || user?.role === 'Dancer' || user?.type === 'BAR';
    const accountId = authState.EntityAccountId;

    // Determine if this is a bar profile (similar to web's useProfileType)
    // Check user.type === 'BAR' or profile type indicates bar
    const type = (user?.type || user?.Type || user?.role || "").toString().toUpperCase();
    const isBarProfile = type === "BAR" || 
                        type === "BARPAGE" || 
                        type.includes("BARPAGE") ||
                        type.includes("BAR") ||
                        !!user?.barPageId ||
                        !!user?.BarPageId ||
                        !!user?.barPageID ||
                        !!barDetail; // Nếu có barDetail thì chắc chắn là bar profile
    
    // Get followingType based on user type (similar to web)
    const getFollowingType = (): 'USER' | 'BAR' | 'BUSINESS' => {
        if (!user) return 'USER';
        const userType = (user.type || user.role || '').toString().toUpperCase();
        if (userType === 'BAR' || userType.includes('BARPAGE') || userType.includes('BAR')) {
            return 'BAR';
        }
        if (userType === 'DJ' || userType === 'DANCER' || userType.includes('BUSINESS')) {
            return 'BUSINESS';
        }
        return 'USER';
    };
    
    const followingType = getFollowingType();
    
    // Get barPageId from profile data (like web)
    // Try multiple sources: from profile data, entityId, or profile.id
    const barPageId = isBarProfile && user ? (
        user.barPageId || 
        user.BarPageId || 
        user.barPageID ||
        user.targetId || 
        user.targetID ||
        id // Fallback to entityAccountId
    ) : null;
    
    // Fetch bar detail when user is a bar (using barPageId, not entityAccountId)
    // Note: /api/bar/:id endpoint requires barPageId, not entityAccountId
    useEffect(() => {
        if (id && !loading && isBarProfile) {
            // Only fetch if we have barPageId (required by API)
            const fetchId = barPageId;
            if (fetchId) {
                fetchBarDetail(fetchId);
                fetchTables(fetchId);
            } else {
                // If no barPageId, we can't fetch barDetail via /api/bar/:id
                // The bar profile will use user data instead
                console.log('[UserProfile] No barPageId available, using user data for bar profile');
            }
        }
    }, [id, loading, isBarProfile, barPageId, fetchBarDetail, fetchTables]);
    
    // Set default tab to "tables" when not logged in and viewing bar profile
    useEffect(() => {
        // Check if we should render bar profile (isBarProfile OR has barDetail)
        const shouldRenderBar = isBarProfile || !!barDetail;
        if (!shouldRenderBar) return;
        
        try {
            const session = authState?.token;
            const isNotLoggedIn = !session;
            
            if (isNotLoggedIn && shouldRenderBar) {
                // Chưa login và là bar profile -> nhảy vào tab đặt bàn
                console.log('[UserProfile] Setting barActiveTab to "tables" for bar profile (not logged in)');
                setBarActiveTab('tables');
            }
        } catch (e) {
            // Nếu không có session thì coi như chưa login
            if (shouldRenderBar) {
                console.log('[UserProfile] Setting barActiveTab to "tables" for bar profile (error getting session)');
                setBarActiveTab('tables');
            }
        }
    }, [user, isBarProfile, barDetail, authState?.token]);
    
    // Fetch posts count for bar using entityAccountId
    useEffect(() => {
        if (user && user.entityAccountId) {
            const fetchPostsCount = async () => {
                try {
                    const response = await feedApi.getPostByUserId(user.entityAccountId, 1, 1);
                    if (response.success && response.data) {
                        setPostsCount(response.data.total || 0);
                    }
                } catch (error) {
                    console.error("Error fetching posts count:", error);
                }
            };
            fetchPostsCount();
        }
    }, [user]);
    
    // Set following status and check if needed
    useEffect(() => {
        if (user) {
            setIsFollowing(user.isFollowing || false);
        }
    }, [user]);
    
    // Check follow status for bar profile if not already set
    useEffect(() => {
        const checkBarFollowStatus = async () => {
            // Only check if: bar profile (isBarProfile or has barDetail), logged in, and isFollowing is not set or false
            const shouldCheck = (isBarProfile || !!barDetail) && id && authState.token && authState.EntityAccountId;
            if (!shouldCheck) {
                return;
            }
            
            // If user.isFollowing is already true, no need to check
            if (user?.isFollowing === true) {
                setIsFollowing(true);
                return;
            }
            
            // If user.isFollowing is explicitly false, no need to check
            if (user?.isFollowing === false) {
                setIsFollowing(false);
                return;
            }
            
            // If user data doesn't have isFollowing, check from API
            const followingId = user?.entityAccountId || id;
            if (followingId && authState.EntityAccountId) {
                try {
                    const response = await feedApi.checkFollow(authState.EntityAccountId, followingId);
                    if (response.success && response.data) {
                        setIsFollowing(response.data.isFollowing || false);
                        // User state will be updated on next profile refetch
                    }
                } catch (error) {
                    console.error('Error checking follow status:', error);
                }
            }
        };
        
        checkBarFollowStatus();
    }, [isBarProfile, barDetail, id, authState.token, authState.EntityAccountId, user?.entityAccountId, user?.isFollowing]);


    const formatNumber = (num: number) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };


    const handleFollowPress = () => {
        followUser();
    };

    const handleUnFollowPress = () => {
        unFollowUser();
    };

    const handleMessagePress = async () => {
        if (!authState.token || !authState.EntityAccountId || !id) {
            Alert.alert('Lỗi', 'Không thể bắt đầu trò chuyện. Vui lòng đăng nhập lại.');
            return;
        }

        try {
            const messageApi = new MessageApiService(authState.token);
            const conversation = await messageApi.createOrGetConversation(authState.EntityAccountId, id);

            if (conversation && conversation._id) {
                router.push({
                    pathname: '/conversation',
                    params: {id: conversation._id}
                });
            } else {
                Alert.alert('Lỗi', 'Không thể tạo cuộc trò chuyện');
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
            Alert.alert('Lỗi', 'Không thể tạo cuộc trò chuyện. Vui lòng thử lại.');
        }
    }

    const handleBookingPress = async () => {
        setVisible(true)
    };

    const handleSocialLink = (platform: string, username?: string) => {
        if (!username || username === 'N/A') {
            Alert.alert('Thông báo', 'Người dùng chưa cập nhật thông tin này');
            return;
        }

        let url = '';
        switch (platform) {
            case 'tiktok':
                url = `https://www.tiktok.com/${username.replace('@', '')}`;
                break;
            case 'facebook':
                url = username.startsWith('http') ? username : `https://facebook.com/${username}`;
                break;
            case 'instagram':
                url = `https://instagram.com/${username.replace('@', '')}`;
                break;
            case 'website':
                url = username.startsWith('http') ? username : `https://${username}`;
                break;
            default:
                return;
        }

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Alert.alert('Lỗi', 'Không thể mở liên kết này');
            }
        });
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <View style={styles.coverContainer}>
                <Image
                    source={{uri: user?.background || 'https://picsum.photos/400/200?random=' + user?._id}}
                    style={styles.coverImage}
                    resizeMode="cover"
                />
            </View>

            <View style={styles.profileSection}>
                <View style={styles.avatarContainer}>
                    <Image
                        source={{uri: user?.avatar}}
                        style={styles.avatar}
                    />
                </View>

                <View style={styles.userInfo}>
                    {user?.name && (
                        <Text style={styles.userName}>{user.name}</Text>
                    )}
                    {user?.username && (
                        <Text style={styles.userUsername}>{user.username}</Text>
                    )}
                    {user?.bio && (
                        <Text style={styles.userBio}>{user.bio}</Text>
                    )}
                </View>

                {/*social media link*/}
                {(user?.website || user?.tiktok || user?.facebook || user?.instagram) && (
                    <View style={styles.socialLinksContainer}>
                        <View style={styles.socialIcons}>
                            {user?.tiktok && user.tiktok !== 'N/A' && (
                                <TouchableOpacity
                                    style={styles.socialIconButton}
                                    onPress={() => handleSocialLink('tiktok', user.tiktok)}
                                >
                                    <Ionicons name="logo-tiktok" size={24} color="#000"/>
                                </TouchableOpacity>
                            )}

                            {user?.facebook && user.facebook !== 'N/A' && (
                                <TouchableOpacity
                                    style={styles.socialIconButton}
                                    onPress={() => handleSocialLink('facebook', user.facebook)}
                                >
                                    <Ionicons name="logo-facebook" size={24} color="#1877f2"/>
                                </TouchableOpacity>
                            )}

                            {user?.instagram && user.instagram !== 'N/A' && (
                                <TouchableOpacity
                                    style={styles.socialIconButton}
                                    onPress={() => handleSocialLink('instagram', user.instagram)}
                                >
                                    <Ionicons name="logo-instagram" size={24} color="#e4405f"/>
                                </TouchableOpacity>
                            )}

                            {user?.website && user.website !== 'N/A' && (
                                <TouchableOpacity
                                    style={styles.socialIconButton}
                                    onPress={() => handleSocialLink('website', user.website)}
                                >
                                    <Ionicons name="globe-outline" size={24} color="#2563eb"/>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{formatNumber(posts.length || 0)}</Text>
                        <Text style={styles.statLabel}>Bài viết</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.statItem}
                        onPress={() => {
                            if (user?.entityAccountId) {
                                router.push({
                                    pathname: '/follow',
                                    params: {type: 'followers', userId: user.entityAccountId},
                                });
                            }
                        }}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.statNumber}>{formatNumber(followers.length || 0)}</Text>
                        <Text style={styles.statLabel}>Người theo dõi</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.statItem}
                        onPress={() => {
                            if (user?.entityAccountId) {
                                router.push({
                                    pathname: '/follow',
                                    params: {type: 'following', userId: user.entityAccountId},
                                });
                            }
                        }}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.statNumber}>{formatNumber(following.length || 0)}</Text>
                        <Text style={styles.statLabel}>Đang theo dõi</Text>
                    </TouchableOpacity>
                </View>

                {user?.entityAccountId !== accountId && (
                    <View style={styles.actionButtons}>
                        <FollowButton
                            followingId={user?.entityAccountId || id}
                            followingType={followingType}
                            onChange={(isFollowing) => {
                                setIsFollowing(isFollowing);
                                // Update follower count
                                if (isFollowing) {
                                    setFollowerCount(prev => prev + 1);
                                } else {
                                    setFollowerCount(prev => Math.max(0, prev - 1));
                                }
                            }}
                        />

                        <TouchableOpacity style={styles.messageButton} onPress={handleMessagePress}>
                            <Ionicons name="chatbubble-outline" size={16} color="#2563eb"/>
                            <Text style={styles.messageButtonText}>Nhắn tin</Text>
                        </TouchableOpacity>

                        {
                            (user?.role === 'DJ' || user?.role === 'Dancer') &&
                            <TouchableOpacity style={styles.messageButton} onPress={handleBookingPress}>
                                <Ionicons name="calendar-outline" size={16} color="#2563eb"/>
                                <Text style={styles.messageButtonText}>Đặt lịch</Text>
                            </TouchableOpacity>
                        }

                    </View>
                )}

                <View style={styles.postsHeader}>
                    <TouchableOpacity
                        style={[
                            styles.postsHeaderItem,
                            (activeTab === 'posts' && showReview) && styles.activeTabP,
                        ]}
                        onPress={() => setActiveTab('posts')}
                    >
                        <Ionicons
                            name="grid-outline"
                            size={20}
                            color='#000000'
                        />
                        <Text
                            style={[
                                styles.postsHeaderText,
                                (activeTab === 'posts' && showReview) && styles.activeTextP,
                            ]}
                        >
                            Bài viết
                        </Text>
                    </TouchableOpacity>

                    {
                        showReview && <TouchableOpacity
                            style={[
                                styles.postsHeaderItem,
                                activeTab === 'reviews' && styles.activeTab,
                            ]}
                            onPress={() => setActiveTab('reviews')}
                        >
                            <Ionicons
                                name="star-outline"
                                size={20}
                                color={activeTab === 'reviews' ? '#F59E0B' : '#111827'}
                            />
                            <Text
                                style={[
                                    styles.postsHeaderText,
                                    activeTab === 'reviews' && styles.activeText,
                                ]}
                            >
                                Đánh giá
                            </Text>
                        </TouchableOpacity>
                    }

                </View>
            </View>
            {(activeTab === 'reviews' && showReview) && (
                <Review
                    authState={authState}
                    user={user}
                    userReview={userReview}
                    refreshComments={refreshComments}/>
            )}
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent/>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff"/>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Hồ sơ</Text>
                    <View style={styles.headerRight}/>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563eb"/>
                    <Text style={styles.loadingText}>Đang tải hồ sơ...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!user) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent/>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff"/>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Hồ sơ</Text>
                    <View style={styles.headerRight}/>
                </View>
                <View style={styles.errorContainer}>
                    <Ionicons name="person-outline" size={48} color="#6b7280"/>
                    <Text style={styles.errorText}>Không tìm thấy người dùng</Text>
                    {id && (
                        <TouchableOpacity style={styles.messageButtonError} onPress={handleMessagePress}>
                            <Ionicons name="chatbubble-outline" size={16} color="#2563eb"/>
                            <Text style={styles.messageButtonText}>Nhắn tin</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </SafeAreaView>
        );
    }

    // Render bar profile if it's a bar profile - show tabs for both owner and public view
    // Check: isBarProfile (render even if barDetail is loading)
    // Also render if barDetail exists (even if user.type is not set correctly)
    const shouldRenderBarProfile = isBarProfile || !!barDetail;
    
    console.log('[UserProfile] Debug bar profile:', {
        isBarProfile,
        hasBarDetail: !!barDetail,
        shouldRenderBarProfile,
        userType: user?.type,
        userRole: user?.role,
        hasEntityAccountId: !!user?.entityAccountId,
        hasId: !!id,
        user: user ? Object.keys(user) : null
    });
    
    // Render bar profile if: isBarProfile OR has barDetail, AND has id (id is always available from route)
    if (shouldRenderBarProfile && id) {
        // Check if current user is the owner of this bar
        // Compare entityAccountId (the bar's entity ID) with accountId (current logged-in user's entity ID)
        const isOwner = accountId && user?.entityAccountId && user.entityAccountId === accountId;
        
        console.log('[BarProfile] Render check:', {
            isOwner,
            userEntityAccountId: user?.entityAccountId,
            accountId,
            isFollowing,
            hasToken: !!authState.token,
            willShowFollowButton: !isOwner && !!authState.token
        });
        
        const handleBarFollowPress = async () => {
            console.log('[handleBarFollowPress] Called', {
                isFollowing,
                hasToken: !!authState.token,
                hasEntityAccountId: !!authState.EntityAccountId,
                userEntityAccountId: user?.entityAccountId,
                id,
                accountId
            });
            
            // Check if user is logged in before following
            if (!authState.token || !authState.EntityAccountId) {
                Alert.alert('Lỗi', 'Vui lòng đăng nhập để theo dõi quán bar.');
                return;
            }
            
            // Get followingId (entityAccountId of the bar)
            // Try multiple sources: user.entityAccountId, barDetail.entityAccountId, or id from route
            // Handle id as array (expo-router can return array)
            const routeId = Array.isArray(id) ? id[0] : id;
            const followingId = user?.entityAccountId || 
                               user?.EntityAccountId || 
                               barDetail?.entityAccountId || 
                               barDetail?.EntityAccountId ||
                               routeId;
            
            console.log('[handleBarFollowPress] Getting followingId:', {
                userEntityAccountId: user?.entityAccountId,
                userEntityAccountIdUpper: user?.EntityAccountId,
                barDetailEntityAccountId: barDetail?.entityAccountId,
                barDetailEntityAccountIdUpper: barDetail?.EntityAccountId,
                routeId: id,
                finalFollowingId: followingId,
                hasUser: !!user,
                hasBarDetail: !!barDetail
            });
            
            if (!followingId || typeof followingId !== 'string' || followingId.trim() === '') {
                Alert.alert('Lỗi', 'Không tìm thấy thông tin quán bar.');
                console.error('[handleBarFollowPress] Missing or invalid followingId:', {
                    followingId,
                    type: typeof followingId,
                    user: user ? Object.keys(user) : null,
                    barDetail: barDetail ? Object.keys(barDetail) : null,
                    id,
                    userEntityAccountId: user?.entityAccountId,
                    barDetailEntityAccountId: barDetail?.entityAccountId
                });
                return;
            }
            
            console.log('[handleBarFollowPress] Following:', {
                followerId: authState.EntityAccountId,
                followingId,
                followingType: 'BAR',
                currentIsFollowing: isFollowing
            });
            
            try {
                if (isFollowing) {
                    // Unfollow
                    const response = await feedApi.unFollowUser(authState.EntityAccountId, followingId);
                    if (response.success) {
                        setIsFollowing(false);
                        // Update follower count immediately
                        setFollowerCount(prev => Math.max(0, prev - 1));
                        // User state will be updated on next profile refetch
                    } else {
                        Alert.alert('Lỗi', 'Không thể hủy theo dõi. Vui lòng thử lại.');
                    }
                } else {
                    // Follow - use followingType 'BAR' for bar profiles
                    // Ensure all required fields are present
                    if (!authState.EntityAccountId || !followingId) {
                        Alert.alert('Lỗi', 'Thiếu thông tin cần thiết. Vui lòng thử lại.');
                        return;
                    }
                    
                    const followingType = 'BAR'; // Bar profile always uses 'BAR'
                    console.log('[handleBarFollowPress] Calling followUser with:', {
                        followerId: authState.EntityAccountId,
                        followingId,
                        followingType
                    });
                    
                    const response = await feedApi.followUser(
                        authState.EntityAccountId, 
                        followingId, 
                        followingType
                    );
                    
                    // Handle response - check if already following (409)
                    if (response.success) {
                        setIsFollowing(true);
                        // Update follower count immediately
                        setFollowerCount(prev => prev + 1);
                        // User state will be updated on next profile refetch
                    } else {
                        // Check if error is "Already following" (409 Conflict)
                        const errorMessage = response.message || response.error || '';
                        if (errorMessage.toLowerCase().includes('already following') || 
                            errorMessage.toLowerCase().includes('đã theo dõi')) {
                            // Already following - just sync state
                            setIsFollowing(true);
                            // Don't update follower count if already following
                            // User state will be updated on next profile refetch
                        } else {
                            Alert.alert('Lỗi', response.message || 'Không thể theo dõi. Vui lòng thử lại.');
                        }
                    }
                }
            } catch (error: any) {
                console.error('Error following/unfollowing bar:', error);
                
                // Handle 409 Conflict (Already following)
                const errorMessage = error?.message || error?.error || '';
                if (errorMessage.toLowerCase().includes('already following') || 
                    errorMessage.toLowerCase().includes('đã theo dõi') ||
                    errorMessage.toLowerCase().includes('conflict')) {
                    // Already following - just sync state
                    setIsFollowing(true);
                    // Don't update follower count if already following
                    // User state will be updated on next profile refetch
                } else {
                    Alert.alert('Lỗi', 'Đã xảy ra lỗi. Vui lòng thử lại.');
                }
            }
        };

        const handleBarMessagePress = async () => {
            if (!authState.token || !authState.EntityAccountId || !id) {
                Alert.alert('Lỗi', 'Không thể bắt đầu trò chuyện. Vui lòng đăng nhập lại.');
                return;
            }

            try {
                const messageApi = new MessageApiService(authState.token);
                const conversation = await messageApi.createOrGetConversation(authState.EntityAccountId, id);
                if (conversation && conversation._id) {
                    router.push({
                        pathname: '/conversation',
                        params: {id: conversation._id}
                    });
                } else {
                    Alert.alert('Lỗi', 'Không thể tạo cuộc trò chuyện');
                }
            } catch (error) {
                console.error('Error creating conversation:', error);
                Alert.alert('Lỗi', 'Không thể tạo cuộc trò chuyện. Vui lòng thử lại.');
            }
        };

        const handleBarBookTablePress = () => {
            setBarActiveTab('tables');
        };

        const handleBarRefresh = async () => {
            setRefreshing(true);
            try {
                // Refresh using barPageId (not entityAccountId)
                const refreshBarPageId = barPageId || barDetail?.barPageId;
                if (refreshBarPageId) {
                    await Promise.all([
                        fetchBarDetail(refreshBarPageId),
                        fetchTables(refreshBarPageId),
                    ]);
                }
            } catch (error) {
                console.error("Refresh error:", error);
            } finally {
                setRefreshing(false);
            }
        };

        // Create barDetail from user data if barDetail is not loaded yet
        const displayBarDetail = barDetail || {
            barName: user?.name || user?.barName || user?.userName || 'Quán bar',
            name: user?.name || user?.barName || user?.userName || 'Quán bar',
            avatar: user?.avatar || undefined,
            logo: user?.avatar || undefined,
            background: user?.background || user?.coverImage || undefined,
            coverImage: user?.background || user?.coverImage || undefined,
            address: user?.address || undefined,
            phoneNumber: user?.phoneNumber || undefined,
            email: user?.email || undefined,
            description: user?.bio || user?.description || undefined,
            entityAccountId: user?.entityAccountId || id,
            barPageId: barPageId || undefined,
        };
        
        // Use user.entityAccountId or id for entityAccountId
        const entityAccountIdForBar = user?.entityAccountId || id;

        const renderBarTabContent = () => {
            // Use entityAccountId for posts/videos, barPageId for reviews/tables
            const entityAccountIdForPosts = user?.entityAccountId || barDetail?.entityAccountId || id;
            const barPageIdForBarData = barPageId || barDetail?.barPageId;
            
            switch (barActiveTab) {
                case 'info':
                    return <BarInfoTab barDetail={displayBarDetail} barPageId={barPageIdForBarData} />;
                case 'posts':
                    return <BarPostsTab barId={entityAccountIdForPosts} />;
                case 'videos':
                    return <BarVideosTab barId={entityAccountIdForPosts} />;
                case 'reviews':
                    return <BarReviewsTab barId={barPageIdForBarData || entityAccountIdForPosts} />;
                case 'tables':
                    return (
                        <BarTablesTab
                            barId={barPageIdForBarData || entityAccountIdForPosts}
                            barDetail={displayBarDetail}
                            tables={tables || []}
                            bookedTables={bookedTables || []}
                            fetchBookedTables={fetchBookedTables}
                            entityAccountId={entityAccountIdForPosts}
                        />
                    );
                default:
                    return null;
            }
        };

        if (loadingBarDetail) {
            return (
                <SafeAreaView style={styles.container} edges={['top']}>
                    <StatusBar barStyle="dark-content" backgroundColor="#fff" />
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                        <Text style={styles.loadingText}>Đang tải thông tin quán bar...</Text>
                    </View>
                </SafeAreaView>
            );
        }

        const insets = useSafeAreaInsets();
        
        return (
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleBarRefresh} />
                    }
                    stickyHeaderIndices={[1]}
                    contentContainerStyle={{ paddingBottom: 200 + insets.bottom }}
                    bounces={true}
                    alwaysBounceVertical={false}
                    nestedScrollEnabled={true}
                >
                    {/* Bar Profile Header */}
                    <BarProfileHeader
                        barDetail={displayBarDetail}
                        activeTab={barActiveTab}
                        postsCount={postsCount}
                        followerCount={followerCount}
                        followingCount={following.length || 0}
                        onTabChange={setBarActiveTab}
                        onFollowersPress={() => {
                            if (entityAccountIdForBar) {
                                router.push({
                                    pathname: '/follow',
                                    params: {type: 'followers', userId: entityAccountIdForBar},
                                });
                            }
                        }}
                        onFollowingPress={() => {
                            if (entityAccountIdForBar) {
                                router.push({
                                    pathname: '/follow',
                                    params: {type: 'following', userId: entityAccountIdForBar},
                                });
                            }
                        }}
                        onFollowPress={!isOwner ? () => {
                            // Follow button is now handled by FollowButton component in BarProfileHeader
                        } : undefined}
                        onMessagePress={!isOwner ? handleBarMessagePress : undefined}
                        onBookTablePress={handleBarBookTablePress}
                        isFollowing={isFollowing}
                        followingId={!isOwner ? (user?.entityAccountId || id) : undefined}
                        followingType="BAR"
                        onFollowChange={(isFollowing) => {
                            setIsFollowing(isFollowing);
                            // Update follower count
                            if (isFollowing) {
                                setFollowerCount(prev => prev + 1);
                            } else {
                                setFollowerCount(prev => Math.max(0, prev - 1));
                            }
                        }}
                    />

                    {/* Tab Content - flex: 0 to allow full scroll */}
                    <View style={{ flex: 0 }}>
                        {renderBarTabContent()}
                    </View>
                    {/* Add extra space at bottom for floating button and iOS safe area */}
                    <View style={{ height: 200 }} />
                </ScrollView>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={{flex: 1}}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent/>

                <Animated.View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff"/>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.moreButton}>
                        <Ionicons name="ellipsis-horizontal" size={24} color="#fff"/>
                    </TouchableOpacity>
                </Animated.View>

                <AnimatedFlatList
                    data={activeTab === "posts" ? posts : userReview.reviews}
                    renderItem={({item}) => {
                        return activeTab === "posts" ? (
                            <RenderPost
                                item={item}
                                currentId={authState.currentId}
                                currentEntityAccountId={authState.EntityAccountId}
                                feedApiService={feedApi}
                            />
                        ) : (
                            <RenderReviewItem item={item}/>
                        );
                    }}
                    keyExtractor={(item: any) => item.id ?? item._id}
                    ListHeaderComponent={renderHeader}
                    ItemSeparatorComponent={() => (
                        <View style={{height: 8, backgroundColor: '#f0f2f5'}}/>
                    )}
                    showsVerticalScrollIndicator={false}
                    onScroll={Animated.event(
                        [{nativeEvent: {contentOffset: {y: scrollY}}}],
                        {useNativeDriver: true}
                    )}
                    style={{paddingBottom: 20}}
                    scrollEventThrottle={16}
                    ListEmptyComponent={
                        activeTab === "posts" ?
                            <View style={styles.emptyContainer}>
                                <Ionicons name="images-outline" size={48} color="#d1d5db"/>
                                <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
                                <Text style={styles.emptySubtext}>
                                    {user.entityAccountId === accountId ? 'Hãy chia sẻ khoảnh khắc đầu tiên!' : 'Người dùng chưa đăng bài viết nào.'}
                                </Text>
                            </View> : <></>
                    }
                />
                <BookingModal visible={visible} onClose={() => setVisible(false)} user={user}/>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#F59E0B',
    },
    activeTabP: {
        borderBottomWidth: 2,
        borderBottomColor: '#000000',
    },
    activeText: {
        color: '#F59E0B',
        fontWeight: '600',
    },
    activeTextP: {
        color: '#000000',
        fontWeight: '600',
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
    messageButtonError: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#2563eb',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginTop: 20,
    },
    tabContentContainer: {
        backgroundColor: '#f8fafc',
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
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    postsHeaderItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
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
    multipleImagesIndicator: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 12,
        padding: 4,
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
    socialLinksContainer: {
        marginBottom: 16,
        paddingHorizontal: 8,
    },
    socialLink: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 12,
    },
    socialLinkText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#2563eb',
        fontWeight: '500',
        flex: 1,
    },
    socialIcons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
    },
    socialIconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
});

