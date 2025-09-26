import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Post {
  id: string;
  user: string;
  avatar: string;
  content: string;
  image: string;
  likes: number;
  isLiked: boolean;
  comments: number;
}

const initialPosts: Post[] = [
  {
    id: '1',
    user: 'Nguyen Van A',
    avatar: 'https://i.pravatar.cc/100?img=1',
    content: 'Bài đăng số 1 - Hôm nay thật đẹp trời!',
    image: 'https://picsum.photos/400/300?random=1',
    likes: 24,
    isLiked: false,
    comments: 5,
  },
  {
    id: '2',
    user: 'Nguyen Van B',
    avatar: 'https://i.pravatar.cc/100?img=2',
    content: 'Bài đăng số 2 - Vừa ăn món ngon tại quán mới!',
    image: 'https://picsum.photos/400/300?random=2',
    likes: 18,
    isLiked: true,
    comments: 3,
  },
  {
    id: '3',
    user: 'Nguyen Van C',
    avatar: 'https://i.pravatar.cc/100?img=3',
    content: 'Cuối tuần đi du lịch cùng gia đình',
    image: 'https://picsum.photos/400/300?random=3',
    likes: 35,
    isLiked: false,
    comments: 8,
  },
  {
    id: '4',
    user: 'Nguyen Van D',
    avatar: 'https://i.pravatar.cc/100?img=4',
    content: 'Học được nhiều điều mới hôm nay',
    image: 'https://picsum.photos/400/300?random=4',
    likes: 12,
    isLiked: false,
    comments: 2,
  },
];

// Ô đăng bài mới (header)
const PostInputBox = ({ openSheet, pickImage }: { openSheet: () => void; pickImage: () => void }) => (
  <View style={styles.postBox}>
    <Image
      source={{ uri: 'https://i.pravatar.cc/100?img=10' }}
      style={styles.avatar}
    />
    <TouchableOpacity style={styles.postInput} onPress={openSheet}>
      <Text style={{ color: '#6b7280' }}>Đăng bài...</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={pickImage} style={styles.iconButton}>
      <Ionicons name="image-outline" size={24} color="#6b7280" />
    </TouchableOpacity>
  </View>
);

