import React, {useState, useEffect} from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    TextInput,
} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";
import {useRouter, useLocalSearchParams} from "expo-router";
import {CameraView, CameraType, useCameraPermissions} from "expo-camera";
import {BarApiService} from "@/services/barApi";
import {useAuth} from "@/hooks/useAuth";
import BookingDetailAfterScanModal from "@/app/barDetail/modals/BookingDetailAfterScanModal";
import {BookingItem} from "@/types/tableType";

export default function ScanQRScreen() {
    const router = useRouter();
    const {barId} = useLocalSearchParams<{barId: string}>();
    const {authState} = useAuth();
    const barApi = new BarApiService(authState.token!);

    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [manualInput, setManualInput] = useState(false);
    const [qrData, setQrData] = useState("");
    const [loading, setLoading] = useState(false);
    const [booking, setBooking] = useState<BookingItem | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        if (!permission) {
            requestPermission();
        }
    }, [permission]);

    const handleBarCodeScanned = async ({data}: {data: string}) => {
        if (scanned) return;
        
        setScanned(true);
        await processQRData(data);
    };

    const processQRData = async (data: string) => {
        if (!barId) {
            Alert.alert("Lỗi", "Không tìm thấy thông tin quán bar");
            return;
        }

        setLoading(true);
        try {
            const response = await barApi.scanQRCode(data, barId);
            if (response.success && response.data?.booking) {
                setBooking(response.data.booking);
                setShowDetailModal(true);
            } else {
                Alert.alert(
                    "Lỗi",
                    response.data?.message || "QR code không hợp lệ hoặc không thuộc quán này",
                    [
                        {
                            text: "Thử lại",
                            onPress: () => setScanned(false),
                        },
                    ]
                );
            }
        } catch (error) {
            console.error("Error scanning QR:", error);
            Alert.alert("Lỗi", "Có lỗi xảy ra khi quét QR code", [
                {
                    text: "Thử lại",
                    onPress: () => setScanned(false),
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleManualSubmit = async () => {
        if (!qrData.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập mã QR code");
            return;
        }
        await processQRData(qrData.trim());
    };

    const handleCloseDetail = () => {
        setShowDetailModal(false);
        setBooking(null);
        setScanned(false);
        setQrData("");
    };

    if (!permission) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.permissionContainer}>
                    <Ionicons name="camera-outline" size={64} color="#64748b" />
                    <Text style={styles.permissionText}>Đang yêu cầu quyền truy cập camera...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.permissionContainer}>
                    <Ionicons name="camera-outline" size={64} color="#64748b" />
                    <Text style={styles.permissionText}>
                        Cần quyền truy cập camera để quét QR code
                    </Text>
                    <TouchableOpacity
                        style={styles.permissionButton}
                        onPress={requestPermission}
                    >
                        <Text style={styles.permissionButtonText}>Cấp quyền</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Quét QR Code</Text>
                <TouchableOpacity
                    onPress={() => setManualInput(!manualInput)}
                    style={styles.switchButton}
                >
                    <Ionicons
                        name={manualInput ? "camera" : "text"}
                        size={24}
                        color="#3b82f6"
                    />
                </TouchableOpacity>
            </View>

            {manualInput ? (
                /* Manual Input Mode */
                <View style={styles.manualContainer}>
                    <View style={styles.manualCard}>
                        <Ionicons name="qr-code-outline" size={48} color="#3b82f6" />
                        <Text style={styles.manualTitle}>Nhập mã QR code</Text>
                        <Text style={styles.manualSubtitle}>
                            Nhập hoặc dán mã QR code từ khách hàng
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Nhập mã QR code..."
                            placeholderTextColor="#9ca3af"
                            value={qrData}
                            onChangeText={setQrData}
                            multiline
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                            onPress={handleManualSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                    <Text style={styles.submitButtonText}>Xác nhận</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                /* Camera Mode */
                <View style={styles.cameraContainer}>
                    <CameraView
                        style={styles.camera}
                        facing={CameraType.back}
                        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                        barcodeScannerSettings={{
                            barcodeTypes: ["qr"],
                        }}
                    >
                        <View style={styles.overlay}>
                            <View style={styles.scanArea}>
                                <View style={styles.corner} />
                                <View style={[styles.corner, styles.cornerTopRight]} />
                                <View style={[styles.corner, styles.cornerBottomLeft]} />
                                <View style={[styles.corner, styles.cornerBottomRight]} />
                            </View>
                            <Text style={styles.scanHint}>
                                Đưa QR code vào khung để quét
                            </Text>
                        </View>
                    </CameraView>

                    {scanned && (
                        <View style={styles.scannedOverlay}>
                            <ActivityIndicator size="large" color="#3b82f6" />
                            <Text style={styles.scannedText}>Đang xử lý...</Text>
                        </View>
                    )}
                </View>
            )}

            {/* Booking Detail Modal */}
            <BookingDetailAfterScanModal
                visible={showDetailModal}
                booking={booking}
                onClose={handleCloseDetail}
                onConfirmSuccess={() => {
                    handleCloseDetail();
                    router.back();
                }}
                barId={barId || ""}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0f172a",
    },
    switchButton: {
        padding: 8,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
    },
    permissionText: {
        fontSize: 16,
        color: "#64748b",
        textAlign: "center",
        marginTop: 16,
    },
    permissionButton: {
        marginTop: 24,
        paddingHorizontal: 32,
        paddingVertical: 12,
        backgroundColor: "#3b82f6",
        borderRadius: 8,
    },
    permissionButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    cameraContainer: {
        flex: 1,
        position: "relative",
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    scanArea: {
        width: 250,
        height: 250,
        position: "relative",
    },
    corner: {
        position: "absolute",
        width: 30,
        height: 30,
        borderColor: "#3b82f6",
        borderWidth: 3,
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    cornerTopRight: {
        top: 0,
        right: 0,
        left: "auto",
        borderLeftWidth: 0,
        borderRightWidth: 3,
        borderBottomWidth: 0,
        borderTopWidth: 3,
    },
    cornerBottomLeft: {
        top: "auto",
        bottom: 0,
        left: 0,
        borderTopWidth: 0,
        borderRightWidth: 0,
        borderBottomWidth: 3,
        borderLeftWidth: 3,
    },
    cornerBottomRight: {
        top: "auto",
        bottom: 0,
        right: 0,
        left: "auto",
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderBottomWidth: 3,
        borderRightWidth: 3,
    },
    scanHint: {
        marginTop: 32,
        fontSize: 16,
        color: "#fff",
        fontWeight: "500",
        textAlign: "center",
    },
    scannedOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
        alignItems: "center",
    },
    scannedText: {
        marginTop: 16,
        fontSize: 16,
        color: "#fff",
        fontWeight: "600",
    },
    manualContainer: {
        flex: 1,
        backgroundColor: "#f8fafc",
        padding: 20,
        justifyContent: "center",
    },
    manualCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 24,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    manualTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#0f172a",
        marginTop: 16,
        marginBottom: 8,
    },
    manualSubtitle: {
        fontSize: 14,
        color: "#64748b",
        textAlign: "center",
        marginBottom: 24,
    },
    input: {
        width: "100%",
        minHeight: 120,
        backgroundColor: "#f8fafc",
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: "#0f172a",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        textAlignVertical: "top",
        marginBottom: 20,
    },
    submitButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#3b82f6",
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        gap: 8,
        width: "100%",
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});


