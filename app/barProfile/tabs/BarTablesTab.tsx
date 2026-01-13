import React, {useEffect, useState} from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Pressable,
    Dimensions,
    Platform,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {LinearGradient} from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {BarTable} from "@/types/tableType";
import BookingModal from "@/app/barDetail/modals/bookingModal";
import {BarApiService} from "@/services/barApi";
import {useAuth} from "@/hooks/useAuth";

const {width} = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

interface BarTablesTabProps {
    barId: string; // barPageId for fetching combos and tables
    barDetail: any;
    tables: BarTable[];
    bookedTables: any[];
    fetchBookedTables: (entityAccountId: string, date: string) => void;
    entityAccountId?: string; // entityAccountId for fetching booked tables
}

// Table Card Component
const TableCard: React.FC<{
    item: BarTable;
    isSelected: boolean;
    isBooked: boolean;
    onSelect: (table: BarTable) => void;
}> = ({item, isSelected, isBooked, onSelect}) => {
    const handlePress = () => {
        if (!isBooked) {
            onSelect(item);
        }
    };

    return (
        <Pressable
            onPress={handlePress}
            disabled={isBooked}
            style={[
                styles.tableCard,
                isBooked && styles.tableCardBooked,
                isSelected && styles.tableCardSelected,
                {borderColor: isSelected ? item.color : "transparent"},
            ]}
        >
            <View style={styles.tableIconSection}>
                <LinearGradient
                    colors={
                        isBooked
                            ? ["#94a3b8", "#cbd5e1"]
                            : isSelected
                                ? [item.color, `${item.color}dd`]
                                : [`${item.color}40`, `${item.color}20`]
                    }
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.tableIconGradient}
                >
                    <Ionicons
                        name={isBooked ? "lock-closed" : "beer"}
                        size={28}
                        color={isBooked ? "#64748b" : isSelected ? "#fff" : item.color}
                    />
                </LinearGradient>

                {isSelected && !isBooked && (
                    <View style={styles.checkBadge}>
                        <Ionicons name="checkmark-circle" size={24} color="#10b981"/>
                    </View>
                )}
            </View>

            <View style={styles.tableInfo}>
                <Text
                    style={[
                        styles.tableName,
                        isBooked && styles.tableNameBooked,
                        isSelected && styles.tableNameSelected,
                    ]}
                    numberOfLines={1}
                >
                    {item.tableName}
                </Text>

                <View style={styles.tableTypeBadge}>
                    <Text
                        style={[
                            styles.tableType,
                            isBooked && styles.tableTextBooked,
                            isSelected && styles.tableTypeSelected,
                        ]}
                    >
                        {item.tableTypeName}
                    </Text>
                </View>
            </View>

            {isBooked && (
                <View style={styles.bookedOverlay}>
                    <View style={styles.bookedBadge}>
                        <Ionicons name="lock-closed" size={12} color="#fff"/>
                        <Text style={styles.bookedText}>Đã đặt</Text>
                    </View>
                </View>
            )}
        </Pressable>
    );
};