export default function HomeScreen() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['50%', '90%'], []);
  const [postText, setPostText] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Request permissions
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Quyền truy cập bị từ chối',
        'Cần quyền truy cập thư viện ảnh để chọn ảnh.'
      );
      return false;
    }
    return true;
  };

  // Pick images from gallery
  const pickImage = useCallback(async () => {
    console.log('Opening image picker...');
    
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
        selectionLimit: 5, // Giới hạn 5 ảnh
      });

      if (!result.canceled) {
        const imageUris = result.assets.map(asset => asset.uri);
        setSelectedImages(prev => [...prev, ...imageUris]);
        
        // Mở BottomSheet nếu chưa mở
        bottomSheetRef.current?.snapToIndex(1);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  }, []);

  // Remove selected image
  const removeImage = useCallback((index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Handle sheet changes
  const handleSheetChanges = useCallback((index: number) => {
    console.log('Sheet changed to index:', index);
    if (index === -1) {
      // Reset khi đóng sheet
      setSelectedImages([]);
      setPostText('');
    }
  }, []);

  const openSheet = useCallback(() => {
    console.log('Opening sheet...');
    bottomSheetRef.current?.snapToIndex(1);
  }, []);

  const submitPost = useCallback(() => {
    console.log('Post content:', postText);
    console.log('Selected images:', selectedImages);
    
    // Tạo post mới
    const newPost: Post = {
      id: Date.now().toString(),
      user: 'Bạn',
      avatar: 'https://i.pravatar.cc/100?img=10',
      content: postText,
      image: selectedImages[0] || 'https://picsum.photos/400/300?random=' + Math.floor(Math.random() * 100),
      likes: 0,
      isLiked: false,
      comments: 0,
    };
    
    // Thêm post mới vào đầu danh sách
    setPosts(prev => [newPost, ...prev]);
    
    bottomSheetRef.current?.close();
    setPostText('');
    setSelectedImages([]);
    
    Alert.alert('Thành công', 'Bài viết đã được đăng!');
  }, [postText, selectedImages]);

  // Handle like post
  const handleLike = useCallback((postId: string) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1
            }
          : post
      )
    );
  }, []);

  // Handle share post
  const handleShare = useCallback(async (post: Post) => {
    try {
        Alert.alert(
          'Chia sẻ',
          `Bài viết của ${post.user}: "${post.content}"`,
          [
            { text: 'Sao chép link', onPress: () => console.log('Copy link') },
            { text: 'Đóng', style: 'cancel' }
          ]
        );
        return;
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Lỗi', 'Không thể chia sẻ bài viết');
    }
  }, []);

  // Handle comment (placeholder)
  const handleComment = useCallback((postId: string) => {
    Alert.alert(
      'Bình luận',
      'Tính năng bình luận sẽ được phát triển trong phiên bản tiếp theo!',
      [{ text: 'OK' }]
    );
  }, []);

  // Header animation
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -100],
    extrapolate: 'clamp',
  });

  const renderItem = ({ item }: { item: Post }) => (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.username}>{item.user}</Text>
          <Text style={styles.subText}>Vừa đăng · 1 giờ trước</Text>
        </View>
      </View>

      {/* Content */}
      <Text style={styles.content}>{item.content}</Text>

      {/* Image */}
      <Image source={{ uri: item.image }} style={styles.postImage} />

      {/* Like and Comment count */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {item.likes > 0 && `${item.likes} lượt thích`}
          {item.likes > 0 && item.comments > 0 && ' • '}
          {item.comments > 0 && `${item.comments} bình luận`}
        </Text>
      </View>

      {/* Actions */}
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
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1f2937" />

      {/* Animated Header */}
      <Animated.View style={[styles.header, { transform: [{ translateY: headerTranslateY }] }]}>
        <LinearGradient colors={['#1f2937', '#374151']} style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Smokder App</Text>
              <Text style={styles.headerSubtitle}>Chia sẻ khoảnh khắc</Text>
            </View>
            {/* <TouchableOpacity style={styles.searchButton}>
              <Ionicons name="search-outline" size={24} color="#fff" />
            </TouchableOpacity> */}
          </View>
        </LinearGradient>
      </Animated.View>

      <Animated.FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={[styles.container, { paddingTop: 40 }]}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListHeaderComponent={<PostInputBox openSheet={openSheet} pickImage={pickImage} />}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      />

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose={true}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetView style={styles.sheetContent}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Tạo bài viết</Text>
            <TouchableOpacity
              onPress={() => bottomSheetRef.current?.close()}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <TextInput
            placeholder="Bạn đang nghĩ gì?"
            multiline
            style={styles.input}
            value={postText}
            onChangeText={setPostText}
            autoFocus={false}
          />

          {/* Selected Images */}
          {selectedImages.length > 0 && (
            <ScrollView horizontal style={styles.imageContainer} showsHorizontalScrollIndicator={false}>
              {selectedImages.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.selectedImage} />
                  <TouchableOpacity 
                    style={styles.removeImageBtn}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
              <Ionicons name="image-outline" size={24} color="#2563eb" />
              <Text style={styles.mediaButtonText}>Ảnh</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.mediaButton}>
              <Ionicons name="videocam-outline" size={24} color="#2563eb" />
              <Text style={styles.mediaButtonText}>Video</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.mediaButton}>
              <Ionicons name="location-outline" size={24} color="#2563eb" />
              <Text style={styles.mediaButtonText}>Vị trí</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, (!postText.trim() && selectedImages.length === 0) && styles.submitBtnDisabled]}
            onPress={submitPost}
            disabled={!postText.trim() && selectedImages.length === 0}
          >
            <Text style={styles.submitBtnText}>Đăng</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f9fafb' 
  },

  // Header Styles - giống cinema app
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerGradient: {
    paddingTop: 40,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#d1d5db',
    marginTop: 2,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Post Input Box
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

  // Card Styles
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
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  username: { fontWeight: 'bold', fontSize: 15, color: '#111827' },
  subText: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  content: { 
    paddingHorizontal: 12,
    marginBottom: 12, 
    fontSize: 15, 
    color: '#374151',
    lineHeight: 20,
  },
  postImage: { 
    width: '100%', 
    height: 250, 
    marginBottom: 8,
  },
  
  // Stats (likes, comments count)
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

  // BottomSheet Styles
  sheetBackground: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  handleIndicator: {
    backgroundColor: '#d1d5db',
    width: 40,
  },
  sheetContent: {
    flex: 1,
    padding: 16,
    backgroundColor: 'transparent'
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    minHeight: 80,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    textAlignVertical: 'top',
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  
  // Image Selection Styles
  imageContainer: {
    marginBottom: 16,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 8,
    marginTop: 8
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  mediaButton: {
    alignItems: 'center',
    padding: 8,
  },
  mediaButtonText: {
    marginTop: 4,
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500',
  },
  
  submitBtn: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 'auto',
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