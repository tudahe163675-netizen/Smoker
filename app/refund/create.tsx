import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRefund } from '@/hooks/useRefund';
import { Colors } from '@/constants/colors';

export default function CreateRefundScreen() {
  const router = useRouter();
  const { createRefundRequest, loading } = useRefund();
  const [bookedScheduleId, setBookedScheduleId] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const handleCreate = async () => {
    if (!bookedScheduleId.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập Booking Schedule ID');
      return;
    }

    if (!refundReason.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do hoàn tiền');
      return;
    }

    try {
      const refundRequest = await createRefundRequest({
        bookedScheduleId: bookedScheduleId.trim(),
        refundReason: refundReason.trim(),
      });

      if (refundRequest) {
        Alert.alert('Thành công', 'Yêu cầu hoàn tiền đã được tạo', [
          {
            text: 'OK',
            onPress: () => router.replace(`/refund/${refundRequest.bookedScheduleId}`),
          },
        ]);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tạo yêu cầu hoàn tiền');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo yêu cầu hoàn tiền</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.label}>Booking Schedule ID *</Text>
            <TextInput
              style={styles.input}
              value={bookedScheduleId}
              onChangeText={setBookedScheduleId}
              placeholder="Nhập Booking Schedule ID"
              placeholderTextColor={Colors.mutedForeground}
              autoCapitalize="none"
            />
            <Text style={styles.hint}>
              ID của booking schedule mà bạn muốn hoàn tiền
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Lý do hoàn tiền *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={refundReason}
              onChangeText={setRefundReason}
              placeholder="Nhập lý do hoàn tiền"
              placeholderTextColor={Colors.mutedForeground}
              multiline
              numberOfLines={6}
              maxLength={500}
            />
            <Text style={styles.hint}>{refundReason.length}/500</Text>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={Colors.primary} />
            <Text style={styles.infoText}>
              Yêu cầu hoàn tiền của bạn sẽ được xem xét bởi quản trị viên. Vui lòng cung cấp đầy đủ
              thông tin và lý do hợp lý.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.createButton,
            (!bookedScheduleId.trim() || !refundReason.trim() || loading) &&
              styles.createButtonDisabled,
          ]}
          onPress={handleCreate}
          disabled={!bookedScheduleId.trim() || !refundReason.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.primaryForeground} size="small" />
          ) : (
            <>
              <Ionicons name="receipt" size={20} color={Colors.primaryForeground} />
              <Text style={styles.createButtonText}>Tạo yêu cầu hoàn tiền</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.foreground,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.foreground,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: Colors.input,
    color: Colors.foreground,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: Colors.mutedForeground,
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.primaryLight,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.foreground,
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: Colors.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
});

