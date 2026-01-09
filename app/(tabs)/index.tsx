import RenderPost from '@/components/post/PostContent';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { CreateStoryModal } from '@/components/story/CreateStoryModal';
import { StoryList } from '@/components/story/StoryList';
import { StoryViewer } from '@/components/story/StoryViewer';
import FeedHeader from '@/components/ui/FeedHeader';
import { CreateMenuModal } from '@/components/feed/CreateMenuModal';
import { useAuth } from '@/hooks/useAuth';
import { useFeed } from '@/hooks/useFeed';
import { useSocket } from '@/hooks/useSocket';
import { useStory } from '@/hooks/useStory';
import { FeedApiService } from "@/services/feedApi";
import { MessageApiService } from '@/services/messageApi';
import { PostData } from '@/types/postType';
import { StoryData } from '@/types/storyType';
import { isStoryValid } from '@/utils/extension';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
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

const {width: screenWidth} = Dimensions.get('window');

const PostInputBox = ({openModal, pickMedia, avatar}: {
    openModal: () => void;
    pickMedia: () => void;
    avatar: string | undefined;
}) => (
    <View style={styles.postBox}>
        <Image
            source={{uri: avatar ?? 'https://i.pravatar.cc/100?img=10'}}
            style={styles.avatar}
        />
        <TouchableOpacity style={styles.postInput} onPress={openModal}>
            <Text style={{color: '#6b7280'}}>Đăng bài...</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={pickMedia} style={styles.iconButton}>
            <Ionicons name="image-outline" size={24} color="#6b7280"/>
        </TouchableOpacity>
    </View>
);

