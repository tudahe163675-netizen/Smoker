import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { CommentInput } from '@/components/post/CommentInput';
import { CommentsList } from '@/components/post/CommentsList';
import { EditPostModal } from '@/components/post/EditPostModal';
import { PostContent } from '@/components/post/PostContent';
import { PostMenu } from '@/components/post/PostMenu';
import { useAuth } from '@/hooks/useAuth';
import { usePostDetails } from '@/hooks/usePost';

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
  } = usePostDetails(id!);
  const { authState } = useAuth();
  const currentUserId = authState.currentId;

  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const moreButtonRef = useRef<View>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !post) return;
    
    setSubmittingComment(true);
    try {
      const success = await addComment(commentText.trim());

      if (success) {
        setCommentText('');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể gửi bình luận');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikePost = () => {
    if (post) {
      likePost();
    }
  };

  const handleShare = async () => {
    if (!post) return;

    try {
      const result = await Share.share({
        message: `${post.content}\n\nXem thêm tại Smoker App`,
        title: 'Chia sẻ bài viết',
        url: `https://smoker.app/post/${post._id}`,
      });

      if (result.action === Share.sharedAction) {
        Alert.alert('Thành công', 'Đã chia sẻ bài viết');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chia sẻ bài viết');
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
    // setEditImages(post.images);
    closeMenu();
    setTimeout(() => setIsEditing(true), 200);
  };

  const handleSubmitEdit = async (content: string, images: string[]) => {
    if (!post) return false;

    try {
      // const success = await updatePost(post.id, {
      //   content: content.trim(),
      //   images: images,
      // });
      // if (success) {
      //   setIsEditing(false);
      //   Alert.alert('Thành công', 'Bài viết đã được cập nhật');
      //   return true;
      // }
      return false;
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật bài viết');
      return false;
    }
  };

  const handleDeletePost = () => {
    if (!post) return;

    closeMenu();

    // setTimeout(() => {
    //   Alert.alert(
    //     'Xóa bài viết',
    //     'Bạn có chắc chắn muốn xóa bài viết này?',
    //     [
    //       { text: 'Hủy', style: 'cancel' },
    //       {
    //         text: 'Xóa',
    //         style: 'destructive',
    //         onPress: async () => {
    //           try {
    //             const success = await deletePost(post._id);
    //             if (success) {
    //               router.back();
    //               setTimeout(() => {
    //                 Alert.alert('Thành công', 'Bài viết đã được xóa');
    //               }, 300);
    //             }
    //           } catch (error) {
    //             Alert.alert('Lỗi', 'Không thể xóa bài viết');
    //           }
    //         },
    //       },
    //     ],
    //     { cancelable: true }
    //   );
    // }, 200);
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
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

  const isPostOwner = post.accountId === currentUserId;

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
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <PostContent
            post={post}
            onUserPress={handleUserPress}
            onLike={handleLikePost}
            onShare={handleShare}
          />

          <CommentsList
            comments={post.comments}
            onUserPress={handleUserPress}
            onLikeComment={likeComment}
          />
        </ScrollView>

        <CommentInput
          value={commentText}
          onChange={setCommentText}
          onSubmit={handleSubmitComment}
          submitting={submittingComment}
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
});