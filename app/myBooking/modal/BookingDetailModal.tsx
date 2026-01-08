import {
    Modal,
    ScrollView,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Pressable,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {SafeAreaView} from "react-native-safe-area-context";
import {format} from 'date-fns';
import {vi} from 'date-fns/locale';
import {useRouter} from "expo-router";

interface BookingDetailModalProps {
    dataBooking: any;
    onClose: () => void;
    visible: boolean;
}

export default function BookingDetailModal({
                                               visible,
                                               dataBooking,
                                               onClose,
                                           }: BookingDetailModalProps) {
    const router = useRouter();
    if (!visible) return (<></>);
    const isBar = dataBooking.type === "BarTable"
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
    const statusKey = dataBooking.scheduleStatus.toLowerCase();
    const status = statusConfig[statusKey] ?? {
        label: "Không xác định",
        color: "#6b7280",
    };

    const listSlot = [
        {id: 1, text: "0h–2h"},
        {id: 2, text: "2h–4h"},
        {id: 3, text: "4h–6h"},
        {id: 4, text: "6h–8h"},
        {id: 5, text: "8h–10h"},
        {id: 6, text: "10h–12h"},
        {id: 7, text: "12h–14h"},
        {id: 8, text: "14h–16h"},
        {id: 9, text: "16h–18h"},
        {id: 10, text: "18h–20h"},
        {id: 11, text: "20h–22h"},
        {id: 12, text: "22h–24h"},
    ]

    const startDate = new Date(dataBooking.startTime);
    const bookingDate = new Date(dataBooking.bookingDate);
    const address = isBar ? dataBooking.receiverInfo.address ? (JSON.parse(dataBooking.receiverInfo.address)).fullAddress : "" : dataBooking.detailSchedule.location;
    const bookingTimeText = isBar
        ? format(bookingDate, "EEEE, dd/MM/yyyy, HH:mm", { locale: vi })
        : format(bookingDate, "EEEE, dd/MM/yyyy", { locale: vi });
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            {/* Backdrop */}
            <Pressable style={styles.backdrop} onPress={onClose}/>

            <SafeAreaView style={styles.wrapper}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>
                            Thông tin chi tiết
                        </Text>
                        <TouchableOpacity onPress={onClose} hitSlop={10}>
                            <Ionicons name="close" size={22} color="#334155"/>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        contentContainerStyle={styles.content}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Quán */}
                        <View style={styles.card}>
                            <View style={styles.row}>
                                <Ionicons
                                    name={isBar ? "business-outline" : "headset-outline"}
                                    size={20}
                                    color="#4f46e5"
                                />
                                <View style={{marginLeft: 8, flex: 1}}>
                                    <Text style={styles.label}>{isBar ? "Quán bar" : "Tên"}</Text>
                                    <View style={styles.row}>
                                        <Text style={styles.valueBold}>
                                            {dataBooking.receiverInfo.name}
                                        </Text>
                                        <Ionicons
                                            name="open-outline"
                                            size={16}
                                            color="#4f46e5"
                                            style={{padding: 6}}
                                            onPress={() => {
                                                onClose()
                                                router.push({
                                                    pathname: '/user',
                                                    params: { id: dataBooking.receiverInfo.entityAccountId }
                                                });
                                            }}
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Trạng thái */}
                        <View style={styles.rowBetween}>
                            <Text style={styles.label}>Trạng thái</Text>
                            <View
                                style={[
                                    styles.statusBadge,
                                    {borderColor: status.color},
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

                        {/* Ngày đặt */}
                        <View style={styles.infoRow}>
                            <Ionicons
                                name="calendar-outline"
                                size={18}
                                color="#64748b"
                            />
                            <View style={{marginLeft: 10}}>
                                <Text style={styles.label}>Ngày đặt</Text>
                                <Text style={styles.valueBold}>
                                    {format(startDate, 'EEEE, dd/MM/yyyy', {locale: vi})}
                                </Text>
                            </View>
                        </View>

                        {/* Ngày biểu diễn */}
                        <View style={styles.infoRow}>
                            <Ionicons
                                name="calendar-outline"
                                size={18}
                                color="#64748b"
                            />
                            <View style={{marginLeft: 10}}>
                                <Text style={styles.label}>Ngày biểu diễn</Text>
                                <Text style={styles.valueBold}>
                                    {bookingTimeText}
                                </Text>
                            </View>
                        </View>

                        {/* Địa điểm */}
                        <View style={styles.infoRow}>
                            <Ionicons
                                name="location-outline"
                                size={18}
                                color="#64748b"
                            />
                            <View style={{marginLeft: 10, flex: 1}}>
                                <Text style={styles.label}>
                                    Địa điểm
                                </Text>
                                <Text style={styles.value}>
                                    {address ?? "Đang cập nhật"}
                                </Text>
                            </View>
                        </View>

                        {/* Ghi chú */}
                        {
                            dataBooking.detailSchedule.Note && (
                                <View style={styles.infoRow}>
                                    <Ionicons
                                        name="document-text-outline"
                                        size={18}
                                        color="#64748b"
                                    />
                                    <View style={{marginLeft: 10}}>
                                        <Text style={styles.label}>
                                            Ghi chú
                                        </Text>
                                        <Text style={styles.value}>
                                            {dataBooking.detailSchedule.Note ?? "Đang cập nhật"}
                                        </Text>
                                    </View>
                                </View>
                            )
                        }

                        {
                            isBar ?
                                <>
                                    {/* Danh sách bàn */}
                                    <View style={styles.section}>
                                        <Text style={styles.label}>Danh sách bàn</Text>

                                        <View style={styles.tableBox}>
                                            {dataBooking.detailSchedule.table &&
                                                Object.values(dataBooking.detailSchedule.table).map((table: any, index) => (
                                                    <Text key={index} style={styles.valueBold}>
                                                        {table.tableName}
                                                    </Text>
                                                ))}
                                        </View>
                                    </View>
                                </> :
                                <>
                                    {/* Khung giờ */}
                                    <View style={styles.section}>
                                        <Text style={styles.label}>Khung giờ</Text>

                                        <View style={styles.tableBox}>
                                            {dataBooking.detailSchedule.slots.map((slotId: number) => {
                                                const slot = listSlot.find(s => s.id === slotId);
                                                if (!slot) return null;

                                                return (
                                                    <Text key={slotId} style={styles.valueBold}>
                                                        {slot.text}
                                                    </Text>
                                                );
                                            })}
                                        </View>
                                    </View>
                                </>
                        }

                        {/*<View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>
                                Tổng tiền cọc
                            </Text>
                            <Text
                                style={styles.total}>{dataBooking.detailSchedule.offeredPrice.toLocaleString('vi-VN')} ₫</Text>
                        </View>*/}

                        {/* Tổng tiền */}
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Tổng tiền</Text>
                            <Text style={styles.deposit}>{dataBooking.totalAmount.toLocaleString('vi-VN')} ₫</Text>
                        </View>

                        <Text style={styles.bookingCode}>
                            Mã đặt: {dataBooking.bookedScheduleId}
                        </Text>
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
    card: {
        backgroundColor: "#f8fafc",
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
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
        borderColor: "#22c55e",
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    statusText: {
        fontSize: 12,
        color: "#22c55e",
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
    total: {
        fontSize: 16,
        fontWeight: "600",
        color: "#6366f1",
    },
    bookingCode: {
        fontSize: 12,
        color: "#64748b",
        marginBottom: 7
    },
});
