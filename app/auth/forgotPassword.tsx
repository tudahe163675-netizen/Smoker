import { forgotPasswordApi, resetPasswordApi, verifyOtpApi } from '@/services/authApi';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
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

type Step = 'email' | 'otp' | 'password';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Validate email
  const isEmailValid = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email.trim() !== '' && emailRegex.test(email);
  };

  // Validate OTP
  const isOtpValid = () => {
    return otp.trim().length === 6;
  };

  // Validate password
  const isPasswordValid = () => {
    return newPassword.length >= 6 && newPassword === confirmPassword;
  };

  const animateTransition = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(callback, 150);
  };

  // Step 1: Send email
  const handleSendEmail = async () => {
    if (!isEmailValid()) {
      Alert.alert("Lỗi", "Vui lòng nhập email hợp lệ");
      return;
    }

    setIsLoading(true);

    try {
      const res = await forgotPasswordApi(email);

      if (res.message === 'Đã gửi email khôi phục mật khẩu') {
        Alert.alert(
          "Thành công",
          "Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.",
          [
            {
              text: "OK",
              onPress: () => animateTransition(() => setCurrentStep('otp'))
            }
          ]
        );
        return;
      }

      Alert.alert("Lỗi", res.message ?? "Gửi email thất bại");

    } catch (error) {
      Alert.alert("Lỗi", "Không thể kết nối đến server");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (!isOtpValid()) {
      Alert.alert("Lỗi", "Vui lòng nhập mã OTP 6 chữ số");
      return;
    }

    setIsLoading(true);

    try {
      const res = await verifyOtpApi(email, otp);

      if (res.message === 'Xác thực OTP thành công') {
        Alert.alert(
          "Xác thực thành công",
          "Vui lòng nhập mật khẩu mới của bạn",
          [
            {
              text: "OK",
              onPress: () => animateTransition(() => setCurrentStep('password'))
            }
          ]
        );
        return;
      }

      Alert.alert("Lỗi", res.message ?? "Xác thực thất bại");
    } catch (error) {
      Alert.alert("Lỗi", "Mã OTP không chính xác hoặc đã hết hạn");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async () => {
    if (!isPasswordValid()) {
      if (newPassword.length < 6) {
        Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự");
      } else {
        Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp");
      }
      return;
    }

    setIsLoading(true);

    try {
      const res = await resetPasswordApi(email, newPassword, confirmPassword);
      
      if (res.message === 'Đổi mật khẩu thành công') {
        Alert.alert(
          "Đổi mật khẩu thành công",
          "Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập lại.",
          [
            {
              text: "OK",
              onPress: () => router.back()
            }
          ]
        );
        return
      }

      Alert.alert("Lỗi", res.message ?? "Xác thực thất bại");

    } catch (error) {
      Alert.alert("Lỗi", "Không thể đổi mật khẩu. Vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'email') {
      router.back();
    } else if (currentStep === 'otp') {
      animateTransition(() => setCurrentStep('email'));
    } else {
      animateTransition(() => setCurrentStep('otp'));
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'email':
        return 'Quên mật khẩu?';
      case 'otp':
        return 'Xác thực OTP';
      case 'password':
        return 'Đặt mật khẩu mới';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'email':
        return 'Nhập email của bạn để nhận mã OTP';
      case 'otp':
        return `Nhập mã OTP 6 chữ số đã được gửi đến ${email}`;
      case 'password':
        return 'Nhập mật khẩu mới cho tài khoản của bạn';
    }
  };

  const renderEmailStep = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={{ marginBottom: 20 }}>
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
      </View>

      <TouchableOpacity
        style={[styles.button, (!isEmailValid() || isLoading) && styles.buttonDisabled]}
        onPress={handleSendEmail}
        disabled={!isEmailValid() || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Gửi mã OTP</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()} disabled={isLoading}>
        <Text style={styles.loginText}>
          Quay lại <Text style={styles.loginLink}>Đăng nhập</Text>
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderOtpStep = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={{ marginBottom: 20 }}>
        <TextInput
          placeholder="000000"
          style={[styles.input, styles.otpInput]}
          placeholderTextColor="#d1d5db"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
          editable={!isLoading}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, (!isOtpValid() || isLoading) && styles.buttonDisabled]}
        onPress={handleVerifyOtp}
        disabled={!isOtpValid() || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Xác thực OTP</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleSendEmail}
        disabled={isLoading}
        style={styles.resendContainer}
      >
        <Text style={styles.resendText}>
          Không nhận được mã? <Text style={styles.resendLink}>Gửi lại</Text>
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderPasswordStep = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={[styles.passwordContainer, { marginBottom: 16 }]}>
        <TextInput
          placeholder="Mật khẩu mới"
          style={styles.input}
          placeholderTextColor="#9ca3af"
          secureTextEntry={!showPassword}
          value={newPassword}
          onChangeText={setNewPassword}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={22}
            color="#6b7280"
          />
        </TouchableOpacity>
      </View>

      <View style={[styles.passwordContainer, { marginBottom: 16 }]}>
        <TextInput
          placeholder="Xác nhận mật khẩu"
          style={styles.input}
          placeholderTextColor="#9ca3af"
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          <Ionicons
            name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
            size={22}
            color="#6b7280"
          />
        </TouchableOpacity>
      </View>

      {newPassword.length > 0 && (
        <View style={styles.passwordRequirements}>
          <View style={styles.requirementRow}>
            <Ionicons
              name={newPassword.length >= 6 ? "checkmark-circle" : "close-circle"}
              size={16}
              color={newPassword.length >= 6 ? "#10b981" : "#ef4444"}
            />
            <Text style={styles.requirementText}>Ít nhất 6 ký tự</Text>
          </View>
          {confirmPassword.length > 0 && (
            <View style={styles.requirementRow}>
              <Ionicons
                name={newPassword === confirmPassword ? "checkmark-circle" : "close-circle"}
                size={16}
                color={newPassword === confirmPassword ? "#10b981" : "#ef4444"}
              />
              <Text style={styles.requirementText}>Mật khẩu khớp nhau</Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, (!isPasswordValid() || isLoading) && styles.buttonDisabled]}
        onPress={handleResetPassword}
        disabled={!isPasswordValid() || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Đổi mật khẩu mới</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBack}
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
            <Text style={styles.title}>{getStepTitle()}</Text>
            <Text style={styles.description}>{getStepDescription()}</Text>

            {currentStep === 'email' && renderEmailStep()}
            {currentStep === 'otp' && renderOtpStep()}
            {currentStep === 'password' && renderPasswordStep()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    height: 140,
  },
  brandText: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#111827',
    textTransform: 'uppercase',
    marginTop: 12,
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    marginBottom: 0,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    fontSize: 15,
    color: '#111827',
  },
  otpInput: {
    fontSize: 20,
    letterSpacing: 4,
    textAlign: 'center',
    fontWeight: '600',
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 14,
    padding: 4,
  },
  passwordRequirements: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#93bbf5',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  loginText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
  },
  loginLink: {
    color: '#2563eb',
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
  },
  resendLink: {
    color: '#2563eb',
    fontWeight: '600',
  },
});