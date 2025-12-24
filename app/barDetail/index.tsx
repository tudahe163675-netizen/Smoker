import {useBar} from "@/hooks/useBar";
import {BarTable} from "@/types/tableType";
import {Ionicons} from "@expo/vector-icons";
import {useFocusEffect} from "@react-navigation/native";
import {LinearGradient} from "expo-linear-gradient";
import {useLocalSearchParams, useRouter} from "expo-router";
import React, {useEffect, useState} from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Pressable,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import BookingModal from "@/app/barDetail/modals/bookingModal";

const {width} = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

// Simple Table Card Component
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
            {/* Icon Section */}
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

            {/* Table Info */}
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

                <View style={styles.tableCapacityRow}>
                    <Ionicons
                        name="people"
                        size={14}
                        color={isBooked ? "#94a3b8" : isSelected ? item.color : "#64748b"}
                    />
                    <Text
                        style={[
                            styles.tableCapacity,
                            isBooked && styles.tableTextBooked,
                            isSelected && {color: item.color},
                        ]}
                    >
                        {item.capacity} người
                    </Text>
                </View>
            </View>

            {/* Price Section */}
            <View style={styles.tablePriceSection}>
                <Text
                    style={[
                        styles.tablePrice,
                        isBooked && styles.tablePriceBooked,
                        isSelected && {color: item.color},
                    ]}
                >
                    {item.depositPrice.toLocaleString()}₫
                </Text>
                <Text style={styles.priceLabel}>Giá cọc</Text>
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

// Skeleton Loading Component
const SkeletonCard = () => {
    return (
        <View style={styles.container}>
            <StatusBar
                barStyle="light-content"
                translucent
                backgroundColor="transparent"
            />
            <View style={styles.skeletonHeader}/>
            <View style={styles.skeletonInfoCard}>
                <View style={[styles.skeletonText, {width: "70%", height: 28}]}/>
                <View
                    style={[
                        styles.skeletonText,
                        {width: "90%", height: 16, marginTop: 16},
                    ]}
                />
                <View
                    style={[
                        styles.skeletonText,
                        {width: "60%", height: 16, marginTop: 8},
                    ]}
                />
                <View style={styles.skeletonStatsContainer}>
                    {[1, 2, 3].map((i) => (
                        <View key={i} style={styles.skeletonStat}/>
                    ))}
                </View>
            </View>
            <View style={styles.section}>
                <View style={[styles.skeletonText, {width: 150, height: 24}]}/>
                <View style={styles.skeletonTableList}>
                    {[1, 2, 3, 4].map((i) => (
                        <View key={i} style={styles.skeletonTable}/>
                    ))}
                </View>
            </View>
        </View>
    );
};

