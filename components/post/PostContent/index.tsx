import {FeedApiService} from "@/services/feedApi";
import {PostData} from "@/types/postType";
import {formatTime} from "@/utils/extension";
import {Ionicons} from "@expo/vector-icons";
import {useRouter} from "expo-router";
import {useEffect, useState} from "react";
import {
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import {styles} from "./style";
import AudioPlayer from "@/components/media/AudioPlayer";
import ImagePlayer from "@/components/media/ImagePlayer";
import VideoPlayer from "@/components/media/VideoPlayer";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface RenderPostProps {
    item: PostData,
    currentId: string,
    currentEntityAccountId?: string,
    feedApiService: FeedApiService,
    customCss?: boolean,
    disableBtn?: boolean
}

export default function Index({item, currentId, currentEntityAccountId, feedApiService, customCss = true, disableBtn = false}: RenderPostProps) {
    const router = useRouter();
    const [data, setData] = useState<PostData>(item);
    const [currentImageIndexes, setCurrentImageIndexes] = useState<{ [key: string]: number }>({});

    const likeCount = data.stats?.likeCount ?? 0;
    const commentCount = data.stats?.commentCount ?? 0;

    const [liked, setLiked] = useState<boolean>(() => {
        return item.stats?.isLikedByMe !== undefined
            ? item.stats.isLikedByMe
            : Boolean((item as any).likedByCurrentUser);
    });
    const isLiked = liked;

    const [repostModalVisible, setRepostModalVisible] = useState(false);
    const [repostContent, setRepostContent] = useState('');

    useEffect(() => {
        const isLikedValue = item.stats?.isLikedByMe !== undefined
            ? item.stats.isLikedByMe
            : Boolean((item as any).likedByCurrentUser);
        setLiked(isLikedValue);
        setData(item);
    }, [item.id, item._id, item.stats?.isLikedByMe, (item as any).likedByCurrentUser]);

    const handlePostPress = (postId: string) => {
        router.push({
            pathname: '/post',
            params: {id: postId}
        });
    };

    const handleAuthorPress = () => {
        const authorId = data.author?.entityAccountId || data.entityAccountId || data.author?.entityId || data.entityId;
        if (!authorId) return;

        // Check if this is current user's own profile - compare with EntityAccountId
        const myEntityAccountId = currentEntityAccountId || currentId;
        if (myEntityAccountId && String(myEntityAccountId).toLowerCase() === String(authorId).toLowerCase()) {
            router.push('/(tabs)/profile');
        } else {
            router.push({
                pathname: '/user',
                params: {id: authorId},
            });
        }
    };

    const music = data.music || null;

    const hasMusic = !!music;

    const audioTitle = music?.title || null;
    const artistName = music?.artistName || music?.artist || null;
    const thumbnail = music?.coverUrl || music?.thumbnailUrl || music?.thumbnail || null;
    const audioUrl = music?.audioUrl || null;
    const purchaseLink = music?.purchaseLink || null;
    const genre = music?.hashTag || music?.genre || null;
    const description = music?.details || null;

    const shouldShowMusic = hasMusic && music && audioUrl;

    const isRepost = !!data.originalPost;
    const originalPost = data.originalPost;

    const medias = (() => {
        const m = data.medias;

        if (Array.isArray(m)) {
            return {
                images: m.filter((x: any) => x && x.type === "image"),
                videos: m.filter((x: any) => x && x.type === "video"),
                audios: m.filter((x: any) => x && x.type === "audio")
            };
        }

        if (m && typeof m === 'object' && !Array.isArray(m)) {
            return {
                images: (m as any).images || [],
                videos: (m as any).videos || [],
                audios: (m as any).audios || []
            };
        }

        const fallbackMediaItems = data.mediaIds ?? [];
        return {
            images: fallbackMediaItems.filter((m: any) => m?.type === 'image'),
            videos: fallbackMediaItems.filter((m: any) => m?.type === 'video'),
            audios: fallbackMediaItems.filter((m: any) => m?.type === 'audio')
        };
    })();

    if (isRepost && medias.images.length === 0 && medias.videos.length === 0 && originalPost) {
        const originalMedias = originalPost.medias ?? originalPost.mediaIds ?? [];
        if (Array.isArray(originalMedias)) {
            medias.images = originalMedias.filter((m: any) => m?.type === 'image');
            medias.videos = originalMedias.filter((m: any) => m?.type === 'video');
        }
    }

    const imageMedias = medias.images;
    const videoMedias = medias.videos;
    const hasMedia = imageMedias.length > 0 || videoMedias.length > 0;

    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const youtubeMatch = data.content?.match(youtubeRegex);
    const youtubeVideoId = youtubeMatch ? youtubeMatch[1] : null;

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
            return <VideoPlayer uri={mediaUrl} />;
        } else {
            return <ImagePlayer uri={mediaUrl} />;
        }
    };

    const handleLike = async (id: string) => {
        try {
            const nextLiked = !liked;
            setLiked(nextLiked);
            setData(prev => ({
                ...prev,
                stats: prev.stats ? {
                    ...prev.stats,
                    likeCount: Math.max(0, (prev.stats.likeCount || 0) + (nextLiked ? 1 : -1)),
                    isLikedByMe: nextLiked
                } : {
                    likeCount: nextLiked ? 1 : 0,
                    commentCount: 0,
                    shareCount: 0,
                    viewCount: 0,
                    isLikedByMe: nextLiked
                }
            }));

            let feedApi = await feedApiService.likePost(id);

            if (!feedApi.success) {
                setLiked(!nextLiked);
                setData(prev => ({
                    ...prev,
                    stats: prev.stats ? {
                        ...prev.stats,
                        likeCount: Math.max(0, (prev.stats.likeCount || 0) + (nextLiked ? -1 : 1)),
                        isLikedByMe: !nextLiked
                    } : {
                        likeCount: nextLiked ? 0 : 1,
                        commentCount: 0,
                        shareCount: 0,
                        viewCount: 0,
                        isLikedByMe: !nextLiked
                    }
                }));
            }
        } catch (error) {
            setLiked(!liked);
            setData(prev => ({
                ...prev,
                stats: prev.stats ? {
                    ...prev.stats,
                    likeCount: Math.max(0, (prev.stats.likeCount || 0) + (liked ? -1 : 1)),
                    isLikedByMe: !liked
                } : {
                    likeCount: liked ? 0 : 1,
                    commentCount: 0,
                    shareCount: 0,
                    viewCount: 0,
                    isLikedByMe: !liked
                }
            }));
            console.error("Failed to toggle like on post", error);
        }
    }

    const handleShare = async (item: any) => {
        if (!item) return;
        try {
            let request = {
                title: item.title,
                content: repostContent.trim(),
                images: item.images,
                videos: item.videos,
                audios: "",
                musicTitle: "",
                artistName: "",
                description: "",
                hashTag: "",
                musicPurchaseLink: "",
                musicBackgroundImage: "",
                type: item.type,
                songId: item.songId,
                musicId: item.musicId,
                entityAccountId: currentEntityAccountId,
                entityId: item.author?.entityId || item.entityId,
                entityType: item.author?.entityType || item.entityType,
                repostedFromId: item.id || item._id,
                repostedFromType: item.type
            }
            const response = await feedApiService.rePost(request);
            if (response.success) {
                Alert.alert('Thành công', 'Đã đăng lại bài viết');
                setRepostModalVisible(false);
            } else {
                Alert.alert('Lỗi', 'Không đăng lại bài viết');
            }
        } catch (error) {
            console.log("error repost: ", error);
            Alert.alert('Lỗi', 'Không đăng lại bài viết');
        }
    };

    return (
        <View style={customCss ? styles.card : styles.cardFull}>
            <TouchableOpacity
                onPress={() => handlePostPress(data.id ?? '')}
                disabled={disableBtn}
            >
                <View style={styles.cardHeader}>
                    <TouchableOpacity onPress={handleAuthorPress} activeOpacity={0.7}>
                        <Image source={{uri: data.author?.avatar ?? data.authorAvatar}} style={styles.avatar}/>
                    </TouchableOpacity>
                    <View>
                        <TouchableOpacity onPress={handleAuthorPress}  activeOpacity={0.7}>
                            <Text style={styles.username}>{data.author?.name ?? data.authorName}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handlePostPress(data.id ?? '')} disabled={disableBtn}>
                            <Text style={styles.subText}>
                                {formatTime(data.createdAt)}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>


                {data.content && (
                    <Text style={styles.content}>{data.content}</Text>
                )}

                {isRepost && originalPost && (
                    <View style={styles.repostContainer}>
                        <View style={styles.repostHeader}>
                            <Ionicons name="repeat-outline" size={16} color="#6b7280"/>
                            <Text style={styles.repostText}>
                                {data.author?.name ?? data.authorName} đã đăng lại
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => {
                                if (originalPost.id) {
                                    handlePostPress(originalPost.id);
                                }
                            }}
                            style={styles.originalPostContainer}
                        >
                            <View style={styles.originalPostHeader}>
                                <TouchableOpacity
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        const originalAuthorId = originalPost.author?.entityAccountId || originalPost.entityAccountId || originalPost.author?.entityId || originalPost.entityId;
                                        if (originalAuthorId) {
                                            const myEntityAccountId = currentEntityAccountId || currentId;
                                            if (myEntityAccountId && String(myEntityAccountId).toLowerCase() === String(originalAuthorId).toLowerCase()) {
                                                router.push('/(tabs)/profile');
                                            } else {
                                                router.push({
                                                    pathname: '/user',
                                                    params: {id: originalAuthorId},
                                                });
                                            }
                                        }
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Image
                                        source={{uri: originalPost.author?.avatar ?? ''}}
                                        style={styles.originalPostAvatar}
                                    />
                                </TouchableOpacity>
                                <View>
                                    <TouchableOpacity
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            const originalAuthorId = originalPost.author?.entityAccountId || originalPost.entityAccountId || originalPost.author?.entityId || originalPost.entityId;
                                            if (originalAuthorId) {
                                                if (currentId && String(currentId).toLowerCase() === String(originalAuthorId).toLowerCase()) {
                                                    router.push('/(tabs)/profile');
                                                } else {
                                                    router.push({
                                                        pathname: '/user',
                                                        params: {id: originalAuthorId},
                                                    });
                                                }
                                            }
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.originalPostName}>
                                            {originalPost.author?.name ?? 'Người dùng'}
                                        </Text>
                                    </TouchableOpacity>
                                    {originalPost.createdAt && (
                                        <Text style={styles.originalPostTime}>
                                            {formatTime(originalPost.createdAt)}
                                        </Text>
                                    )}
                                </View>
                            </View>
                            {originalPost.content && (
                                <Text style={styles.originalPostContent}>{originalPost.content}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {youtubeVideoId && (
                    <View style={styles.youtubeContainer}>
                        <TouchableOpacity
                            style={styles.youtubeThumbnail}
                            onPress={() => {
                                const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeVideoId}`;
                                Linking.openURL(youtubeUrl).catch(err => console.error('Error opening YouTube:', err));
                            }}
                        >
                            <Image
                                source={{uri: `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`}}
                                style={styles.youtubeImage}
                                resizeMode="cover"
                            />
                            <View style={styles.youtubePlayButton}>
                                <Ionicons name="play-circle" size={48} color="#fff"/>
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.youtubeLink} numberOfLines={1}>
                            {data.content}
                        </Text>
                    </View>
                )}

                {shouldShowMusic && (
                    <View style={styles.musicContainer}>
                        <View style={styles.musicHeader}>
                            {thumbnail ? (
                                <Image
                                    source={{uri: thumbnail}}
                                    style={styles.musicThumbnail}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={[styles.musicThumbnail, {backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center'}]}>
                                    <Ionicons name="musical-notes" size={30} color="#2563eb" />
                                </View>
                            )}
                            <View style={styles.musicInfo}>
                                <Ionicons name="musical-notes" size={24} color="#2563eb"/>
                                <View style={styles.musicDetails}>
                                    {audioTitle && <Text style={styles.musicTitle}>{audioTitle}</Text>}
                                    {artistName && <Text style={styles.musicArtist}>{artistName}</Text>}
                                    {genre && <Text style={styles.musicGenre}>{genre}</Text>}
                                </View>
                            </View>
                        </View>
                        {description && (
                            <Text style={styles.musicDescription}>{description}</Text>
                        )}
                        {audioUrl && (
                            <AudioPlayer uri={audioUrl} postId={data.id ?? data._id ?? ''}/>
                        )}
                        {purchaseLink ? (
                            <TouchableOpacity
                                style={styles.purchaseButton}
                                onPress={() => {
                                    console.log('[RenderPost] Opening purchase link:', purchaseLink);
                                    Linking.openURL(purchaseLink).catch(err => console.error('Error opening purchase link:', err));
                                }}
                            >
                                <Ionicons name="cart-outline" size={16} color="#fff"/>
                                <Text style={styles.purchaseButtonText}>Mua nhạc</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                )}

                {!isRepost && !shouldShowMusic && hasMedia && (
                    <View style={styles.imageGalleryContainer}>
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            snapToInterval={screenWidth - 16}
                            decelerationRate="fast"
                            onScroll={(event) => handleImageScroll(event, data.id ?? data._id ?? '')}
                            contentContainerStyle={{
                                alignItems: 'center',
                            }}
                            scrollEventThrottle={16}
                        >
                            {imageMedias.map((media: any, index: number) => (
                                <TouchableOpacity
                                    key={`image-${media.id ?? media._id ?? index}`}
                                    style={styles.imageContainer}
                                >
                                    {renderMediaItem(media.url, false)}
                                </TouchableOpacity>
                            ))}

                            {videoMedias.map((media: any, index: number) => (
                                <TouchableOpacity
                                    key={`video-${media.id ?? media._id ?? index}`}
                                    style={styles.imageContainer}
                                >
                                    {renderMediaItem(media.url, true)}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {(imageMedias.length + videoMedias.length) > 1 && (
                            <View style={styles.imageCounter}>
                                <Text style={styles.imageCounterText}>
                                    {(currentImageIndexes[data.id ?? data._id ?? ''] ?? 0) + 1}/{imageMedias.length + videoMedias.length}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                <View style={styles.statsContainer}>
                    <Text style={styles.statsText}>
                        {likeCount > 0 ? `${likeCount} lượt thích` : ''}
                        {likeCount > 0 && commentCount > 0 ? ' • ' : ''}
                        {commentCount > 0 ? `${commentCount} bình luận` : ''}
                    </Text>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleLike(data.id ?? data._id ?? '')}
                    >
                        <Ionicons
                            name={isLiked ? "heart" : "heart-outline"}
                            size={20}
                            color={isLiked ? "#ef4444" : "#6b7280"}
                        />
                        <Text style={[
                            styles.actionText,
                            isLiked && {color: '#ef4444'}
                        ]}>
                            {isLiked ? 'Đã thích' : 'Thích'}
                        </Text>
                    </TouchableOpacity>

                    <View
                        style={styles.actionBtn}
                    >
                        <Ionicons name="chatbubble-outline" size={18} color="#6b7280"/>
                        <Text style={styles.actionText}>Bình luận</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => {
                            setRepostModalVisible(true);
                        }}
                    >
                        <Ionicons name="repeat-outline" size={18} color="#6b7280"/>
                        <Text style={styles.actionText}>Đăng lại</Text>
                    </TouchableOpacity>
                </View>

                {data.topComments && data.topComments.length > 0 && (
                    <View style={styles.commentsPreview}>
                        {data.topComments.slice(0, 2).map((comment, index) => (
                            <TouchableOpacity
                                key={comment.id ?? `comment-${index}`}
                                style={styles.commentPreviewItem}
                                onPress={() => handlePostPress(data.id ?? data._id ?? '')}
                            >
                                <TouchableOpacity
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        const commentAuthorId = comment.author?.entityAccountId || comment.author?.entityId;
                                        if (commentAuthorId) {
                                            const myEntityAccountId = currentEntityAccountId || currentId;
                                            if (myEntityAccountId && String(myEntityAccountId).toLowerCase() === String(commentAuthorId).toLowerCase()) {
                                                router.push('/(tabs)/profile');
                                            } else {
                                                router.push({
                                                    pathname: '/user',
                                                    params: {id: commentAuthorId},
                                                });
                                            }
                                        }
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Image
                                        source={{uri: comment.author?.avatar ?? comment.authorAvatar ?? ''}}
                                        style={styles.commentPreviewAvatar}
                                    />
                                </TouchableOpacity>
                                <View style={styles.commentPreviewContent}>
                                    <Text style={styles.commentPreviewText} numberOfLines={2}>
                                        <TouchableOpacity
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                const commentAuthorId = comment.author?.entityAccountId || comment.author?.entityId;
                                                if (commentAuthorId) {
                                                    if (currentId && String(currentId).toLowerCase() === String(commentAuthorId).toLowerCase()) {
                                                        router.push('/(tabs)/profile');
                                                    } else {
                                                        router.push({
                                                            pathname: '/user',
                                                            params: {id: commentAuthorId},
                                                        });
                                                    }
                                                }
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.commentPreviewAuthor}>
                                                {comment.author?.name ?? comment.authorName}
                                            </Text>
                                        </TouchableOpacity>
                                        {' '}
                                        <Text style={styles.commentPreviewTextContent}>
                                            {comment.content}
                                        </Text>
                                    </Text>
                                    <Text style={styles.commentPreviewLikesText}>
                                        {comment.stats?.likeCount ?? 0} lượt thích
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                        {commentCount > 2 && (
                            <TouchableOpacity
                                style={styles.viewAllComments}
                                onPress={() => handlePostPress(data.id ?? data._id ?? '')}
                            >
                                <Text style={styles.viewAllCommentsText}>
                                    Xem tất cả {commentCount} bình luận
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </TouchableOpacity>

            <Modal
                visible={repostModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setRepostModalVisible(false);
                    setRepostContent('');
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
                                }}
                            >
                                <Text style={styles.repostModalCancel}>Hủy</Text>
                            </TouchableOpacity>
                            <Text style={styles.repostModalTitle}>Đăng lại</Text>
                            <TouchableOpacity
                                onPress={()=> handleShare(data)}
                                disabled={repostContent.trim() === ''}
                            >
                                <Text style={[
                                    styles.repostModalSubmit,
                                    !repostContent.trim() && styles.repostModalSubmitDisabled
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

                            <View style={styles.repostOriginalPreview}>
                                <View style={styles.repostOriginalHeader}>
                                    <TouchableOpacity
                                        onPress={handleAuthorPress}
                                        activeOpacity={0.7}
                                    >
                                        <Image
                                            source={{uri: data.author?.avatar ?? data.authorAvatar ?? ''}}
                                            style={styles.repostOriginalAvatar}
                                        />
                                    </TouchableOpacity>
                                    <View style={styles.repostOriginalInfo}>
                                        <TouchableOpacity
                                            onPress={handleAuthorPress}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.repostOriginalName}>
                                                {data.author?.name ?? data.authorName}
                                            </Text>
                                        </TouchableOpacity>
                                        <Text style={styles.repostOriginalTime}>
                                            {formatTime(data.createdAt)}
                                        </Text>
                                    </View>
                                </View>
                                {data.content && (
                                    <Text style={styles.repostOriginalContent} numberOfLines={3}>
                                        {data.content}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}