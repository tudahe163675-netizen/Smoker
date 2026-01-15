import React from "react";
import {Modal, View, Text, TouchableOpacity, StyleSheet} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface IConfirmBookingModalProps {
    data: {
        date: string;
        slot: number;
        timeRange?: string;
        location?: string;
        originalPrice: number;
        discount: number;
        totalPrice: number;
        deposit: number;
        remaining: number;
    };
    onClose: () => void;
    onConfirmPayment: () => void;
}

export default function ConfirmBooking({
                                           data,
                                           onClose,
                                           onConfirmPayment,
                                       }: IConfirmBookingModalProps) {
    if (!data) return null;

    const formatMoney = (n: number) =>
        n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " đ";

    return (
        <Modal
            visible={true}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
        <View style={styles.overlay}>
            <View style={styles.modal}>
                    {/* Title */}
                <Text style={styles.title}>Xác nhận đặt lịch</Text>

                    {/* Phần 1: Thông tin sự kiện */}
                    <View style={styles.eventSection}>
                        <View style={styles.eventRow}>
                            <Ionicons name="location-outline" size={18} color="#3b82f6" />
                            <Text style={styles.eventText}>
                                {data.location || "Chưa có địa chỉ"}
                            </Text>
                        </View>
                        <View style={styles.eventRow}>
                            <Ionicons name="time-outline" size={18} color="#3b82f6" />
                            <Text style={styles.eventText}>
                                {data.date} | {data.slot} Slot {data.timeRange ? `(${data.timeRange})` : ''}
                            </Text>
                        </View>
                </View>

                    {/* Divider - Kẻ liền */}
                    <View style={styles.solidDivider} />

                    {/* Phần 2: Chi tiết thanh toán (Hóa đơn style) */}
                    <View style={styles.paymentSection}>
                        <Text style={styles.paymentSectionTitle}>Chi tiết thanh toán</Text>
                        
                        <View style={styles.paymentRow}>
                            <Text style={styles.paymentLabel}>Giá gốc:</Text>
                            <View style={styles.dottedLineContainer}>
                                <View style={styles.dottedLine} />
                                <Text style={styles.paymentValue}>
                                    {formatMoney(data.originalPrice)}
                                </Text>
                            </View>
                </View>

                        {data.discount > 0 && (
                            <View style={styles.paymentRow}>
                                <Text style={styles.paymentLabel}>Giảm giá (Combo):</Text>
                                <View style={styles.dottedLineContainer}>
                                    <View style={styles.dottedLine} />
                                    <Text style={[styles.paymentValue, styles.discountValue]}>
                                        -{formatMoney(data.discount)}
                                    </Text>
                                </View>
                </View>
                        )}

                        <View style={styles.paymentRow}>
                            <Text style={[styles.paymentLabel, styles.totalLabel]}>Tổng cộng:</Text>
                            <View style={styles.dottedLineContainer}>
                                <View style={styles.dottedLine} />
                                <Text style={[styles.paymentValue, styles.totalValue]}>
                                    {formatMoney(data.totalPrice)}
                                </Text>
                            </View>
                        </View>
                </View>

                    {/* Divider - Kẻ nét đứt */}
                    <View style={styles.dashedDivider} />

                    {/* Phần 3: Cần thanh toán ngay */}
                    <View style={styles.depositSection}>
                        <View style={styles.depositRow}>
                            <Ionicons name="cash-outline" size={20} color="#10b981" />
                            <View style={styles.depositInfo}>
                                <Text style={styles.depositLabel}>Cần thanh toán ngay (Cọc):</Text>
                                <Text style={styles.depositAmount}>
                                    {formatMoney(data.deposit)}
                                </Text>
                            </View>
                        </View>
                        {data.remaining > 0 && (
                            <Text style={styles.remainingText}>
                                (Phần còn lại {formatMoney(data.remaining)} thanh toán trực tiếp cho DJ)
                            </Text>
                        )}
                </View>

                    {/* Action Buttons */}
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                            <Text style={styles.cancelText}>Hủy</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.confirmBtn} onPress={onConfirmPayment}>
                            <Text style={styles.confirmText}>
                                THANH TOÁN {formatMoney(data.deposit)}
                            </Text>
                    </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modal: {
        width: "100%",
        maxWidth: 400,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 20,
        textAlign: "center",
    },
    // Phần 1: Thông tin sự kiện
    eventSection: {
        marginBottom: 16,
    },
    eventRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
    },
    eventText: {
        fontSize: 14,
        color: "#374151",
        flex: 1,
    },
    // Divider
    solidDivider: {
        height: 1,
        backgroundColor: "#e5e7eb",
        marginVertical: 16,
    },
    dashedDivider: {
        height: 1,
        borderTopWidth: 1,
        borderTopColor: "#d1d5db",
        borderStyle: "dashed",
        marginVertical: 16,
    },
    // Phần 2: Chi tiết thanh toán
    paymentSection: {
        backgroundColor: "#f9fafb",
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
    },
    paymentSectionTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 12,
    },
    paymentRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    paymentLabel: {
        fontSize: 14,
        color: "#6b7280",
    },
    totalLabel: {
        fontWeight: "600",
        color: "#374151",
    },
    dottedLineContainer: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        marginLeft: 8,
    },
    dottedLine: {
        flex: 1,
        height: 1,
        borderBottomWidth: 1,
        borderBottomColor: "#d1d5db",
        borderStyle: "dashed",
        marginRight: 8,
    },
    paymentValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
    },
    discountValue: {
        color: "#ef4444",
    },
    totalValue: {
        fontSize: 16,
        fontWeight: "700",
        color: "#3b82f6",
    },
    // Phần 3: Cần thanh toán ngay
    depositSection: {
        marginBottom: 20,
    },
    depositRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 8,
    },
    depositInfo: {
        flex: 1,
    },
    depositLabel: {
        fontSize: 14,
        color: "#6b7280",
        marginBottom: 4,
    },
    depositAmount: {
        fontSize: 20,
        fontWeight: "700",
        color: "#10b981",
    },
    remainingText: {
        fontSize: 12,
        color: "#6b7280",
        fontStyle: "italic",
        marginLeft: 32,
    },
    // Buttons
    buttonRow: {
        flexDirection: "row",
        gap: 12,
        marginTop: 8,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        backgroundColor: "#f3f4f6",
        borderRadius: 8,
        alignItems: "center",
    },
    cancelText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#374151",
    },
    confirmBtn: {
        flex: 2,
        paddingVertical: 14,
        backgroundColor: "#10b981",
        borderRadius: 8,
        alignItems: "center",
    },
    confirmText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 15,
        textAlign: "center",
    },
});
