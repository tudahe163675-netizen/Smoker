import { UserEntity } from '@/constants/authData';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useCallback, useEffect } from 'react';
import { formatAddressForSave, validateAddressFields } from '@/utils/addressFormatter';
import Dropdown from './Dropdown';
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
  View,
} from 'react-native';

type BusinessType = 'dj' | 'dancer';

interface BusinessRegistrationData {
  name: string;
  phone: string;
  email: string;
  address: string;
  bio: string;
  gender?: string;
  pricePerHours?: string;
  pricePerSession?: string;
  genre?: string; // For DJ
  avatar?: {
    uri: string;
    name: string;
    type: string;
  };
  background?: {
    uri: string;
    name: string;
    type: string;
  };
}

interface BusinessRegistrationModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (type: BusinessType, data: BusinessRegistrationData) => Promise<void>;
  entities: UserEntity[];
}

export const BusinessRegistrationModal: React.FC<BusinessRegistrationModalProps> = ({
  visible,
  onClose,
  onSubmit,
  entities
}) => {
  const [step, setStep] = useState<'select' | 'form'>('select');
  const [businessType, setBusinessType] = useState<BusinessType>('dj');
  const [loading, setLoading] = useState(false);

  const hasDJ = entities.some(entity => entity.type === 'BusinessAccount' && entity.role === 'DJ');
  const hasDancer = entities.some(entity => entity.type === 'BusinessAccount' && entity.role === 'Dancer');
  const hasBothAccounts = hasDJ && hasDancer;

  // Form data
  const [formData, setFormData] = useState<BusinessRegistrationData>({
    name: '',
    phone: '',
    email: '',
    address: '', // Will store JSON string: {"detail":"13","provinceId":"1","districtId":"21","wardId":"617"}
    bio: '',
    gender: 'male',
    pricePerHours: '',
    pricePerSession: '',
    genre: '',
  });

  // Location states for AddressSelector
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedWardId, setSelectedWardId] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [provinces, setProvinces] = useState<Array<{ value: string; label: string }>>([]);
  const [districts, setDistricts] = useState<Array<{ value: string; label: string }>>([]);
  const [wards, setWards] = useState<Array<{ value: string; label: string }>>([]);

  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const res = await fetch('https://open.oapi.vn/location/provinces?page=0&size=100');
        const data = await res.json();
        setProvinces(
          data.data.map((x: any) => ({
            value: x.id,
            label: `${x.name} (${x.typeText})`,
          }))
        );
      } catch (e) {
        console.error('Failed to load provinces:', e);
      }
    };
    loadProvinces();
  }, []);

  // Load districts when province is selected
  useEffect(() => {
    if (!selectedProvinceId) {
      setDistricts([]);
      setWards([]);
      return;
    }
    const loadDistricts = async () => {
      try {
        const res = await fetch(`https://open.oapi.vn/location/districts/${selectedProvinceId}?page=0&size=100`);
        const data = await res.json();
        setDistricts(
          data.data.map((x: any) => ({
            value: x.id,
            label: `${x.name} (${x.typeText})`,
          }))
        );
        setWards([]);
      } catch (e) {
        console.error('Failed to load districts:', e);
      }
    };
    loadDistricts();
  }, [selectedProvinceId]);

  // Load wards when district is selected
  useEffect(() => {
    if (!selectedDistrictId) {
      setWards([]);
      return;
    }
    const loadWards = async () => {
      try {
        const res = await fetch(`https://open.oapi.vn/location/wards/${selectedDistrictId}?page=0&size=100`);
        const data = await res.json();
        setWards(
          data.data.map((x: any) => ({
            value: x.id,
            label: `${x.name} (${x.typeText})`,
          }))
        );
      } catch (e) {
        console.error('Failed to load wards:', e);
      }
    };
    loadWards();
  }, [selectedDistrictId]);

  // Update address JSON when location fields change
  useEffect(() => {
    if (validateAddressFields(addressDetail, selectedProvinceId, selectedDistrictId, selectedWardId)) {
      const addressJson = formatAddressForSave(addressDetail, selectedProvinceId, selectedDistrictId, selectedWardId);
      if (addressJson) {
        setFormData(prev => ({ ...prev, address: addressJson }));
      }
    }
  }, [addressDetail, selectedProvinceId, selectedDistrictId, selectedWardId]);

  const handleSelectType = (type: BusinessType) => {
    setBusinessType(type);
    setStep('form');
  };

  const handleBack = () => {
    if (step === 'form') {
      setStep('select');
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setStep('select');
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      bio: '',
      gender: 'male',
      pricePerHours: '',
      pricePerSession: '',
      genre: '',
    });
    onClose();
  };

  const handlePickImage = async (type: 'avatar' | 'background') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: type === 'avatar' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const imageData = {
          uri: asset.uri,
          name: `${type}_${Date.now()}.jpg`,
          type: 'image/jpeg',
        };

        setFormData(prev => ({
          ...prev,
          [type]: imageData,
        }));
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập tên');
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập số điện thoại');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập email');
      return false;
    }
    if (!formData.address.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập địa chỉ');
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Thông báo', 'Email không hợp lệ');
      return false;
    }

    // Validate phone format
    const phoneRegex = /^[0-9+\-\s()]{10,}$/;
    if (!phoneRegex.test(formData.phone)) {
      Alert.alert('Thông báo', 'Số điện thoại không hợp lệ');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSubmit(businessType, formData);
      handleClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSelectType = () => {
    // If user already has both account types
    if (hasBothAccounts) {
      return (
        <View style={styles.selectContainer}>
          <View style={styles.maxAccountsContainer}>
            <View style={styles.maxAccountsIcon}>
              <Ionicons name="checkmark-circle" size={64} color="#10b981" />
            </View>
            <Text style={styles.maxAccountsTitle}>
              Đã đăng ký đầy đủ
            </Text>
            <Text style={styles.maxAccountsDescription}>
              Bạn đã có tài khoản DJ và Dancer. Mỗi người dùng chỉ được tạo tối đa 1 tài khoản mỗi loại.
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.selectContainer}>
        <Text style={styles.selectTitle}>Chọn loại tài khoản</Text>
        <Text style={styles.selectSubtitle}>
          Bạn muốn đăng ký tài khoản kinh doanh nào?
        </Text>

        {!hasDJ && (
          <TouchableOpacity
            style={styles.typeCard}
            onPress={() => handleSelectType('dj')}
          >
            <View style={styles.typeIcon}>
              <Ionicons name="musical-notes" size={32} color="#2563eb" />
            </View>
            <View style={styles.typeContent}>
              <Text style={styles.typeTitle}>DJ</Text>
              <Text style={styles.typeDescription}>
                Đăng ký làm DJ chuyên nghiệp, nhận booking từ các quán bar
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </TouchableOpacity>
        )}

        {hasDJ && (
          <View style={[styles.typeCard, styles.typeCardDisabled]}>
            <View style={[styles.typeIcon, styles.typeIconDisabled]}>
              <Ionicons name="musical-notes" size={32} color="#9ca3af" />
            </View>
            <View style={styles.typeContent}>
              <Text style={[styles.typeTitle, styles.typeTextDisabled]}>DJ</Text>
              <Text style={styles.typeDescription}>
                Bạn đã có tài khoản DJ
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
          </View>
        )}

        {!hasDancer && (
          <TouchableOpacity
            style={styles.typeCard}
            onPress={() => handleSelectType('dancer')}
          >
            <View style={styles.typeIcon}>
              <Ionicons name="fitness" size={32} color="#8b5cf6" />
            </View>
            <View style={styles.typeContent}>
              <Text style={styles.typeTitle}>Dancer</Text>
              <Text style={styles.typeDescription}>
                Đăng ký làm vũ công chuyên nghiệp, biểu diễn tại các sự kiện
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </TouchableOpacity>
        )}

        {hasDancer && (
          <View style={[styles.typeCard, styles.typeCardDisabled]}>
            <View style={[styles.typeIcon, styles.typeIconDisabled]}>
              <Ionicons name="fitness" size={32} color="#9ca3af" />
            </View>
            <View style={styles.typeContent}>
              <Text style={[styles.typeTitle, styles.typeTextDisabled]}>Dancer</Text>
              <Text style={styles.typeDescription}>
                Bạn đã có tài khoản Dancer
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
          </View>
        )}
      </View>
    );
  };

  const renderForm = () => (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>
            Đăng ký tài khoản {businessType === 'dj' ? 'DJ' : 'Dancer'}
          </Text>
          <Text style={styles.formSubtitle}>
            Điền thông tin để hoàn tất đăng ký
          </Text>
        </View>

        {/* Avatar Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ảnh đại diện *</Text>
          <TouchableOpacity
            style={styles.imageUpload}
            onPress={() => handlePickImage('avatar')}
          >
            {formData.avatar ? (
              <Image source={{ uri: formData.avatar.uri }} style={styles.uploadedImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={32} color="#9ca3af" />
                <Text style={styles.imagePlaceholderText}>Chọn ảnh đại diện</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Background Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ảnh bìa</Text>
          <TouchableOpacity
            style={styles.imageUploadWide}
            onPress={() => handlePickImage('background')}
          >
            {formData.background ? (
              <Image source={{ uri: formData.background.uri }} style={styles.uploadedImageWide} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="images" size={32} color="#9ca3af" />
                <Text style={styles.imagePlaceholderText}>Chọn ảnh bìa</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên hiển thị *</Text>
            <TextInput
              style={styles.input}
              placeholder={businessType === 'dj' ? 'VD: DJ Khoa' : 'VD: Dancer Linh'}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số điện thoại *</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: +84901234567"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: contact@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
            />
          </View>

          {/* Address Section */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Địa chỉ *</Text>
            
            {/* Province */}
            <View style={[styles.input, { marginBottom: 12 }]}>
              <Dropdown
                data={provinces}
                placeholder="Chọn Tỉnh/Thành phố"
                onChange={(item) => {
                  setSelectedProvinceId(item.value);
                  setSelectedDistrictId('');
                  setSelectedWardId('');
                }}
              />
            </View>

            {/* District */}
            {selectedProvinceId && (
              <View style={[styles.input, { marginBottom: 12 }]}>
                <Dropdown
                  data={districts}
                  placeholder="Chọn Quận/Huyện"
                  onChange={(item) => {
                    setSelectedDistrictId(item.value);
                    setSelectedWardId('');
                  }}
                />
              </View>
            )}

            {/* Ward */}
            {selectedDistrictId && (
              <>
                <View style={[styles.input, { marginBottom: 12 }]}>
                  <Dropdown
                    data={wards}
                    placeholder="Chọn Phường/Xã"
                    onChange={(item) => setSelectedWardId(item.value)}
                  />
                </View>

                {/* Address Detail */}
                <TextInput
                  style={styles.input}
                  placeholder="Số nhà, tên đường..."
                  value={addressDetail}
                  onChangeText={setAddressDetail}
                />
              </>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Giới tính</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  formData.gender === 'male' && styles.genderButtonActive,
                ]}
                onPress={() => setFormData(prev => ({ ...prev, gender: 'male' }))}
              >
                <Ionicons
                  name="male"
                  size={20}
                  color={formData.gender === 'male' ? '#2563eb' : '#6b7280'}
                />
                <Text
                  style={[
                    styles.genderButtonText,
                    formData.gender === 'male' && styles.genderButtonTextActive,
                  ]}
                >
                  Nam
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderButton,
                  formData.gender === 'female' && styles.genderButtonActive,
                ]}
                onPress={() => setFormData(prev => ({ ...prev, gender: 'female' }))}
              >
                <Ionicons
                  name="female"
                  size={20}
                  color={formData.gender === 'female' ? '#2563eb' : '#6b7280'}
                />
                <Text
                  style={[
                    styles.genderButtonText,
                    formData.gender === 'female' && styles.genderButtonTextActive,
                  ]}
                >
                  Nữ
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderButton,
                  formData.gender === 'other' && styles.genderButtonActive,
                ]}
                onPress={() => setFormData(prev => ({ ...prev, gender: 'other' }))}
              >
                <Ionicons
                  name="transgender"
                  size={20}
                  color={formData.gender === 'other' ? '#2563eb' : '#6b7280'}
                />
                <Text
                  style={[
                    styles.genderButtonText,
                    formData.gender === 'other' && styles.genderButtonTextActive,
                  ]}
                >
                  Khác
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Giới thiệu</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Giới thiệu về bản thân..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={formData.bio}
              onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
            />
          </View>
        </View>

        {/* DJ Specific */}
        {businessType === 'dj' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin DJ</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Thể loại nhạc</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: EDM, House, Techno"
                value={formData.genre}
                onChangeText={(text) => setFormData(prev => ({ ...prev, genre: text }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Giá theo giờ (VNĐ)</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: 500000"
                keyboardType="numeric"
                value={formData.pricePerHours}
                onChangeText={(text) => setFormData(prev => ({ ...prev, pricePerHours: text }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Giá theo buổi (VNĐ)</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: 2000000"
                keyboardType="numeric"
                value={formData.pricePerSession}
                onChangeText={(text) => setFormData(prev => ({ ...prev, pricePerSession: text }))}
              />
            </View>
          </View>
        )}

        {/* Dancer Specific */}
        {businessType === 'dancer' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin Dancer</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Giá theo giờ (VNĐ)</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: 400000"
                keyboardType="numeric"
                value={formData.pricePerHours}
                onChangeText={(text) => setFormData(prev => ({ ...prev, pricePerHours: text }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Giá theo buổi (VNĐ)</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: 1500000"
                keyboardType="numeric"
                value={formData.pricePerSession}
                onChangeText={(text) => setFormData(prev => ({ ...prev, pricePerSession: text }))}
              />
            </View>
          </View>
        )}

        <View style={styles.submitSection}>
          <Text style={styles.noteText}>
            * Các trường bắt buộc phải điền
          </Text>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Đăng ký ngay</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đăng ký kinh doanh</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {step === 'select' ? renderSelectType() : renderForm()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },

  // Select Type Screen
  selectContainer: {
    flex: 1,
    padding: 20,
  },
  selectTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  selectSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  typeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  typeContent: {
    flex: 1,
  },
  typeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 14,
    color: '#6b7280',
  },

  // Disabled Type Card
  typeCardDisabled: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    opacity: 0.7,
  },
  typeIconDisabled: {
    backgroundColor: '#f3f4f6',
  },
  typeTextDisabled: {
    color: '#9ca3af',
  },

  // Max Accounts Screen
  maxAccountsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  maxAccountsIcon: {
    marginBottom: 24,
  },
  maxAccountsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  maxAccountsDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  maxAccountsButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  maxAccountsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Form Screen
  formContainer: {
    flex: 1,
  },
  formHeader: {
    padding: 20,
    paddingBottom: 16,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },

  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },

  // Image Upload
  imageUpload: {
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  imageUploadWide: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center'
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  uploadedImageWide: {
    width: '100%',
    height: '100%',
  },

  // Input
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
  textArea: {
    height: 100,
    paddingTop: 10,
  },

  // Gender Selector
  genderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    gap: 6,
  },
  genderButtonActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  genderButtonTextActive: {
    color: '#2563eb',
  },

  // Submit
  submitSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  noteText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});