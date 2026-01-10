import RenderPost from '@/components/post/PostContent';
import { useAuth } from '@/hooks/useAuth';
import { FeedApiService } from '@/services/feedApi';
import { PostData } from '@/types/postType';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { formatTime } from '@/utils/extension';

export default function TrashScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { authState } = useAuth();
    const [posts, setPosts] = useState<PostData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const feedApiService = new FeedApiService(authState.token || '');

    const loadTrashedPosts = useCallback(async () => {
        if (!authState.token) {
            setLoading(false);
            return;
        }

        try {
            const response = await feedApiService.getTrashedPosts({ 
                page: 1, 
                limit: 50,
                entityAccountId: authState.EntityAccountId 
            });
            console.log('Trashed posts response:', response);
            
            // Handle different response formats
            let postsData: PostData[] = [];
            if (response.success) {
                if (Array.isArray(response.data)) {
                    postsData = response.data;
                } else if (response.data && Array.isArray((response.data as any).posts)) {
                    postsData = (response.data as any).posts;
                } else if (response.data && Array.isArray((response.data as any).data)) {
                    postsData = (response.data as any).data;
                }
            } else {
                console.error('Failed to load trashed posts:', response.message);
            }
            
            setPosts(postsData);
        } catch (error) {
            console.error('Error loading trashed posts:', error);
            setPosts([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [authState.token, feedApiService]);

    useEffect(() => {
        loadTrashedPosts();
    }, [loadTrashedPosts]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadTrashedPosts();
    }, [loadTrashedPosts]);

    const handleRestore = async (post: PostData) => {
        Alert.alert(
            'Khôi phục bài viết',
            'Bạn có chắc muốn khôi phục bài viết này?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Khôi phục',
                    onPress: async () => {
                        try {
                            if (!authState.EntityAccountId) {
                                Alert.alert('Lỗi', 'Không xác định được entityAccountId');
                                return;
                            }
                            const response = await feedApiService.restorePost(post.id || post._id || '', {
                                entityAccountId: authState.EntityAccountId,
                            });
                            if (response.success) {
                                Alert.alert('Thành công', 'Bài viết đã được khôi phục');
                                loadTrashedPosts();
                            } else {
                                Alert.alert('Lỗi', response.message || 'Không thể khôi phục bài viết');
                            }
                        } catch (error) {
                            console.error('Error restoring post:', error);
                            Alert.alert('Lỗi', 'Không thể khôi phục bài viết');
                        }
                    },
                },
            ]
        );
    };

    const formatTrashedTime = (trashedAt: string | null | undefined) => {
        if (!trashedAt) return 'Vừa xóa';
        const now = new Date();
        const trashed = new Date(trashedAt);
        const diffInMs = now.getTime() - trashed.getTime();
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInDays > 0) {
            return `Đã xóa ${diffInDays} ngày trước`;
        } else if (diffInHours > 0) {
            return `Đã xóa ${diffInHours} giờ trước`;
        } else {
            const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
            return diffInMinutes > 0 ? `Đã xóa ${diffInMinutes} phút trước` : 'Vừa xóa';
        }
    };

    const renderItem = ({ item }: { item: PostData }) => (
        <View style={styles.postWrapper}>
            <RenderPost
                item={item}
                currentId={authState.currentId || ''}
                currentEntityAccountId={authState.EntityAccountId}
                feedApiService={feedApiService}
                isTrashed={true}
                userRole={authState.role}
            />
            <View style={styles.postActions}>
                <Text style={styles.trashedTime}>
                    {formatTrashedTime(item.trashedAt)}
                </Text>
                <TouchableOpacity
                    style={styles.restoreButton}
                    onPress={() => handleRestore(item)}
                >
                    <Ionicons name="refresh-outline" size={18} color="#2563eb" />
                    <Text style={styles.restoreButtonText}>Khôi phục</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thùng rác</Text>
                <View style={styles.backButton} />
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            ) : posts.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="trash-outline" size={80} color="#d1d5db" />
                    <Text style={styles.emptyTitle}>Không có bài viết nào</Text>
                    <Text style={styles.emptySubtitle}>
                        Các bài viết đã xóa sẽ hiển thị ở đây. Chúng sẽ tự động xóa vĩnh viễn sau 30 ngày.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={posts}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id || item._id || String(Math.random())}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[Colors.primary]}
                            tintColor={Colors.primary}
                        />
                    }
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.card,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6b7280',
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 20,
    },
    listContent: {
        padding: 8,
        paddingBottom: 40,
    },
    separator: {
        height: 8,
    },
    postWrapper: {
        marginBottom: 8,
    },
    postActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        marginTop: -8,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },
    trashedTime: {
        fontSize: 13,
        color: '#6b7280',
    },
    restoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#eff6ff',
    },
    restoreButtonText: {
        fontSize: 14,
        color: '#2563eb',
        fontWeight: '500',
    },
});

