import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import { CommentInput } from '@/components/post/CommentInput';
import { CommentsList } from '@/components/post/CommentsList';
import { EditPostModal } from '@/components/post/EditPostModal';
import { PostMenu } from '@/components/post/PostMenu';
import RenderPost from '@/components/post/PostContent';
import { useAuth } from '@/hooks/useAuth';
import { usePostDetails } from '@/hooks/usePost';
import { FeedApiService } from "@/services/feedApi";

// Skeleton Loading Component
const SkeletonLoader = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.skeletonContainer}>
      {/* Skeleton Post Header */}
      <View style={styles.skeletonPost}>
        <View style={styles.skeletonPostHeader}>
          <Animated.View style={[styles.skeletonAvatar, { opacity }]} />
          <View style={styles.skeletonPostInfo}>
            <Animated.View style={[styles.skeletonText, { width: 120, height: 16, opacity }]} />
            <Animated.View style={[styles.skeletonText, { width: 80, height: 12, marginTop: 6, opacity }]} />
          </View>
        </View>
        
        {/* Skeleton Post Content */}
        <Animated.View style={[styles.skeletonText, { width: '100%', height: 16, marginTop: 16, opacity }]} />
        <Animated.View style={[styles.skeletonText, { width: '90%', height: 16, marginTop: 8, opacity }]} />
        <Animated.View style={[styles.skeletonText, { width: '70%', height: 16, marginTop: 8, opacity }]} />
        
        {/* Skeleton Post Image */}
        <Animated.View style={[styles.skeletonImage, { opacity }]} />
        
        {/* Skeleton Actions */}
        <View style={styles.skeletonActions}>
          <Animated.View style={[styles.skeletonButton, { opacity }]} />
          <Animated.View style={[styles.skeletonButton, { opacity }]} />
          <Animated.View style={[styles.skeletonButton, { opacity }]} />
        </View>
      </View>

      {/* Skeleton Comments Section */}
      <View style={styles.skeletonCommentsSection}>
        <Animated.View style={[styles.skeletonText, { width: 100, height: 18, marginBottom: 16, opacity }]} />
        
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.skeletonComment}>
            <Animated.View style={[styles.skeletonCommentAvatar, { opacity }]} />
            <View style={styles.skeletonCommentContent}>
              <Animated.View style={[styles.skeletonText, { width: 100, height: 14, opacity }]} />
              <Animated.View style={[styles.skeletonText, { width: '100%', height: 14, marginTop: 8, opacity }]} />
              <Animated.View style={[styles.skeletonText, { width: '80%', height: 14, marginTop: 6, opacity }]} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export default function PostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    post,
    comments,
    loading,
    addComment,
    likeComment,
    likePost,
    deletePost,
    updatePost,
    fetchPostDetails,
    addReply,
    likeReply,
  } = usePostDetails(id!);
  const { authState } = useAuth();
  const currentUserId = authState.currentId;

  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; replyId?: string; authorName: string } | null>(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const moreButtonRef = useRef<View>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;
const feedApi = new FeedApiService(authState.token!);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPostDetails(false);
    setRefreshing(false);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !post) return;
    
    setSubmittingComment(true);
    try {
      let success = false;
      if (replyingTo) {
        success = await addReply(replyingTo.commentId, replyingTo.replyId, commentText.trim());
      } else {
        success = await addComment(commentText.trim());
      }

      if (success) {
        setCommentText('');
        setReplyingTo(null);
      } else {
        Alert.alert('Lỗi', replyingTo ? 'Không thể gửi phản hồi' : 'Không thể gửi bình luận');
      }
    } catch (error) {
      Alert.alert('Lỗi', replyingTo ? 'Không thể gửi phản hồi' : 'Không thể gửi bình luận');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleUserPress = (userId: string) => {
    router.push({
      pathname: '/user',
      params: { id: userId }
    });
  };

  const handleMoreButtonPress = () => {
    moreButtonRef.current?.measure((fx, fy, width, height, px, py) => {
      setMenuPosition({ x: px - 160, y: py + height + 8 });
      setIsMenuVisible(true);

      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }).start();
    });
  };

  const closeMenu = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setIsMenuVisible(false);
    });
  };

  const handleEditPost = () => {
    if (!post) return;
    setEditContent(post.content);
    closeMenu();
    setTimeout(() => setIsEditing(true), 200);
  };

  const handleSubmitEdit = async (content: string, images: string[]) => {
    if (!post) return false;

    try {
      return false;
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật bài viết');
      return false;
    }
  };

  const handleDeletePost = () => {
    if (!post) return;
    closeMenu();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View style={styles.headerRight} />
        </View>
        <SkeletonLoader />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#6b7280" />
          <Text style={styles.errorText}>Không tìm thấy bài viết</Text>
        </View>
      </View>
    );
  }

  const isPostOwner = (post.author?.entityAccountId || post.accountId) === currentUserId;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View ref={moreButtonRef} collapsable={false}>
          <TouchableOpacity
            style={styles.moreButton}
            onPress={handleMoreButtonPress}
            disabled={!isPostOwner}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={24}
              color={isPostOwner ? "#111827" : "#d1d5db"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <PostMenu
        visible={isMenuVisible}
        position={menuPosition}
        scaleAnim={scaleAnim}
        onClose={closeMenu}
        onEdit={handleEditPost}
        onDelete={handleDeletePost}
      />

      <EditPostModal
        visible={isEditing}
        post={post}
        initialContent={editContent}
        initialImages={editImages}
        onClose={() => setIsEditing(false)}
        onSubmit={handleSubmitEdit}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2563eb']}
              tintColor="#2563eb"
            />
          }
        >
          {post && (
            <RenderPost
              item={post}
              currentId={currentUserId || ''}
              currentEntityAccountId={authState.EntityAccountId}
              feedApiService={feedApi}
              customCss={false}
              disableBtn={true}
            />
          )}

          <CommentsList
            comments={comments}
            onUserPress={handleUserPress}
            onLikeComment={likeComment}
            onReply={(commentId, replyId, authorName) => {
              setReplyingTo({ commentId, replyId, authorName: authorName || 'Người dùng' });
            }}
            onLikeReply={likeReply}
          />
        </ScrollView>

        <CommentInput
          value={commentText}
          onChange={setCommentText}
          onSubmit={handleSubmitComment}
          submitting={submittingComment}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },

  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerRight: {
    width: 40,
  },
  moreButton: {
    padding: 8,
    marginRight: -8,
  },

  // Loading & Error states
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

  // Skeleton styles
  skeletonContainer: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  skeletonPost: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  skeletonPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
  },
  skeletonPostInfo: {
    marginLeft: 12,
    flex: 1,
  },
  skeletonText: {
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
  },
  skeletonImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    marginTop: 16,
  },
  skeletonActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  skeletonButton: {
    width: 80,
    height: 36,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
  },
  skeletonCommentsSection: {
    backgroundColor: '#fff',
    padding: 16,
  },
  skeletonComment: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  skeletonCommentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e5e7eb',
  },
  skeletonCommentContent: {
    marginLeft: 12,
    flex: 1,
  },
});