import React, {useEffect, useState} from "react";
import {View, Text, StyleSheet, FlatList, ActivityIndicator} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import PostContent from "@/components/post/PostContent";
import {FeedApiService} from "@/services/feedApi";
import {useAuth} from "@/hooks/useAuth";

interface BarPostsTabProps {
    barId: string;
}

const BarPostsTab: React.FC<BarPostsTabProps> = ({barId}) => {
    const {authState} = useAuth();
    const feedApi = new FeedApiService(authState.token!);
    
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        fetchPosts();
    }, [barId]);

    const fetchPosts = async (pageNum = 1) => {
        try {
            setLoading(pageNum === 1);
            const response = await feedApi.getPostByUserId(barId, pageNum, 10);
            
            if (response.success && response.data) {
                const newPosts = response.data.data || [];
                if (pageNum === 1) {
                    setPosts(newPosts);
                } else {
                    setPosts(prev => [...prev, ...newPosts]);
                }
                setHasMore(newPosts.length === 10);
                setPage(pageNum);
            }
        } catch (error) {
            console.error("Error fetching posts:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchPosts(1);
    };

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            fetchPosts(page + 1);
        }
    };

    const renderPost = ({item}: {item: any}) => (
        <PostContent post={item} />
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
        </View>
    );

    const renderFooter = () => {
        if (!loading || page === 1) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#3b82f6" />
            </View>
        );
    };

    if (loading && page === 1) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Đang tải bài viết...</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={posts}
            renderItem={renderPost}
            keyExtractor={(item, index) => item.postId || index.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            scrollEnabled={false}
            nestedScrollEnabled={true}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
        />
    );
};

export default BarPostsTab;

const styles = StyleSheet.create({
    listContainer: {
        paddingBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 60,
        backgroundColor: "#f8fafc",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: "#64748b",
        fontWeight: "500",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 100,
    },
    emptyText: {
        fontSize: 15,
        color: "#94a3b8",
        marginTop: 12,
        fontWeight: "500",
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: "center",
    },
});

