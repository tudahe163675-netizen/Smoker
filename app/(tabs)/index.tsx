import AnimatedHeader from '@/components/ui/AnimatedHeader';
import { useAuth } from '@/hooks/useAuth';
import { useFeed } from '@/hooks/useFeed';
import { PostData } from '@/types/postType';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

const PostInputBox = ({ openModal, pickMedia }: { openModal: () => void; pickMedia: () => void }) => (
  <View style={styles.postBox}>
    <Image
      source={{ uri: 'https://i.pravatar.cc/100?img=10' }}
      style={styles.avatar}
    />
    <TouchableOpacity style={styles.postInput} onPress={openModal}>
      <Text style={{ color: '#6b7280' }}>Đăng bài...</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={pickMedia} style={styles.iconButton}>
      <Ionicons name="image-outline" size={24} color="#6b7280" />
    </TouchableOpacity>
  </View>
);

// ✅ Simple progress bar như Facebook - chỉ có thanh progress thôi!
const UploadingProgressBar = ({ progress }: { progress: number }) => (
  <View style={styles.uploadingContainer}>
    <View style={styles.uploadingContent}>
      <ActivityIndicator size="small" color="#2563eb" style={{ marginRight: 8 }} />
      <Text style={styles.uploadingLabel}>Đang đăng bài viết...</Text>
    </View>
    <View style={styles.simpleProgressBar}>
      <Animated.View 
        style={[
          styles.simpleProgressFill, 
          { width: `${progress}%` }
        ]} 
      />
    </View>
  </View>
);

