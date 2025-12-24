import { useAuth } from '@/hooks/useAuth';
import { FeedApiService } from "@/services/feedApi";
import { CreateStoryData } from '@/types/storyType';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
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
    View
} from 'react-native';

interface CreateStoryModalProps {
    visible: boolean;
    uploading: boolean;
    uploadProgress: number;
    currentUserAvatar?: string;
    onClose: () => void;
    onSubmit: (storyData: CreateStoryData) => void;
}

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
    visible,
    uploading,
    uploadProgress,
    currentUserAvatar,
    onClose,
    onSubmit,
}) => {
    const [content, setContent] = useState('');
    const [selectedImage, setSelectedImage] = useState<{
        uri: string;
        type: string;
        name: string;
    } | null>(null);
    const { authState } = useAuth();

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [9, 16],
                quality: 0.8,
            });

            if (!result.canceled) {
                const asset = result.assets[0];
                setSelectedImage({
                    uri: asset.uri,
                    type: 'image/jpeg',
                    name: `story_${Date.now()}.jpg`,
                });
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Lỗi', 'Không thể chọn ảnh');
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
    };

    const handleSubmit = async () => {
        if (!content.trim() && !selectedImage) {
            Alert.alert('Thông báo', 'Vui lòng nhập nội dung hoặc chọn ảnh');
            return;
        }

        let imageUrl: string | undefined;
        if (selectedImage) {
            try {
                const files: { uri: string; type: "image" | "video" }[] = [
                    {
                        uri: selectedImage.uri,
                        type: selectedImage.type === "image/jpeg" ? "image" : "video"
                    }
                ];

                const feedApi = new FeedApiService(authState.token!);
                const response = await feedApi.uploadPostMedia(files);
                
                if (response.success && response.data && response.data.length > 0) {
                    imageUrl = response.data[0].url;
                } else {
                    Alert.alert('Lỗi', 'Không thể upload ảnh. Vui lòng thử lại.');
                    return;
                }
            } catch (error) {
                console.error('Error uploading image:', error);
                Alert.alert('Lỗi', 'Không thể upload ảnh. Vui lòng thử lại.');
                return;
            }
        }

        const now = new Date();
        const next24h = (new Date(now.getTime() + 24 * 60 * 60 * 1000)).toISOString().replace("Z", "+00:00");
        const storyData: CreateStoryData = {
            content: content.trim(),
            image: imageUrl,
            entityAccountId: authState.EntityAccountId!,
            status: 'public',
            expiredAt: next24h
        };

        onSubmit(storyData);
        handleClose();
    };

    const handleClose = () => {
        setContent('');
        setSelectedImage(null);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Tạo Story</Text>
                            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.modalBody}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Index Info */}
                            <View style={styles.userInfo}>
                                <Image
                                    source={{ uri: currentUserAvatar || 'https://i.pravatar.cc/100?img=10' }}
                                    style={styles.avatar}
                                />
                                <Text style={styles.username}>Story của bạn</Text>
                            </View>

                            {/* Image Preview hoặc Add Image Button */}
                            {selectedImage ? (
                                <View style={styles.imagePreviewContainer}>
                                    <Image
                                        source={{ uri: selectedImage.uri }}
                                        style={styles.imagePreview}
                                        resizeMode="cover"
                                    />
                                    <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                                        <Ionicons name="close-circle" size={32} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                                    <Ionicons name="image-outline" size={48} color="#2563eb" />
                                    <Text style={styles.addImageText}>Thêm ảnh</Text>
                                </TouchableOpacity>
                            )}

                            {/* Content Input */}
                            <TextInput
                                placeholder="Chia sẻ cảm xúc của bạn..."
                                multiline
                                style={styles.input}
                                value={content}
                                onChangeText={setContent}
                                placeholderTextColor="#9ca3af"
                                textAlignVertical="top"
                            />

                            {/* Tips */}
                            <View style={styles.tipsContainer}>
                                <Ionicons name="information-circle-outline" size={20} color="#6b7280" />
                                <Text style={styles.tipsText}>Story sẽ tự động xóa sau 24 giờ</Text>
                            </View>
                        </ScrollView>

                        {/* Submit Button - Fixed position */}
                        <View style={styles.footer}>
                            {uploading ? (
                                <View style={styles.uploadingContainer}>
                                    <ActivityIndicator size="small" color="#2563eb" />
                                    <Text style={styles.uploadingText}>Đang đăng... {uploadProgress}%</Text>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={[
                                        styles.submitButton,
                                        (!content.trim() && !selectedImage) && styles.submitButtonDisabled,
                                    ]}
                                    onPress={handleSubmit}
                                    disabled={!content.trim() && !selectedImage}
                                >
                                    <Text style={styles.submitButtonText}>Đăng Story</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    keyboardAvoidingView: {
        flex: 1,
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
        maxHeight: '90%',
        flex: 1,
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
        flex: 1,
        padding: 16,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    username: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    imagePreviewContainer: {
        position: 'relative',
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
    },
    imagePreview: {
        width: '100%',
        height: 350, // Giảm chiều cao để có thêm không gian cho nội dung
        backgroundColor: '#f3f4f6',
    },
    removeImageButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#fff',
        borderRadius: 16,
    },
    addImageButton: {
        height: 200,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        backgroundColor: '#f9fafb',
    },
    addImageText: {
        marginTop: 12,
        fontSize: 16,
        color: '#2563eb',
        fontWeight: '600',
    },
    input: {
        minHeight: 100,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#111827',
        textAlignVertical: 'top',
        backgroundColor: '#f9fafb',
        marginBottom: 16,
    },
    tipsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#eff6ff',
        borderRadius: 8,
    },
    tipsText: {
        marginLeft: 8,
        fontSize: 13,
        color: '#6b7280',
    },
    footer: {
        padding: 16,
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        backgroundColor: '#fff',
    },
    uploadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: '#eff6ff',
        borderRadius: 12,
    },
    uploadingText: {
        marginLeft: 12,
        fontSize: 15,
        color: '#2563eb',
        fontWeight: '500',
    },
    submitButton: {
        backgroundColor: '#2563eb',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});