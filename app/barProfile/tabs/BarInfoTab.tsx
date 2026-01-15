import React, {useState, useEffect} from "react";
import {View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator, ScrollView, Dimensions, Image, Alert} from "react-native";
import * as Clipboard from 'expo-clipboard';
import {Ionicons} from "@expo/vector-icons";
import {LinearGradient} from "expo-linear-gradient";
import {BarApiService} from "@/services/barApi";
import {useAuth} from "@/hooks/useAuth";
import {Combo} from "@/types/tableType";
import { parseAddressFromString, buildAddressFromIds } from "@/utils/addressFormatter";

// Format address function (similar to web)
const formatAddress = (address: any): string | null => {
    if (!address) return null;

    if (typeof address === 'string') {
        const trimmed = address.trim();
        // If it's a non-empty string and not JSON, return it directly
        if (trimmed && !trimmed.startsWith('{')) {
            return trimmed;
        }
        // If it's a JSON string, try to parse it
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
                return formatAddress(JSON.parse(trimmed));
            } catch {
                return null; // Return null if parsing fails, don't show raw JSON
            }
        }
        return trimmed || null;
    }

    if (typeof address === 'object') {
        const {
            fullAddress,
            detail,
            addressDetail,
            wardName,
            ward,
            districtName,
            district,
            provinceName,
            province
        } = address;

        // If fullAddress exists, use it
        if (fullAddress) return fullAddress;

        // Build address from parts
        const parts = [
            detail || addressDetail,
            wardName || ward,
            districtName || district,
            provinceName || province
        ].filter(Boolean);

        if (parts.length > 0) return parts.join(', ');
        
        // If object only has IDs but no names, return null
        return null;
    }

    return null;
};

const {width} = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;
const EVENT_CARD_WIDTH = width - 48;

interface BarInfoTabProps {
    barDetail: any;
    barPageId?: string; // barPageId for fetching events and combos
}

