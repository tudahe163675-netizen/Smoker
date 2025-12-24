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
                <Text style={styles.title}>Xác nhận đặt lịch</Text>

                <View style={styles.noteBox}>
                    <Text style={styles.noteTitle}>Lưu ý:</Text>
                    <Text style={styles.note}>• Bạn chỉ cần thanh toán cọc 50.000 đ để giữ chỗ</Text>
                    <Text style={styles.note}>• Số tiền còn lại phải thanh toán trực tiếp với DJ</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Ngày:</Text>
                    <Text style={styles.value}>{data.date}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Số slot:</Text>
                    <Text style={styles.value}>{data.slot} slot</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Tổng giá:</Text>
                    <Text style={styles.value}>{data.totalPrice}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Tiền cọc:</Text>
                    <Text style={styles.value}>{data.deposit}</Text>
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
        marginBottom: 16,
    },
    noteBox: {
        backgroundColor: "#F4F6FF",
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    noteTitle: {
        fontWeight: "600",
        marginBottom: 6,
    },
    note: {
        fontSize: 13,
        color: "#555",
        marginBottom: 2,
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
    },
    buttonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20,
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