const Index: React.FC<any> = ({}) => {
    const {id} = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const {
        barDetail,
        tables,
        bookedTables,
        loadingDetail,
        loadingTables,
        loadingBooking,
        fetchBarDetail,
        fetchTables,
        fetchBookedTables,
        createBooking,
        createPaymentLink,
    } = useBar();
    const [refreshing, setRefreshing] = useState(false);
    const [visible, setVisible] = useState(false);
    const [data, setData] = useState<any>();
    const [selectedTables, setSelectedTables] = useState<BarTable[]>([]);
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split("T")[0]
    );

    useEffect(() => {
        fetchBarDetail(id);
        fetchTables(id);
    }, [id]);

    useEffect(() => {
        if (barDetail?.entityAccountId) {
            fetchBookedTables(barDetail.entityAccountId, selectedDate);
        }
    }, [barDetail?.entityAccountId, selectedDate]);

    // Refresh data khi quay lại màn hình này
    useFocusEffect(
        React.useCallback(() => {
            if (barDetail?.entityAccountId) {
                fetchBookedTables(barDetail.entityAccountId, selectedDate);
            }
        }, [barDetail?.entityAccountId, selectedDate])
    );

    const handleBackPress = () => {
        router.back();
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                fetchBarDetail(id),
                fetchTables(id),
                barDetail?.entityAccountId &&
                fetchBookedTables(
                    barDetail.entityAccountId,
                    selectedDate.toISOString().split("T")[0]
                ),
            ]);
        } catch (error) {
            console.error("Refresh error:", error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleTableSelect = (table: BarTable) => {
        setSelectedTables((prev) => {
            const isSelected = prev.some((t) => t.tableId === table.tableId);
            if (isSelected) {
                return prev.filter((t) => t.tableId !== table.tableId);
            } else {
                return [...prev, table];
            }
        });
    };

    const isTableBooked = (tableId: string): boolean => {
        if (!bookedTables || bookedTables.length === 0) return false;

        return bookedTables.some((booking) => {
            if (booking.ScheduleStatus === "Canceled") return false;
            return Object.keys(booking.detailSchedule?.Table || {}).includes(
                tableId
            );
        });
    };

    const calculateTotalDepositAmount = (): number => {
        if (!selectedTables || selectedTables.length === 0) return 0;
        return selectedTables.reduce((sum, table) => sum + table.depositPrice, 0);
    };

    const handleBookingPress = () => {
        if (selectedTables.length === 0) {
            Alert.alert("Thông báo", "Vui lòng chọn ít nhất một bàn!");
            return;
        }
        const totalDepositAmount = calculateTotalDepositAmount();
        const bookingData = {
            receiverId: barDetail!.entityAccountId,
            tables: selectedTables.map((t) => ({
                id: t.tableId,
                tableName: t.tableName,
                price: t.depositPrice,
            })),
            note: `Đặt bàn - ${new Date().toLocaleString()}`,
            totalAmount: totalDepositAmount,
            startTime: `${selectedDate}T00:00:00.000Z`,
            endTime: `${selectedDate}T23:59:59.999Z`,
            paymentStatus: "Pending",
            scheduleStatus: "Confirmed",
        };
        setData(bookingData);
        setVisible(true)
    };

    if (loadingDetail) {
        return <SkeletonCard/>;
    }

    if (!barDetail) {
        return (
            <SafeAreaView style={styles.emptyContainer}>
                <Ionicons name="sad-outline" size={64} color="#cbd5e1"/>
                <Text style={styles.emptyText}>Không tìm thấy quán bar</Text>
                <Pressable style={styles.backButton} onPress={handleBackPress}>
                    <Text style={styles.backButtonText}>Quay lại</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle="light-content"
                translucent
                backgroundColor="transparent"
            />

            {/* Header */}
            <SafeAreaView style={styles.headerSafeArea} edges={["top"]}>
                <View style={styles.headerOverlay}>
                    <Pressable
                        style={styles.backButtonCircle}
                        onPress={handleBackPress}
                        android_ripple={{color: "rgba(255,255,255,0.3)", borderless: true}}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff"/>
                    </Pressable>
                </View>
            </SafeAreaView>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh}/>
                }
            >
                {/* Bar Image */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{uri: barDetail.background || barDetail.avatar}}
                        style={styles.barImage}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.7)"]}
                        style={styles.imageGradient}
                    />
                    {barDetail.role && (
                        <View style={styles.roleBadge}>
                            <Ionicons
                                name="checkmark-circle"
                                size={14}
                                color="#fff"
                                style={{marginRight: 4}}
                            />
                            <Text style={styles.roleText}>{barDetail.role}</Text>
                        </View>
                    )}
                </View>

                {/* Bar Info */}
                <View style={styles.barInfoCard}>
                    <Text style={styles.barName}>{barDetail.barName}</Text>

                    <View style={styles.infoRow}>
                        <View style={styles.infoIconContainer}>
                            <Ionicons name="location" size={18} color="#3b82f6"/>
                        </View>
                        <Text style={styles.infoText}>
                            {barDetail.address ||
                                barDetail.addressData?.fullAddress ||
                                "Chưa cập nhật địa chỉ"}
                        </Text>
                    </View>

                    {barDetail.phoneNumber && (
                        <View style={styles.infoRow}>
                            <View style={styles.infoIconContainer}>
                                <Ionicons name="call" size={18} color="#10b981"/>
                            </View>
                            <Text style={styles.infoText}>{barDetail.phoneNumber}</Text>
                        </View>
                    )}

                    {barDetail.email && (
                        <View style={styles.infoRow}>
                            <View style={styles.infoIconContainer}>
                                <Ionicons name="mail" size={18} color="#f59e0b"/>
                            </View>
                            <Text style={styles.infoText}>{barDetail.email}</Text>
                        </View>
                    )}

                    {/* Quick Stats */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Ionicons name="time-outline" size={20} color="#64748b"/>
                            <Text style={styles.statText}>18:00 - 02:00</Text>
                        </View>
                        <View style={styles.statDivider}/>
                        <View style={styles.statItem}>
                            <Ionicons name="star" size={20} color="#fbbf24"/>
                            <Text style={styles.statText}>4.5</Text>
                        </View>
                        <View style={styles.statDivider}/>
                        <View style={styles.statItem}>
                            <Ionicons name="people-outline" size={20} color="#64748b"/>
                            <Text style={styles.statText}>250+</Text>
                        </View>
                    </View>
                </View>

                {/* Tables Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>Chọn bàn</Text>
                            <Text style={styles.sectionSubtitle}>
                                {tables.length} bàn có sẵn
                            </Text>
                        </View>
                        <Ionicons name="calendar-outline" size={24} color="#3b82f6"/>
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
                                    Đã chọn {selectedTables.length} bàn •{" "}
                                    {calculateTotalDepositAmount().toLocaleString()}₫
                                </Text>
                            </LinearGradient>
                        </View>
                    )}

                    {loadingTables ? (
                        <View style={styles.loadingTableContainer}>
                            <ActivityIndicator size="large" color="#3b82f6"/>
                            <Text style={styles.loadingText}>Đang tải danh sách bàn...</Text>
                        </View>
                    ) : !tables || tables.length === 0 ? (
                        <View style={styles.emptyTableContainer}>
                            <Ionicons name="beer-outline" size={64} color="#cbd5e1"/>
                            <Text style={styles.emptyTableText}>Chưa có bàn nào</Text>
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

                <View style={{height: 120}}/>
            </ScrollView>

            {/* Floating Book Button */}
            {selectedTables.length > 0 && (
                <View style={styles.bookingButtonContainer}>
                    <Pressable
                        style={styles.bookingButton}
                        onPress={handleBookingPress}
                        android_ripple={{color: "rgba(255,255,255,0.3)"}}
                        disabled={loadingBooking}
                    >
                        <LinearGradient
                            colors={["#3b82f6", "#2563eb"]}
                            start={{x: 0, y: 0}}
                            end={{x: 1, y: 0}}
                            style={styles.bookingButtonGradient}
                        >
                            {loadingBooking ? (
                                <ActivityIndicator size="small" color="#fff"/>
                            ) : (
                                <>
                                    <View style={styles.bookingButtonIcon}>
                                        <Ionicons name="calendar" size={24} color="#fff"/>
                                    </View>
                                    <View style={styles.bookingButtonContent}>
                                        <Text style={styles.bookingButtonText}>
                                            Đặt bàn ({selectedTables.length})
                                        </Text>
                                        <Text style={styles.bookingButtonSubtext}>
                                            Tổng cọc: {calculateTotalDepositAmount().toLocaleString()}₫
                                        </Text>
                                    </View>
                                    <Ionicons name="arrow-forward" size={20} color="#fff"/>
                                </>
                            )}
                        </LinearGradient>
                    </Pressable>
                </View>
            )}
            <BookingModal visible={visible} dataBooking={data} onClose={() => setVisible(false)} clearData={() => setSelectedTables([])}/>
        </View>
    );
};