const UploadingProgressBar = ({progress}: { progress: number }) => (
    <View style={styles.uploadingContainer}>
        <View style={styles.uploadingContent}>
            <ActivityIndicator size="small" color="#2563eb" style={{marginRight: 8}}/>
            <Text style={styles.uploadingLabel}>Đang đăng bài viết...</Text>
        </View>
        <View style={styles.simpleProgressBar}>
            <Animated.View
                style={[
                    styles.simpleProgressFill,
                    {width: `${progress}%`}
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
    const {authState} = useAuth();
    const currentUserId = authState.currentId;
    const avartarAuthor = authState.avatar;
    const entityAccountId = authState.EntityAccountId;
    const currentUserName = authState.userEmail || 'Bạn';
    const feedApi = new FeedApiService(authState.token!);

    const {socket} = useSocket();

    // Unread count state
    const [unreadCount, setUnreadCount] = useState<number>(0);

    // Message API instance
    const messageApi = React.useMemo(() => {
        if (authState.token) {
            return new MessageApiService(authState.token);
        }
        return null;
    }, [authState.token]);

    // Fetch unread count
    useEffect(() => {
        const fetchUnread = async () => {
            if (messageApi && entityAccountId) {
                try {
                    const count = await messageApi.getUnreadCount(entityAccountId);
                    setUnreadCount(count);
                } catch (err) {
                    setUnreadCount(0);
                }
            }
        };
        fetchUnread();
    }, [messageApi, entityAccountId]);

    //realtime
    useEffect(() => {
        if (!socket) return;
        const handleNewMessage = () => {
            if (messageApi && entityAccountId) {
                messageApi.getUnreadCount(entityAccountId)
                    .then(setUnreadCount)
                    .catch(() => setUnreadCount(0));
            }
        };
        const handleMessagesRead = () => {
            if (messageApi && entityAccountId) {
                messageApi.getUnreadCount(entityAccountId)
                    .then(setUnreadCount)
                    .catch(() => setUnreadCount(0));
            }
        };
        socket.on('new_message', handleNewMessage);
        socket.on('messages_read', handleMessagesRead);
        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('messages_read', handleMessagesRead);
        };
    }, [socket, messageApi, entityAccountId]);

    // Story states
    const [storyViewerVisible, setStoryViewerVisible] = useState(false);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [createStoryModalVisible, setCreateStoryModalVisible] = useState(false);
    const [selectedStoryId, setSelectedStoryId] = useState<string | undefined>(undefined);
    const [repostModalVisible, setRepostModalVisible] = useState(false);
    const [repostContent, setRepostContent] = useState('');
    const [repostingItem, setRepostingItem] = useState<PostData | null>(null);
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [createMenuVisible, setCreateMenuVisible] = useState(false);

    const {
        posts,
        loading,
        refreshing,
        error,
        uploading,
        uploadProgress,
        createPost,
        likePost,
        refresh: refreshFeed,
        loadMore,
        hasMore
    } = useFeed();

    const {
        stories,
        loading: storiesLoading,
        uploading: storyUploading,
        uploadProgress: storyUploadProgress,
        createStory,
        likeStory,
        markAsViewed,
        deleteStory,
        refresh: refreshStories,
    } = useStory();

    const validStories = React.useMemo(() => {
        return stories.filter(story => isStoryValid(story.createdAt));
    }, [stories]);

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

    const submitRepost = useCallback(async () => {
        if (!repostingItem) return;

        const repostContentText = repostContent.trim() || repostingItem.content || '';
        
        try {
            let request = {
                title: repostingItem.title || '',
                content: repostContentText,
                images: repostingItem.images,
                videos: repostingItem.videos,
                audios: "",
                musicTitle: "",
                artistName: "",
                description: "",
                hashTag: "",
                musicPurchaseLink: "",
                musicBackgroundImage: "",
                type: repostingItem.type,
                songId: repostingItem.songId,
                musicId: repostingItem.musicId,
                entityAccountId: entityAccountId,
                entityId: repostingItem.author?.entityId ?? repostingItem.entityId,
                entityType: repostingItem.author?.entityType ?? repostingItem.entityType,
                repostedFromId: repostingItem.id ?? repostingItem._id,
                repostedFromType: repostingItem.type
            }
            const response = await feedApi.rePost(request);
            if (response.success) {
                Alert.alert('Thành công', 'Đã đăng lại bài viết');
                setRepostModalVisible(false);
                setRepostContent('');
                setRepostingItem(null);
                // Refresh feed
                refreshFeed();
            } else {
                Alert.alert('Lỗi', 'Không đăng lại bài viết');
            }
        } catch (error) {
            console.log("error repost: ", error);
            Alert.alert('Lỗi', 'Không đăng lại bài viết');
        }
    }, [repostingItem, repostContent, entityAccountId, feedApi]);

    // Story handlers
    const handleStoryPress = useCallback((story: StoryData, index: number) => {
        setSelectedStoryId(story._id);
        setCurrentStoryIndex(index);
        setStoryViewerVisible(true);
    }, []);

    const handleCloseStoryViewer = useCallback(() => {
        setStoryViewerVisible(false);
        setSelectedStoryId(undefined);
    }, []);

    const handleCreateStory = useCallback(() => {
        setCreateStoryModalVisible(true);
    }, []);

    const handleSubmitStory = useCallback(async (storyData: any) => {
        const success = await createStory(storyData);
        if (success) {
            Alert.alert('Thành công', 'Story đã được đăng!');
        }
    }, [createStory]);

    const handleRefresh = useCallback(() => {
        refreshFeed();
        refreshStories();
    }, [refreshFeed, refreshStories]);

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Vừa xong';
        if (diffInHours < 24) return `${diffInHours} giờ trước`;
        return `${Math.floor(diffInHours / 24)} ngày trước`;
    };

    const handleRepostAction = useCallback((item: PostData) => {
        setRepostingItem(item);
        setRepostContent('');
        setRepostModalVisible(true);
    }, []);

    const renderItem = useCallback(({item}: { item: PostData }) => {
        return (
            <RenderPost
                item={item}
                currentId={authState.currentId ?? ''}
                currentEntityAccountId={authState.EntityAccountId}
                feedApiService={feedApi}
            />
        );
    }, [authState.currentId, authState.token, handleRepostAction]);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.card}/>


            {/* Header giống web */}
            <FeedHeader
                onSearchPress={() => setSearchModalVisible(true)}
                onMessagesPress={() => router.push('/chat')}
                onNotificationsPress={() => {
                    // TODO: Open notifications panel
                }}
                onProfilePress={() => {
                    // TODO: Open profile/sidebar
                }}
                unreadMessageCount={unreadCount}
                unreadNotificationCount={0}
            />
            
            {/* Plus button để tạo nội dung - giống web */}
            <View style={styles.createButtonContainer}>
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => setCreateMenuVisible(true)}
                >
                    <Ionicons name="add" size={24} color={Colors.primaryForeground} />
                </TouchableOpacity>
            </View>

            <Animated.FlatList
                data={posts}
                renderItem={renderItem}
                    keyExtractor={(item) => item.id ?? item._id ?? ''}
                style={styles.container}
                contentContainerStyle={{paddingBottom: 40, paddingTop: 8}}
                ItemSeparatorComponent={() => (
                    <View style={{height: 8, backgroundColor: Colors.background}}/>
                )}
                ListHeaderComponent={
                    <>
                        <PostInputBox openModal={openModal} pickMedia={pickMedia} avatar={avartarAuthor}/>

                        <StoryList
                            stories={validStories}
                            currentUserAvatar={avartarAuthor}
                            currentUserName={'Bạn'}
                            onStoryPress={handleStoryPress}
                            onCreateStory={handleCreateStory}
                            loading={storyUploading}
                        />

                        {uploading && (
                            <UploadingProgressBar progress={uploadProgress}/>
                        )}
                    </>
                }
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[Colors.primary]}
                        tintColor={Colors.primary}
                    />
                }
                onEndReached={() => {
                    if (!loading && hasMore) loadMore();
                }}
                onEndReachedThreshold={0.5}
                ListFooterComponent={() => {
                    if (!loading) return null;
                    return (
                        <View style={{padding: 12}}>
                            <ActivityIndicator size="small" color={Colors.primary}/>
                        </View>
                    );
                }}
                onScroll={Animated.event(
                    [{nativeEvent: {contentOffset: {y: scrollY}}}],
                    {useNativeDriver: true}
                )}
                scrollEventThrottle={16}
            />

            {/* Post Modal */}
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
                                <Ionicons name="close" size={24} color="#6b7280"/>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.modalBody}
                            showsVerticalScrollIndicator={false}
                        >
                            <TextInput
                                placeholder="Bạn đang nghĩ gì?"
                                placeholderTextColor="#9ca3af"
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
                                                        source={{uri: media.uri}}
                                                        style={styles.selectedImage}
                                                        resizeMode={ResizeMode.COVER}
                                                        useNativeControls
                                                        shouldPlay={false}
                                                    />
                                                    <View style={styles.videoLabel}>
                                                        <Ionicons name="videocam" size={16} color="#fff"/>
                                                    </View>
                                                </>
                                            ) : (
                                                <Image source={{uri: media.uri}} style={styles.selectedImage}/>
                                            )}
                                            <TouchableOpacity
                                                style={styles.removeImageBtn}
                                                onPress={() => removeMedia(index)}
                                            >
                                                <Ionicons name="close-circle" size={24} color="#ef4444"/>
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
                                <Ionicons name="image-outline" size={24}
                                          color={selectedMedia.length >= 5 ? "#9ca3af" : "#1877f2"}/>
                                <Text style={[styles.addImageText, selectedMedia.length >= 5 && {color: '#9ca3af'}]}>
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

            {/* Story Viewer */}
            <StoryViewer
                visible={storyViewerVisible}
                stories={validStories}
                initialIndex={currentStoryIndex}
                initialStoryId={selectedStoryId} 
                currentUserEntityAccountId={entityAccountId}
                onClose={handleCloseStoryViewer}
                onLike={likeStory}
                onMarkAsViewed={markAsViewed}
                onDelete={deleteStory}
            />

            {/* Create Story Modal */}
            <CreateStoryModal
                visible={createStoryModalVisible}
                uploading={storyUploading}
                uploadProgress={storyUploadProgress}
                currentUserAvatar={avartarAuthor}
                onClose={() => setCreateStoryModalVisible(false)}
                onSubmit={handleSubmitStory}
            />

            {/* Global Search Modal */}
            <GlobalSearch
                visible={searchModalVisible}
                onClose={() => setSearchModalVisible(false)}
            />

            {/* Create Menu Modal */}
            <CreateMenuModal
                visible={createMenuVisible}
                onClose={() => setCreateMenuVisible(false)}
                onPostPress={openModal}
                onStoryPress={handleCreateStory}
            />

            {/* Repost Modal */}
            <Modal
                visible={repostModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setRepostModalVisible(false);
                    setRepostContent('');
                    setRepostingItem(null);
                }}
            >
                <KeyboardAvoidingView
                    style={styles.repostModalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <View style={styles.repostModalContent}>
                        <View style={styles.repostModalHeader}>
                            <TouchableOpacity
                                onPress={() => {
                                    setRepostModalVisible(false);
                                    setRepostContent('');
                                    setRepostingItem(null);
                                }}
                            >
                                <Text style={styles.repostModalCancel}>Hủy</Text>
                            </TouchableOpacity>
                            <Text style={styles.repostModalTitle}>Đăng lại</Text>
                            <TouchableOpacity
                                onPress={submitRepost}
                                disabled={!repostingItem}
                            >
                                <Text style={[
                                    styles.repostModalSubmit,
                                    !repostingItem && styles.repostModalSubmitDisabled
                                ]}>
                                    Đăng
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.repostModalBody}>
                            <TextInput
                                style={styles.repostModalInput}
                                placeholder="Thêm suy nghĩ của bạn..."
                                placeholderTextColor="#9ca3af"
                                value={repostContent}
                                onChangeText={setRepostContent}
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                                autoFocus
                            />
                            
                            {/* Preview original post */}
                            {repostingItem && (
                                <View style={styles.repostOriginalPreview}>
                                    <View style={styles.repostOriginalHeader}>
                                        <Image 
                                            source={{uri: repostingItem.author?.avatar ?? repostingItem.authorAvatar ?? ''}} 
                                            style={styles.repostOriginalAvatar}
                                        />
                                        <View style={styles.repostOriginalInfo}>
                                            <Text style={styles.repostOriginalName}>
                                                {repostingItem.author?.name ?? repostingItem.authorName}
                                            </Text>
                                            <Text style={styles.repostOriginalTime}>
                                                {formatTime(repostingItem.createdAt)}
                                            </Text>
                                        </View>
                                    </View>
                                    {repostingItem.content && (
                                        <Text style={styles.repostOriginalContent} numberOfLines={3}>
                                            {repostingItem.content}
                                        </Text>
                                    )}
                                </View>
                            )}
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background, // Giống web: #F0F2F5
    },
    createButtonContainer: {
        position: 'absolute',
        top: 80,
        right: 16,
        zIndex: 100,
    },
    createButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    postBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        padding: 12,
        borderBottomWidth: 1,
        borderColor: Colors.border,
        marginBottom: 8,
        marginTop: 8,
    },
    postInput: {
        flex: 1,
        marginHorizontal: 10,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: Colors.input,
    },
    iconButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: Colors.muted,
    },
    card: {
        backgroundColor: Colors.card,
        marginHorizontal: 8,
        marginBottom: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: Colors.black,
        shadowOpacity: 0.05,
        shadowOffset: {width: 0, height: 2},
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
    videoContainer: {
        width: screenWidth - 16,
        height: 250,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    videoPlayButton: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
    uploadingContainer: {
        backgroundColor: '#fff',
        marginHorizontal: 8,
        marginBottom: 12,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: {width: 0, height: 2},
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
        shadowOffset: {width: 0, height: -2},
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
    // Repost styles
    repostContainer: {
        marginHorizontal: 12,
        marginBottom: 12,
        padding: 12,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#2563eb',
    },
    repostHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    repostText: {
        fontSize: 13,
        color: '#6b7280',
        marginLeft: 6,
        fontWeight: '500',
    },
    originalPostContainer: {
        marginTop: 8,
    },
    originalPostHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    originalPostAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
    },
    originalPostInfo: {
        flex: 1,
    },
    originalPostName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    originalPostTime: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    originalPostContent: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
    },
    // YouTube styles
    youtubeContainer: {
        marginHorizontal: 12,
        marginBottom: 12,
    },
    youtubeThumbnail: {
        position: 'relative',
        width: '100%',
        height: 200,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    youtubeImage: {
        width: '100%',
        height: '100%',
    },
    youtubePlayButton: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    youtubeLink: {
        marginTop: 8,
        fontSize: 14,
        color: '#2563eb',
        textDecorationLine: 'underline',
    },
    // Music styles
    musicContainer: {
        marginHorizontal: 12,
        marginBottom: 12,
        padding: 12,
        backgroundColor: '#eff6ff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#dbeafe',
    },
    musicInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    musicDetails: {
        marginLeft: 12,
        flex: 1,
    },
    musicTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    musicArtist: {
        fontSize: 13,
        color: '#6b7280',
    },
    // Repost Modal styles
    repostModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    repostModalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: -2},
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    repostModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    repostModalCancel: {
        fontSize: 16,
        color: '#6b7280',
    },
    repostModalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    repostModalSubmit: {
        fontSize: 16,
        color: '#2563eb',
        fontWeight: '600',
    },
    repostModalSubmitDisabled: {
        color: '#9ca3af',
    },
    repostModalBody: {
        padding: 16,
    },
    repostModalInput: {
        minHeight: 120,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: '#f9fafb',
        color: '#111827',
    },
    repostOriginalPreview: {
        padding: 12,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#2563eb',
    },
    repostOriginalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    repostOriginalAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
    },
    repostOriginalInfo: {
        flex: 1,
    },
    repostOriginalName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    repostOriginalTime: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    repostOriginalContent: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
    },
});