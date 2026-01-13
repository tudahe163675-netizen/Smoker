import React, {useState, useEffect, useMemo} from "react";
import {
    Modal,
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView, 
    Alert,
    ActivityIndicator,
    Platform,
    KeyboardAvoidingView,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useRouter} from "expo-router";
import {useAuth} from "@/hooks/useAuth";
import {BarApiService} from "@/services/barApi";
import {isValidPhone} from "@/utils/extension";
import {Combo} from "@/types/tableType";

interface BookingModalProps {
    dataBooking: any,
    onClose: () => void,
    visible: boolean,
    clearData: () => void,
    barId: string, // barPageId
    tableId?: string,
    preselectedCombo?: Combo | null,
    bookingDate?: string, // Format: YYYY-MM-DD
    selectedTable?: any, // Table info
}

export default function BookingModal({
    visible, 
    dataBooking, 
    onClose, 
    clearData, 
    barId, 
    tableId,
    preselectedCombo,
    bookingDate,
    selectedTable,
}: BookingModalProps) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [combos, setCombos] = useState<Combo[]>([]);
    const [loadingCombos, setLoadingCombos] = useState(false);
    const [selectedCombo, setSelectedCombo] = useState<Combo | null>(preselectedCombo || null);
    const [selectedVoucher, setSelectedVoucher] = useState<any | null>(null);
    const [vouchers, setVouchers] = useState<any[]>([]);
    const [loadingVouchers, setLoadingVouchers] = useState(false);
    const [phoneError, setPhoneError] = useState("");

    const [form, setForm] = useState({
        customerName: "",
        phone: "",
        note: "",
    });

    const {authState} = useAuth();
    const barApi = useMemo(() => new BarApiService(authState.token!), [authState.token]);

    // Fetch combos when modal opens
    useEffect(() => {
        if (visible && barId) {
            fetchCombos();
        }
    }, [visible, barId]);

    // Reset selected combo when modal opens (combo will be selected in modal)
    useEffect(() => {
        if (visible) {
            setSelectedCombo(null);
        }
    }, [visible]);

    // Fetch vouchers when combo is selected
    useEffect(() => {
        if (selectedCombo) {
            fetchVouchers();
        } else {
            setVouchers([]);
            setSelectedVoucher(null);
        }
    }, [selectedCombo]);

    const fetchCombos = async () => {
        setLoadingCombos(true);
        try {
            const response = await barApi.getBarCombos(barId);
            // Handle response format like web: can be array directly or { data: [...] }
            const combosData = response.data || [];
            if (Array.isArray(combosData)) {
                setCombos(combosData);
            } else if (combosData.data && Array.isArray(combosData.data)) {
                setCombos(combosData.data);
            } else {
                setCombos([]);
            }
        } catch (error) {
            console.error("Error fetching combos:", error);
            setCombos([]);
        } finally {
            setLoadingCombos(false);
        }
    };

    const fetchVouchers = async () => {
        if (!selectedCombo) return;
        
        setLoadingVouchers(true);
        try {
            // Get combo price (handle both formats)
            const comboPrice = selectedCombo.Price || selectedCombo.price || 0;
            const response = await barApi.getAvailableVouchers(comboPrice);
            // Handle response format
            const vouchersData = response.data || [];
            if (Array.isArray(vouchersData)) {
                setVouchers(vouchersData);
            } else if (vouchersData.data && Array.isArray(vouchersData.data)) {
                setVouchers(vouchersData.data);
            } else {
                setVouchers([]);
            }
        } catch (error) {
            console.error("Error fetching vouchers:", error);
            setVouchers([]);
        } finally {
            setLoadingVouchers(false);
        }
    };

    // Calculate amounts
    const calculateAmounts = () => {
        if (!selectedCombo) return null;

        // Handle both formats: web uses Price (uppercase), app uses price (lowercase)
        const originalPrice = selectedCombo.Price || selectedCombo.price || 0;
        const discountPercentage = selectedVoucher ? (selectedVoucher.DiscountPercentage || selectedVoucher.discountPercentage || 0) : 0;
        const discountAmount = Math.floor(originalPrice * discountPercentage / 100);
        const finalPaymentAmount = originalPrice - discountAmount;

        return {
            originalPrice,
            discountAmount,
            finalPaymentAmount,
            discountPercentage
        };
    };

    const amounts = calculateAmounts();

    const handleSubmit = async () => {
        const nameTrimmed = form.customerName.trim();
        const phoneTrimmed = form.phone.trim();

        setPhoneError("");
        setErrors({});

        // Validation
        if (!nameTrimmed) {
            setErrors({ customerName: "Vui lòng nhập tên khách hàng" });
            return;
        }

        if (!phoneTrimmed) {
            setErrors({ phone: "Vui lòng nhập số điện thoại" });
            return;
        }

        if (!selectedCombo) {
            Alert.alert("Thông báo", "Vui lòng chọn combo");
            return;
        }

        // Validate phone number
        const rawPhone = phoneTrimmed.replace(/\s/g, "");
        let normalizedPhone = rawPhone;
        if (normalizedPhone.startsWith("+84")) {
            normalizedPhone = "0" + normalizedPhone.substring(3);
        } else if (normalizedPhone.startsWith("84") && normalizedPhone.length >= 10) {
            normalizedPhone = "0" + normalizedPhone.substring(2);
        }

        const isVietnameseFormat = /^0\d{9,10}$/.test(normalizedPhone);
        if (!isVietnameseFormat) {
            setPhoneError("Số điện thoại Việt Nam không hợp lệ. Ví dụ hợp lệ: 0987654321 hoặc 0912345678");
            return;
        }

        setSubmitting(true);
        try {
            // Prepare booking request
            const bookingDateStr = bookingDate || new Date().toISOString().split("T")[0];
            const startTime = `${bookingDateStr}T18:00:00.000Z`;
            const endTime = `${bookingDateStr}T23:59:59.999Z`;

            const req: any = {
                receiverId: dataBooking?.receiverId || barId,
                comboId: selectedCombo.ComboId || selectedCombo.comboId,
                tableId: tableId || dataBooking?.tables?.[0]?.id,
                bookingDate: bookingDateStr,
                startTime: startTime,
                endTime: endTime,
                customerName: nameTrimmed,
                phone: normalizedPhone,
                note: form.note.trim() || "",
                totalAmount: amounts?.finalPaymentAmount || 0,
            };

            if (selectedVoucher && selectedVoucher.VoucherId) {
                req.voucherCode = selectedVoucher.VoucherCode || selectedVoucher.voucherCode;
            }

            const bookingResult = await barApi.createBookingWithCombo(req);

            if (!bookingResult.success || !bookingResult.data?.BookedScheduleId) {
                Alert.alert("Lỗi", bookingResult.message || "Không thể tạo booking!");
                return;
            }

            // Use createTableFullPayment for combo booking (giống web)
            const totalAmount = amounts?.finalPaymentAmount || 0;
            const discountPercentages = selectedVoucher 
                ? (selectedVoucher.DiscountPercentage || selectedVoucher.discountPercentage || 0)
                : 0;

            const paymentResult = await barApi.createTableFullPayment(
                bookingResult.data.BookedScheduleId,
                {
                    amount: totalAmount,
                    discountPercentages: discountPercentages > 0 ? discountPercentages : undefined,
                }
            );

            if (!paymentResult.success || !paymentResult.data?.paymentUrl) {
                Alert.alert("Lỗi", paymentResult.message || "Không thể tạo link thanh toán!");
                return;
            }

            clearData();
            onClose();
                router.push({
                    pathname: "/payment",
                    params: {
                    url: paymentResult.data.paymentUrl,
                    bookingId: bookingResult.data.BookedScheduleId,
                    },
                });
        } catch (error) {
            console.error("Booking error:", error);
            Alert.alert("Lỗi", "Có lỗi xảy ra. Vui lòng thử lại!");
        } finally {
            setSubmitting(false);
        }
    };

    // Reset form when modal closes
    useEffect(() => {
        if (!visible) {
            setForm({
                customerName: "",
                phone: "",
                note: "",
            });
            setSelectedCombo(preselectedCombo || null);
            setSelectedVoucher(null);
            setPhoneError("");
            setErrors({});
        }
    }, [visible, preselectedCombo]);

    // Get available vouchers for selected combo
    const availableVouchers = useMemo(() => {
        if (!selectedCombo || vouchers.length === 0) return [];
        
        const comboPrice = selectedCombo.Price || selectedCombo.price || 0;
        return vouchers.filter(v => {
            const minValue = v.MinComboValue || v.minComboValue || 0;
            const usedCount = v.UsedCount || v.usedCount || 0;
            const maxUsage = v.MaxUsage || v.maxUsage || 0;
            const startDate = new Date(v.StartDate || v.startDate);
            const endDate = new Date(v.EndDate || v.endDate);
            const status = v.Status || v.status || '';
            const now = new Date();

            return minValue <= comboPrice &&
                   usedCount < maxUsage &&
                   startDate <= now &&
                   endDate >= now &&
                   status === 'ACTIVE';
        });
    }, [vouchers, selectedCombo]);

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalOverlay}
            >
                <View style={styles.modalContainer}>
                    <ScrollView 
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>Đặt bàn với Combo</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color="#1f2937" />
                            </TouchableOpacity>
                        </View>

                        {/* Bàn đã chọn */}
                        {selectedTable && (
                            <View style={styles.selectedTableContainer}>
                                <Text style={styles.selectedTableText}>
                                    Bàn đã chọn: {selectedTable.tableName || selectedTable.TableName || 'Bàn đã chọn'}
                                </Text>
                            </View>
                        )}

                        {/* Combo Selection */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                Chọn Combo (bắt buộc)
                            </Text>
                            {loadingCombos ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="small" color="#3b82f6" />
                                    <Text style={styles.loadingText}>Đang tải combo...</Text>
                                </View>
                            ) : combos.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>Không có combo nào</Text>
                                </View>
                            ) : (
                                <ScrollView 
                                    horizontal 
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.comboScrollContainer}
                                >
                                    {combos.map((combo) => {
                                        // Handle both formats
                                        const comboId = combo.ComboId || combo.comboId || '';
                                        const comboName = combo.ComboName || combo.comboName || '';
                                        const description = combo.Description || combo.description || '';
                                        const price = combo.Price || combo.price || 0;
                                        const salePrice = combo.SalePrice || combo.salePrice;
                                        const isSelected = selectedCombo && (
                                            (selectedCombo.ComboId || selectedCombo.comboId) === comboId
                                        );

                                        return (
                                            <TouchableOpacity
                                                key={comboId}
                                                style={[
                                                    styles.comboCard,
                                                    isSelected && styles.comboCardSelected,
                                                ]}
                                                onPress={() => setSelectedCombo(combo)}
                                            >
                                                <Text style={[
                                                    styles.comboCardTitle,
                                                    isSelected && styles.comboCardTitleSelected,
                                                ]} numberOfLines={2}>
                                                    {comboName}
                                                </Text>
                                                {description && (
                                                    <Text style={[
                                                        styles.comboCardDescription,
                                                        isSelected && styles.comboCardDescriptionSelected,
                                                    ]} numberOfLines={2}>
                                                        {description}
                                                    </Text>
                                                )}
                                                <Text style={[
                                                    styles.comboCardPrice,
                                                    isSelected && styles.comboCardPriceSelected,
                                                ]}>
                                                    {price.toLocaleString('vi-VN')} đ
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            )}
                        </View>

                        {/* Voucher Selection - chỉ hiện khi đã chọn combo */}
                        {selectedCombo && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>
                                    Voucher giảm giá (tùy chọn)
                                </Text>
                                {loadingVouchers ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="small" color="#3b82f6" />
                                        <Text style={styles.loadingText}>Đang tải voucher...</Text>
                                    </View>
                                ) : (
                                    <ScrollView 
                                        horizontal 
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.voucherScrollContainer}
                                    >
                                        {/* Skip voucher option */}
                                        <TouchableOpacity
                                            style={[
                                                styles.voucherCard,
                                                selectedVoucher === null && styles.voucherCardSelected,
                                            ]}
                                            onPress={() => setSelectedVoucher(null)}
                                        >
                                            <Text style={styles.voucherCardTitle}>
                                                Không dùng voucher
                                            </Text>
                                            <Text style={styles.voucherCardSubtitle}>
                                                Thanh toán đầy đủ
                                            </Text>
                    </TouchableOpacity>

                                        {/* Available vouchers */}
                                        {availableVouchers.map((voucher) => {
                                            const voucherId = voucher.VoucherId || voucher.voucherId || '';
                                            const voucherName = voucher.VoucherName || voucher.voucherName || '';
                                            const voucherCode = voucher.VoucherCode || voucher.voucherCode || '';
                                            const discountPercent = voucher.DiscountPercentage || voucher.discountPercentage || 0;
                                            const usedCount = voucher.UsedCount || voucher.usedCount || 0;
                                            const maxUsage = voucher.MaxUsage || voucher.maxUsage || 0;
                                            const isSelected = selectedVoucher && (
                                                (selectedVoucher.VoucherId || selectedVoucher.voucherId) === voucherId
                                            );

                                            return (
                        <TouchableOpacity
                                                    key={voucherId}
                            style={[
                                                        styles.voucherCard,
                                                        isSelected && styles.voucherCardSelected,
                                                    ]}
                                                    onPress={() => setSelectedVoucher(voucher)}
                                                >
                                                    <Text style={styles.voucherCardTitle}>
                                                        {voucherName}
                                                    </Text>
                                                    <Text style={styles.voucherCardCode}>
                                                        Code: {voucherCode}
                                                    </Text>
                                                    <Text style={styles.voucherCardDiscount}>
                                                        Giảm {discountPercent}%
                                                    </Text>
                                                    <Text style={styles.voucherCardRemaining}>
                                                        Còn {maxUsage - usedCount} lượt
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>
                                )}
                                {!loadingVouchers && availableVouchers.length === 0 && (
                                    <View style={styles.emptyVoucherContainer}>
                                        <Text style={styles.emptyVoucherText}>
                                            Không có voucher khả dụng cho combo này
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Payment Summary */}
                        {amounts && (
                            <View style={styles.paymentSummary}>
                                <Text style={styles.paymentSummaryTitle}>
                                    Tóm tắt thanh toán
                                </Text>
                                <View style={styles.paymentSummaryRow}>
                                    <Text>Giá combo gốc:</Text>
                                    <Text>{amounts.originalPrice.toLocaleString('vi-VN')} đ</Text>
                                </View>
                                {amounts.discountAmount > 0 && (
                                    <View style={[styles.paymentSummaryRow, styles.paymentSummaryDiscount]}>
                                        <Text>Giảm giá ({amounts.discountPercentage}%):</Text>
                                        <Text>-{amounts.discountAmount.toLocaleString('vi-VN')} đ</Text>
                                    </View>
                                )}
                                <View style={[styles.paymentSummaryRow, styles.paymentSummaryTotal]}>
                                    <Text style={styles.paymentSummaryTotalText}>Tổng tiền thanh toán:</Text>
                                    <Text style={styles.paymentSummaryTotalText}>
                                        {amounts.finalPaymentAmount.toLocaleString('vi-VN')} đ
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Customer Information */}
                        <View style={styles.section}>
                            <Text style={styles.label}>
                                Tên khách hàng *
                            </Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    errors.customerName && styles.inputError,
                                ]}
                                placeholder="Nhập tên của bạn"
                                placeholderTextColor="#9ca3af"
                                value={form.customerName}
                                onChangeText={(text) => {
                                    setForm(prev => ({ ...prev, customerName: text }));
                                    if (errors.customerName) {
                                        setErrors(prev => ({ ...prev, customerName: null }));
                                    }
                                }}
                            />
                            {errors.customerName && (
                                <Text style={styles.errorText}>{errors.customerName}</Text>
                        )}
                    </View>

                        <View style={styles.section}>
                            <Text style={styles.label}>
                                Số điện thoại *
                            </Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    (errors.phone || phoneError) && styles.inputError,
                                ]}
                                placeholder="Ví dụ: 0987654321 hoặc 0912345678"
                                placeholderTextColor="#9ca3af"
                                value={form.phone}
                                onChangeText={(text) => {
                                    setForm(prev => ({ ...prev, phone: text }));
                                    if (errors.phone || phoneError) {
                                        setErrors(prev => ({ ...prev, phone: null }));
                                        setPhoneError("");
                                    }
                                }}
                                keyboardType="phone-pad"
                            />
                            {errors.phone && (
                                <Text style={styles.errorText}>{errors.phone}</Text>
                            )}
                            {phoneError && (
                                <Text style={styles.errorText}>{phoneError}</Text>
                            )}
                    </View>

                        <View style={styles.section}>
                            <Text style={styles.label}>
                                Ghi chú (tùy chọn)
                            </Text>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Thời gian đến, yêu cầu đặc biệt..."
                                placeholderTextColor="#9ca3af"
                                value={form.note}
                                onChangeText={(text) => setForm(prev => ({ ...prev, note: text }))}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Payment Notice */}
                        {selectedCombo && (
                            <View style={styles.noticeYellow}>
                                <Text style={styles.noticeYellowText}>
                                    💳 Bạn sẽ thanh toán toàn bộ combo. Sau khi thanh toán thành công, hệ thống sẽ tạo QR code để quán bar xác nhận.
                                </Text>
                    </View>
                        )}

                        {/* Important Notice */}
                        {selectedCombo && (
                            <View style={styles.noticeRed}>
                                <Text style={styles.noticeRedIcon}>⚠️</Text>
                                <View style={styles.noticeRedContent}>
                                    <Text style={styles.noticeRedTitle}>
                                        Lưu ý quan trọng:
                                    </Text>
                                    <Text style={styles.noticeRedText}>
                                        Sau khi quán bar xác nhận đặt bàn, bạn sẽ không thể hủy và không thể hoàn lại tiền. Vui lòng kiểm tra kỹ thông tin trước khi xác nhận thanh toán.
                                    </Text>
                                </View>
                    </View>
                        )}

                        {/* Action Buttons */}
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={onClose}
                            >
                                <Text style={styles.cancelButtonText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.submitButton,
                                    (!selectedCombo || submitting) && styles.submitButtonDisabled,
                                ]}
                                onPress={handleSubmit}
                                disabled={!selectedCombo || submitting}
                            >
                                <Text style={styles.submitButtonText}>
                                    {submitting ? 'Đang xử lý...' : 'Thanh toán Combo'}
                                </Text>
                    </TouchableOpacity>
                        </View>
                </ScrollView>
                </View>
            </KeyboardAvoidingView>
            </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        width: '90%',
        maxWidth: 700,
        maxHeight: '90%',
    },
    scrollContent: {
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1f2937',
    },
    closeButton: {
        padding: 4,
    },
    selectedTableContainer: {
        backgroundColor: '#f3f4f6',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
    },
    selectedTableText: {
        fontWeight: '600',
        color: '#374151',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 12,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    loadingText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#64748b',
    },
    emptyContainer: {
        padding: 40,
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        alignItems: 'center',
    },
    emptyText: {
        color: '#6b7280',
        fontSize: 14,
    },
    comboScrollContainer: {
        paddingVertical: 8,
    },
    comboCard: {
        width: 250,
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        backgroundColor: '#fff',
        marginRight: 12,
    },
    comboCardSelected: {
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
    },
    comboCardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 8,
    },
    comboCardTitleSelected: {
        color: '#10b981',
    },
    comboCardDescription: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 8,
        minHeight: 40,
    },
    comboCardDescriptionSelected: {
        color: '#6b7280',
    },
    comboCardPrice: {
        fontSize: 18,
        fontWeight: '700',
        color: '#10b981',
    },
    comboCardPriceSelected: {
        color: '#10b981',
    },
    voucherScrollContainer: {
        paddingVertical: 8,
    },
    voucherCard: {
        width: 200,
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        backgroundColor: '#fff',
        marginRight: 12,
    },
    voucherCardSelected: {
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
    },
    voucherCardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 4,
    },
    voucherCardCode: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 4,
    },
    voucherCardDiscount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#10b981',
    },
    voucherCardSubtitle: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 4,
    },
    voucherCardRemaining: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    emptyVoucherContainer: {
        padding: 20,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 12,
    },
    emptyVoucherText: {
        color: '#6b7280',
        fontSize: 14,
    },
    paymentSummary: {
        backgroundColor: '#f3f4f6',
        padding: 20,
        borderRadius: 12,
        marginBottom: 24,
    },
    paymentSummaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 16,
    },
    paymentSummaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    paymentSummaryDiscount: {
        color: '#10b981',
    },
    paymentSummaryTotal: {
        borderTopWidth: 2,
        borderTopColor: '#d1d5db',
        paddingTop: 8,
        marginTop: 8,
    },
    paymentSummaryTotalText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#10b981',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        width: '100%',
        padding: 12,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        fontSize: 16,
        color: '#1f2937',
    },
    inputError: {
        borderColor: '#ef4444',
        borderWidth: 1.5,
    },
    textArea: {
        width: '100%',
        minHeight: 80,
        padding: 12,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        fontSize: 16,
        color: '#1f2937',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 12,
        marginTop: 4,
    },
    noticeYellow: {
        backgroundColor: '#FEF3C7',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FCD34D',
        marginBottom: 16,
    },
    noticeYellowText: {
        color: '#92400E',
        fontWeight: '600',
        fontSize: 14,
    },
    noticeRed: {
        backgroundColor: '#FEE2E2',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FCA5A5',
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    noticeRedIcon: {
        fontSize: 20,
    },
    noticeRedContent: {
        flex: 1,
    },
    noticeRedTitle: {
        fontWeight: '700',
        fontSize: 15,
        color: '#991B1B',
        marginBottom: 8,
    },
    noticeRedText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#7F1D1D',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    cancelButton: {
        flex: 1,
        padding: 12,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3b82f6',
    },
    submitButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#3b82f6',
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