const BarTablesTab: React.FC<BarTablesTabProps> = ({
    barId, // barPageId
    barDetail,
    tables,
    bookedTables,
    fetchBookedTables,
    entityAccountId, // entityAccountId for booked tables
}) => {
    const {authState} = useAuth();
    const barApi = new BarApiService(authState.token!);
    const insets = useSafeAreaInsets();
    
    const [selectedTables, setSelectedTables] = useState<BarTable[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [bookingData, setBookingData] = useState<any>(null);

    useEffect(() => {
        // Use entityAccountId for fetching booked tables (not barPageId)
        const accountId = entityAccountId || barDetail?.entityAccountId;
        if (accountId) {
            fetchBookedTables(accountId, selectedDate.toISOString().split("T")[0]);
        }
    }, [entityAccountId, barDetail?.entityAccountId, selectedDate, fetchBookedTables]);


    const handleTableSelect = (table: BarTable) => {
        setSelectedTables((prev) => {
            const isSelected = prev.some((t) => t.tableId === table.tableId);
            if (isSelected) {
                return prev.filter((t) => t.tableId !== table.tableId);
            } else {
                return [table]; // Only allow one table selection
            }
        });
    };

    const isTableBooked = (tableId: string): boolean => {
        if (!bookedTables || bookedTables.length === 0) return false;

        return bookedTables.some((booking) => {
            if (booking.ScheduleStatus === "Canceled" || booking.ScheduleStatus === "Rejected") 
                return false;

            const bookingDateObj = new Date(booking.BookingDate);
            const selectedDateObj = new Date(selectedDate);
            if (bookingDateObj.toDateString() !== selectedDateObj.toDateString()) {
                return false;
            }

            return Object.keys(booking.detailSchedule?.Table || {}).includes(tableId);
        });
    };

    const handleBookingPress = () => {
        if (selectedTables.length === 0) {
            Alert.alert("Thông báo", "Vui lòng chọn một bàn!");
            return;
        }

        const data = {
            receiverId: barDetail.entityAccountId,
            tables: selectedTables.map((t) => ({
                id: t.tableId,
                tableName: t.tableName,
                price: 0,
            })),
            selectedDate: selectedDate.toISOString().split("T")[0],
            note: "",
            startTime: `${selectedDate.toISOString().split("T")[0]}T00:00:00.000Z`,
            endTime: `${selectedDate.toISOString().split("T")[0]}T23:59:59.999Z`,
            paymentStatus: "Pending",
            scheduleStatus: "Pending",
        };
        setBookingData(data);
        setModalVisible(true);
    };

    return (
        <View style={styles.container}>
            {/* Remove nested ScrollView - let parent ScrollView handle scrolling */}
            <View style={styles.contentContainer}>
                {/* Date Picker Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="calendar" size={20} color="#3b82f6" />
                        <Text style={styles.sectionTitle}>Chọn ngày</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
                        <Text style={styles.dateButtonText}>
                            {selectedDate.toLocaleDateString("vi-VN", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#64748b" />
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            value={selectedDate}
                            mode="date"
                            display={Platform.OS === "ios" ? "spinner" : "default"}
                            minimumDate={new Date()}
                            onChange={(event, date) => {
                                if (Platform.OS === "android") {
                                    setShowDatePicker(false);
                                }
                                if (date) {
                                    setSelectedDate(date);
                                    setSelectedTables([]);
                                    if (Platform.OS === "ios") {
                                        setShowDatePicker(false);
                                    }
                                }
                            }}
                        />
                    )}
                </View>

                {/* Tables Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="beer" size={20} color="#f59e0b" />
                        <Text style={styles.sectionTitle}>Chọn bàn</Text>
                    </View>

                    {selectedTables.length > 0 && (
                        <View style={styles.selectedInfo}>
                            <LinearGradient
                                colors={["#3b82f6", "#2563eb"]}
                                start={{x: 0, y: 0}}
                                end={{x: 1, y: 0}}
                                style={styles.selectedInfoGradient}
                            >
                                <Ionicons name="checkmark-circle" size={20} color="#fff"/>
                                <Text style={styles.selectedInfoText}>
                                    Đã chọn {selectedTables.length} bàn
                                </Text>
                            </LinearGradient>
                        </View>
                    )}

                    {!tables || tables.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="beer-outline" size={64} color="#cbd5e1"/>
                            <Text style={styles.emptyText}>Chưa có bàn nào</Text>
                        </View>
                    ) : (
                        <View style={styles.tableGrid}>
                            {tables.map((item) => {
                                const isBooked = isTableBooked(item.tableId);
                                const isSelected = selectedTables.some(
                                    (t) => t.tableId === item.tableId
                                );

                                return (
                                    <View key={item.tableId} style={styles.tableGridItem}>
                                        <TableCard
                                            item={item}
                                            isSelected={isSelected}
                                            isBooked={isBooked}
                                            onSelect={handleTableSelect}
                                        />
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>
            </View>

            {/* Floating Book Button */}
            {selectedTables.length > 0 && (
                <View style={[styles.bookingButtonContainer, { bottom: 20 + insets.bottom }]}>
                    <Pressable
                        style={styles.bookingButton}
                        onPress={handleBookingPress}
                        android_ripple={{color: "rgba(255,255,255,0.3)"}}
                    >
                        <LinearGradient
                            colors={["#3b82f6", "#2563eb"]}
                            start={{x: 0, y: 0}}
                            end={{x: 1, y: 0}}
                            style={styles.bookingButtonGradient}
                        >
                            <View style={styles.bookingButtonIcon}>
                                <Ionicons name="calendar" size={24} color="#fff"/>
                            </View>
                            <View style={styles.bookingButtonContent}>
                                <Text style={styles.bookingButtonText}>Đặt bàn</Text>
                            </View>
                            <Ionicons name="arrow-forward" size={20} color="#fff"/>
                        </LinearGradient>
                    </Pressable>
                </View>
            )}

            <BookingModal 
                visible={modalVisible} 
                dataBooking={bookingData} 
                onClose={() => {
                    setModalVisible(false);
                }} 
                clearData={() => {
                    setSelectedTables([]);
                }}
                barId={barId}
                tableId={selectedTables[0]?.tableId || ""}
                bookingDate={selectedDate.toISOString().split("T")[0]}
                selectedTable={selectedTables[0]}
            />
        </View>
    );
};

export default BarTablesTab;

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#f8fafc",
        minHeight: '100%',
    },
    contentContainer: {
        paddingBottom: 100, // Extra space for floating button
    },
    section: {
        backgroundColor: "#fff",
        marginTop: 12,
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
        gap: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0f172a",
    },
    dateButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8fafc",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    dateButtonText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: "#1f2937",
        fontWeight: "500",
    },
    loadingContainer: {
        paddingVertical: 40,
        alignItems: "center",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: "#64748b",
        fontWeight: "500",
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: "center",
    },
    emptyText: {
        fontSize: 15,
        color: "#94a3b8",
        marginTop: 12,
        fontWeight: "500",
    },
    comboScrollContainer: {
        paddingVertical: 8,
    },
    comboCard: {
        width: 200,
        marginRight: 12,
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 2,
        borderColor: "#e5e7eb",
    },
    comboCardSelected: {
        borderColor: "#3b82f6",
    },
    comboCardGradient: {
        padding: 12,
        minHeight: 180,
    },
    comboCardContent: {
        flex: 1,
        position: "relative",
    },
    comboCardTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 4,
    },
    comboCardTitleSelected: {
        color: "#fff",
    },
    comboCardDescription: {
        fontSize: 12,
        color: "#64748b",
        marginBottom: 8,
        minHeight: 32,
    },
    comboCardDescriptionSelected: {
        color: "rgba(255,255,255,0.9)",
    },
    comboCardPriceRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 4,
    },
    comboCardOriginalPrice: {
        fontSize: 12,
        color: "#94a3b8",
        textDecorationLine: "line-through",
    },
    comboCardOriginalPriceSelected: {
        color: "rgba(255,255,255,0.7)",
    },
    comboCardSalePrice: {
        fontSize: 18,
        fontWeight: "700",
        color: "#ef4444",
    },
    comboCardSalePriceSelected: {
        color: "#fff",
    },
    comboCardCheckBadge: {
        position: "absolute",
        top: -8,
        right: -8,
        backgroundColor: "#10b981",
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#fff",
    },
    selectedComboInfo: {
        marginTop: 16,
        borderRadius: 16,
        overflow: "hidden",
    },
    selectedComboInfoGradient: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        paddingHorizontal: 20,
        gap: 10,
    },
    selectedComboInfoText: {
        fontSize: 15,
        color: "#fff",
        fontWeight: "700",
    },
    selectedInfo: {
        marginBottom: 16,
        borderRadius: 16,
        overflow: "hidden",
    },
    selectedInfoGradient: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        paddingHorizontal: 20,
        gap: 10,
    },
    selectedInfoText: {
        fontSize: 15,
        color: "#fff",
        fontWeight: "700",
    },
    tableGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginHorizontal: -6,
    },
    tableGridItem: {
        width: "50%",
        paddingHorizontal: 6,
        marginBottom: 12,
    },
    tableCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 14,
        borderWidth: 2,
        borderColor: "transparent",
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowOffset: {width: 0, height: 2},
        shadowRadius: 8,
        elevation: 4,
        position: "relative",
    },
    tableCardBooked: {
        backgroundColor: "#f8fafc",
        opacity: 0.7,
    },
    tableCardSelected: {
        borderWidth: 3,
        backgroundColor: "#eff6ff",
    },
    tableIconSection: {
        position: "relative",
        marginBottom: 12,
    },
    tableIconGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: "center",
        alignItems: "center",
    },
    checkBadge: {
        position: "absolute",
        top: -4,
        right: 0,
    },
    tableInfo: {
        marginBottom: 12,
    },
    tableName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 6,
    },
    tableNameBooked: {
        color: "#94a3b8",
    },
    tableNameSelected: {
        color: "#1e40af",
    },
    tableTypeBadge: {
        alignSelf: "flex-start",
        backgroundColor: "#f1f5f9",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    tableType: {
        fontSize: 11,
        color: "#64748b",
        fontWeight: "600",
        textTransform: "uppercase",
    },
    tableTypeSelected: {
        color: "#3b82f6",
    },
    tableTextBooked: {
        color: "#94a3b8",
    },
    bookedOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(248, 250, 252, 0.6)",
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    bookedBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: "#64748b",
        borderRadius: 20,
    },
    bookedText: {
        fontSize: 12,
        color: "#fff",
        fontWeight: "700",
    },
    bookingButtonContainer: {
        position: "absolute",
        bottom: 20,
        left: 16,
        right: 16,
    },
    bookingButton: {
        borderRadius: 20,
        overflow: "hidden",
        shadowColor: "#3b82f6",
        shadowOpacity: 0.4,
        shadowOffset: {width: 0, height: 8},
        shadowRadius: 20,
        elevation: 12,
    },
    bookingButtonGradient: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 18,
        paddingHorizontal: 20,
    },
    bookingButtonIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    bookingButtonContent: {
        flex: 1,
        marginLeft: 16,
    },
    bookingButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
        letterSpacing: 0.3,
    },
});

