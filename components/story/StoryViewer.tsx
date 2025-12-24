import { StoryData } from '@/types/storyType';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds

interface StoryViewerProps {
  visible: boolean;
  stories: StoryData[];
  initialIndex: number;
  initialStoryId?: string;
  currentUserEntityAccountId?: string;
  onClose: () => void;
  onLike: (storyId: string) => void;
  onMarkAsViewed: (storyId: string) => void;
  onDelete?: (storyId: string) => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
  visible,
  stories,
  initialIndex,
  initialStoryId,
  currentUserEntityAccountId,
  onClose,
  onLike,
  onMarkAsViewed,
  onDelete,
}) => {
  const [currentUserGroupIndex, setCurrentUserGroupIndex] = useState(0);
  const [currentStoryIndexInGroup, setCurrentStoryIndexInGroup] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Gom stories theo người dùng
  const groupStoriesByUser = (allStories: StoryData[]) => {
    const myStories = allStories.filter(s => s.isOwner);
    const otherStories = allStories.filter(s => !s.isOwner);

    const grouped = new Map<string, StoryData[]>();
    
    otherStories.forEach(story => {
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

    // Tạo danh sách các nhóm người dùng
    const userGroups: StoryData[][] = [];
    
    // Thêm nhóm stories của bản thân (nếu có)
    if (myStories.length > 0) {
      const sortedMyStories = [...myStories].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      userGroups.push(sortedMyStories);
    }

    // Thêm các nhóm stories của người khác, sắp xếp theo thời gian story mới nhất
    const sortedOtherGroups = Array.from(grouped.values())
      .sort((a, b) => new Date(b[0].createdAt).getTime() - new Date(a[0].createdAt).getTime());
    
    userGroups.push(...sortedOtherGroups);

    return userGroups;
  };

  const userGroups = groupStoriesByUser(stories);
  const currentGroup = userGroups[currentUserGroupIndex] || [];
  const currentStory = currentGroup[currentStoryIndexInGroup];

  const isOwner = currentStory?.entityAccountId === currentUserEntityAccountId;
  const isLiked = !!currentUserEntityAccountId && !!Object.values(currentStory?.likes || {}).find(
    like => like.entityAccountId === currentUserEntityAccountId
  );
  const likeCount = Object.keys(currentStory?.likes || {}).length;

  // Tìm index của user group và story index dựa trên initialStoryId hoặc initialIndex
  useEffect(() => {
    if (visible && stories.length > 0 && userGroups.length > 0) {
      // Ưu tiên sử dụng initialStoryId nếu có
      let targetStory: StoryData | undefined;
      
      if (initialStoryId) {
        // Tìm story theo ID
        targetStory = stories.find(s => s._id === initialStoryId);
      } else if (initialIndex >= 0 && initialIndex < stories.length) {
        // Fallback: sử dụng initialIndex
        targetStory = stories[initialIndex];
      }
      
      if (!targetStory) {
        // Nếu không tìm thấy, mặc định là nhóm đầu tiên
        setCurrentUserGroupIndex(0);
        setCurrentStoryIndexInGroup(0);
        return;
      }
      
      // Tìm nhóm và vị trí của story trong nhóm
      let foundGroupIndex = 0;
      let foundStoryIndexInGroup = 0;
      
      for (let i = 0; i < userGroups.length; i++) {
        const storyIndex = userGroups[i].findIndex(s => s._id === targetStory!._id);
        if (storyIndex !== -1) {
          foundGroupIndex = i;
          foundStoryIndexInGroup = storyIndex;
          break;
        }
      }
      
      setCurrentUserGroupIndex(foundGroupIndex);
      setCurrentStoryIndexInGroup(foundStoryIndexInGroup);
    }
  }, [visible, initialIndex, initialStoryId]);

  // Kiểm tra xem story có ảnh không
  const hasImage = currentStory?.images || 
    (currentStory?.mediaIds && currentStory.mediaIds.length > 0 && currentStory.mediaIds[0].url);    

  useEffect(() => {
    if (visible && currentStory) {
      onMarkAsViewed(currentStory._id);
      startProgress();
    }

    return () => {
      progressAnim.setValue(0);
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [visible, currentUserGroupIndex, currentStoryIndexInGroup]);

  // Play audio if story has music
  useEffect(() => {
    const playAudio = async () => {
      if (currentStory?.audioUrl && !isPaused) {
        try {
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: currentStory.audioUrl },
            { shouldPlay: true, isLooping: true }
          );
          setSound(newSound);
        } catch (error) {
          console.error('Error playing audio:', error);
        }
      }
    };

    playAudio();

    return () => {
      if (sound) {
        sound.unloadAsync();
        setSound(null);
      }
    };
  }, [currentStory, isPaused]);

  const startProgress = () => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !isPaused) {
        goToNext();
      }
    });
  };

  const pauseProgress = () => {
    setIsPaused(true);
    progressAnim.stopAnimation();
    if (sound) {
      sound.pauseAsync();
    }
  };

  const resumeProgress = () => {
    setIsPaused(false);
    const currentValue = (progressAnim as any)._value;
    const remainingDuration = STORY_DURATION * (1 - currentValue);

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: remainingDuration,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !isPaused) {
        goToNext();
      }
    });

    if (sound) {
      sound.playAsync();
    }
  };

  const goToNext = () => {
    // Nếu còn story trong nhóm hiện tại
    if (currentStoryIndexInGroup < currentGroup.length - 1) {
      setCurrentStoryIndexInGroup(currentStoryIndexInGroup + 1);
    } 
    // Chuyển sang nhóm người dùng tiếp theo
    else if (currentUserGroupIndex < userGroups.length - 1) {
      setCurrentUserGroupIndex(currentUserGroupIndex + 1);
      setCurrentStoryIndexInGroup(0);
    } 
    // Đã hết tất cả stories
    else {
      onClose();
    }
  };

  const goToPrevious = () => {
    // Nếu không phải story đầu tiên trong nhóm
    if (currentStoryIndexInGroup > 0) {
      setCurrentStoryIndexInGroup(currentStoryIndexInGroup - 1);
    } 
    // Quay lại nhóm người dùng trước đó
    else if (currentUserGroupIndex > 0) {
      const previousGroupIndex = currentUserGroupIndex - 1;
      setCurrentUserGroupIndex(previousGroupIndex);
      setCurrentStoryIndexInGroup(userGroups[previousGroupIndex].length - 1);
    }
  };

  const handleLike = () => {
    onLike(currentStory._id);
  };

  const handleDelete = () => {
    Alert.alert(
      'Xóa story',
      'Bạn có chắc chắn muốn xóa story này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            if (onDelete) {
              onDelete(currentStory._id);
              onClose();
            }
          },
        },
      ]
    );
  };

  if (!currentStory) return null;

  const gradientColors = [
    ['#667eea', '#764ba2', '#f093fb'],
    ['#fa709a', '#fee140'],
    ['#30cfd0', '#330867'],
    ['#a8edea', '#fed6e3'],
    ['#ff9a9e', '#fecfef', '#fecfef'],
    ['#ffecd2', '#fcb69f'],
    ['#ff6e7f', '#bfe9ff'],
    ['#e0c3fc', '#8ec5fc'],
  ];
  
  // Chọn gradient dựa trên story id để đảm bảo consistent
  const gradientIndex = currentStory._id ? 
    currentStory._id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradientColors.length : 0;
  const selectedGradient = gradientColors[gradientIndex];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <View style={styles.container}>
        {/* Background */}
        {hasImage ? (
          <>
            <Image
              source={{ 
                uri: currentStory.images || 
                  (currentStory.mediaIds && currentStory.mediaIds.length > 0 
                    ? currentStory.mediaIds[0].url 
                    : '')
              }}
              style={styles.backgroundImage}
              resizeMode="cover"
            />
            <View style={styles.overlay} />
          </>
        ) : (
          <LinearGradient
            colors={selectedGradient}
            style={styles.backgroundGradient}
          />
        )}

        {/* Touch Areas for Navigation */}
        <View style={styles.touchableArea}>
          <TouchableOpacity
            style={styles.leftTouch}
            activeOpacity={1}
            onPressIn={pauseProgress}
            onPressOut={resumeProgress}
            onPress={goToPrevious}
          />
          <TouchableOpacity
            style={styles.rightTouch}
            activeOpacity={1}
            onPressIn={pauseProgress}
            onPressOut={resumeProgress}
            onPress={goToNext}
          />
        </View>

        {/* Progress Bars */}
        <View style={styles.progressContainer}>
          {currentGroup.map((_, index) => (
            <View key={index} style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width:
                      index < currentStoryIndexInGroup
                        ? '100%'
                        : index === currentStoryIndexInGroup
                        ? progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          })
                        : '0%',
                  },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image
              source={{ uri: currentStory.authorAvatar }}
              style={styles.avatar}
            />
            <View style={styles.userTextContainer}>
              <Text style={styles.username}>{currentStory.authorName}</Text>
              <Text style={styles.timeAgo}>
                {formatTimeAgo(currentStory.createdAt)}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            {/* {isOwner && onDelete && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={24} color="#fff" />
              </TouchableOpacity>
            )} */}
            
            <TouchableOpacity style={styles.headerButton} onPress={onClose}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content - Centered when no image */}
        {currentStory.content && (
          <View style={[
            styles.contentContainer,
            !hasImage && styles.contentCentered
          ]}>
            <Text style={[
              styles.contentText,
              !hasImage && styles.contentTextLarge
            ]}>
              {currentStory.content}
            </Text>
          </View>
        )}

        {/* Music Info */}
        {currentStory.songId && hasImage && (
          <View style={styles.musicInfo}>
            <Ionicons name="musical-notes" size={20} color="#fff" />
            <View style={styles.musicTextContainer}>
              <Text style={styles.songTitle} numberOfLines={1}>
                {currentStory.songId.title}
              </Text>
              <Text style={styles.artistName} numberOfLines={1}>
                {currentStory.songId.artistName}
              </Text>
            </View>
          </View>
        )}

        {/* Music Info - Repositioned when no image */}
        {currentStory.songId && !hasImage && (
          <View style={[styles.musicInfo, styles.musicInfoBottom]}>
            <Ionicons name="musical-notes" size={20} color="#fff" />
            <View style={styles.musicTextContainer}>
              <Text style={styles.songTitle} numberOfLines={1}>
                {currentStory.songId.title}
              </Text>
              <Text style={styles.artistName} numberOfLines={1}>
                {currentStory.songId.artistName}
              </Text>
            </View>
          </View>
        )}

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.likeButton}
            onPress={handleLike}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={32}
              color={isLiked ? "#ef4444" : "#fff"}
            />
            {likeCount > 0 && (
              <Text style={styles.likeCount}>{likeCount}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) {
    return 'Vừa xong';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}phút`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}giờ`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days}ngày`;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    position: 'absolute',
    width,
    height,
  },
  backgroundGradient: {
    position: 'absolute',
    width,
    height,
  },
  overlay: {
    position: 'absolute',
    width,
    height,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  touchableArea: {
    flex: 1,
    flexDirection: 'row',
  },
  leftTouch: {
    flex: 1,
  },
  rightTouch: {
    flex: 1,
  },
  progressContainer: {
    position: 'absolute',
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 50,
    left: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
    zIndex: 10,
  },
  progressBarBackground: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
  header: {
    position: 'absolute',
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  username: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  timeAgo: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  contentCentered: {
    top: '50%',
    bottom: 'auto',
    transform: [{ translateY: -50 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  contentTextLarge: {
    fontSize: 24,
    lineHeight: 36,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  musicInfo: {
    position: 'absolute',
    bottom: 70,
    left: 16,
    right: 80,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 12,
    borderRadius: 12,
    zIndex: 10,
  },
  musicInfoBottom: {
    bottom: 140,
  },
  musicTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  songTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  artistName: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 60,
    right: 16,
    zIndex: 10,
  },
  likeButton: {
    alignItems: 'center',
  },
  likeCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});