import BookingModal from "@/app/user/modals/bookingModal";
import Review from "@/app/user/review";
import RenderReviewItem from "@/app/user/review/renderReviewItem";
import RenderPost from "@/components/post/PostContent";
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { FeedApiService } from "@/services/feedApi";
import { MessageApiService } from '@/services/messageApi';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
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
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const {width: screenWidth} = Dimensions.get('window');
const imageSize = (screenWidth - 32 - 8) / 3;

export default function Index() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<string>('posts');
    const {id} = useLocalSearchParams<{ id: string }>();
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
    const scrollY = useRef(new Animated.Value(0)).current;
    const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
    const feedApi = new FeedApiService(authState.token!);
    const [visible, setVisible] = useState(false);
    const showReview = user?.role === 'DJ' || user?.role === 'Dancer' || user?.type === 'BAR';
    const accountId = authState.EntityAccountId;

    const handleBarPress = useCallback(() => {
        if (user?.targetId) {
            router.push({
                pathname: "/barDetail",
                params: {id: user?.targetId},
            });
        }
    }, [user?.targetId]);

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
                    <Text style={styles.userName}>{user?.name}</Text>
                    <Text style={styles.userUsername}>{user?.username}</Text>
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
                        <TouchableOpacity
                            style={[
                                styles.followButton,
                                user?.isFollowing && styles.followingButton
                            ]}
                            onPress={user?.isFollowing ? handleUnFollowPress : handleFollowPress}
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

                        {user?.type === 'BAR' && user.targetId && (
                            <TouchableOpacity style={styles.messageButton} onPress={handleBarPress}>
                                <Ionicons name="wine-outline" size={16} color="#2563eb"/>
                                <Text style={styles.messageButtonText}>Đặt bàn</Text>
                            </TouchableOpacity>
                        )}
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

