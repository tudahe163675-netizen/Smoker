import AnimatedHeader from '@/components/ui/AnimatedHeader';
import { combosData } from '@/constants/barData';
import { useBooking } from '@/hooks/useBooking';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function BookingScreen() {
  const {
    bookingData,
    timeSlots,
    guestOptions,
    tableTypes,
    isLoading,
    updateBookingData,
    updateCustomerInfo,
    submitBooking,
    getMinDate,
    getMaxDate,
    formatDate,
    calculateTotalPrice,
  } = useBooking();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const scrollY = useRef(new Animated.Value(0)).current;

  const selectedCombo = combosData.find(combo => combo.id === bookingData.selectedCombo);
  const totalSteps = 4;

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      updateBookingData({ selectedDate });
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    const success = await submitBooking();
    if (success) {
      router.back();
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return bookingData.selectedDate && bookingData.selectedTime;
      case 2:
        return bookingData.guestCount > 0;
      case 3:
        return true; // Optional step
      case 4:
        return bookingData.customerInfo.name && bookingData.customerInfo.phone;
      default:
        return false;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Chọn ngày và giờ';
      case 2:
        return 'Số khách và loại bàn';
      case 3:
        return 'Combo và yêu cầu';
      case 4:
        return 'Thông tin đặt bàn';
      default:
        return 'Đặt bàn';
    }
  };

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 0],
    extrapolate: 'clamp',
  });

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <View key={index} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            index < currentStep && styles.completedStep,
            index === currentStep - 1 && styles.activeStep,
          ]}>
            {index < currentStep - 1 ? (
              <Ionicons name="checkmark" size={16} color="#fff" />
            ) : (
              <Text style={[
                styles.stepNumber,
                (index === currentStep - 1 || index < currentStep - 1) && styles.activeStepNumber
              ]}>
                {index + 1}
              </Text>
            )}
          </View>
          {index < totalSteps - 1 && (
            <View style={[
              styles.stepLine,
              index < currentStep - 1 && styles.completedLine
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderDateTimeStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Chọn ngày và giờ</Text>
      
      <TouchableOpacity 
        style={styles.dateButton} 
        onPress={() => setShowDatePicker(true)}
      >
        <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
        <Text style={styles.dateButtonText}>
          {bookingData.selectedDate ? formatDate(bookingData.selectedDate) : 'Chọn ngày'}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#6b7280" />
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={bookingData.selectedDate || new Date()}
          mode="date"
          display="default"
          minimumDate={getMinDate()}
          maximumDate={getMaxDate()}
          onChange={handleDateChange}
        />
      )}

      <Text style={styles.sectionTitle}>Chọn giờ</Text>
      <View style={styles.timeGrid}>
        {timeSlots.map((slot) => (
          <TouchableOpacity
            key={slot.id}
            style={[
              styles.timeSlot,
              !slot.available && styles.unavailableSlot,
              bookingData.selectedTime === slot.time && styles.selectedTimeSlot,
            ]}
            onPress={() => slot.available && updateBookingData({ selectedTime: slot.time })}
            disabled={!slot.available}
          >
            <Text style={[
              styles.timeText,
              !slot.available && styles.unavailableText,
              bookingData.selectedTime === slot.time && styles.selectedTimeText,
            ]}>
              {slot.time}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderGuestStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Số lượng khách</Text>
      
      <View style={styles.guestGrid}>
        {guestOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.guestOption,
              bookingData.guestCount === option.value && styles.selectedGuestOption,
            ]}
            onPress={() => updateBookingData({ guestCount: option.value })}
          >
            <Ionicons 
              name="people-outline" 
              size={24} 
              color={bookingData.guestCount === option.value ? '#fff' : '#6b7280'} 
            />
            <Text style={[
              styles.guestOptionText,
              bookingData.guestCount === option.value && styles.selectedGuestText,
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Loại bàn</Text>
      <View style={styles.tableTypes}>
        {tableTypes.map((table) => (
          <TouchableOpacity
            key={table.id}
            style={[
              styles.tableOption,
              bookingData.tableType === table.id && styles.selectedTableOption,
            ]}
            onPress={() => updateBookingData({ tableType: table.id as any })}
          >
            <View style={styles.tableHeader}>
              <Ionicons 
                name={table.icon as any} 
                size={24} 
                color={bookingData.tableType === table.id ? '#3b82f6' : '#6b7280'} 
              />
              <View style={styles.tableInfo}>
                <Text style={[
                  styles.tableName,
                  bookingData.tableType === table.id && styles.selectedTableText,
                ]}>
                  {table.name}
                </Text>
                <Text style={styles.tableDescription}>{table.description}</Text>
              </View>
              <Text style={styles.tablePrice}>
                {table.price === 0 ? 'Miễn phí' : `+${table.price.toLocaleString()}đ`}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderComboStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Chọn combo (tùy chọn)</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[
            styles.comboOption,
            !bookingData.selectedCombo && styles.selectedComboOption,
          ]}
          onPress={() => updateBookingData({ selectedCombo: null })}
        >
          <Text style={styles.comboSkipText}>Bỏ qua</Text>
        </TouchableOpacity>
        
        {combosData.slice(0, 3).map((combo) => (
          <TouchableOpacity
            key={combo.id}
            style={[
              styles.comboOption,
              bookingData.selectedCombo === combo.id && styles.selectedComboOption,
            ]}
            onPress={() => updateBookingData({ selectedCombo: combo.id })}
          >
            <Text style={styles.comboTitle}>{combo.title}</Text>
            <Text style={styles.comboPrice}>{combo.salePrice}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TextInput
        style={styles.textInput}
        placeholder="Yêu cầu đặc biệt (tùy chọn)"
        value={bookingData.specialRequests}
        onChangeText={(text) => updateBookingData({ specialRequests: text })}
        multiline
        numberOfLines={3}
      />
    </View>
  );

  const renderCustomerStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Thông tin khách hàng</Text>
      
      <TextInput
        style={styles.textInput}
        placeholder="Họ và tên *"
        value={bookingData.customerInfo.name}
        onChangeText={(text) => updateCustomerInfo({ name: text })}
      />
      
      <TextInput
        style={styles.textInput}
        placeholder="Số điện thoại *"
        value={bookingData.customerInfo.phone}
        onChangeText={(text) => updateCustomerInfo({ phone: text })}
        keyboardType="phone-pad"
      />
      
      <TextInput
        style={styles.textInput}
        placeholder="Email (tùy chọn)"
        value={bookingData.customerInfo.email}
        onChangeText={(text) => updateCustomerInfo({ email: text })}
        keyboardType="email-address"
      />

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Thông tin đặt bàn</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Ngày:</Text>
          <Text style={styles.summaryValue}>
            {bookingData.selectedDate ? formatDate(bookingData.selectedDate) : '-'}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Giờ:</Text>
          <Text style={styles.summaryValue}>{bookingData.selectedTime || '-'}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Số khách:</Text>
          <Text style={styles.summaryValue}>{bookingData.guestCount} người</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Loại bàn:</Text>
          <Text style={styles.summaryValue}>
            {tableTypes.find(t => t.id === bookingData.tableType)?.name}
          </Text>
        </View>
        
        {selectedCombo && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Combo:</Text>
            <Text style={styles.summaryValue}>{selectedCombo.title}</Text>
          </View>
        )}
        
        <View style={styles.summaryDivider} />
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryTotal}>Tổng cộng:</Text>
          <Text style={styles.summaryTotalValue}>
            {calculateTotalPrice().toLocaleString()}đ
          </Text>
        </View>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderDateTimeStep();
      case 2:
        return renderGuestStep();
      case 3:
        return renderComboStep();
      case 4:
        return renderCustomerStep();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1f2937" />
      
      {/* Animated Header */}
      <AnimatedHeader
        title="Đặt bàn"
        subtitle={`Bước ${currentStep}/${totalSteps}: ${getStepTitle()}`}
        iconName="arrow-back"
        onIconPress={handleBack}
        headerTranslateY={headerTranslateY}
        gradientColors={['#1f2937', '#374151']}
      />

      {/* Step Indicator */}
      {renderStepIndicator()}

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 20 }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
          {renderCurrentStep()}
        </Animated.ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleBack}
          >
            <Text style={styles.secondaryButtonText}>
              {currentStep === 1 ? 'Hủy' : 'Quay lại'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.primaryButton,
              !canProceed() && styles.disabledButton,
            ]}
            onPress={handleNext}
            disabled={!canProceed() || isLoading}
          >
            <LinearGradient
              colors={!canProceed() ? ['#9ca3af', '#9ca3af'] : ['#ef4444', '#dc2626']}
              style={styles.primaryGradient}
            >
              {isLoading ? (
                <Text style={styles.primaryButtonText}>Đang xử lý...</Text>
              ) : (
                <Text style={styles.primaryButtonText}>
                  {currentStep === totalSteps ? 'Xác nhận đặt bàn' : 'Tiếp tục'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  // Step Indicator
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
    marginTop: 40, // Space for animated header
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStep: {
    backgroundColor: '#3b82f6',
  },
  completedStep: {
    backgroundColor: '#10b981',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  activeStepNumber: {
    color: '#fff',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  completedLine: {
    backgroundColor: '#10b981',
  },

  // Content
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 20,
    marginBottom: 12,
  },

  // Date & Time
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 20,
  },
  dateButtonText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlot: {
    width: (width - 60) / 3,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedTimeSlot: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  unavailableSlot: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  selectedTimeText: {
    color: '#fff',
  },
  unavailableText: {
    color: '#9ca3af',
  },

  // Guest Count
  guestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  guestOption: {
    width: (width - 60) / 2,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedGuestOption: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  guestOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 8,
  },
  selectedGuestText: {
    color: '#fff',
  },

  // Table Types
  tableTypes: {
    marginBottom: 20,
  },
  tableOption: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  selectedTableOption: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableInfo: {
    flex: 1,
    marginLeft: 12,
  },
  tableName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  selectedTableText: {
    color: '#3b82f6',
  },
  tableDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  tablePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },

  // Combo
  comboOption: {
    width: 120,
    height: 80,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedComboOption: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  comboTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  comboPrice: {
    fontSize: 10,
    color: '#ef4444',
    fontWeight: 'bold',
    marginTop: 4,
  },
  comboSkipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },

  // Inputs
  textInput: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 16,
    marginBottom: 16,
    marginTop: 20
  },

  // Summary
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  summaryTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
  },

  // Bottom Actions
  bottomActions: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 6,
  },
  secondaryButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryGradient: {
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});