import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const posts = [
  {
    id: '1',
    user: 'Nguyen Van A',
    avatar: 'https://i.pravatar.cc/100?img=1',
    content: 'Bài đăng số 1',
    image: 'https://picsum.photos/400/300?random=1',
  },
  {
    id: '2',
    user: 'Nguyen Van B',
    avatar: 'https://i.pravatar.cc/100?img=2',
    content: 'Bài đăng số 2',
    image: 'https://picsum.photos/400/300?random=2',
  },
  {
    id: '3',
    user: 'Nguyen Van C',
    avatar: 'https://i.pravatar.cc/100?img=1',
    content: 'Bài đăng số 1',
    image: 'https://picsum.photos/400/300?random=1',
  },
  {
    id: '4',
    user: 'Nguyen Van E',
    avatar: 'https://i.pravatar.cc/100?img=2',
    content: 'Bài đăng số 2',
    image: 'https://picsum.photos/400/300?random=2',
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
    console.log('1231231');
    
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
    
    // TODO: Xử lý đăng bài với text và ảnh
    
    bottomSheetRef.current?.close();
    setPostText('');
    setSelectedImages([]);
  }, [postText, selectedImages]);

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View>
          <Text style={styles.username}>{item.user}</Text>
          <Text style={styles.subText}>Vừa đăng · 1 giờ trước</Text>
        </View>
      </View>

      {/* Content */}
      <Text style={styles.content}>{item.content}</Text>

      {/* Image */}
      <Image source={{ uri: item.image }} style={styles.postImage} />

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="heart-outline" size={18} color="#6b7280" />
          <Text style={styles.actionText}>Thích</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="chatbubble-outline" size={18} color="#6b7280" />
          <Text style={styles.actionText}>Bình luận</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="arrow-redo-outline" size={18} color="#6b7280" />
          <Text style={styles.actionText}>Chia sẻ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.container}
        ListHeaderComponent={<PostInputBox openSheet={openSheet} pickImage={pickImage} />}
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
  container: { flex: 1, backgroundColor: '#f9fafb' },
  postBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
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
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  username: { fontWeight: 'bold', fontSize: 14, color: '#111827' },
  subText: { fontSize: 12, color: '#6b7280' },
  content: { marginBottom: 8, fontSize: 14, color: '#374151' },
  postImage: { width: '100%', height: 200, borderRadius: 6, marginBottom: 8 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    flex: 1,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#6b7280',
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