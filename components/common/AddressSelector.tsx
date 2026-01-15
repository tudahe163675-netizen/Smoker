import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocationApiService, LocationItem } from '@/services/locationApi';
import { formatAddressForSave, validateAddressFields, parseAddressFromString, extractAddressFields } from '@/utils/addressFormatter';

interface AddressSelectorProps {
  selectedProvinceId: string;
  selectedDistrictId: string;
  selectedWardId: string;
  addressDetail: string;
  onProvinceChange: (id: string) => void;
  onDistrictChange: (id: string) => void;
  onWardChange: (id: string) => void;
  onAddressDetailChange: (detail: string) => void;
  onAddressChange?: (fullAddress: string) => void;
  onAddressJsonChange?: (json: string | null) => void;
  disabled?: boolean;
  required?: boolean;
}

export default function AddressSelector({
  selectedProvinceId,
  selectedDistrictId,
  selectedWardId,
  addressDetail,
  onProvinceChange,
  onDistrictChange,
  onWardChange,
  onAddressDetailChange,
  onAddressChange,
  onAddressJsonChange,
  disabled = false,
  required = true,
}: AddressSelectorProps) {
  const locationApi = new LocationApiService();
  
  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showWardModal, setShowWardModal] = useState(false);

  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setLoading(true);
        const data = await locationApi.getProvinces();
        setProvinces(data);
      } catch (error) {
        console.error('[AddressSelector] Failed to load provinces:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProvinces();
  }, []);

  // Load districts when province is selected
  useEffect(() => {
    const loadDistricts = async () => {
      if (!selectedProvinceId) {
        setDistricts([]);
        return;
      }
      try {
        setLoading(true);
        const data = await locationApi.getDistricts(selectedProvinceId);
        setDistricts(data);
      } catch (error) {
        console.error('[AddressSelector] Failed to load districts:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDistricts();
  }, [selectedProvinceId]);

  // Load wards when district is selected
  useEffect(() => {
    const loadWards = async () => {
      if (!selectedDistrictId) {
        setWards([]);
        return;
      }
      try {
        setLoading(true);
        const data = await locationApi.getWards(selectedDistrictId);
        setWards(data);
      } catch (error) {
        console.error('[AddressSelector] Failed to load wards:', error);
      } finally {
        setLoading(false);
      }
    };
    loadWards();
  }, [selectedDistrictId]);

  // Build full address string
  const buildAddress = () => {
    const parts = [];
    if (addressDetail) parts.push(addressDetail);
    
    const selectedWard = wards.find(w => w.id === selectedWardId);
    const selectedDistrict = districts.find(d => d.id === selectedDistrictId);
    const selectedProvince = provinces.find(p => p.id === selectedProvinceId);

    if (selectedWard) parts.push(selectedWard.name);
    if (selectedDistrict) parts.push(selectedDistrict.name);
    if (selectedProvince) parts.push(selectedProvince.name);

    return parts.join(', ');
  };

  // Update address callbacks when selections change
  useEffect(() => {
    // Build full address string for display
    if (onAddressChange && (selectedProvinceId || selectedDistrictId || selectedWardId || addressDetail)) {
      const fullAddr = buildAddress();
      onAddressChange(fullAddr);
    }

    // Format and validate JSON address for saving
    if (onAddressJsonChange) {
      if (required) {
        // If required, validate all 4 fields are present
        if (validateAddressFields(addressDetail, selectedProvinceId, selectedDistrictId, selectedWardId)) {
          const addressJson = formatAddressForSave(addressDetail, selectedProvinceId, selectedDistrictId, selectedWardId);
          onAddressJsonChange(addressJson);
        } else {
          // Not all fields are filled, pass null
          onAddressJsonChange(null);
        }
      } else {
        // If not required, format if any field is present
        if (addressDetail || selectedProvinceId || selectedDistrictId || selectedWardId) {
          const addressJson = formatAddressForSave(addressDetail, selectedProvinceId, selectedDistrictId, selectedWardId);
          onAddressJsonChange(addressJson); // Will be null if validation fails
        } else {
          onAddressJsonChange(null);
        }
      }
    }
  }, [selectedProvinceId, selectedDistrictId, selectedWardId, addressDetail, onAddressChange, onAddressJsonChange, required]);

  const getSelectedProvinceName = () => {
    const province = provinces.find(p => p.id === selectedProvinceId);
    return province ? `${province.name}${province.typeText ? ` (${province.typeText})` : ''}` : '-- Chọn Tỉnh/Thành phố --';
  };

  const getSelectedDistrictName = () => {
    const district = districts.find(d => d.id === selectedDistrictId);
    return district ? `${district.name}${district.typeText ? ` (${district.typeText})` : ''}` : '-- Chọn Quận/Huyện --';
  };

  const getSelectedWardName = () => {
    const ward = wards.find(w => w.id === selectedWardId);
    return ward ? `${ward.name}${ward.typeText ? ` (${ward.typeText})` : ''}` : '-- Chọn Phường/Xã --';
  };

  const renderPickerModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    items: LocationItem[],
    selectedId: string,
    onSelect: (id: string) => void
  ) => (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerItem,
                    selectedId === item.id && styles.pickerItemSelected,
                  ]}
                  onPress={() => {
                    onSelect(item.id);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      selectedId === item.id && styles.pickerItemTextSelected,
                    ]}
                  >
                    {item.name}{item.typeText ? ` (${item.typeText})` : ''}
                  </Text>
                  {selectedId === item.id && (
                    <Ionicons name="checkmark" size={20} color="#2563eb" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Không có dữ liệu</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Province Picker */}
      <TouchableOpacity
        style={[styles.pickerButton, disabled && styles.pickerButtonDisabled]}
        onPress={() => !disabled && setShowProvinceModal(true)}
        disabled={disabled || loading}
      >
        <Text style={[styles.pickerButtonText, !selectedProvinceId && styles.pickerButtonTextPlaceholder]}>
          {getSelectedProvinceName()}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#6b7280" />
      </TouchableOpacity>

      {renderPickerModal(
        showProvinceModal,
        () => setShowProvinceModal(false),
        'Chọn Tỉnh/Thành phố',
        provinces,
        selectedProvinceId,
        (id) => {
          onProvinceChange(id);
          onDistrictChange('');
          onWardChange('');
        }
      )}

      {/* District Picker */}
      {selectedProvinceId && (
        <TouchableOpacity
          style={[styles.pickerButton, disabled && styles.pickerButtonDisabled, styles.pickerButtonMargin]}
          onPress={() => !disabled && setShowDistrictModal(true)}
          disabled={disabled || loading || !selectedProvinceId}
        >
          <Text style={[styles.pickerButtonText, !selectedDistrictId && styles.pickerButtonTextPlaceholder]}>
            {getSelectedDistrictName()}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#6b7280" />
        </TouchableOpacity>
      )}

      {renderPickerModal(
        showDistrictModal,
        () => setShowDistrictModal(false),
        'Chọn Quận/Huyện',
        districts,
        selectedDistrictId,
        (id) => {
          onDistrictChange(id);
          onWardChange('');
        }
      )}

      {/* Ward Picker */}
      {selectedDistrictId && (
        <TouchableOpacity
          style={[styles.pickerButton, disabled && styles.pickerButtonDisabled, styles.pickerButtonMargin]}
          onPress={() => !disabled && setShowWardModal(true)}
          disabled={disabled || loading || !selectedDistrictId}
        >
          <Text style={[styles.pickerButtonText, !selectedWardId && styles.pickerButtonTextPlaceholder]}>
            {getSelectedWardName()}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#6b7280" />
        </TouchableOpacity>
      )}

      {renderPickerModal(
        showWardModal,
        () => setShowWardModal(false),
        'Chọn Phường/Xã',
        wards,
        selectedWardId,
        onWardChange
      )}

      {/* Address Detail Input */}
      {(selectedProvinceId || selectedDistrictId || selectedWardId) && (
        <TextInput
          style={[styles.textInput, styles.pickerButtonMargin]}
          placeholder="Số nhà, tên đường, tổ, khu phố..."
          value={addressDetail}
          onChangeText={onAddressDetailChange}
          editable={!disabled}
          placeholderTextColor="#9ca3af"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pickerButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#f3f4f6',
  },
  pickerButtonMargin: {
    marginTop: 0,
  },
  pickerButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  pickerButtonTextPlaceholder: {
    color: '#9ca3af',
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 16,
    color: '#111827',
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
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalCloseButton: {
    padding: 4,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickerItemSelected: {
    backgroundColor: '#eff6ff',
  },
  pickerItemText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  pickerItemTextSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
});



