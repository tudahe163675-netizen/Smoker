import { useState } from 'react';
import { Alert } from 'react-native';

export interface BookingData {
  selectedDate: Date | null;
  selectedTime: string;
  guestCount: number;
  selectedCombo: string | null;
  customerInfo: {
    name: string;
    phone: string;
    email: string;
  };
  specialRequests: string;
  tableType: 'standard' | 'vip' | 'private';
}

export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

export const useBooking = () => {
  const [bookingData, setBookingData] = useState<BookingData>({
    selectedDate: null,
    selectedTime: '',
    guestCount: 2,
    selectedCombo: null,
    customerInfo: {
      name: '',
      phone: '',
      email: '',
    },
    specialRequests: '',
    tableType: 'standard',
  });

  const [isLoading, setIsLoading] = useState(false);

  // Available time slots (in real app, this would come from API)
  const timeSlots: TimeSlot[] = [
    { id: '1', time: '17:00', available: true },
    { id: '2', time: '17:30', available: true },
    { id: '3', time: '18:00', available: true },
    { id: '4', time: '18:30', available: false },
    { id: '5', time: '19:00', available: true },
    { id: '6', time: '19:30', available: true },
    { id: '7', time: '20:00', available: true },
    { id: '8', time: '20:30', available: false },
    { id: '9', time: '21:00', available: true },
    { id: '10', time: '21:30', available: true },
    { id: '11', time: '22:00', available: true },
  ];

  const guestOptions = [
    { id: 1, label: '1 người', value: 1 },
    { id: 2, label: '2 người', value: 2 },
    { id: 3, label: '3-4 người', value: 4 },
    { id: 4, label: '5-6 người', value: 6 },
    { id: 5, label: '7-8 người', value: 8 },
    { id: 6, label: '9-10 người', value: 10 },
    { id: 7, label: 'Trên 10 người', value: 15 },
  ];

  const tableTypes = [
    { 
      id: 'standard', 
      name: 'Bàn thường', 
      description: 'Không gian mở, phù hợp nhóm nhỏ',
      price: 0,
      icon: 'restaurant-outline'
    },
    { 
      id: 'vip', 
      name: 'Bàn VIP', 
      description: 'Không gian riêng tư, view đẹp',
      price: 200000,
      icon: 'diamond-outline'
    },
    { 
      id: 'private', 
      name: 'Phòng riêng', 
      description: 'Phòng kín, karaoke, phù hợp tiệc tùng',
      price: 500000,
      icon: 'business-outline'
    },
  ];

  const updateBookingData = (updates: Partial<BookingData>) => {
    setBookingData(prev => ({
      ...prev,
      ...updates,
    }));
  };

  const updateCustomerInfo = (info: Partial<BookingData['customerInfo']>) => {
    setBookingData(prev => ({
      ...prev,
      customerInfo: {
        ...prev.customerInfo,
        ...info,
      },
    }));
  };

  const validateBooking = (): boolean => {
    const { selectedDate, selectedTime, customerInfo } = bookingData;
    
    if (!selectedDate) {
      Alert.alert('Lỗi', 'Vui lòng chọn ngày đặt bàn');
      return false;
    }
    
    if (!selectedTime) {
      Alert.alert('Lỗi', 'Vui lòng chọn giờ đặt bàn');
      return false;
    }
    
    if (!customerInfo.name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên');
      return false;
    }
    
    if (!customerInfo.phone.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
      return false;
    }
    
    // Simple phone validation
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(customerInfo.phone.replace(/\s/g, ''))) {
      Alert.alert('Lỗi', 'Số điện thoại không hợp lệ');
      return false;
    }
    
    return true;
  };

  const submitBooking = async (): Promise<boolean> => {
    if (!validateBooking()) {
      return false;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real app, make API call here
      console.log('Booking submitted:', bookingData);
      
      Alert.alert(
        'Đặt bàn thành công!', 
        `Cảm ơn ${bookingData.customerInfo.name}!\nMã đặt bàn: #${Math.random().toString(36).substr(2, 9).toUpperCase()}\n\nChúng tôi sẽ liên hệ xác nhận trong vòng 15 phút.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setBookingData({
                selectedDate: null,
                selectedTime: '',
                guestCount: 2,
                selectedCombo: null,
                customerInfo: {
                  name: '',
                  phone: '',
                  email: '',
                },
                specialRequests: '',
                tableType: 'standard',
              });
            }
          }
        ]
      );
      
      return true;
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra, vui lòng thử lại sau');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getMinDate = (): Date => {
    return new Date(); // Today
  };

  const getMaxDate = (): Date => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // 30 days from now
    return maxDate;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateTotalPrice = (): number => {
    let total = 0;
    
    // Add table type price
    const tableType = tableTypes.find(t => t.id === bookingData.tableType);
    if (tableType) {
      total += tableType.price;
    }
    
    // Add combo price (if selected)
    // In real app, you would get combo price from the selected combo
    
    return total;
  };

  return {
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
  };
};