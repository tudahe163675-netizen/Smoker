// app/(tabs)/index.tsx
import AnimatedHeader from '@/components/ui/AnimatedHeader';
import { Post } from '@/constants/feedData';
import { useFeed } from '@/hooks/useFeed';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

const PostInputBox = ({ openModal, pickImage }: { openModal: () => void; pickImage: () => void }) => (
  <View style={styles.postBox}>
    <Image
      source={{ uri: 'https://i.pravatar.cc/100?img=10' }}
      style={styles.avatar}
    />
    <TouchableOpacity style={styles.postInput} onPress={openModal}>
      <Text style={{ color: '#6b7280' }}>Đăng bài...</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={pickImage} style={styles.iconButton}>
      <Ionicons name="image-outline" size={24} color="#6b7280" />
    </TouchableOpacity>
  </View>
);

export default function HomeScreen() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [postText, setPostText] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [currentImageIndexes, setCurrentImageIndexes] = useState<{[key: string]: number}>({});

  const {
    posts,
    loading,
    refreshing,
    error,
    createPost,
    likePost,
    refresh,
  } = useFeed();

  const pickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
        selectionLimit: 5,
      });

      if (!result.canceled) {
        const imageUris = result.assets.map(asset => asset.uri);
        setSelectedImages(prev => [...prev, ...imageUris]);
        setModalVisible(true);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  }, []);

  const removeImage = useCallback((index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const openModal = useCallback(() => {
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setSelectedImages([]);
    setPostText('');
  }, []);

  const submitPost = useCallback(async () => {
    const success = await createPost({
      content: postText,
      images: selectedImages,
    });

    closeModal();

    if (success) {
      Alert.alert('Thành công', 'Bài viết đã được đăng!');
    }
  }, [postText, selectedImages, createPost, closeModal]);

  const handleLike = useCallback((postId: string) => {
    likePost(postId);
  }, [likePost]);

  const handleShare = useCallback(async (post: Post) => {
    Alert.alert(
      'Chia sẻ',
      `Bài viết của ${post.user.name}: "${post.content}"`,
      [
        { text: 'Sao chép link', onPress: () => console.log('Copy link') },
        { text: 'Đóng', style: 'cancel' }
      ]
    );
  }, []);

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

  const renderItem = ({ item }: { item: Post }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <TouchableOpacity onPress={() => handleUserPress(item.userId)}>
          <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <TouchableOpacity onPress={() => handleUserPress(item.userId)}>
            <Text style={styles.username}>{item.user.name}</Text>
          </TouchableOpacity>
          <Text style={styles.subText}>
            {formatTime(item.createdAt)}
            {item.location && ` • ${item.location}`}
          </Text>
        </View>
      </View>

      <TouchableOpacity onPress={() => handleComment(item.id)}>
        <Text style={styles.content}>{item.content}</Text>
      </TouchableOpacity>

      {item.images.length > 0 && (
        <View style={styles.imageGalleryContainer}>
          <FlatList
            data={item.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(image, index) => `${item.id}-image-${index}`}
            renderItem={({ item: image }) => (
              <TouchableOpacity 
                style={styles.imageContainer}
                onPress={() => handleComment(item.id)}
              >
                <Image
                  source={{ uri: image }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
            snapToInterval={screenWidth}
            decelerationRate="fast"
            onScroll={(event) => handleImageScroll(event, item.id)}
            scrollEventThrottle={16}
          />
          {item.images.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {(currentImageIndexes[item.id] || 0) + 1}/{item.images.length}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {item.likes > 0 && `${item.likes} lượt thích`}
          {item.likes > 0 && item.commentsCount > 0 && ' • '}
          {item.commentsCount > 0 && `${item.commentsCount} bình luận`}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleLike(item.id)}
        >
          <Ionicons
            name={item.isLiked ? "heart" : "heart-outline"}
            size={20}
            color={item.isLiked ? "#ef4444" : "#6b7280"}
          />
          <Text style={[
            styles.actionText,
            item.isLiked && { color: '#ef4444' }
          ]}>
            {item.isLiked ? 'Đã thích' : 'Thích'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleComment(item.id)}
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
        keyExtractor={(item) => item.id}
        style={[styles.container, { paddingTop: 40 }]}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListHeaderComponent={<PostInputBox openModal={openModal} pickImage={pickImage} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      />

      {/* Modal thay thế BottomSheet */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo bài viết</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Content */}
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

              {selectedImages.length > 0 && (
                <ScrollView 
                  horizontal 
                  style={styles.imagesPreview} 
                  showsHorizontalScrollIndicator={false}
                >
                  {selectedImages.map((uri, index) => (
                    <View key={index} style={styles.imageWrapper}>
                      <Image source={{ uri }} style={styles.selectedImage} />
                      <TouchableOpacity
                        style={styles.removeImageBtn}
                        onPress={() => removeImage(index)}
                      >
                        <Ionicons name="close-circle" size={24} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
                  <Ionicons name="image-outline" size={28} color="#2563eb" />
                  <Text style={styles.mediaButtonText}>Thêm ảnh</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn, 
                (!postText.trim() && selectedImages.length === 0) && styles.submitBtnDisabled
              ]}
              onPress={submitPost}
              disabled={!postText.trim() && selectedImages.length === 0}
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
    width: screenWidth,
  },
  postImage: {
    width: screenWidth,
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
  removeImageBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 8,
  },
  mediaButton: {
    alignItems: 'center',
    padding: 12,
  },
  mediaButtonText: {
    marginTop: 6,
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
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
});