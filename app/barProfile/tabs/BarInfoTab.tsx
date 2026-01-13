import React, {useState, useEffect} from "react";
import {View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator, ScrollView, Dimensions} from "react-native";
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

    const fetchEvents = async () => {
        if (!barPageId) return;
        try {
            setLoadingEvents(true);
            const response = await barApi.getBarEvents(barPageId);
            if (response.success && response.data) {
                const eventsData = Array.isArray(response.data) 
                    ? response.data 
                    : Array.isArray(response.data.data) 
                        ? response.data.data 
                        : [];
                setEvents(eventsData);
            }
        } catch (error) {
            console.error("Error fetching events:", error);
        } finally {
            setLoadingEvents(false);
        }
    };

    const fetchCombos = async () => {
        if (!barPageId) return;
        try {
            setLoadingCombos(true);
            const response = await barApi.getBarCombos(barPageId);
            if (response.success && response.data) {
                const combosData = Array.isArray(response.data) 
                    ? response.data 
                    : Array.isArray(response.data.data) 
                        ? response.data.data 
                        : [];
                setCombos(combosData);
            }
        } catch (error) {
            console.error("Error fetching combos:", error);
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

    return (
        <View style={styles.container}>
            {/* About Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="information-circle" size={24} color="#3b82f6" />
                    <Text style={styles.sectionTitle}>Giới thiệu</Text>
                </View>
                <Text style={styles.description}>
                    {barDetail.description || barDetail.bio || "Chưa có thông tin giới thiệu"}
                </Text>
            </View>

            {/* Contact Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="call" size={24} color="#10b981" />
                    <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
                </View>

                {barDetail.phoneNumber && (
                    <TouchableOpacity style={styles.infoCard} onPress={callPhone}>
                        <View style={styles.infoIconContainer}>
                            <Ionicons name="call" size={20} color="#10b981" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Số điện thoại</Text>
                            <Text style={styles.infoValue}>{barDetail.phoneNumber}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                    </TouchableOpacity>
                )}

                {barDetail.email && (
                    <TouchableOpacity style={styles.infoCard} onPress={sendEmail}>
                        <View style={styles.infoIconContainer}>
                            <Ionicons name="mail" size={20} color="#f59e0b" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Email</Text>
                            <Text style={styles.infoValue}>{barDetail.email}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                    </TouchableOpacity>
                )}

                {resolvedAddress ? (
                    <TouchableOpacity style={styles.infoCard} onPress={openMap}>
                        <View style={styles.infoIconContainer}>
                            <Ionicons name="location" size={20} color="#3b82f6" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Địa chỉ</Text>
                            <Text style={styles.infoValue}>{resolvedAddress}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                    </TouchableOpacity>
                ) : null}
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
                            {events.map((event) => (
                                <View key={event.EventId || event.eventId} style={styles.eventCard}>
                                    <LinearGradient
                                        colors={["#8b5cf6", "#7c3aed"]}
                                        start={{x: 0, y: 0}}
                                        end={{x: 1, y: 1}}
                                        style={styles.eventCardGradient}
                                    >
                                        <Ionicons name="calendar" size={32} color="#fff" />
                                        <Text style={styles.eventTitle} numberOfLines={2}>
                                            {event.EventName || event.eventName || "Sự kiện"}
                                        </Text>
                                        <Text style={styles.eventDate}>
                                            {formatDate(event.StartDate || event.startDate)}
                                        </Text>
                                    </LinearGradient>
                                </View>
                            ))}
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
                                const comboId = combo.comboId || '';
                                const comboName = combo.comboName || '';
                                const price = combo.price || 0;
                                
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
                                                {comboName}
                                            </Text>
                                            <Text style={styles.comboPrice}>
                                                {price.toLocaleString("vi-VN")} đ
                                            </Text>
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
        paddingHorizontal: 4,
    },
    eventCard: {
        width: 200,
        marginRight: 12,
        borderRadius: 16,
        overflow: "hidden",
    },
    eventCardGradient: {
        padding: 20,
        alignItems: "center",
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#fff",
        marginTop: 12,
        textAlign: "center",
    },
    eventDate: {
        fontSize: 12,
        color: "rgba(255,255,255,0.9)",
        marginTop: 8,
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
        alignItems: "center",
    },
    comboName: {
        fontSize: 14,
        fontWeight: "700",
        color: "#fff",
        marginTop: 8,
        textAlign: "center",
    },
    comboPrice: {
        fontSize: 16,
        fontWeight: "700",
        color: "#fff",
        marginTop: 8,
    },
});

