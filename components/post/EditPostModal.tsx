import { FeedApiService } from '@/services/feedApi';
import { PostData } from '@/types/postType';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '@/constants/colors';

interface EditPostModalProps {
    visible: boolean;
    post: PostData | null;
    feedApiService?: FeedApiService;
    onClose: () => void;
    onUpdated?: () => void;
    // For backward compatibility with post.tsx
    initialContent?: string;
    initialImages?: string[];
    onSubmit?: (content: string, images: string[]) => Promise<boolean>;
}

export default function EditPostModal({
    visible,
    post,
    feedApiService,
    onClose,
    onUpdated,
    initialContent,
    initialImages,
    onSubmit,
}: EditPostModalProps) {
    const [content, setContent] = useState('');
    const [status, setStatus] = useState<'public' | 'private'>('public');
    const [showPrivacyDropdown, setShowPrivacyDropdown] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (post && visible) {
            // Use initialContent if provided (from post.tsx), otherwise use post.content
            setContent(initialContent || post.content || '');
            setStatus((post.status as 'public' | 'private') || 'public');
            setShowPrivacyDropdown(false);
        }
    }, [post, visible, initialContent]);

    const handleSubmit = async () => {
        if (!post) return;

        if (!content.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập nội dung');
            return;
        }

        setSubmitting(true);
        try {
            // If onSubmit is provided (from post.tsx), use it
            if (onSubmit) {
                const success = await onSubmit(content.trim(), initialImages || []);
                if (success) {
                    onClose();
                }
            } else if (feedApiService && onUpdated) {
                // Otherwise use feedApiService (from PostContent)
                // Preserve existing media when updating
                const updateData: any = {
                    content: content.trim(),
                    status: status,
                };

                // Preserve existing media if any - format like web version
                if (post.medias && post.medias.length > 0) {
                    const mediaData: any[] = [];
                    
                    post.medias.forEach((media: any) => {
                        const mediaUrl = media.url || media;
                        const mediaId = media.id || media._id || '';
                        const mediaType = media.type || (mediaUrl.includes('video') ? 'video' : 'image');
                        
                        mediaData.push({
                            id: mediaId,
                            url: mediaUrl,
                            caption: media.caption || '',
                            type: mediaType.toLowerCase() || 'image'
                        });
                    });

                    if (mediaData.length > 0) {
                        updateData.medias = mediaData;
                    }
                }

                const response = await feedApiService.updatePost(post.id || post._id || '', updateData);

                if (response.success) {
                    Alert.alert('Thành công', 'Bài viết đã được cập nhật');
                    onUpdated();
                    onClose();
                } else {
                    Alert.alert('Lỗi', response.message || 'Không thể cập nhật bài viết');
                }
            }
        } catch (error) {
            console.error('Error updating post:', error);
            Alert.alert('Lỗi', 'Không thể cập nhật bài viết');
        } finally {
            setSubmitting(false);
        }
    };

    if (!post) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        {/* Header */}
                        <View style={styles.header}>
                            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                                <Text style={styles.cancelText}>Hủy</Text>
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>Chỉnh sửa bài viết</Text>
                            <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={submitting || !content.trim()}
                                style={[styles.submitButton, (!content.trim() || submitting) && styles.submitButtonDisabled]}
                            >
                                <Text style={[styles.submitText, (!content.trim() || submitting) && styles.submitTextDisabled]}>
                                    {submitting ? 'Đang lưu...' : 'Lưu'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                            {/* User Info & Privacy */}
                            <View style={styles.userInfo}>
                                <Image
                                    source={{ uri: post.author?.avatar || post.authorAvatar || 'https://i.pravatar.cc/100?img=10' }}
                                    style={styles.avatar}
                                />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.userName}>{post.author?.name || post.authorName || 'Bạn'}</Text>
                                    {/* Privacy Dropdown */}
                                    <TouchableOpacity
                                        style={styles.privacySelector}
                                        onPress={() => setShowPrivacyDropdown(!showPrivacyDropdown)}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons
                                            name={status === "public" ? "globe-outline" : "lock-closed-outline"}
                                            size={16}
                                            color="#6b7280"
                                        />
                                        <Text style={styles.privacyText}>
                                            {status === "public" ? "Công khai" : "Chỉ mình tôi"}
                                        </Text>
                                        <Ionicons name="chevron-down" size={16} color="#6b7280" />
                                    </TouchableOpacity>
                                    {showPrivacyDropdown && (
                                        <View style={styles.privacyDropdown}>
                                            <TouchableOpacity
                                                style={[styles.privacyOption, status === "public" && styles.privacyOptionActive]}
                                                onPress={() => {
                                                    setStatus("public");
                                                    setShowPrivacyDropdown(false);
                                                }}
                                            >
                                                <Ionicons name="globe-outline" size={18} color={status === "public" ? "#2563eb" : "#6b7280"} />
                                                <View style={{ flex: 1, marginLeft: 8 }}>
                                                    <Text style={[styles.privacyOptionText, status === "public" && styles.privacyOptionTextActive]}>
                                                        Công khai
                                                    </Text>
                                                    <Text style={styles.privacyOptionDesc}>Mọi người có thể xem</Text>
                                                </View>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.privacyOption, status === "private" && styles.privacyOptionActive]}
                                                onPress={() => {
                                                    setStatus("private");
                                                    setShowPrivacyDropdown(false);
                                                }}
                                            >
                                                <Ionicons name="lock-closed-outline" size={18} color={status === "private" ? "#2563eb" : "#6b7280"} />
                                                <View style={{ flex: 1, marginLeft: 8 }}>
                                                    <Text style={[styles.privacyOptionText, status === "private" && styles.privacyOptionTextActive]}>
                                                        Chỉ mình tôi
                                                    </Text>
                                                    <Text style={styles.privacyOptionDesc}>Chỉ bạn có thể xem</Text>
                                                </View>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Content Input */}
                            <TextInput
                                placeholder="Bạn đang nghĩ gì?"
                                placeholderTextColor="#9ca3af"
                                multiline
                                style={styles.input}
                                value={content}
                                onChangeText={setContent}
                                autoFocus
                                maxLength={5000}
                            />

                            {/* Media Preview (if any) */}
                            {post.medias && post.medias.length > 0 && (
                                <View style={styles.mediaPreview}>
                                    <Text style={styles.mediaPreviewTitle}>
                                        {post.medias.length} {post.medias.length === 1 ? 'ảnh/video' : 'ảnh/video'} (không thể chỉnh sửa)
                                    </Text>
                                    <View style={styles.mediaGrid}>
                                        {post.medias.slice(0, 4).map((media, index) => (
                                            <View key={index} style={styles.mediaItem}>
                                                <Image
                                                    source={{ uri: media.url || media }}
                                                    style={styles.mediaThumbnail}
                                                    resizeMode="cover"
                                                />
                                                {media.type === 'video' && (
                                                    <View style={styles.videoBadge}>
                                                        <Ionicons name="play-circle" size={20} color="#fff" />
                                                    </View>
                                                )}
                                            </View>
                                        ))}
                                        {post.medias.length > 4 && (
                                            <View style={styles.mediaMore}>
                                                <Text style={styles.mediaMoreText}>+{post.medias.length - 4}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    cancelButton: {
        padding: 4,
    },
    cancelText: {
        fontSize: 16,
        color: '#6b7280',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    submitButton: {
        padding: 4,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitText: {
        fontSize: 16,
        color: '#2563eb',
        fontWeight: '600',
    },
    submitTextDisabled: {
        color: '#9ca3af',
    },
    body: {
        padding: 16,
        maxHeight: 500,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    userName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    privacySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
        alignSelf: 'flex-start',
    },
    privacyText: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '500',
    },
    privacyDropdown: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 1000,
        marginTop: 4,
    },
    privacyOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    privacyOptionActive: {
        backgroundColor: '#eff6ff',
    },
    privacyOptionText: {
        fontSize: 15,
        color: '#111827',
        fontWeight: '500',
    },
    privacyOptionTextActive: {
        color: '#2563eb',
    },
    privacyOptionDesc: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
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
        color: '#111827',
    },
    mediaPreview: {
        padding: 12,
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        marginTop: 8,
    },
    mediaPreviewTitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 8,
        fontWeight: '500',
    },
    mediaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    mediaItem: {
        width: 80,
        height: 80,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    mediaThumbnail: {
        width: '100%',
        height: '100%',
    },
    videoBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 12,
        padding: 2,
    },
    mediaMore: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mediaMoreText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
