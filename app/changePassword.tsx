import { useAuth } from '@/hooks/useAuth';
import { changePasswordApi } from '@/services/authApi';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ChangePasswordScreen() {
    const router = useRouter();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { authState } = useAuth();
    const token = authState.token;

    const validateInputs = () => {
        if (!currentPassword.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu hiện tại');
            return false;
        }

        if (newPassword.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
            return false;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
            return false;
        }

        if (currentPassword === newPassword) {
            Alert.alert('Lỗi', 'Mật khẩu mới phải khác mật khẩu hiện tại');
            return false;
        }

        return true;
    };

    const handleChangePassword = async () => {
        if (!validateInputs()) return;

        setIsLoading(true);

        try {
            const response = await changePasswordApi(
                currentPassword,
                newPassword,
                confirmPassword,
                token!
            );

            if (
                response.status === "error" ||
                response.message === "Token không hợp lệ" ||
                response.message === "Mật khẩu hiện tại không đúng"
            ) {
                Alert.alert("Lỗi", response.message || "Đổi mật khẩu thất bại");
                return;
            }

            if (response.message === "Đổi mật khẩu thành công") {
                Alert.alert(
                    "Thành công",
                    "Mật khẩu của bạn đã được thay đổi thành công",
                    [{
                        text: "OK",
                        onPress: () => router.back(),
                    }]
                );
                return;
            }

            Alert.alert("Lỗi", "Đổi mật khẩu thất bại");

        } catch (error) {
            Alert.alert("Lỗi", "Không thể kết nối đến server");
        } finally {
            setIsLoading(false);
        }
    };


    const isFormValid = () => {
        return (
            currentPassword.trim() !== '' &&
            newPassword.length >= 6 &&
            newPassword === confirmPassword &&
            currentPassword !== newPassword
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor="transparent"
                translucent
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    disabled={isLoading}
                >
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
                <View style={styles.headerRight} />
            </View>

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Info Card */}
                    <View style={styles.infoCard}>
                        <Ionicons name="information-circle" size={24} color="#2563eb" />
                        <Text style={styles.infoText}>
                            Để bảo mật tài khoản, vui lòng sử dụng mật khẩu mạnh và không chia sẻ với người khác
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.formContainer}>
                        {/* Current Password */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Mật khẩu hiện tại</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nhập mật khẩu hiện tại"
                                    placeholderTextColor="#9ca3af"
                                    secureTextEntry={!showCurrentPassword}
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    editable={!isLoading}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                    <Ionicons
                                        name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={22}
                                        color="#6b7280"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* New Password */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Mật khẩu mới</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nhập mật khẩu mới"
                                    placeholderTextColor="#9ca3af"
                                    secureTextEntry={!showNewPassword}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    editable={!isLoading}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowNewPassword(!showNewPassword)}
                                >
                                    <Ionicons
                                        name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={22}
                                        color="#6b7280"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Confirm Password */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nhập lại mật khẩu mới"
                                    placeholderTextColor="#9ca3af"
                                    secureTextEntry={!showConfirmPassword}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    editable={!isLoading}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <Ionicons
                                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={22}
                                        color="#6b7280"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Password Requirements */}
                        {newPassword.length > 0 && (
                            <View style={styles.requirementsContainer}>
                                <Text style={styles.requirementsTitle}>Yêu cầu mật khẩu:</Text>

                                <View style={styles.requirementRow}>
                                    <Ionicons
                                        name={
                                            newPassword.length >= 6 ? 'checkmark-circle' : 'close-circle'
                                        }
                                        size={18}
                                        color={newPassword.length >= 6 ? '#10b981' : '#ef4444'}
                                    />
                                    <Text style={styles.requirementText}>Ít nhất 6 ký tự</Text>
                                </View>

                                {confirmPassword.length > 0 && (
                                    <View style={styles.requirementRow}>
                                        <Ionicons
                                            name={
                                                newPassword === confirmPassword
                                                    ? 'checkmark-circle'
                                                    : 'close-circle'
                                            }
                                            size={18}
                                            color={
                                                newPassword === confirmPassword ? '#10b981' : '#ef4444'
                                            }
                                        />
                                        <Text style={styles.requirementText}>Mật khẩu khớp nhau</Text>
                                    </View>
                                )}

                                {newPassword.length > 0 && currentPassword.length > 0 && (
                                    <View style={styles.requirementRow}>
                                        <Ionicons
                                            name={
                                                currentPassword !== newPassword
                                                    ? 'checkmark-circle'
                                                    : 'close-circle'
                                            }
                                            size={18}
                                            color={
                                                currentPassword !== newPassword ? '#10b981' : '#ef4444'
                                            }
                                        />
                                        <Text style={styles.requirementText}>
                                            Khác mật khẩu hiện tại
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* Bottom Button */}
                <View style={styles.bottomContainer}>
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            (!isFormValid() || isLoading) && styles.submitButtonDisabled,
                        ]}
                        onPress={handleChangePassword}
                        disabled={!isFormValid() || isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Đổi mật khẩu</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 56,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    headerRight: {
        width: 40,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#eff6ff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#1e40af',
        lineHeight: 20,
    },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    passwordContainer: {
        position: 'relative',
    },
    input: {
        borderWidth: 1.5,
        borderColor: '#d1d5db',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        paddingRight: 50,
        fontSize: 15,
        color: '#111827',
        backgroundColor: '#f9fafb',
    },
    eyeIcon: {
        position: 'absolute',
        right: 16,
        top: 14,
        padding: 4,
    },
    requirementsContainer: {
        marginTop: 4,
        padding: 16,
        backgroundColor: '#f9fafb',
        borderRadius: 12,
    },
    requirementsTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    requirementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 10,
    },
    requirementText: {
        fontSize: 14,
        color: '#6b7280',
    },
    bottomContainer: {
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 32 : 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    submitButton: {
        backgroundColor: '#2563eb',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        backgroundColor: '#93bbf5',
        shadowOpacity: 0,
        elevation: 0,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});