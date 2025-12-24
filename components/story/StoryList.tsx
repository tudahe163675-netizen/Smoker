import { StoryData } from '@/types/storyType';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const STORY_WIDTH = 110;
const STORY_HEIGHT = 180;

interface StoryListProps {
  stories: StoryData[];
  currentUserAvatar?: string;
  currentUserName?: string;
  onStoryPress: (story: StoryData, index: number) => void;
  onCreateStory: () => void;
  loading?: boolean;
}

export const StoryList: React.FC<StoryListProps> = ({
  stories,
  currentUserAvatar,
  currentUserName = 'Bạn',
  onStoryPress,
  onCreateStory,
  loading = false,
}) => {
  // Gom stories theo người dùng
  const groupStoriesByUser = (userStories: StoryData[]) => {
    const grouped = new Map<string, StoryData[]>();
    
    userStories.forEach(story => {
      const key = story.entityAccountId || story.authorName;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(story);
    });

    // Sắp xếp stories trong mỗi nhóm theo thời gian (mới nhất trước)
    grouped.forEach((stories) => {
      stories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });

    return grouped;
  };

  // Lấy story đại diện cho user (story mới nhất chưa xem, hoặc story mới nhất nếu đã xem hết)
  const getRepresentativeStory = (userStories: StoryData[]): StoryData => {
    const unviewedStories = userStories.filter(s => !s.viewed);
    if (unviewedStories.length > 0) {
      return unviewedStories[0]; // Đã được sort theo thời gian rồi
    }
    return userStories[0]; // Story mới nhất
  };

  const myStories = stories.filter(s => s.isOwner);
  const otherStories = stories.filter(s => !s.isOwner);

  const myStoriesGrouped = groupStoriesByUser(myStories);
  const otherStoriesGrouped = groupStoriesByUser(otherStories);

  // Danh sách story đại diện của người khác, sắp xếp theo thời gian story mới nhất
  const otherStoriesRepresentatives = Array.from(otherStoriesGrouped.entries())
    .map(([_, userStories]) => ({
      representative: getRepresentativeStory(userStories),
      allStories: userStories,
      latestTime: new Date(userStories[0].createdAt).getTime(),
      hasUnviewed: userStories.some(s => !s.viewed)
    }))
    .sort((a, b) => b.latestTime - a.latestTime);

  // Story đại diện của bản thân
  const myRepresentativeStory = myStories.length > 0 ? getRepresentativeStory(myStories) : null;
  const hasMyStories = myStories.length > 0;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Create Story Card */}
        <TouchableOpacity style={styles.storyCard} onPress={onCreateStory}>
          <View style={styles.createStoryImageContainer}>
            <Image
              source={{ uri: currentUserAvatar || 'https://i.pravatar.cc/100?img=10' }}
              style={styles.createStoryImage}
            />
          </View>
          <View style={styles.createStoryFooter}>
            <View style={styles.createIconContainer}>
              <Ionicons name="add" size={20} color="#fff" />
            </View>
            <Text style={styles.createStoryText}>Tạo story</Text>
          </View>
        </TouchableOpacity>

        {/* My Stories */}
        {hasMyStories && myRepresentativeStory && (
          <TouchableOpacity
            style={styles.storyCard}
            onPress={() => onStoryPress(myRepresentativeStory, 0)}
          >
            {(() => {
              const imageUrl = myRepresentativeStory.images || 
                (myRepresentativeStory.mediaIds && myRepresentativeStory.mediaIds.length > 0 
                  ? myRepresentativeStory.mediaIds[0].url 
                  : null
                );
              
              return (
                <>
                  {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.storyCardImage} />
                  ) : (
                    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.storyCardImage} />
                  )}
                  <View style={styles.storyCardOverlay} />
                  <View style={styles.myStoryHeader}>
                    <View style={styles.myStoryAvatarContainer}>
                      <Image
                        source={{ uri: currentUserAvatar || 'https://i.pravatar.cc/100?img=10' }}
                        style={styles.myStoryAvatar}
                      />
                      <LinearGradient
                        colors={['#f59e0b', '#ef4444']}
                        style={styles.myStoryAvatarBorder}
                      />
                    </View>
                  </View>
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.6)']}
                    style={styles.storyCardFooter}
                  >
                    <Text style={styles.storyCardName}>{currentUserName}</Text>
                  </LinearGradient>
                </>
              );
            })()}
          </TouchableOpacity>
        )}

        {/* Loading Card */}
        {loading && (
          <View style={styles.storyCard}>
            <View style={[styles.storyCardImage, styles.loadingCard]}>
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={styles.storyCardFooter}
            >
              <Text style={styles.storyCardName}>Đang đăng...</Text>
            </LinearGradient>
          </View>
        )}

        {/* Other Users' Stories */}
        {otherStoriesRepresentatives.map((item) => {
          const story = item.representative;
          return (
            <TouchableOpacity
              key={story._id}
              style={styles.storyCard}
              onPress={() => onStoryPress(story, 0)} // Index không quan trọng nữa vì có story._id
            >
              <Image
                source={{ 
                  uri: story.images || 
                  (story.mediaIds && story.mediaIds.length > 0 ? story.mediaIds[0].url : story.authorAvatar)
                }}
                style={styles.storyCardImage}
              />
              <View style={styles.storyCardOverlay} />
              <View style={styles.storyHeader}>
                <View style={styles.avatarContainer}>
                  <Image source={{ uri: story.authorAvatar }} style={styles.storyAvatar} />
                  {item.hasUnviewed && (
                    <LinearGradient
                      colors={['#f59e0b', '#ef4444', '#ec4899']}
                      style={styles.avatarBorder}
                    />
                  )}
                </View>
              </View>
              {story.songId && (
                <View style={styles.musicBadge}>
                  <Ionicons name="musical-notes" size={12} color="#fff" />
                </View>
              )}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                style={styles.storyCardFooter}
              >
                <Text style={styles.storyCardName} numberOfLines={2}>
                  {story.authorName}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 8,
  },
  storyCard: {
    width: STORY_WIDTH,
    height: STORY_HEIGHT,
    marginHorizontal: 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    position: 'relative',
  },
  storyCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  storyCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  storyHeader: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  avatarContainer: {
    position: 'relative',
    width: 40,
    height: 40,
  },
  storyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 44,
    height: 44,
    borderRadius: 22,
    zIndex: -1,
  },
  storyCardFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    paddingTop: 24,
  },
  storyCardName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  musicBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Create Story Styles
  createStoryImageContainer: {
    width: '100%',
    height: '65%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  createStoryImage: {
    width: 110,
    height: 117,
    resizeMode: 'cover',
  },
  createStoryFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },
  createIconContainer: {
    position: 'absolute',
    top: -15,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  createStoryText: {
    marginTop: 8,
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },

  // My Story Styles
  myStoryHeader: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  myStoryAvatarContainer: {
    position: 'relative',
    width: 40,
    height: 40,
  },
  myStoryAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#fff',
  },
  myStoryAvatarBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 44,
    height: 44,
    borderRadius: 22,
    zIndex: -1,
  },

  // Loading Styles
  loadingCard: {
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
});