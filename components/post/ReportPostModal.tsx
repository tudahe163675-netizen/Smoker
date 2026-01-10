import { PostData } from '@/types/postType';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
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

interface ReportPostModalProps {
    visible: boolean;
    post: PostData | null;
    onClose: () => void;
    onSubmit: (reason: string, details: string) => Promise<void>;
}

const REPORT_REASONS = [
    { value: 'spam', label: 'Spam' },
    { value: 'violence', label: 'Bạo lực' },
    { value: 'harassment', label: 'Quấy rối' },
    { value: 'adult', label: 'Nội dung người lớn' },
    { value: 'fraud', label: 'Lừa đảo' },
    { value: 'other', label: 'Khác' },
];

export default function ReportPostModal({
    visible,
    post,
    onClose,
    onSubmit,
}: ReportPostModalProps) {
    const [selectedReason, setSelectedReason] = useState('spam');
    const [details, setDetails] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (visible) {
            setSelectedReason('spam');
            setDetails('');
        } else {
            setSubmitting(false);
        }
    }, [visible]);

    const handleSubmit = async () => {
        if (!selectedReason) {
            Alert.alert('Lỗi', 'Vui lòng chọn lý do báo cáo');
            return;
        }

        setSubmitting(true);
        try {
            const reasonLabel = REPORT_REASONS.find(r => r.value === selectedReason)?.label || selectedReason;
            await onSubmit(reasonLabel, details.trim());
            Alert.alert('Thành công', 'Báo cáo đã được gửi. Cảm ơn bạn đã giúp chúng tôi cải thiện cộng đồng!');
            onClose();
        } catch (error) {
            console.error('Error reporting post:', error);
            Alert.alert('Lỗi', error instanceof Error ? error.message : 'Không thể gửi báo cáo');
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
                            <Ionicons name="flag-outline" size={24} color="#ef4444" />
                            <Text style={styles.headerTitle}>Báo cáo bài viết</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                            <Text style={styles.description}>
                                Vui lòng chọn lý do báo cáo bài viết này. Chúng tôi sẽ xem xét và xử lý báo cáo của bạn.
                            </Text>

                            {/* Reason Selection */}
                            <View style={styles.reasonSection}>
                                <Text style={styles.sectionTitle}>Lý do báo cáo</Text>
                                <View style={styles.reasonGrid}>
                                    {REPORT_REASONS.map((reason) => {
                                        const isSelected = selectedReason === reason.value;
                                        return (
                                            <TouchableOpacity
                                                key={reason.value}
                                                style={[
                                                    styles.reasonButton,
                                                    isSelected && styles.reasonButtonSelected,
                                                ]}
                                                onPress={() => setSelectedReason(reason.value)}
                                                activeOpacity={0.7}
                                            >
                                                <Text
                                                    style={[
                                                        styles.reasonButtonText,
                                                        isSelected && styles.reasonButtonTextSelected,
                                                    ]}
                                                >
                                                    {reason.label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Details Input */}
                            <View style={styles.detailsSection}>
                                <Text style={styles.sectionTitle}>Chi tiết (tùy chọn)</Text>
                                <TextInput
                                    placeholder="Mô tả thêm về vấn đề bạn gặp phải..."
                                    placeholderTextColor="#9ca3af"
                                    multiline
                                    numberOfLines={5}
                                    style={styles.detailsInput}
                                    value={details}
                                    onChangeText={setDetails}
                                    textAlignVertical="top"
                                />
                            </View>
                        </ScrollView>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[styles.cancelButton, submitting && styles.buttonDisabled]}
                                onPress={onClose}
                                disabled={submitting}
                            >
                                <Text style={styles.cancelButtonText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.submitButton,
                                    (!selectedReason || submitting) && styles.buttonDisabled,
                                ]}
                                onPress={handleSubmit}
                                disabled={!selectedReason || submitting}
                            >
                                <Text style={styles.submitButtonText}>
                                    {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
                                </Text>
                            </TouchableOpacity>
                        </View>
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
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        gap: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    closeButton: {
        padding: 4,
    },
    body: {
        padding: 16,
        maxHeight: 500,
    },
    description: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
        marginBottom: 20,
    },
    reasonSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
    },
    reasonGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    reasonButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: '#fff',
    },
    reasonButtonSelected: {
        borderColor: Colors.primary,
        backgroundColor: '#eff6ff',
    },
    reasonButtonText: {
        fontSize: 14,
        color: '#374151',
    },
    reasonButtonTextSelected: {
        color: Colors.primary,
        fontWeight: '600',
    },
    detailsSection: {
        marginBottom: 16,
    },
    detailsInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#111827',
        backgroundColor: '#f9fafb',
        minHeight: 100,
    },
    footer: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#374151',
    },
    submitButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: Colors.danger,
        alignItems: 'center',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});

