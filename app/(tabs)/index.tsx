// app/home.tsx
import React from 'react';
import {
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

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
];

// Ô đăng bài mới (header)
const PostInputBox = () => (
  <View style={styles.postBox}>
    <Image
      source={{ uri: 'https://i.pravatar.cc/100?img=10' }}
      style={styles.avatar}
    />
    <TouchableOpacity style={styles.postInput}>
      <Text style={{ color: '#6b7280' }}>Đăng bài...</Text>
    </TouchableOpacity>
    <TouchableOpacity>
      <Text style={styles.icon}>🖼️</Text>
    </TouchableOpacity>
  </View>
);

export default function HomeScreen() {
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
          <Text>👍 Thích</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text>💬 Bình luận</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text>↗️ Chia sẻ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.container}
        ListHeaderComponent={<PostInputBox />}
      />
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  // Ô đăng bài
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
  icon: {
    fontSize: 20,
  },
  // Card bài đăng
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#111827',
  },
  subText: {
    fontSize: 12,
    color: '#6b7280',
  },
  content: {
    marginBottom: 8,
    fontSize: 14,
    color: '#374151',
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 6,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionBtn: {
    alignItems: 'center',
  },
});
