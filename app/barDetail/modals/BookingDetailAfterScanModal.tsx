import React, {useState} from "react";
import {
    Modal,
    ScrollView,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Pressable,
    ActivityIndicator,
    Alert,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {SafeAreaView} from "react-native-safe-area-context";
import {format} from 'date-fns';
import {vi} from 'date-fns/locale';
import {BarApiService} from "@/services/barApi";
import {useAuth} from "@/hooks/useAuth";
import {BookingItem} from "@/types/tableType";

interface BookingDetailAfterScanModalProps {
    visible: boolean;
    booking: BookingItem | null;
    onClose: () => void;
    onConfirmSuccess?: () => void;
    barId: string;
}

export default function BookingDetailAfterScanModal({
    visible,
    booking,
    onClose,
    onConfirmSuccess,
    barId,
}: BookingDetailAfterScanModalProps) {
    const {authState} = useAuth();
    const barApi = new BarApiService(authState.token!);
    const [loading, setLoading] = useState(false);

    if (!visible || !booking) return null;

    const startDate = new Date(booking.StartTime);
    const bookingDate = new Date(booking.BookingDate);
    const endDate = new Date(booking.EndTime);

    const canConfirmArrival = booking.ScheduleStatus === 'Confirmed';
    const canEndBooking = booking.ScheduleStatus === 'Arrived';

    const handleConfirmArrival = async () => {
        if (!canConfirmArrival) return;

        setLoading(true);
        try {
            const response = await barApi.confirmArrival(booking.BookedScheduleId);
            if (response.success) {
                Alert.alert("Thành công", "Đã xác nhận khách đến quán", [
                    {
                        text: "OK",
                        onPress: () => {
                            onConfirmSuccess?.();
                            onClose();
                        },
                    },
                ]);
            } else {
                Alert.alert("Lỗi", response.message || "Không thể xác nhận");
            }
        } catch (error) {
            console.error("Error confirming arrival:", error);
            Alert.alert("Lỗi", "Có lỗi xảy ra. Vui lòng thử lại!");
        } finally {
            setLoading(false);
        }
    };

    const handleEndBooking = async () => {
        if (!canEndBooking) return;

        Alert.alert(
            "Xác nhận",
            "Bạn có chắc chắn muốn kết thúc booking này?",
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xác nhận",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const response = await barApi.endBooking(booking.BookedScheduleId);
                            if (response.success) {
                                Alert.alert("Thành công", "Đã kết thúc booking", [
                                    {
                                        text: "OK",
                                        onPress: () => {
                                            onConfirmSuccess?.();
                                            onClose();
                                        },
                                    },
                                ]);
                            } else {
                                Alert.alert("Lỗi", response.message || "Không thể kết thúc booking");
                            }
                        } catch (error) {
                            console.error("Error ending booking:", error);
                            Alert.alert("Lỗi", "Có lỗi xảy ra. Vui lòng thử lại!");
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const statusConfig: Record<string, {label: string; color: string}> = {
        confirmed: {
            label: "Đã xác nhận",
            color: "#22c55e",
        },
        pending: {
            label: "Chờ xác nhận",
            color: "#f59e0b",
        },
        arrived: {
            label: "Đã đến quán",
            color: "#3b82f6",
        },
        ended: {
            label: "Đã kết thúc",
            color: "#6b7280",
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

    const statusKey = booking.ScheduleStatus.toLowerCase();
    const status = statusConfig[statusKey] ?? {
        label: "Không xác định",
        color: "#6b7280",
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <Pressable style={styles.backdrop} onPress={onClose} />
            <SafeAreaView style={styles.wrapper}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Chi tiết đặt bàn</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={10}>
                            <Ionicons name="close" size={22} color="#334155" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        contentContainerStyle={styles.content}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Trạng thái */}
                        <View style={styles.rowBetween}>
                            <Text style={styles.label}>Trạng thái</Text>
                            <View
                                style={[
                                    styles.statusBadge,
                                    {borderColor: status.color, backgroundColor: `${status.color}15`},
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.statusText,
                                        {color: status.color},
                                    ]}
                                >
                                    {status.label}
                                </Text>
                            </View>
                        </View>

                        {/* Mã booking */}
                        <View style={styles.infoRow}>
                            <Ionicons name="receipt-outline" size={18} color="#64748b" />
                            <View style={{marginLeft: 10}}>
                                <Text style={styles.label}>Mã đặt bàn</Text>
                                <Text style={styles.valueBold}>{booking.BookedScheduleId}</Text>
                            </View>
                        </View>

                        {/* Ngày đặt */}
                        <View style={styles.infoRow}>
                            <Ionicons name="calendar-outline" size={18} color="#64748b" />
                            <View style={{marginLeft: 10}}>
                                <Text style={styles.label}>Ngày đặt</Text>
                                <Text style={styles.valueBold}>
                                    {format(startDate, 'EEEE, dd/MM/yyyy', {locale: vi})}
                                </Text>
                            </View>
                        </View>

                        {/* Thời gian */}
                        <View style={styles.infoRow}>
                            <Ionicons name="time-outline" size={18} color="#64748b" />
                            <View style={{marginLeft: 10}}>
                                <Text style={styles.label}>Thời gian</Text>
                                <Text style={styles.valueBold}>
                                    {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
                                </Text>
                            </View>
                        </View>

                        {/* Danh sách bàn */}
                        {booking.detailSchedule?.Table && (
                            <View style={styles.section}>
                                <Text style={styles.label}>Danh sách bàn</Text>
                                <View style={styles.tableBox}>
                                    {Object.values(booking.detailSchedule.Table).map((table: any, index) => (
                                        <Text key={index} style={styles.valueBold}>
                                            {table.TableName}
                                        </Text>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Ghi chú */}
                        {booking.detailSchedule?.Note && (
                            <View style={styles.infoRow}>
                                <Ionicons name="document-text-outline" size={18} color="#64748b" />
                                <View style={{marginLeft: 10, flex: 1}}>
                                    <Text style={styles.label}>Ghi chú</Text>
                                    <Text style={styles.value}>{booking.detailSchedule.Note}</Text>
                                </View>
                            </View>
                        )}

                        {/* Tổng tiền */}
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Tổng tiền</Text>
                            <Text style={styles.deposit}>
                                {booking.TotalAmount.toLocaleString('vi-VN')} ₫
                            </Text>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actionContainer}>
                            {canConfirmArrival && (
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.confirmButton]}
                                    onPress={handleConfirmArrival}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <>
                                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                            <Text style={styles.actionButtonText}>Xác nhận đã tới quán</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}

                            {canEndBooking && (
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.endButton]}
                                    onPress={handleEndBooking}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <>
                                            <Ionicons name="stop-circle" size={20} color="#fff" />
                                            <Text style={styles.actionButtonText}>Kết thúc booking</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}

                            {!canConfirmArrival && !canEndBooking && (
                                <View style={styles.noActionContainer}>
                                    <Ionicons name="information-circle-outline" size={24} color="#64748b" />
                                    <Text style={styles.noActionText}>
                                        {booking.ScheduleStatus === 'Ended' 
                                            ? 'Booking đã kết thúc'
                                            : 'Không có hành động nào khả dụng'}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.4)",
    },
    wrapper: {
        flex: 1,
        justifyContent: "flex-end",
    },
    container: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: "90%",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#0f172a",
    },
    content: {
        padding: 16,
    },
    rowBetween: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        color: "#64748b",
        marginBottom: 2,
        fontWeight: "500",
    },
    value: {
        fontSize: 14,
        color: "#334155",
    },
    valueBold: {
        fontSize: 14,
        fontWeight: "600",
        color: "#0f172a",
    },
    statusBadge: {
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
    },
    infoRow: {
        flexDirection: "row",
        marginBottom: 16,
    },
    section: {
        marginBottom: 16,
    },
    tableBox: {
        backgroundColor: "#f1f5f9",
        borderRadius: 10,
        padding: 12,
        marginTop: 6,
    },
    priceRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
        marginTop: 8,
    },
    priceLabel: {
        fontSize: 14,
        fontWeight: "500",
        color: "#0f172a",
    },
    deposit: {
        fontSize: 16,
        fontWeight: "600",
        color: "#16a34a",
    },
    actionContainer: {
        marginTop: 20,
        gap: 12,
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        gap: 8,
    },
    confirmButton: {
        backgroundColor: "#3b82f6",
    },
    endButton: {
        backgroundColor: "#6b7280",
    },
    actionButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    noActionContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 20,
        gap: 8,
    },
    noActionText: {
        fontSize: 14,
        color: "#64748b",
    },
});


