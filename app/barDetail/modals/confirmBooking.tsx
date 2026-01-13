import React from "react";
import {Modal, View, Text, TouchableOpacity, StyleSheet} from "react-native";

interface IConfirmBookingModalProps {
    data: any;
    onClose: () => void;
    onConfirmPayment: () => void;
}

export default function ConfirmBooking({
                                           data,
                                           onClose,
                                           onConfirmPayment,
                                       }: IConfirmBookingModalProps) {
    if (!data) return null;

    return (
        <View style={styles.overlay}>
            <View style={styles.modal}>
                <Text style={styles.title}>Xác nhận đặt bàn</Text>

                {data.combo && (
                    <View style={styles.row}>
                        <Text style={styles.label}>Combo: </Text>
                        <Text style={styles.value}>{data.combo.comboName}</Text>
                    </View>
                )}

                {data.voucherCode && (
                    <View style={styles.row}>
                        <Text style={styles.label}>Voucher: </Text>
                        <Text style={styles.value}>{data.voucherCode}</Text>
                    </View>
                )}

                {data.voucherDiscount > 0 && (
                    <View style={styles.row}>
                        <Text style={styles.label}>Giảm giá: </Text>
                        <Text style={[styles.value, {color: "#10b981"}]}>
                            -{data.voucherDiscount.toLocaleString()}₫
                        </Text>
                    </View>
                )}

                <View style={styles.row}>
                    <Text style={styles.label}>Bàn: </Text>
                    <Text style={styles.value}>{data.tables?.map((t) => t.tableName).join(", ") || "N/A"}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Tổng tiền:</Text>
                    <Text style={[styles.value, {fontSize: 16, fontWeight: "700", color: "#ef4444"}]}>
                        {data.totalAmount.toLocaleString()}₫
                    </Text>
                </View>

                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                        <Text style={styles.cancelText}>Quay lại</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.confirmBtn} onPress={onConfirmPayment}>
                        <Text style={styles.confirmText}>Thanh toán</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
    },
    modal: {
        width: "85%",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 7,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 6,
    },
    label: {
        fontSize: 14,
        color: "#444",
    },
    value: {
        fontSize: 14,
        fontWeight: "600",
        maxWidth: "50%",
        textAlign: "right"
    },
    buttonRow: {
        marginTop: 7,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    cancelBtn: {
        width: "45%",
        paddingVertical: 12,
        backgroundColor: "#eee",
        borderRadius: 8,
        alignItems: "center",
    },
    cancelText: {
        fontWeight: "600",
    },
    confirmBtn: {
        width: "50%",
        paddingVertical: 12,
        backgroundColor: "#3A57E8",
        borderRadius: 8,
        alignItems: "center",
    },
    confirmText: {
        color: "#fff",
        fontWeight: "700",
        textAlign: "center",
    },
});
