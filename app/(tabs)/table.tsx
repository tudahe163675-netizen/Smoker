import AnimatedHeader from '@/components/ui/AnimatedHeader';
import { Table } from '@/constants/tableData';
import { useTableManagement } from '@/hooks/useTableManagement';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TableManagementScreen() {
  const router = useRouter();
  const { tables, createTable, refresh, loading } = useTableManagement();
  const [tableModalVisible, setTableModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [newTable, setNewTable] = useState({
    number: '',
    type: 'thường' as 'vip' | 'luxury' | 'thường',
    capacity: '',
  });

  const scrollY = useRef(new Animated.Value(0)).current;

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -100],
    extrapolate: 'clamp',
  });

  const handleCreateTable = () => {
    const success = createTable(newTable);
    if (success) {
      setTableModalVisible(false);
      setNewTable({ number: '', type: 'thường', capacity: '' });
    }
  };

  const handleTablePress = (table: Table) => {
    setSelectedTable(table);
    setDetailModalVisible(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const TableItem = ({ table }: { table: Table }) => {
    const typeConfig = {
      'thường': { label: 'Bàn Thường', color: '#6b7280' },
      'vip': { label: 'Bàn VIP', color: '#f59e0b' },
      'luxury': { label: 'Bàn Luxury', color: '#8b5cf6' },
    }[table.type];

    return (
      <TouchableOpacity
        style={styles.tableItem}
        onPress={() => handleTablePress(table)}
        activeOpacity={0.7}
      >
        <View style={styles.tableItemLeft}>
          <View style={[styles.tableTypeIndicator, { backgroundColor: typeConfig.color }]} />
          <View style={styles.tableInfo}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableNumber}>Bàn {table.number}</Text>

            </View>
            <Text style={styles.tableType}>{typeConfig.label} • {table.capacity} người</Text>
            {table.customer && (
              <Text style={styles.customerName}>👤 {table.customer.name}</Text>
            )}
            {table.currentOrder && (
              <Text style={styles.orderTotal}>
                💰 {formatCurrency(table.currentOrder.total)}
              </Text>
            )}
          </View>
        </View>
        <View style={[
          styles.statusBadge,
          table.status === 'trống' && styles.statusEmpty,
          table.status === 'đang sử dụng' && styles.statusOccupied,
          table.status === 'đã đặt' && styles.statusBooked,
        ]}>
          <Text style={styles.statusText}>
            {table.status.toUpperCase()}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1f2937" />

      <AnimatedHeader
        title="Quản lý bàn"
        iconName="add"
        onIconPress={() => setTableModalVisible(true)}
        headerTranslateY={headerTranslateY}
      />

      {/* list bàn */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >

        {/* Summary Card với nút xem chi tiết */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.summaryTitle}>Tổng quan hôm nay</Text>
              <Text style={styles.summarySubtitle}>
                {tables.filter(t => t.status === 'đang sử dụng').length}/{tables.length} bàn đang sử dụng
              </Text>
            </View>
            <TouchableOpacity
              style={styles.summaryButton}
              onPress={() => router.push('/revenue')}
            >
              <Ionicons name="bar-chart" size={20} color="#10b981" />
              <Text style={styles.summaryButtonText}>Thu nhập</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Trống</Text>
              <Text style={[styles.statValue, { color: '#10b981' }]}>
                {tables.filter(t => t.status === 'trống').length}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Sử dụng</Text>
              <Text style={[styles.statValue, { color: '#ef4444' }]}>
                {tables.filter(t => t.status === 'đang sử dụng').length}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Đã đặt</Text>
              <Text style={[styles.statValue, { color: '#f59e0b' }]}>
                {tables.filter(t => t.status === 'đã đặt').length}
              </Text>
            </View>
          </View>
        </View>

        {tables.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>Chưa có bàn nào</Text>
            <Text style={styles.emptyStateSubtext}>Nhấn + để thêm bàn mới</Text>
          </View>
        ) : (
          tables.map((table) => (
            <TableItem key={table.id} table={table} />
          ))
        )}
      </Animated.ScrollView>

      {/* Modal thêm bàn */}
      <Modal
        visible={tableModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTableModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setTableModalVisible(false)}>
                <Text style={styles.modalCancel}>Hủy</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Thêm bàn mới</Text>
              <TouchableOpacity onPress={handleCreateTable}>
                <Text style={styles.modalSave}>Tạo</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Số bàn</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newTable.number}
                  onChangeText={(text) => setNewTable(prev => ({ ...prev, number: text }))}
                  placeholder="Nhập số bàn"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Loại bàn</Text>
                <View style={styles.typeSelector}>
                  {(['thường', 'vip', 'luxury'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeOption,
                        newTable.type === type && styles.typeOptionSelected
                      ]}
                      onPress={() => setNewTable(prev => ({ ...prev, type }))}
                    >
                      <Text style={[
                        styles.typeLabel,
                        newTable.type === type && styles.typeLabelSelected
                      ]}>
                        {type === 'thường' ? 'Thường' : type === 'vip' ? 'VIP' : 'Luxury'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Sức chứa</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newTable.capacity}
                  onChangeText={(text) => setNewTable(prev => ({ ...prev, capacity: text }))}
                  placeholder="Nhập số người"
                  keyboardType="numeric"
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal chi tiết bàn */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Chi tiết bàn {selectedTable?.number}</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.detailBody} showsVerticalScrollIndicator={false}>
              {selectedTable && (
                <>
                  {/* Thông tin bàn */}
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Thông tin bàn</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Loại bàn:</Text>
                      <Text style={styles.detailValue}>
                        {selectedTable.type === 'thường' ? 'Bàn Thường' :
                          selectedTable.type === 'vip' ? 'Bàn VIP' : 'Bàn Luxury'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Sức chứa:</Text>
                      <Text style={styles.detailValue}>{selectedTable.capacity} người</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Trạng thái:</Text>
                      <Text style={[
                        styles.detailValue,
                        selectedTable.status === 'trống' && { color: '#10b981' },
                        selectedTable.status === 'đang sử dụng' && { color: '#ef4444' },
                        selectedTable.status === 'đã đặt' && { color: '#f59e0b' },
                      ]}>
                        {selectedTable.status}
                      </Text>
                    </View>
                  </View>

                  {/* Thông tin khách hàng */}
                  {selectedTable.customer && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Tên:</Text>
                        <Text style={styles.detailValue}>{selectedTable.customer.name}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>SĐT:</Text>
                        <Text style={styles.detailValue}>{selectedTable.customer.phone}</Text>
                      </View>
                      {selectedTable.customer.bookingTime && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Giờ đặt:</Text>
                          <Text style={styles.detailValue}>
                            {formatTime(selectedTable.customer.bookingTime)}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Chi tiết order */}
                  {selectedTable.currentOrder && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>Chi tiết order</Text>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Giờ vào:</Text>
                        <Text style={styles.detailValue}>
                          {formatTime(selectedTable.currentOrder.startTime)}
                        </Text>
                      </View>

                      <View style={styles.orderItems}>
                        {selectedTable.currentOrder.items.map((item, index) => (
                          <View key={index} style={styles.orderItem}>
                            <Text style={styles.orderItemName}>
                              {item.name} x{item.quantity}
                            </Text>
                            <Text style={styles.orderItemPrice}>
                              {formatCurrency(item.price * item.quantity)}
                            </Text>
                          </View>
                        ))}
                      </View>

                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Tổng cộng:</Text>
                        <Text style={styles.totalValue}>
                          {formatCurrency(selectedTable.currentOrder.total)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {selectedTable.status === 'trống' && (
                    <View style={styles.emptyDetail}>
                      <Ionicons name="checkmark-circle-outline" size={48} color="#10b981" />
                      <Text style={styles.emptyDetailText}>Bàn đang trống</Text>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  tableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tableItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tableTypeIndicator: {
    width: 4,
    height: 60,
    borderRadius: 2,
    marginRight: 12,
  },
  tableInfo: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tableNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 16
  },
  statusEmpty: {
    backgroundColor: '#d1fae5',
  },
  statusOccupied: {
    backgroundColor: '#fee2e2',
  },
  statusBooked: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#374151',
  },
  tableType: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 13,
    color: '#2563eb',
    marginTop: 2,
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 6,
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
    maxHeight: '70%',
  },
  detailModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalSave: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  detailBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  typeOptionSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  typeLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  typeLabelSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  orderItems: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  orderItemName: {
    fontSize: 14,
    color: '#374151',
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
  },
  emptyDetail: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyDetailText: {
    fontSize: 16,
    color: '#10b981',
    marginTop: 12,
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  summarySubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  summaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  summaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
});