import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CancelBookingModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function CancelBookingModal({
                                       visible,
                                       onClose,
                                       onConfirm,
                                   }: CancelBookingModalProps) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.modal}>
                   <View style={{alignItems:'center'}}>
                       <Ionicons
                           name="warning-outline"
                           size={36}
                           color="#dc2626"
                           style={{ marginBottom: 8 }}
                       />

                       <Text style={styles.title}>Huỷ đặt bàn?</Text>
                       <Text style={styles.desc}>
                           Thao tác này không thể hoàn tác. Bạn có chắc chắn muốn
                           huỷ lịch đặt này không?
                       </Text>
                   </View>

                    <View style={styles.row}>
                        <TouchableOpacity
                            style={styles.outlineBtn}
                            onPress={onClose}
                        >
                            <Text style={styles.outlineText}>Quay lại</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.dangerBtn}
                            onPress={onConfirm}
                        >
                            <Text style={styles.dangerText}>Huỷ đặt</Text>
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
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modal: {
        width: "100%",
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 8,
        color: "#0f172a",
    },
    desc: {
        fontSize: 14,
        color: "#64748b",
        textAlign: "center",
        marginBottom: 16,
    },
    amount: {
        fontSize: 24,
        fontWeight: "800",
        color: "#10b981",
        marginVertical: 8,
    },
    row: {
        flexDirection: "row",
        gap: 12
    },
    outlineBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        alignItems: "center",
    },
    outlineText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#334155",
    },
    dangerBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: "#dc2626",
        alignItems: "center",
    },
    dangerText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 14,
    },
    primaryBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: "#10b981",
        alignItems: "center",
    },
    primaryText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 14,
    },
});
