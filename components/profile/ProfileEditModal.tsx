import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AddressSelector from '@/components/common/AddressSelector';
import { ProfileApiService } from '@/services/profileApi';
import { BarApiService } from '@/services/barApi';
import { BusinessApiService } from '@/services/businessApi';
import { parseAddressFromString, extractAddressFields, validateAddressFields, formatAddressForSave } from '@/utils/addressFormatter';

type ProfileType = 'Account' | 'BarPage' | 'BusinessAccount';

interface ProfileEditModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  profile: any;
  profileType: ProfileType;
  token: string;
}

export default function ProfileEditModal({
  visible,
  onClose,
  onSuccess,
  profile,
  profileType,
  token,
}: ProfileEditModalProps) {
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState({
    userName: '',
    bio: '',
    phone: '',
    gender: '',
    pricePerHours: '',
    pricePerSession: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Address selector states
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedWardId, setSelectedWardId] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [addressJson, setAddressJson] = useState<string | null>(null);

  // Initialize form data from profile
  useEffect(() => {
    if (profile && visible) {
      // For BarPage, use BarName; for others, use userName
      const nameField =
        profileType === 'BarPage'
          ? profile.BarName || profile.barName || profile.userName || profile.name || ''
          : profile.userName || profile.name || '';

      setFormData({
        userName: nameField,
        bio: profile.bio || profile.Bio || '',
        phone: profile.phone || profile.Phone || profile.phoneNumber || '',
        gender: profile.gender || profile.Gender || '',
        pricePerHours: profile.pricePerHours || profile.PricePerHours || '',
        pricePerSession: profile.pricePerSession || profile.PricePerSession || '',
      });

      // Parse address data to populate AddressSelector
      // Priority 1: Parse from address field (JSON string)
      if (profile.address && typeof profile.address === 'string') {
        const parsedAddress = parseAddressFromString(profile.address);
        if (parsedAddress) {
          const fields = extractAddressFields(parsedAddress);
          setSelectedProvinceId(fields.provinceId);
          setSelectedDistrictId(fields.districtId);
          setSelectedWardId(fields.wardId);
          setAddressDetail(fields.detail);
        }
      }
      // Priority 2: Backend returns: provinceId, districtId, wardId, addressDetail
      else if (profile.provinceId || profile.districtId || profile.wardId || profile.addressDetail) {
        setSelectedProvinceId(profile.provinceId || '');
        setSelectedDistrictId(profile.districtId || '');
        setSelectedWardId(profile.wardId || '');
        setAddressDetail(profile.addressDetail || '');
      }
      // Priority 3: Parse from addressObject
      else if (profile.addressObject && typeof profile.addressObject === 'object') {
        const addrObj = profile.addressObject;
        setSelectedProvinceId(addrObj.provinceId || '');
        setSelectedDistrictId(addrObj.districtId || '');
        setSelectedWardId(addrObj.wardId || '');
        setAddressDetail(addrObj.detail || addrObj.addressDetail || '');
      }
    }
  }, [profile, profileType, visible]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.userName?.trim()) {
      newErrors.userName = 'Tên là bắt buộc';
    }
    
    // Validate address if any field is selected
    if (selectedProvinceId || selectedDistrictId || selectedWardId || addressDetail) {
      if (!validateAddressFields(addressDetail, selectedProvinceId, selectedDistrictId, selectedWardId)) {
        newErrors.address = 'Vui lòng điền đầy đủ thông tin địa chỉ (Tỉnh/Thành phố, Quận/Huyện, Phường/Xã, và Địa chỉ chi tiết)';
      }
    }

    return newErrors;
  };

  const handleSave = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      const data: any = { ...formData };

      // Build address JSON string if any address component is selected
      if (selectedProvinceId || selectedDistrictId || selectedWardId || addressDetail) {
        if (!validateAddressFields(addressDetail, selectedProvinceId, selectedDistrictId, selectedWardId)) {
          setErrors({ address: 'Vui lòng điền đầy đủ thông tin địa chỉ' });
          setSaving(false);
          return;
        }

        const addressJsonString = formatAddressForSave(addressDetail, selectedProvinceId, selectedDistrictId, selectedWardId);
        if (!addressJsonString) {
          setErrors({ address: 'Lỗi khi format địa chỉ. Vui lòng thử lại.' });
          setSaving(false);
          return;
        }

        data.address = addressJsonString;
      }

      // Remove empty fields
      Object.keys(data).forEach((key) => {
        if (data[key] === '' || data[key] === null || data[key] === undefined) {
          delete data[key];
        }
      });

      // Remove bio for BarPage since table doesn't have Bio column
      if (profileType === 'BarPage' && data.bio !== undefined) {
        delete data.bio;
      }

      let res;
      switch (profileType) {
        case 'Account': {
          const profileApi = new ProfileApiService(token);
          res = await profileApi.updateProfile(data);
          break;
        }
        case 'BarPage': {
          const barEntityAccountId = profile.EntityAccountId || profile.entityAccountId;
          if (!barEntityAccountId) {
            console.error('[ProfileEditModal] EntityAccountId is missing from profile', profile);
            setErrors({ submit: 'Lỗi: Không tìm thấy EntityAccountId. Không thể lưu.' });
            setSaving(false);
            return;
          }
          const barApi = new BarApiService(token);
          const barData = { ...data };
          // Map userName to BarName for BarPage API
          if (barData.userName && !barData.BarName) {
            barData.BarName = barData.userName;
          }
          // Map phone to phoneNumber for BarPage API
          if (barData.phone && !barData.phoneNumber) {
            barData.phoneNumber = barData.phone;
            delete barData.phone;
          }
          res = await barApi.updateBarPage(barEntityAccountId, barData);
          break;
        }
        case 'BusinessAccount': {
          const businessEntityAccountId = profile.EntityAccountId || profile.entityAccountId;
          if (!businessEntityAccountId) {
            console.error('[ProfileEditModal] EntityAccountId is missing from profile', profile);
            setErrors({ submit: 'Lỗi: Không tìm thấy EntityAccountId. Không thể lưu.' });
            setSaving(false);
            return;
          }
          const businessApi = new BusinessApiService(token);
          res = await businessApi.updateBusiness(businessEntityAccountId, data);
          break;
        }
        default:
          throw new Error('Invalid profile type');
      }

      if (res?.success || res?.status === 'success') {
        onSuccess();
        onClose();
      } else {
        setErrors({ submit: res?.message || 'Cập nhật thất bại' });
      }
    } catch (error: any) {
      console.error('[ProfileEditModal] Error saving profile:', error);
      setErrors({
        submit: error.response?.data?.message || error.message || 'Cập nhật thất bại',
      });
    } finally {
      setSaving(false);
    }
  };

  const isPerformer = profileType === 'BusinessAccount';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { paddingBottom: insets.bottom + 20, maxHeight: '90%' },
            ]}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh sửa hồ sơ</Text>
              <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollViewContent}
              showsVerticalScrollIndicator={false}
            >
              {errors.submit && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errors.submit}</Text>
                </View>
              )}

              {/* Name */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                  Tên <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.userName && styles.inputError]}
                  value={formData.userName}
                  onChangeText={(value) => handleChange('userName', value)}
                  placeholder="Nhập tên của bạn"
                  placeholderTextColor="#9ca3af"
                />
                {errors.userName && (
                  <Text style={styles.fieldError}>{errors.userName}</Text>
                )}
              </View>

              {/* Bio - Only for Account and BusinessAccount, not for BarPage */}
              {profileType !== 'BarPage' && (
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Giới thiệu</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.bio}
                    onChangeText={(value) => handleChange('bio', value)}
                    placeholder="Giới thiệu về bản thân..."
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              )}

              {/* Phone */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Điện thoại</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(value) => handleChange('phone', value)}
                  placeholder="Nhập số điện thoại"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                />
              </View>

              {/* Address */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Địa chỉ</Text>
                <View style={styles.addressSelectorContainer}>
                  <AddressSelector
                    selectedProvinceId={selectedProvinceId}
                    selectedDistrictId={selectedDistrictId}
                    selectedWardId={selectedWardId}
                    addressDetail={addressDetail}
                    onProvinceChange={(id) => {
                      setSelectedProvinceId(id);
                      setSelectedDistrictId('');
                      setSelectedWardId('');
                    }}
                    onDistrictChange={(id) => {
                      setSelectedDistrictId(id);
                      setSelectedWardId('');
                    }}
                    onWardChange={(id) => {
                      setSelectedWardId(id);
                    }}
                    onAddressDetailChange={(detail) => {
                      setAddressDetail(detail);
                    }}
                    onAddressJsonChange={(json) => {
                      setAddressJson(json);
                    }}
                    required={false}
                  />
                </View>
                {errors.address && (
                  <Text style={styles.fieldError}>{errors.address}</Text>
                )}
              </View>

              {/* Gender */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Giới tính</Text>
                <View style={styles.genderContainer}>
                  {['Nam', 'Nữ', 'Khác'].map((gender) => (
                    <TouchableOpacity
                      key={gender}
                      style={[
                        styles.genderOption,
                        formData.gender === gender && styles.genderOptionSelected,
                      ]}
                      onPress={() => handleChange('gender', gender)}
                    >
                      <Text
                        style={[
                          styles.genderOptionText,
                          formData.gender === gender && styles.genderOptionTextSelected,
                        ]}
                      >
                        {gender}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Price fields for Performers (DJ/Dancer) */}
              {isPerformer && (
                <>
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Giá theo slot (đ/slot)</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.pricePerHours}
                      onChangeText={(value) => handleChange('pricePerHours', value)}
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Giá theo buổi (đ/slot)</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.pricePerSession}
                      onChangeText={(value) => handleChange('pricePerSession', value)}
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                    />
                  </View>
                </>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalCloseButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  required: {
    color: '#dc2626',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  fieldError: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 4,
  },
  addressSelectorContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  genderOptionSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  genderOptionText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  genderOptionTextSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  saveButton: {
    backgroundColor: '#2563eb',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});