const BarInfoTab: React.FC<BarInfoTabProps> = ({barDetail, barPageId}) => {
    const {authState} = useAuth();
    const barApi = new BarApiService(authState.token!);
    
    const [events, setEvents] = useState<any[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [combos, setCombos] = useState<Combo[]>([]);
    const [loadingCombos, setLoadingCombos] = useState(false);
    const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);

    useEffect(() => {
        if (barPageId) {
            fetchEvents();
            fetchCombos();
        }
    }, [barPageId]);

    // Resolve address (similar to web version)
    useEffect(() => {
        const resolveAddress = async () => {
            // Priority 1: addressText (already formatted)
            if (barDetail?.addressText && typeof barDetail.addressText === 'string' && barDetail.addressText.trim()) {
                setResolvedAddress(barDetail.addressText.trim());
                return;
            }

            // Priority 2: address field (if it's a formatted string)
            if (barDetail?.address && typeof barDetail.address === 'string') {
                const addressStr = barDetail.address.trim();
                // Only use if it's not a JSON string and has more than just a number
                if (addressStr && !addressStr.startsWith('{') && (addressStr.includes(',') || addressStr.length > 10)) {
                    setResolvedAddress(addressStr);
                    return;
                }

                // If it's a JSON string with IDs, parse and build full address
                if (addressStr.startsWith('{') && addressStr.endsWith('}')) {
                    try {
                        const parsed = parseAddressFromString(addressStr);
                        if (parsed) {
                            const fullAddress = await buildAddressFromIds(parsed);
                            if (fullAddress) {
                                setResolvedAddress(fullAddress);
                                return;
                            }
                        }
                    } catch (e) {
                        console.error('[BarInfoTab] Error parsing address:', e);
                    }
                }
            }

            // Priority 3: addressData or addressObject
            const addressData = barDetail?.addressData || barDetail?.addressObject;
            if (addressData) {
                // If it has IDs but no names, fetch names
                if (addressData.provinceId && addressData.districtId && addressData.wardId && addressData.detail) {
                    const fullAddress = await buildAddressFromIds({
                        detail: addressData.detail || addressData.addressDetail || '',
                        provinceId: addressData.provinceId || '',
                        districtId: addressData.districtId || '',
                        wardId: addressData.wardId || ''
                    });
                    if (fullAddress) {
                        setResolvedAddress(fullAddress);
                        return;
                    }
                }
                
                // Otherwise, try to format with existing names
                const formatted = formatAddress(addressData);
                if (formatted) {
                    setResolvedAddress(formatted);
                    return;
                }
            }

            // Priority 4: address field (try to format)
            if (barDetail?.address) {
                const formatted = formatAddress(barDetail.address);
                if (formatted) {
                    setResolvedAddress(formatted);
                    return;
                }
            }

            setResolvedAddress(null);
        };

        resolveAddress();
    }, [barDetail?.addressText, barDetail?.address, barDetail?.addressData, barDetail?.addressObject]);

    // Helper giống web: đảm bảo luôn trả về array
    const ensureArray = (data: any): any[] => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (data.data && Array.isArray(data.data)) return data.data;
        if (data.items && Array.isArray(data.items)) return data.items;
        if (data.result && Array.isArray(data.result)) return data.result;
        return [];
    };

    const fetchEvents = async () => {
        if (!barPageId) return;
        try {
            setLoadingEvents(true);
            const res = await barApi.getBarEvents(barPageId);
            console.log('[BarInfoTab] Events response:', res);

            let eventsData: any[] = [];

            // Logic parse giống web BarEvent
            if ((res as any).status === "success") {
                eventsData = ensureArray((res as any).data);
            } else if ((res as any).data && (res as any).data.items) {
                eventsData = ensureArray((res as any).data.items);
            } else if (Array.isArray(res)) {
                eventsData = res as any[];
            } else if ((res as any).data && Array.isArray((res as any).data)) {
                eventsData = (res as any).data;
            } else {
                console.warn("[BarInfoTab] Unexpected events response format:", res);
            }

                setEvents(eventsData);
        } catch (error) {
            console.error("Error fetching events:", error);
            setEvents([]);
        } finally {
            setLoadingEvents(false);
        }
    };

    const fetchCombos = async () => {
        if (!barPageId) return;
        try {
            setLoadingCombos(true);
            const res = await barApi.getBarCombos(barPageId);
            console.log("[BarInfoTab] Combos response:", res);

            // Logic parse giống web BarMenuCombo
            let combosData: any[] = [];
            if ((res as any).status === "success") {
                combosData = (res as any).data || [];
            } else if ((res as any).data && Array.isArray((res as any).data)) {
                combosData = (res as any).data;
            } else if (Array.isArray(res)) {
                combosData = res as any[];
            } else {
                console.warn("[BarInfoTab] Unexpected combos response format:", res);
            }

            setCombos(ensureArray(combosData));
        } catch (error) {
            console.error("Error fetching combos:", error);
            setCombos([]);
        } finally {
            setLoadingCombos(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "—";
        try {
            const date = new Date(dateStr);
            return date.toLocaleString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return "—";
        }
    };

    const openMap = () => {
        const address = resolvedAddress || barDetail?.addressText || barDetail?.address || barDetail?.addressData?.fullAddress;
        if (address) {
            Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(address)}`);
        }
    };

    const callPhone = () => {
        if (barDetail.phoneNumber) {
            Linking.openURL(`tel:${barDetail.phoneNumber}`);
        }
    };

    const sendEmail = () => {
        if (barDetail.email) {
            Linking.openURL(`mailto:${barDetail.email}`);
        }
    };

    const copyAddress = async () => {
        const address = resolvedAddress || barDetail?.addressText || barDetail?.address;
        if (address) {
            try {
                await Clipboard.setStringAsync(address);
                Alert.alert('Thành công', 'Đã sao chép địa chỉ');
            } catch (error) {
                console.error('Failed to copy address:', error);
                Alert.alert('Lỗi', 'Không thể sao chép địa chỉ');
            }
        }
    };

    // Helper to display gender in Vietnamese (giống web)
    const displayGender = (gender: string | null | undefined): string => {
        if (!gender) return "Chưa cập nhật";
        const genderLower = gender.toLowerCase();
        if (genderLower === 'male') return 'Nam';
        if (genderLower === 'female') return 'Nữ';
        if (genderLower === 'other') return 'Khác';
        // If already in Vietnamese, return as-is
        return gender;
    };

    // Trạng thái sự kiện giống web (upcoming / ongoing / ended)
    const getEventStatus = (start?: string, end?: string, status?: string) => {
        const normalizedStatus = (status || "").toLowerCase();
        if (normalizedStatus === "ended") return { label: "Đã kết thúc", color: "#6b7280" };
        if (normalizedStatus === "invisible") return { label: "Đang ẩn", color: "#f97316" };

        if (!start || !end) return { label: "Sự kiện", color: "#3b82f6" };

        const now = new Date();
        const startDate = new Date(start);
        const endDate = new Date(end);

        if (now < startDate) return { label: "Sắp diễn ra", color: "#3b82f6" };
        if (now >= startDate && now <= endDate) return { label: "Đang diễn ra", color: "#22c55e" };
        return { label: "Đã kết thúc", color: "#6b7280" };
    };

    return (
        <View style={styles.container}>
            {/* Contact Items - compact (no outer card) */}
            <View style={styles.contactList}>
                {barDetail.phoneNumber && (
                    <TouchableOpacity style={styles.contactItemRow} onPress={callPhone}>
                        <View style={styles.contactIcon}>
                            <Ionicons name="call" size={18} color="#10b981" />
                        </View>
                        <View style={styles.contactContent}>
                            <Text style={styles.contactLabel}>Số điện thoại</Text>
                            <Text style={styles.contactValue} numberOfLines={1}>{barDetail.phoneNumber}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                    </TouchableOpacity>
                )}

                {barDetail.email && (
                    <TouchableOpacity style={styles.contactItemRow} onPress={sendEmail}>
                        <View style={styles.contactIcon}>
                            <Ionicons name="mail" size={18} color="#f59e0b" />
                        </View>
                        <View style={styles.contactContent}>
                            <Text style={styles.contactLabel}>Email</Text>
                            <Text style={styles.contactValue} numberOfLines={1}>{barDetail.email}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                    </TouchableOpacity>
                )}

                {resolvedAddress ? (
                    <View style={styles.contactItemRow}>
                        <View style={styles.contactIcon}>
                            <Ionicons name="location" size={18} color="#3b82f6" />
                        </View>
                        <View style={styles.contactContent}>
                            <Text style={styles.contactLabel}>Địa chỉ</Text>
                            <Text style={styles.contactValue} numberOfLines={2}>{resolvedAddress}</Text>
                        </View>
                        <View style={styles.contactActions}>
                            <TouchableOpacity 
                                style={styles.copyButton}
                                onPress={copyAddress}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="copy-outline" size={16} color="#3b82f6" />
                                <Text style={styles.copyButtonText}>Sao chép</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.mapButton}
                                onPress={openMap}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                    </TouchableOpacity>
                        </View>
                    </View>
                ) : null}

                {barDetail.gender && (
                    <View style={styles.contactItemRow}>
                        <View style={styles.contactIcon}>
                            <Ionicons name="person" size={18} color="#8b5cf6" />
                        </View>
                        <View style={styles.contactContent}>
                            <Text style={styles.contactLabel}>Giới tính</Text>
                            <Text style={styles.contactValue}>{displayGender(barDetail.gender)}</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Events Section */}
            {barPageId && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="calendar" size={24} color="#8b5cf6" />
                        <Text style={styles.sectionTitle}>Sự kiện</Text>
                    </View>

                    {loadingEvents ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#8b5cf6" />
                            <Text style={styles.loadingText}>Đang tải sự kiện...</Text>
                        </View>
                    ) : events.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
                            <Text style={styles.emptyText}>Chưa có sự kiện nào</Text>
                        </View>
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventsScrollContainer}>
                            {events.map((event) => {
                                const eventId = event.EventId || event.eventId || event.id;
                                const title = event.EventName || event.eventName || "Sự kiện";
                                const description = event.Description || event.description || "";
                                const picture = event.Picture || event.picture || "";
                                const startTime = event.StartTime || event.startTime || event.StartDate || event.startDate;
                                const endTime = event.EndTime || event.endTime || event.EndDate || event.endDate;
                                const statusInfo = getEventStatus(startTime, endTime, event.Status || event.status);

                                return (
                                    <View key={eventId} style={styles.eventCard}>
                                        <View style={styles.eventImageWrapper}>
                                            {picture ? (
                                                <Image
                                                    source={{ uri: picture }}
                                                    style={styles.eventImage}
                                                    resizeMode="cover"
                                                />
                                            ) : (
                                    <LinearGradient
                                                    colors={["#4f46e5", "#7c3aed"]}
                                        start={{x: 0, y: 0}}
                                        end={{x: 1, y: 1}}
                                                    style={styles.eventImage}
                                                />
                                            )}
                                            <View style={styles.eventOverlay} />

                                            <View style={styles.eventStatusBadge}>
                                                <View style={[styles.eventStatusDot, { backgroundColor: statusInfo.color }]} />
                                                <Text style={styles.eventStatusText}>{statusInfo.label}</Text>
                                            </View>

                                            <View style={styles.eventTitleContainer}>
                                        <Text style={styles.eventTitle} numberOfLines={2}>
                                                    {title}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.eventInfoContainer}>
                                            {description ? (
                                                <Text style={styles.eventDescription} numberOfLines={2}>
                                                    {description}
                                                </Text>
                                            ) : null}

                                            <View style={styles.eventTimeRow}>
                                                <View style={styles.eventTimeItem}>
                                                    <Ionicons name="time-outline" size={16} color="#9ca3af" />
                                                    <Text style={styles.eventTimeLabel}>Bắt đầu</Text>
                                                    <Text style={styles.eventTimeValue} numberOfLines={1}>
                                                        {formatDate(startTime)}
                                        </Text>
                                                </View>
                                                <View style={styles.eventTimeItem}>
                                                    <Ionicons name="flag-outline" size={16} color="#9ca3af" />
                                                    <Text style={styles.eventTimeLabel}>Kết thúc</Text>
                                                    <Text style={styles.eventTimeValue} numberOfLines={1}>
                                                        {formatDate(endTime)}
                                        </Text>
                                                </View>
                                            </View>
                                        </View>
                                </View>
                                );
                            })}
                        </ScrollView>
                    )}
                </View>
            )}

            {/* Combo Menu Section */}
            {barPageId && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="restaurant" size={24} color="#10b981" />
                        <Text style={styles.sectionTitle}>Combo Menu</Text>
                    </View>

                    {loadingCombos ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#10b981" />
                            <Text style={styles.loadingText}>Đang tải combo...</Text>
                        </View>
                    ) : combos.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="restaurant-outline" size={48} color="#cbd5e1" />
                            <Text style={styles.emptyText}>Chưa có combo nào</Text>
                        </View>
                    ) : (
                        <View style={styles.comboGrid}>
                            {combos.map((combo) => {
                                const comboId = combo.comboId || combo.ComboId || '';
                                const comboName = combo.comboName || combo.ComboName || '';
                                const price = combo.price || combo.Price || 0;
                                const description = combo.description || combo.Description || '';
                                
                                return (
                                    <TouchableOpacity
                                        key={comboId}
                                        style={styles.comboCard}
                                    >
                                        <LinearGradient
                                            colors={["#10b981", "#059669"]}
                                            start={{x: 0, y: 0}}
                                            end={{x: 1, y: 1}}
                                            style={styles.comboCardGradient}
                                        >
                                            <Ionicons name="restaurant" size={24} color="#fff" />
                                            <Text style={styles.comboName} numberOfLines={2}>
                                                {comboName || "Combo"}
                                            </Text>
                                            <Text style={styles.comboPrice}>
                                                {price.toLocaleString("vi-VN")} đ
                                            </Text>
                                            {description ? (
                                                <Text style={styles.comboDescription} numberOfLines={3}>
                                                    {description}
                                                </Text>
                                            ) : null}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>
            )}

            <View style={{height: 40}} />
        </View>
    );
};

export default BarInfoTab;

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#f8fafc",
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
    description: {
        fontSize: 15,
        color: "#475569",
        lineHeight: 24,
    },
    infoCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8fafc",
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    infoIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: "#64748b",
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        color: "#0f172a",
        fontWeight: "600",
    },
    featureGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginHorizontal: -6,
    },
    featureCard: {
        width: "50%",
        paddingHorizontal: 6,
        marginBottom: 12,
        alignItems: "center",
    },
    featureIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },
    featureLabel: {
        fontSize: 13,
        color: "#475569",
        fontWeight: "500",
        textAlign: "center",
    },
    loadingContainer: {
        alignItems: "center",
        paddingVertical: 20,
    },
    loadingText: {
        marginTop: 8,
        fontSize: 14,
        color: "#64748b",
    },
    emptyContainer: {
        alignItems: "center",
        paddingVertical: 40,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        color: "#94a3b8",
    },
    eventsScrollContainer: {
        paddingHorizontal: 16,
        alignItems: "center",
    },
    eventCard: {
        width: EVENT_CARD_WIDTH,
        marginRight: 16,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#0f172a",
    },
    eventImageWrapper: {
        width: "100%",
        height: 200,
        position: "relative",
    },
    eventImage: {
        width: "100%",
        height: "100%",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    eventOverlay: {
        position: "absolute",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.35)",
    },
    eventStatusBadge: {
        position: "absolute",
        top: 12,
        right: 12,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: "rgba(0,0,0,0.65)",
    },
    eventStatusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    eventStatusText: {
        fontSize: 11,
        color: "#f9fafb",
        fontWeight: "600",
    },
    eventTitleContainer: {
        position: "absolute",
        left: 12,
        right: 12,
        bottom: 12,
    },
    eventTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#f9fafb",
    },
    eventInfoContainer: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#020617",
    },
    eventDescription: {
        fontSize: 13,
        color: "#e5e7eb",
        marginBottom: 10,
    },
    eventTimeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 8,
    },
    eventTimeItem: {
        flex: 1,
        backgroundColor: "#020617",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#1f2937",
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
    eventTimeLabel: {
        fontSize: 11,
        color: "#9ca3af",
        marginLeft: 2,
        marginBottom: 2,
    },
    eventTimeValue: {
        fontSize: 12,
        color: "#f9fafb",
        fontWeight: "500",
    },
    comboGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginHorizontal: -6,
    },
    comboCard: {
        width: CARD_WIDTH,
        marginHorizontal: 6,
        marginBottom: 12,
        borderRadius: 16,
        overflow: "hidden",
    },
    comboCardGradient: {
        padding: 16,
        alignItems: "flex-start",
    },
    comboName: {
        fontSize: 14,
        fontWeight: "700",
        color: "#fff",
        marginTop: 8,
        textAlign: "left",
    },
    comboPrice: {
        fontSize: 16,
        fontWeight: "700",
        color: "#fff",
        marginTop: 8,
    },
    comboDescription: {
        fontSize: 12,
        color: "#e5e7eb",
        marginTop: 6,
    },
    // Compact contact styles
    contactList: {
        backgroundColor: "#fff",
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    contactItemRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    contactIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#f8fafc",
        justifyContent: "center",
        alignItems: "center",
    },
    contactContent: {
        flex: 1,
    },
    contactLabel: {
        fontSize: 12,
        color: "#64748b",
        marginBottom: 2,
    },
    contactValue: {
        fontSize: 14,
        color: "#0f172a",
        fontWeight: "600",
    },
    contactActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    copyButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: "#eff6ff",
        borderWidth: 1,
        borderColor: "#bfdbfe",
    },
    copyButtonText: {
        fontSize: 12,
        color: "#3b82f6",
        fontWeight: "500",
    },
    mapButton: {
        padding: 4,
    },
});

