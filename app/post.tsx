// app/post.tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Comment } from '@/constants/feedData';
import { usePostDetails } from '@/hooks/usePost';

const { width: screenWidth } = Dimensions.get('window');

export default function PostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { post, comments, loading, addComment, likeComment } = usePostDetails(id!);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Vừa xong';
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    return `${Math.floor(diffInHours / 24)} ngày trước`;
  };

  // Handle scroll position for image counter
  const handleImageScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / screenWidth);
    setCurrentImageIndex(currentIndex);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !post) return;

    setSubmittingComment(true);
    try {
      const success = await addComment({
        postId: post.id,
        content: commentText.trim(),
      });

      if (success) {
        setCommentText('');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể gửi bình luận');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikeComment = (commentId: string) => {
    likeComment(commentId);
  };

  const handleUserPress = (userId: string) => {
    router.push({
      pathname: '/user',
      params: { id: userId }
    });
  };

  const CommentItem = ({ comment }: { comment: Comment }) => (
    <View style={styles.commentItem}>
      <TouchableOpacity onPress={() => handleUserPress(comment.userId)}>
        <Image source={{ uri: comment.user.avatar }} style={styles.commentAvatar} />
      </TouchableOpacity>
      
      <View style={styles.commentContent}>
        <View style={styles.commentBubble}>
          <TouchableOpacity onPress={() => handleUserPress(comment.userId)}>
            <Text style={styles.commentUserName}>{comment.user.name}</Text>
          </TouchableOpacity>
          <Text style={styles.commentText}>{comment.content}</Text>
        </View> 
        
        <View style={styles.commentActions}>
          <Text style={styles.commentTime}>{formatTime(comment.createdAt)}</Text>
          
          <TouchableOpacity
            style={styles.commentLikeBtn}
            onPress={() => handleLikeComment(comment.id)}
          >
            <Ionicons
              name={comment.isLiked ? "heart" : "heart-outline"}
              size={14}
              color={comment.isLiked ? "#ef4444" : "#6b7280"}
            />
            {comment.likes > 0 && (
              <Text style={[
                styles.commentLikeText,
                comment.isLiked && { color: '#ef4444' }
              ]}>
                {comment.likes}
              </Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.commentReplyBtn}>
            <Text style={styles.commentReplyText}>Trả lời</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bài viết</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bài viết</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#6b7280" />
          <Text style={styles.errorText}>Không tìm thấy bài viết</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bài viết</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.postContainer}>
            <View style={styles.postHeader}>
              <TouchableOpacity onPress={() => handleUserPress(post.userId)}>
                <Image source={{ uri: post.user.avatar }} style={styles.userAvatar} />
              </TouchableOpacity>
              <View style={styles.userInfo}>
                <TouchableOpacity onPress={() => handleUserPress(post.userId)}>
                  <Text style={styles.userName}>{post.user.name}</Text>
                </TouchableOpacity>
                <Text style={styles.postTime}>
                  {formatTime(post.createdAt)}
                  {post.location && ` • ${post.location}`}
                </Text>
              </View>
            </View>

            <Text style={styles.postContent}>{post.content}</Text>

            {/* Updated Image Gallery */}
            {post.images.length > 0 && (
              <View style={styles.imageGalleryContainer}>
                <FlatList
                  data={post.images}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(image, index) => `${post.id}-image-${index}`}
                  renderItem={({ item: image }) => (
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: image }}
                        style={styles.postImage}
                        resizeMode="cover"
                      />
                    </View>
                  )}
                  snapToInterval={screenWidth}
                  decelerationRate="fast"
                  onScroll={handleImageScroll}
                  scrollEventThrottle={16}
                />
                {/* Image Counter */}
                {post.images.length > 1 && (
                  <View style={styles.imageCounter}>
                    <Text style={styles.imageCounterText}>
                      {currentImageIndex + 1}/{post.images.length}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.postStats}>
              <View style={styles.statsRow}>
                {post.likes > 0 && (
                  <View style={styles.likesContainer}>
                    <View style={styles.heartIcon}>
                      <Ionicons name="heart" size={12} color="#fff" />
                    </View>
                    <Text style={styles.likesText}>{post.likes}</Text>
                  </View>
                )}
                <Text style={styles.commentsText}>
                  {post.commentsCount > 0 && `${post.commentsCount} bình luận`}
                </Text>
              </View>
            </View>

            <View style={styles.postActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons
                  name={post.isLiked ? "heart" : "heart-outline"}
                  size={24}
                  color={post.isLiked ? "#ef4444" : "#6b7280"}
                />
                <Text style={[
                  styles.actionText,
                  post.isLiked && { color: '#ef4444' }
                ]}>
                  {post.isLiked ? 'Đã thích' : 'Thích'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={22} color="#6b7280" />
                <Text style={styles.actionText}>Bình luận</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share-outline" size={22} color="#6b7280" />
                <Text style={styles.actionText}>Chia sẻ</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.commentsSection}>
            <Text style={styles.commentsSectionTitle}>
              Bình luận ({comments.length})
            </Text>
            
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
            
            {comments.length === 0 && (
              <View style={styles.noCommentsContainer}>
                <Ionicons name="chatbubble-outline" size={48} color="#d1d5db" />
                <Text style={styles.noCommentsText}>Chưa có bình luận nào</Text>
                <Text style={styles.noCommentsSubtext}>Hãy là người đầu tiên bình luận!</Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.commentInputContainer}>
          <Image
            source={{ uri: 'https://i.pravatar.cc/100?img=10' }}
            style={styles.commentInputAvatar}
          />
          <TextInput
            style={styles.commentInput}
            placeholder="Viết bình luận..."
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!commentText.trim() || submittingComment) && styles.sendButtonDisabled
            ]}
            onPress={handleSubmitComment}
            disabled={!commentText.trim() || submittingComment}
          >
            {submittingComment ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  keyboardView: {
    flex: 1,
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
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerRight: {
    width: 40,
  },
  moreButton: {
    padding: 8,
    marginRight: -8,
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
  scrollView: {
    flex: 1,
  },
  postContainer: {
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  postTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  postContent: {
    paddingHorizontal: 16,
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    marginBottom: 16,
  },

  // Updated Image Gallery Styles
  imageGalleryContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  imageContainer: {
    width: screenWidth,
  },
  postImage: {
    width: screenWidth,
    height: 300,
  },
  imageCounter: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },

  postStats: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heartIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  likesText: {
    fontSize: 14,
    color: '#6b7280',
  },
  commentsText: {
    fontSize: 14,
    color: '#6b7280',
  },
  postActions: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  commentsSection: {
    backgroundColor: '#fff',
  },
  commentsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 4,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  commentTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginRight: 16,
  },
  commentLikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  commentLikeText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  commentReplyBtn: {
    paddingVertical: 2,
  },
  commentReplyText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  noCommentsContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noCommentsText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
    fontWeight: '500',
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  commentInputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
});