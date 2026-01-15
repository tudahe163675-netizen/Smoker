import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PaymentSummary from "./PaymentSummary";

interface PaymentBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedSlots: number[];
  priceCalculation: {
    unitPrice: number;
    totalPrice: number;
    priceType: 'pricePerHour' | 'pricePerSession';
  };
  maxConsecutiveSlots: number;
  depositAmount: number;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_HEIGHT = SCREEN_HEIGHT * 0.5;

/**
 * PaymentBottomSheet Component
 * Bottom sheet hiển thị chi tiết thanh toán
 * Trượt lên từ dưới khi mở
 */
export default function PaymentBottomSheet({
  visible,
  onClose,
  selectedSlots,
  priceCalculation,
  maxConsecutiveSlots,
  depositAmount
}: PaymentBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = React.useRef(new Animated.Value(BOTTOM_SHEET_HEIGHT)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: BOTTOM_SHEET_HEIGHT,
        duration: 250,
        useNativeDriver: true
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: slideAnim }],
              paddingBottom: Math.max(insets.bottom, 16)
            }
          ]}
        >
          {/* Handle */}
          <TouchableOpacity
            style={styles.handleContainer}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <View style={styles.handle} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Chi tiết thanh toán</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={[
              styles.contentContainer,
              { paddingBottom: 20 } // Extra padding để đảm bảo scroll hết nội dung
            ]}
            showsVerticalScrollIndicator={true}
          >
            <PaymentSummary
              selectedSlots={selectedSlots}
              priceCalculation={priceCalculation}
              maxConsecutiveSlots={maxConsecutiveSlots}
              depositAmount={depositAmount}
            />
          </ScrollView>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: BOTTOM_SHEET_HEIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827'
  },
  closeButton: {
    padding: 4
  },
  content: {
    flex: 1
  },
  contentContainer: {
    padding: 16
  }
});