export default function HomeScreen() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [postText, setPostText] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<{ uri: string; type: 'image' | 'video' }[]>([]);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [currentImageIndexes, setCurrentImageIndexes] = useState<{ [key: string]: number }>({});
  const { authState } = useAuth();
  const currentUserId = authState.currentId;

  const {
    posts,
    loading,
    refreshing,
    error,
    uploading,
    uploadProgress,
    createPost,
    likePost,
    refresh,
    loadMore,
    hasMore
  } = useFeed();

  const pickMedia = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5,
        videoMaxDuration: 60,
      });

      if (!result.canceled) {
        const media = result.assets.map(asset => ({
          uri: asset.uri,
          type: (asset.type === 'video' ? 'video' : 'image') as 'image' | 'video',
        }));
        
        if (media.length > 5) {
          Alert.alert('Thông báo', 'Bạn chỉ có thể chọn tối đa 5 file');
          return;
        }
        
        setSelectedMedia(prev => {
          const newMedia = [...prev, ...media];
          if (newMedia.length > 5) {
            Alert.alert('Thông báo', 'Tổng số file không được quá 5');
            return prev;
          }
          return newMedia;
        });
        setModalVisible(true);
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Lỗi', 'Không thể chọn file. Vui lòng thử lại.');
    }
  }, []);

  const removeMedia = useCallback((index: number) => {
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
  }, []);

  const openModal = useCallback(() => {
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setSelectedMedia([]);
    setPostText('');
  }, []);

  const submitPost = useCallback(async () => {
    if (!postText.trim() && selectedMedia.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng nhập nội dung hoặc chọn ảnh/video');
      return;
    }

    closeModal();

    const success = await createPost({
      content: postText,
      files: selectedMedia,
    });

    if (success) {
      Alert.alert('Thành công', 'Bài viết đã được đăng!');
    }
  }, [postText, selectedMedia, createPost, closeModal]);

  const handleLike = useCallback((postId: string) => {
    likePost(postId);
  }, [likePost]);

  const handleShare = async (post: PostData) => {
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

  const handleComment = useCallback((postId: string) => {
    router.push({
      pathname: '/post',
      params: { id: postId }
    });
  }, [router]);

  const handleUserPress = useCallback((userId: string) => {
    router.push({
      pathname: '/user',
      params: { id: userId }
    });
  }, [router]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Vừa xong';
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    return `${Math.floor(diffInHours / 24)} ngày trước`;
  };

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -100],
    extrapolate: 'clamp',
  });

  const handleImageScroll = (event: any, postId: string) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / screenWidth);
    setCurrentImageIndexes(prev => ({
      ...prev,
      [postId]: currentIndex
    }));
  };

  const renderMediaItem = (mediaUrl: string, isVideo: boolean = false) => {    
    if (isVideo) {
      return (
        <Video
          source={{ uri: mediaUrl }}
          style={styles.postImage}
          resizeMode={ResizeMode.COVER}
          useNativeControls
          shouldPlay={false}
        />
      );
    } else {
      return (
        <Image
          source={{ uri: mediaUrl }}
          style={styles.postImage}
          resizeMode="cover"
        />
      );
    }
  };

  const renderItem = ({ item }: { item: PostData }) => {
    const likeCount = Object.keys(item.likes || {}).length;
    const commentCount = Object.keys(item.comments || {}).length;
    const isLiked = !!currentUserId && !!Object.values(item.likes || {}).find(
      like => like.accountId === currentUserId
    );

    let mediaItems = item.medias || item.mediaIds || [];    
    const imageMedias = mediaItems.filter(m => m.type === 'image');
    const videoMedias = mediaItems.filter(m => m.type === 'video');
    const hasMedia = mediaItems.length > 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <TouchableOpacity onPress={() => handleUserPress(item.accountId)}>
            <Image source={{ uri: item.authorAvatar }} style={styles.avatar} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <TouchableOpacity onPress={() => handleUserPress(item.accountId)}>
              <Text style={styles.username}>{item.authorName}</Text>
            </TouchableOpacity>
            <Text style={styles.subText}>
              {formatTime(item.createdAt)}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => handleComment(item._id)}>
          <Text style={styles.content}>{item.content}</Text>
        </TouchableOpacity>

        {hasMedia && (
          <View style={styles.imageGalleryContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={screenWidth - 16}
              decelerationRate="fast"
              onScroll={(event) => handleImageScroll(event, item._id)}
              scrollEventThrottle={16}
            >
              {imageMedias.map((media, index) => (
                <TouchableOpacity
                  key={`image-${media._id || media.id || index}`}
                  style={styles.imageContainer}
                  onPress={() => handleComment(item._id)}
                >
                  {renderMediaItem(media.url, false)}
                </TouchableOpacity>
              ))}

              {videoMedias.map((media, index) => (
                <TouchableOpacity
                  key={`video-${media._id || media.id || index}`}
                  style={styles.imageContainer}
                  onPress={() => handleComment(item._id)}
                >
                  {renderMediaItem(media.url, true)}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {mediaItems.length > 1 && (
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {(currentImageIndexes[item._id] || 0) + 1}/{mediaItems.length}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {likeCount > 0 && `${likeCount} lượt thích`}
            {likeCount > 0 && commentCount > 0 && ' • '}
            {commentCount > 0 && `${commentCount} bình luận`}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleLike(item._id)}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={20}
              color={isLiked ? "#ef4444" : "#6b7280"}
            />
            <Text style={[
              styles.actionText,
              isLiked && { color: '#ef4444' }
            ]}>
              {isLiked ? 'Đã thích' : 'Thích'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleComment(item._id)}
          >
            <Ionicons name="chatbubble-outline" size={18} color="#6b7280" />
            <Text style={styles.actionText}>Bình luận</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleShare(item)}
          >
            <Ionicons name="share-outline" size={18} color="#6b7280" />
            <Text style={styles.actionText}>Chia sẻ</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1f2937" />

      <AnimatedHeader
        title="Smoker App"
        subtitle="Chia sẻ khoảnh khắc"
        headerTranslateY={headerTranslateY}
      />

      <Animated.FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        style={[styles.container, { paddingTop: 40 }]}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListHeaderComponent={
          <>
            <PostInputBox openModal={openModal} pickMedia={pickMedia} />
            
            {/* ✅ Simple progress bar - chỉ có thanh thôi! */}
            {uploading && (
              <UploadingProgressBar progress={uploadProgress} />
            )}
          </>
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
        onEndReached={() => {
          if (!loading && hasMore) loadMore();
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => {
          if (!loading) return null;
          return (
            <View style={{ padding: 12 }}>
              <ActivityIndicator size="small" color="#2563eb" />
            </View>
          );
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo bài viết</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              <TextInput
                placeholder="Bạn đang nghĩ gì?"
                multiline
                style={styles.input}
                value={postText}
                onChangeText={setPostText}
                autoFocus={true}
              />

              {selectedMedia.length > 0 && (
                <ScrollView
                  horizontal
                  style={styles.imagesPreview}
                  showsHorizontalScrollIndicator={false}
                >
                  {selectedMedia.map((media, index) => (
                    <View key={index} style={styles.imageWrapper}>
                      {media.type === 'video' ? (
                        <>
                          <Video
                            source={{ uri: media.uri }}
                            style={styles.selectedImage}
                            resizeMode={ResizeMode.COVER}
                            useNativeControls
                            shouldPlay={false}
                          />
                          <View style={styles.videoLabel}>
                            <Ionicons name="videocam" size={16} color="#fff" />
                          </View>
                        </>
                      ) : (
                        <Image source={{ uri: media.uri }} style={styles.selectedImage} />
                      )}
                      <TouchableOpacity
                        style={styles.removeImageBtn}
                        onPress={() => removeMedia(index)}
                      >
                        <Ionicons name="close-circle" size={24} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              <TouchableOpacity
                style={styles.addImageButton}
                onPress={pickMedia}
                disabled={selectedMedia.length >= 5}
              >
                <Ionicons name="image-outline" size={24} color={selectedMedia.length >= 5 ? "#9ca3af" : "#1877f2"} />
                <Text style={[styles.addImageText, selectedMedia.length >= 5 && { color: '#9ca3af' }]}>
                  {selectedMedia.length >= 5 ? 'Đã đạt giới hạn (5 file)' : 'Thêm ảnh/video'}
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!postText.trim() && selectedMedia.length === 0) && styles.submitBtnDisabled
              ]}
              onPress={submitPost}
              disabled={!postText.trim() && selectedMedia.length === 0}
            >
              <Text style={styles.submitBtnText}>Đăng bài</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb'
  },
  postBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
    marginTop: 8,
  },
  postInput: {
    flex: 1,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 8,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 8,
  },
  headerInfo: {
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12
  },
  username: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#111827'
  },
  subText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2
  },
  content: {
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 15,
    color: '#374151',
    lineHeight: 20,
  },
  imageGalleryContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  imageContainer: {
    width: screenWidth - 16,
  },
  postImage: {
    width: screenWidth - 16,
    height: 250,
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
  statsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  statsText: {
    fontSize: 13,
    color: '#6b7280',
  },
  actions: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  actionBtn: {
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

  // ✅ Simple progress bar (giống Facebook)
  uploadingContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 8,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  uploadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadingLabel: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  simpleProgressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  simpleProgressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 2,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  input: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    textAlignVertical: 'top',
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  imagesPreview: {
    marginBottom: 16,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
    marginTop: 8
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  videoLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderStyle: 'dashed',
    backgroundColor: '#f9fafb',
  },
  addImageText: {
    fontSize: 16,
    color: '#1877f2',
    marginLeft: 8,
    fontWeight: '600',
  },
});