export default Index;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
        backgroundColor: "#f8fafc",
    },
    emptyText: {
        fontSize: 18,
        color: "#64748b",
        marginTop: 16,
        fontWeight: "600",
    },
    backButton: {
        marginTop: 24,
        paddingHorizontal: 32,
        paddingVertical: 12,
        backgroundColor: "#3b82f6",
        borderRadius: 24,
    },
    backButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    headerSafeArea: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        backgroundColor: "transparent",
    },
    headerOverlay: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButtonCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    imageContainer: {
        position: "relative",
        height: 300,
    },
    barImage: {
        width: "100%",
        height: "100%",
        backgroundColor: "#e2e8f0",
    },
    imageGradient: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 150,
    },
    roleBadge: {
        position: "absolute",
        top: 70,
        right: 16,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 24,
        backgroundColor: "#10b981",
        shadowColor: "#10b981",
        shadowOpacity: 0.4,
        shadowOffset: {width: 0, height: 4},
        shadowRadius: 8,
        elevation: 6,
    },
    roleText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "700",
    },
    barInfoCard: {
        backgroundColor: "#fff",
        marginHorizontal: 16,
        marginTop: -40,
        borderRadius: 24,
        padding: 20,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowOffset: {width: 0, height: 4},
        shadowRadius: 16,
        elevation: 8,
    },
    barName: {
        fontSize: 26,
        fontWeight: "800",
        color: "#0f172a",
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    infoIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#f1f5f9",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    infoText: {
        fontSize: 15,
        color: "#475569",
        flex: 1,
        fontWeight: "500",
    },
    statsContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: "#e2e8f0",
    },
    statItem: {
        alignItems: "center",
        gap: 6,
    },
    statText: {
        fontSize: 14,
        color: "#64748b",
        fontWeight: "600",
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: "#e2e8f0",
    },
    section: {
        paddingHorizontal: 16,
        marginTop: 24,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: "#0f172a",
        letterSpacing: -0.5,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: "#64748b",
        marginTop: 4,
        fontWeight: "500",
    },
    selectedInfo: {
        marginBottom: 20,
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#3b82f6",
        shadowOpacity: 0.2,
        shadowOffset: {width: 0, height: 4},
        shadowRadius: 12,
        elevation: 6,
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
    loadingTableContainer: {
        paddingVertical: 60,
        alignItems: "center",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: "#64748b",
        fontWeight: "500",
    },
    emptyTableContainer: {
        paddingVertical: 60,
        alignItems: "center",
    },
    emptyTableText: {
        fontSize: 15,
        color: "#94a3b8",
        marginTop: 12,
        fontWeight: "500",
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
        marginBottom: 8,
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
    tableCapacityRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    tableCapacity: {
        fontSize: 12,
        color: "#64748b",
        fontWeight: "500",
    },
    tablePriceSection: {
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#e2e8f0",
    },
    tablePrice: {
        fontSize: 18,
        fontWeight: "800",
        color: "#3b82f6",
        marginBottom: 2,
    },
    tablePriceBooked: {
        color: "#94a3b8",
    },
    priceLabel: {
        fontSize: 11,
        color: "#94a3b8",
        fontWeight: "500",
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
    bookingButtonSubtext: {
        color: "rgba(255, 255, 255, 0.9)",
        fontSize: 14,
        fontWeight: "600",
        marginTop: 2,
    },
    // Skeleton Styles
    skeletonHeader: {
        width: "100%",
        height: 300,
        backgroundColor: "#e2e8f0",
    },
    skeletonInfoCard: {
        backgroundColor: "#fff",
        marginHorizontal: 16,
        marginTop: -40,
        borderRadius: 24,
        padding: 20,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowOffset: {width: 0, height: 4},
        shadowRadius: 16,
        elevation: 8,
    },
    skeletonText: {
        backgroundColor: "#e2e8f0",
        borderRadius: 8,
    },
    skeletonStatsContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: "#e2e8f0",
    },
    skeletonStat: {
        width: 60,
        height: 40,
        backgroundColor: "#e2e8f0",
        borderRadius: 12,
    },
    skeletonTableList: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 16,
        gap: 14,
    },
    skeletonTable: {
        width: CARD_WIDTH,
        height: 180,
        backgroundColor: "#e2e8f0",
        borderRadius: 16,
    },
});