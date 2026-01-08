import { MyBooking } from '@/types/barType';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    AlertCircle,
    Calendar,
    Clock,
    DollarSign,
    MapPin,
    Phone,
    Store,
} from 'lucide-react-native';
import React, {useState} from 'react';
import {
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function RenderItem({item, index, setDataBooking, showDetail, onCancel, onPay}: {
    item: MyBooking,
    index: number,
    setDataBooking: (value: any) => void,
    showDetail: () => void,
    onCancel: () => void,
    onPay: () => void
}){
    const startDate = new Date(item.startTime);
    const endDate = new Date(item.endTime);
    const barName = item.receiverInfo?.name || 'Quán bar';
    const barAvatar = item.receiverInfo?.avatar || 'https://via.placeholder.com/48';
    const barPhone = item.receiverInfo?.phone || '';

    // Lấy danh sách bàn từ Table object
    const tables = Object.values(item.detailSchedule?.table || {})
        .map((t) => t.tableName)
        .join(', ');

    const isFuture = new Date(item.bookingDate) > new Date();
    const isCancelAble = item.scheduleStatus === 'Pending' && isFuture;
    const isPaymentAble = (item.scheduleStatus !== 'Rejected' && item.scheduleStatus !== 'Canceled') && item.paymentStatus === 'Pending' && isFuture;

    const statusConfig = {
        confirmed: {
            label: "Đã xác nhận",
            color: "#22c55e",
        },
        pending: {
            label: "Chờ xác nhận",
            color: "#f59e0b",
        },
        rejected: {
            label: "Từ chối",
            color: "#ef4444",
        },
        canceled: {
            label: "Đã huỷ",
            color: "#ef4444",
        },
    };
    const statusKey = item.scheduleStatus.toLowerCase();
    const status = statusConfig[statusKey] ?? {
        label: "Không xác định",
        color: "#6b7280",
    };

    return (
        <Animated.View entering={FadeInDown.delay(index * 100)}>
            <TouchableOpacity style={styles.bookingCard} onPress={() =>{
                setDataBooking(item)
                showDetail()
            }}>
                <View style={styles.barInfoHeader}>
                    <Image
                        source={{ uri: barAvatar }}
                        style={styles.barAvatar}
                    />
                    <View style={styles.barInfoText}>
                        <Text style={styles.barNameText}>{barName}</Text>
                        <View style={styles.barTypeRow}>
                            <Store size={14} color="#64748b" />
                            <Text style={styles.barTypeText}>{item.type}</Text>
                        </View>
                    </View>

                    <View
                        style={[
                            styles.statusBadge,
                            {
                                backgroundColor: status.color,
                            },
                        ]}
                    >
                        <Text style={styles.statusText}>{status.label}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Booking Date & Time */}
                <View style={styles.dateRow}>
                    <Calendar size={16} color="#6366f1" />
                    <Text style={styles.dateText}>
                        {format(startDate, 'EEEE, dd/MM/yyyy', { locale: vi })}
                    </Text>
                </View>

                <View style={styles.timeRow}>
                    <Clock size={16} color="#8b5cf6" />
                    <Text style={styles.timeText}>
                        {format(startDate, 'HH:mm')} → {format(endDate, 'HH:mm')}
                    </Text>
                </View>

                <View style={styles.divider} />

                {/* Thông tin chi tiết */}
                {tables ? (
                    <View style={styles.infoRow}>
                        <MapPin size={16} color="#94a3b8" />
                        <Text style={styles.infoText}>Bàn: {tables}</Text>
                    </View>
                ) : null}

                {item.detailSchedule?.location ? (
                    <View style={styles.infoRow}>
                        <MapPin size={16} color="#94a3b8" />
                        <Text style={styles.infoText} numberOfLines={2}>
                            {item.detailSchedule.location}
                        </Text>
                    </View>
                ) : null}

                {barPhone ? (
                    <View style={styles.infoRow}>
                        <Phone size={16} color="#94a3b8" />
                        <Text style={styles.infoText}>{barPhone}</Text>
                    </View>
                ) : null}

                {item.detailSchedule?.note ? (
                    <View style={styles.infoRow}>
                        <AlertCircle size={16} color="#94a3b8" />
                        <Text style={styles.noteText} numberOfLines={3}>
                            {item.detailSchedule.note}
                        </Text>
                    </View>
                ) : null}

                <View style={styles.footer}>
                    {/* Amount + status */}
                    <View style={styles.amountRow}>
                        <DollarSign size={18} color="#10b981" />
                        <Text style={styles.amountText}>
                            {item.totalAmount.toLocaleString("vi-VN")} ₫
                        </Text>
                        <Text style={styles.paymentStatus}>
                            • {item.paymentStatus}
                        </Text>
                    </View>

                    {/* Actions */}
                    <View style={styles.actionRow}>
                        {isPaymentAble && <TouchableOpacity
                            style={styles.payButton}
                            onPress={onPay}
                        >
                            <Text style={styles.payText}>Thanh toán</Text>
                        </TouchableOpacity>}

                        {isCancelAble && <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onCancel}
                        >
                            <Text style={styles.cancelText}>Huỷ đặt</Text>
                        </TouchableOpacity>}

                    </View>
                </View>

            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    bookingCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    barInfoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    barAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
        backgroundColor: '#e2e8f0',
    },
    barInfoText: {
        flex: 1,
    },
    barNameText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4,
    },
    barTypeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    barTypeText: {
        fontSize: 13,
        color: '#64748b',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    dateText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
        textTransform: 'capitalize',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    timeText: {
        fontSize: 15,
        color: '#475569',
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    divider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#475569',
        flex: 1,
    },
    noteText: {
        fontSize: 14,
        color: '#6366f1',
        fontStyle: 'italic',
        flex: 1,
    },
    footer: {
        marginTop: 3,
        paddingTop: 7,
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
    },

    amountRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 12,
    },

    amountText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#10b981",
    },

    paymentStatus: {
        fontSize: 13,
        color: "#94a3b8",
    },

    actionRow: {
        flexDirection: "row",
        gap: 10,
    },

    payButton: {
        flex: 1,
        backgroundColor: "#10b981",
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: "center",
    },

    payText: {
        color: "#ffffff",
        fontWeight: "600",
        fontSize: 14,
    },

    cancelButton: {
        flex: 1,
        backgroundColor: "#fef2f2",
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#fecaca",
    },

    cancelText: {
        color: "#dc2626",
        fontWeight: "600",
        fontSize: 14,
    },

});