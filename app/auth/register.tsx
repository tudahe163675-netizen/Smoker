import { registerApi } from '@/services/authApi';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Validate form
  const isFormValid = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (
      email.trim() !== '' &&
      emailRegex.test(email) &&
      password.trim() !== '' &&
      password.length >= 6 &&
      confirm.trim() !== '' &&
      password === confirm
    );
  };

  const handleRegisterClick = () => {
    if (!isFormValid()) {
      if (email.trim() === '') {
        Alert.alert("Lỗi", "Vui lòng nhập email");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        Alert.alert("Lỗi", "Email không hợp lệ");
        return;
      }
      if (password.trim() === '') {
        Alert.alert("Lỗi", "Vui lòng nhập mật khẩu");
        return;
      }
      if (password.length < 6) {
        Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự");
        return;
      }
      if (confirm.trim() === '') {
        Alert.alert("Lỗi", "Vui lòng xác nhận mật khẩu");
        return;
      }
      if (password !== confirm) {
        Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp");
        return;
      }
      return;
    }
    // Hiển thị modals điều khoản khi form hợp lệ
    setShowTermsModal(true);
  };

  const onAgreeAndRegister = async () => {
    setShowTermsModal(false);
    setIsLoading(true);
    
    try {
      const res = await registerApi(email, password, confirm);

      if (!res.user) {
        Alert.alert("Lỗi", res.message ?? "Đăng ký thất bại");
        return;
      }

      Alert.alert("Thành công", "Đăng ký thành công!", [
        { text: "OK", onPress: () => router.push("/auth/login") },
      ]);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể kết nối đến server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Nút Back */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
        disabled={isLoading}
      >
        <Ionicons name="arrow-back" size={24} color="#111827" />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/logo.jpeg')}
              style={styles.reactLogo}
              contentFit="contain"
            />
            <Text style={styles.brandText}>SMOKER</Text>
          </View>

          <View style={styles.formContainer}>
            <TextInput
              placeholder="Email"
              style={styles.input}
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
            />

            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Mật khẩu"
                style={styles.passwordInput}
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!isLoading}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={22} 
                  color="#6b7280" 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Xác nhận mật khẩu"
                style={styles.passwordInput}
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showConfirm}
                value={confirm}
                onChangeText={setConfirm}
                editable={!isLoading}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowConfirm(!showConfirm)}
                disabled={isLoading}
              >
                <Ionicons 
                  name={showConfirm ? "eye-off-outline" : "eye-outline"} 
                  size={22} 
                  color="#6b7280" 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, (!isFormValid() || isLoading) && styles.buttonDisabled]}
              onPress={handleRegisterClick}
              disabled={!isFormValid() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Đăng ký</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} disabled={isLoading}>
              <Text style={styles.loginText}>
                Bạn đã có tài khoản? <Text style={styles.loginLink}>Đăng nhập</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Terms Modal */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalContainer}>
          <StatusBar
            barStyle="dark-content"
            backgroundColor="#ffffff"
          />
          
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalBackButton}
              onPress={() => setShowTermsModal(false)}
            >
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalScrollContent}
          >
            {/* Illustration */}
            <View style={styles.illustrationContainer}>
              <View style={styles.illustrationBg}>
                <View style={styles.phoneFrame}>
                  <View style={styles.phoneScreen}>
                    <View style={styles.profileCircle} />
                    <View style={styles.profileLine1} />
                    <View style={styles.profileLine2} />
                  </View>
                </View>
                <View style={styles.handLeft} />
                <View style={styles.handRight} />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.modalTitle}>
              Để đăng ký, hãy đọc cũng như đồng ý với các điều khoản và chính sách của chúng tôi
            </Text>

            {/* Key Points */}
            <Text style={styles.sectionTitle}>Các điểm chính bạn nên biết</Text>

            {/* Point 1 */}
            <View style={styles.pointContainer}>
              <View style={styles.iconContainer}>
                <Ionicons name="document-text-outline" size={24} color="#1f2937" />
              </View>
              <View style={styles.pointTextContainer}>
                <Text style={styles.pointText}>
                  Chúng tôi dùng thông tin của bạn để hiển thị cũng như cá nhân hóa quảng cáo và nội dung thương mại mà bạn có thể sẽ thích. Chúng tôi cũng dùng thông tin đó để nghiên cứu và đổi mới, bao gồm cả để phục vụ hoạt động vì công đồng cũng như lợi ích công.{' '}
                  <Text style={styles.learnMore}>Tìm hiểu thêm</Text>
                </Text>
              </View>
            </View>

            {/* Point 2 */}
            <View style={styles.pointContainer}>
              <View style={styles.iconContainer}>
                <Ionicons name="shield-checkmark-outline" size={24} color="#1f2937" />
              </View>
              <View style={styles.pointTextContainer}>
                <Text style={styles.pointText}>
                  Bạn có thể chọn cung cấp thông tin về bản thân mà thông tin này có thể được bảo vệ đặc biệt theo luật quyền riêng tư ở nơi bạn sống.{' '}
                  <Text style={styles.learnMore}>Tìm hiểu thêm</Text>
                </Text>
              </View>
            </View>

            {/* Age Requirement */}
            <View style={styles.ageRequirementContainer}>
              <View style={styles.ageIconContainer}>
                <Ionicons name="alert-circle-outline" size={24} color="#dc2626" />
              </View>
              <View style={styles.ageTextContainer}>
                <Text style={styles.ageText}>
                  Để sử dụng dịch vụ này, bạn phải từ <Text style={styles.ageBold}>18 tuổi trở lên</Text>.
                </Text>
              </View>
            </View>

            {/* Agreement Text */}
            <Text style={styles.agreementText}>
              Bằng việc đăng ký, bạn đồng ý với{' '}
              <Text style={styles.linkTextBlue}>Điều khoản</Text>,{' '}
              <Text style={styles.linkTextBlue}>Chính sách quyền riêng tư</Text> và{' '}
              <Text style={styles.linkTextBlue}>Chính sách cookie</Text> của SMOKER.
            </Text>

            {/* Action Button */}
            <TouchableOpacity
              style={styles.modalButton}
              onPress={onAgreeAndRegister}
            >
              <Text style={styles.modalButtonText}>Tôi đồng ý</Text>
            </TouchableOpacity>

            {/* Already Have Account */}
            <TouchableOpacity
              style={styles.alreadyAccountButton}
              onPress={() => {
                setShowTermsModal(false);
                router.back();
              }}
            >
              <Text style={styles.alreadyAccountText}>Bạn đã có tài khoản ư?</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 44,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 52,
    left: 16,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  reactLogo: {
    width: '100%',
    height: 180,
  },
  brandText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#111827',
    textTransform: 'uppercase',
    marginTop: 20,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    fontSize: 15,
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 12,
    paddingRight: 45,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    fontSize: 15,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 16,
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#93bbf5',
  },
  buttonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  loginText: {
    textAlign: 'center',
    color: '#374151',
    marginBottom: 20,
  },
  loginLink: {
    color: '#2563eb',
    fontWeight: '600',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 44,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  modalBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  illustrationBg: {
    width: '100%',
    height: 220,
    backgroundColor: '#5eead4',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  phoneFrame: {
    width: 120,
    height: 180,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#60a5fa',
    marginBottom: 12,
  },
  profileLine1: {
    width: 80,
    height: 8,
    backgroundColor: '#2563eb',
    borderRadius: 4,
    marginBottom: 6,
  },
  profileLine2: {
    width: 60,
    height: 8,
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  handLeft: {
    position: 'absolute',
    left: 60,
    bottom: 20,
    width: 60,
    height: 80,
    backgroundColor: '#c2793a',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 20,
    transform: [{ rotate: '-15deg' }],
  },
  handRight: {
    position: 'absolute',
    right: 60,
    bottom: 20,
    width: 60,
    height: 80,
    backgroundColor: '#c2793a',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 20,
    transform: [{ rotate: '15deg' }],
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
    lineHeight: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  pointContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pointTextContainer: {
    flex: 1,
  },
  pointText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  learnMore: {
    color: '#2563eb',
    fontWeight: '600',
  },
  ageRequirementContainer: {
    flexDirection: 'row',
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  ageIconContainer: {
    marginRight: 12,
  },
  ageTextContainer: {
    flex: 1,
  },
  ageText: {
    fontSize: 14,
    color: '#991b1b',
    lineHeight: 20,
  },
  ageBold: {
    fontWeight: '700',
  },
  agreementText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  linkTextBlue: {
    color: '#2563eb',
    fontWeight: '600',
  },
  modalButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 50,
    marginBottom: 16,
  },
  modalButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  alreadyAccountButton: {
    paddingVertical: 12,
    marginBottom: 20,
  },
  alreadyAccountText: {
    textAlign: 'center',
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 15,
  },
});