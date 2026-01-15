import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Platform
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

interface HorizontalDatePickerProps {
  selectedDate: Date | null;
  onDateChange: (date: Date) => void;
  minDate?: Date;
  error?: string;
  disabled?: boolean;
}

/**
 * Horizontal Date Picker Component for React Native
 * Hiển thị 7 ngày tiếp theo dưới dạng horizontal scrollable list
 * Giống như các app đặt phim
 */
export default function HorizontalDatePicker({
  selectedDate,
  onDateChange,
  minDate,
  error,
  disabled = false
}: HorizontalDatePickerProps) {
  const [showFullPicker, setShowFullPicker] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Generate 7 days starting from tomorrow (or minDate)
  const generateDates = (): Date[] => {
    const dates: Date[] = [];
    const startDate = minDate || (() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow;
    })();

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }

    return dates;
  };

  const dates = generateDates();

  // Vietnamese day names
  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  // Check if two dates are the same day
  const isSameDay = (date1: Date | null, date2: Date): boolean => {
    if (!date1) return false;
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  // Handle date selection
  const handleDateClick = (date: Date) => {
    if (disabled) return;
    onDateChange(date);
  };

  // Handle "See More" click
  const handleSeeMoreClick = () => {
    if (disabled) return;
    setShowFullPicker(true);
  };

  // Handle full date picker change
  const handleFullDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowFullPicker(false);
    }
    if (selectedDate) {
      onDateChange(selectedDate);
      if (Platform.OS === "ios") {
        setShowFullPicker(false);
      }
    }
  };

  // Scroll to selected date on mount or when selectedDate changes
  useEffect(() => {
    if (scrollRef.current && selectedDate) {
      const selectedIndex = dates.findIndex((date) =>
        isSameDay(selectedDate, date)
      );
      if (selectedIndex >= 0) {
        // Calculate scroll position (each item is ~80px wide with gap)
        const scrollPosition = selectedIndex * 80;
        scrollRef.current.scrollTo({
          x: scrollPosition,
          animated: true
        });
      }
    }
  }, [selectedDate]);

  return (
    <View style={styles.container}>
      {/* Horizontal scrollable date list */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {/* Date items */}
        {dates.map((date, index) => {
          const isSelected = isSameDay(selectedDate, date);
          const dayOfWeek = dayNames[date.getDay()];
          const dayNumber = date.getDate();

          return (
            <TouchableOpacity
              key={index}
              onPress={() => handleDateClick(date)}
              disabled={disabled}
              style={[
                styles.dateItem,
                isSelected && styles.dateItemSelected,
                disabled && styles.dateItemDisabled
              ]}
            >
              <Text
                style={[
                  styles.dayOfWeek,
                  isSelected && styles.dayOfWeekSelected
                ]}
              >
                {dayOfWeek}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  isSelected && styles.dayNumberSelected
                ]}
              >
                {dayNumber}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* "See More" button */}
        <TouchableOpacity
          onPress={handleSeeMoreClick}
          disabled={disabled}
          style={[
            styles.dateItem,
            styles.seeMoreItem,
            disabled && styles.dateItemDisabled
          ]}
        >
          <Ionicons
            name="calendar-outline"
            size={16}
            color={disabled ? "#9ca3af" : "#4b5563"}
          />
          <Text
            style={[
              styles.seeMoreText,
              disabled && styles.seeMoreTextDisabled
            ]}
          >
            Xem thêm
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Full date picker modal */}
      {showFullPicker && (
        <>
          {Platform.OS === "ios" ? (
            <Modal
              visible={showFullPicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowFullPicker(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity
                      onPress={() => setShowFullPicker(false)}
                      style={styles.modalCloseButton}
                    >
                      <Text style={styles.modalCloseText}>Đóng</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Chọn ngày</Text>
                    <View style={styles.modalCloseButton} />
                  </View>
                  <DateTimePicker
                    value={selectedDate || dates[0]}
                    mode="date"
                    minimumDate={dates[0]}
                    onChange={handleFullDateChange}
                    display="spinner"
                  />
                </View>
              </View>
            </Modal>
          ) : (
            <DateTimePicker
              value={selectedDate || dates[0]}
              mode="date"
              minimumDate={dates[0]}
              onChange={handleFullDateChange}
            />
          )}
        </>
      )}

      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%"
  },
  scrollView: {
    width: "100%"
  },
  scrollContent: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 12
  },
  dateItem: {
    width: 64,
    minWidth: 64,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    gap: 4
  },
  dateItemSelected: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    transform: [{ scale: 1.05 }]
  },
  dateItemDisabled: {
    opacity: 0.5
  },
  seeMoreItem: {
    // Same as dateItem but with icon
  },
  dayOfWeek: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4b5563"
  },
  dayOfWeekSelected: {
    color: "#ffffff"
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937"
  },
  dayNumberSelected: {
    color: "#ffffff"
  },
  seeMoreText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4b5563",
    marginTop: 4
  },
  seeMoreTextDisabled: {
    color: "#9ca3af"
  },
  errorContainer: {
    marginTop: 4,
    paddingLeft: 4
  },
  errorText: {
    fontSize: 14,
    color: "#ef4444"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end"
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb"
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937"
  },
  modalCloseButton: {
    minWidth: 60
  },
  modalCloseText: {
    fontSize: 16,
    color: "#3b82f6",
    fontWeight: "600"
  }
});

