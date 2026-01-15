import React, {useState, useCallback, useEffect, useMemo} from "react";
import {
    Modal,
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView, Platform, KeyboardAvoidingView, Alert,
} from "react-native";
import Dropdown from "@/components/Dropdown";
import {Ionicons} from "@expo/vector-icons";
import ConfirmBooking from "@/app/user/modals/confirmBooking";
import HorizontalDatePicker from "@/components/HorizontalDatePicker";
import PaymentStickyBar from "@/components/PaymentStickyBar";
import PaymentSummary from "@/components/PaymentSummary";
import {useRouter, useLocalSearchParams} from "expo-router";
import {ProfileApiService} from "@/services/profileApi";
import {FeedApiService} from "@/services/feedApi";
import {useAuth} from "@/hooks/useAuth";
import {User} from "@/constants/feedData";
import {BarApiService} from "@/services/barApi";
import {isValidPhone} from "@/utils/extension";
import {useSafeAreaInsets} from "react-native-safe-area-context";

interface IBookingModalProps {
    visible: boolean,
    onClose: () => void,
    user: User
}

export default function BookingModal({visible, onClose, user}: IBookingModalProps) {

    const router = useRouter();
    const params = useLocalSearchParams<{ id: string | string[] }>();
    // Handle id as string or array (expo-router can return array)
    const id = Array.isArray(params.id) ? params.id[0] : (params.id || '');
    const [data, setData] = useState<any>()
    const [isConfirm, setIsConfirm] = useState<any>()
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [errors, setErrors] = useState<any>({});
    // LOCATION
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [slots, setSlots] = useState([
        {id: 1, text: "0h–2h", bookings: [], isBooked: false},
        {id: 2, text: "2h–4h", bookings: [], isBooked: false},
        {id: 3, text: "4h–6h", bookings: [], isBooked: false},
        {id: 4, text: "6h–8h", bookings: [], isBooked: false},
        {id: 5, text: "8h–10h", bookings: [], isBooked: false},
        {id: 6, text: "10h–12h", bookings: [], isBooked: false},
        {id: 7, text: "12h–14h", bookings: [], isBooked: false},
        {id: 8, text: "14h–16h", bookings: [], isBooked: false},
        {id: 9, text: "16h–18h", bookings: [], isBooked: false},
        {id: 10, text: "18h–20h", bookings: [], isBooked: false},
        {id: 11, text: "20h–22h", bookings: [], isBooked: false},
        {id: 12, text: "22h–24h", bookings: [], isBooked: false},
    ])

    const [form, setForm] = useState({
        province: "",
        district: "",
        ward: "",
        date: null,
        note: "",
        address: "",
        phone: ""
    });

    const {authState} = useAuth();
    const insets = useSafeAreaInsets();
    const profileApi = new ProfileApiService(authState.token!);
    const feedApi = new FeedApiService(authState.token!);
    const barApi = new BarApiService(authState.token!);
    const [pricePerSlot, setPricePerSlot] = useState<number>(0);
    const [pricePerSession, setPricePerSession] = useState<number>(0);
    
    // Height của PaymentStickyBar (approximate)
    const STICKY_BAR_HEIGHT = 80;

    const parsePriceNumber = (value: any) => {
        if (value === null || value === undefined) return 0;
        // Loại bỏ ký tự không phải số (cho trường hợp API trả về dạng "135.000 đ")
        const cleaned = String(value).replace(/[^0-9.-]/g, "");
        const parsed = Number(cleaned);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const loadData = async () => {
        // Use user.entityAccountId or fallback to id from route params (giống index.tsx)
        const entityAccountId = user?.entityAccountId || id;
        
        if (!entityAccountId) {
            console.warn("user.entityAccountId and route id are both undefined", {
                userEntityAccountId: user?.entityAccountId,
                routeId: id,
                user: user
            });
            return;
        }
        
        console.log('[BookingModal] loadData called with:', {
            entityAccountId,
            userEntityAccountId: user?.entityAccountId,
            routeId: id
        });
        
        try {
            // Fetch booked slots (giống trước đây)
            const response = await profileApi.getListBooked(entityAccountId);
            const bookings = response?.data || [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const validBookings = bookings.filter(item => {
            if (!item.BookingDate) return false;
            const bookingDate = new Date(item.BookingDate);
            bookingDate.setHours(0, 0, 0, 0);
            if (bookingDate < today) return false;

            const isConfirmed = item.ScheduleStatus === "Confirmed";
            if (!isConfirmed) return false;

            const isPendingPaid = item.ScheduleStatus === "Pending" && item.PaymentStatus === "Paid";
            if (!isPendingPaid) return false;

            return Array.isArray(item.detailSchedule?.Slots);
        });

        const slotsWithBookings = slots.map(slot => {
            const bookingsInSlot = validBookings
                .filter(item =>
                    item.detailSchedule.Slots.includes(slot.id)
                )
                .map(item => ({
                    bookingDate: item.BookingDate,
                    bookerId: item.BookerId
                }));

            return {
                ...slot,
                bookings: bookingsInSlot
            };
        });

        setSlots(slotsWithBookings);

            // Fetch performer profile để lấy giá theo slot và giá theo buổi (giống web)
            // Sử dụng feedApi.getViewInformation giống useUserProfile hook để lấy dữ liệu đầy đủ
            const profileRes = await feedApi.getViewInformation(entityAccountId);
            // Response structure từ feedApi.getViewInformation: response.data (không cần check response.data.data)
            const rawProfile: any = profileRes?.data || {};
            
            // Lấy giá theo slot (PricePerHours) - check cả top level và nested BusinessAccount
            const slotPrice = parsePriceNumber(
                rawProfile.pricePerHours ??
                rawProfile.PricePerHours ??
                rawProfile.pricePerHour ??
                rawProfile.PricePerHour ??
                rawProfile?.businessAccount?.pricePerHours ??
                rawProfile?.businessAccount?.PricePerHours ??
                rawProfile?.BusinessAccount?.pricePerHours ??
                rawProfile?.BusinessAccount?.PricePerHours ??
                0
            );
            
            // Lấy giá theo buổi (PricePerSession) - check cả top level và nested BusinessAccount
            const sessionPrice = parsePriceNumber(
                rawProfile.pricePerSession ??
                rawProfile.PricePerSession ??
                rawProfile?.businessAccount?.pricePerSession ??
                rawProfile?.businessAccount?.PricePerSession ??
                rawProfile?.BusinessAccount?.pricePerSession ??
                rawProfile?.BusinessAccount?.PricePerSession ??
                0
            );
            
            setPricePerSlot(slotPrice);
            setPricePerSession(sessionPrice);
            
            // Log xác nhận giá đã được load thành công
            if (slotPrice > 0 || sessionPrice > 0) {
                console.log('[BookingModal] ✅ Prices loaded successfully:', {
                    slotPrice,
                    sessionPrice,
                    hasSlotPrice: slotPrice > 0,
                    hasSessionPrice: sessionPrice > 0
                });
            } else {
                console.warn('[BookingModal] ⚠️ Prices are still 0 after loading. Check API response structure.');
            }
            
            // Log toàn bộ rawProfile để debug - sử dụng JSON.stringify để xem tất cả keys
            console.log('[BookingModal] Profile prices loaded - Full rawProfile:', JSON.stringify(rawProfile, null, 2));
            console.log('[BookingModal] Profile prices loaded - Summary:', {
                slotPrice,
                sessionPrice,
                rawProfileKeys: Object.keys(rawProfile || {}),
                hasBusinessAccount: !!rawProfile?.BusinessAccount,
                hasBusinessAccountLowercase: !!rawProfile?.businessAccount,
                businessAccountKeys: rawProfile?.BusinessAccount ? Object.keys(rawProfile.BusinessAccount) : [],
                businessAccountLowercaseKeys: rawProfile?.businessAccount ? Object.keys(rawProfile.businessAccount) : [],
                rawProfile: {
                    pricePerHours: rawProfile.pricePerHours,
                    PricePerHours: rawProfile.PricePerHours,
                    pricePerHour: rawProfile.pricePerHour,
                    PricePerHour: rawProfile.PricePerHour,
                    pricePerSession: rawProfile.pricePerSession,
                    PricePerSession: rawProfile.PricePerSession,
                    BusinessAccount: rawProfile?.BusinessAccount,
                    businessAccount: rawProfile?.businessAccount
                },
                fromBusinessAccount: {
                    PricePerHours: rawProfile?.BusinessAccount?.PricePerHours,
                    pricePerHours: rawProfile?.BusinessAccount?.pricePerHours,
                    PricePerSession: rawProfile?.BusinessAccount?.PricePerSession,
                    pricePerSession: rawProfile?.BusinessAccount?.pricePerSession
                },
                fromBusinessAccountLowercase: {
                    PricePerHours: rawProfile?.businessAccount?.PricePerHours,
                    pricePerHours: rawProfile?.businessAccount?.pricePerHours,
                    PricePerSession: rawProfile?.businessAccount?.PricePerSession,
                    pricePerSession: rawProfile?.businessAccount?.pricePerSession
                }
            });
        } catch (error) {
            console.error("Error loading booking data or profile:", error);
        }
    }
    useEffect(() => {
        if (visible) {
            loadData();
        }
    }, [visible, user?.entityAccountId, id])


    // PAYMENT - tính giá theo slot giống web
    const DEPOSIT = 50000;

    /**
     * Helper function: Tính số slot liền nhau dài nhất từ danh sách slot đã chọn
     */
    const getMaxConsecutiveSlots = (selectedSlots: number[]): number => {
        if (selectedSlots.length === 0) return 0;
        if (selectedSlots.length === 1) return 1;
        
        const sortedSlots = [...selectedSlots].sort((a, b) => a - b);
        let maxConsecutive = 1;
        let currentConsecutive = 1;
        
        for (let i = 1; i < sortedSlots.length; i++) {
            if (sortedSlots[i] === sortedSlots[i - 1] + 1) {
                currentConsecutive++;
                maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
            } else {
                currentConsecutive = 1;
            }
        }
        
        return maxConsecutive;
    };

    /**
     * Tính giá booking dựa trên số slot và điều kiện
     */
    const calculateBookingPrice = ({
        totalSlots,
        consecutiveSlots,
        pricePerHour,
        pricePerSession
    }: {
        totalSlots: number;
        consecutiveSlots: number;
        pricePerHour: number;
        pricePerSession: number;
    }) => {
        // Điều kiện áp dụng giá ưu đãi (pricePerSession):
        // - Có ít nhất 4 slot liền nhau HOẶC tổng số slot >= 6
        const shouldUseSessionPrice = consecutiveSlots >= 4 || totalSlots >= 6;
        
        // Nếu đủ điều kiện và có pricePerSession > 0 → dùng giá ưu đãi
        if (shouldUseSessionPrice && pricePerSession > 0) {
            return {
                unitPrice: pricePerSession,
                totalPrice: pricePerSession * totalSlots,
                priceType: 'pricePerSession' as const
            };
        }
        
        // Ngược lại → dùng giá theo slot thông thường
        return {
            unitPrice: pricePerHour || 0,
            totalPrice: (pricePerHour || 0) * totalSlots,
            priceType: 'pricePerHour' as const
        };
    };

    // Tính số slot liền nhau dài nhất
    const maxConsecutiveSlots = useMemo(() => {
        return getMaxConsecutiveSlots(selectedSlots);
    }, [selectedSlots]);

    // Tính giá booking dựa trên logic đã định nghĩa
    const priceCalculation = useMemo(() => {
        if (selectedSlots.length === 0) {
            return {
                unitPrice: 0,
                totalPrice: 0,
                priceType: 'pricePerHour' as const,
                reason: null as string | null
            };
        }

        const totalSlots = selectedSlots.length;
        
        // Nếu không có giá hợp lệ
        if ((pricePerSlot || 0) <= 0 && (pricePerSession || 0) <= 0) {
            return {
                unitPrice: 0,
                totalPrice: 0,
                priceType: 'pricePerHour' as const,
                reason: null as string | null
            };
        }
        
        // Tính giá bằng hàm calculateBookingPrice
        const priceResult = calculateBookingPrice({
            totalSlots,
            consecutiveSlots: maxConsecutiveSlots,
            pricePerHour: pricePerSlot || 0,
            pricePerSession: pricePerSession || 0
        });
        
        const result = {
            unitPrice: priceResult.unitPrice,
            totalPrice: priceResult.totalPrice,
            priceType: priceResult.priceType,
            reason: maxConsecutiveSlots >= 4 ? 'consecutive' : totalSlots >= 6 ? 'total' : null
        };
        
        console.log('[BookingModal] Price calculation:', {
            pricePerSlot,
            pricePerSession,
            selectedSlots,
            totalSlots,
            maxConsecutiveSlots,
            result
        });
        
        console.log('[BookingModal] Payment Summary should show:', {
            hasSelectedSlots: selectedSlots.length > 0,
            hasPriceCalculation: !!result,
            unitPrice: result.unitPrice,
            totalPrice: result.totalPrice,
            shouldShow: selectedSlots.length > 0 && !!result && result.unitPrice > 0,
            condition: {
                selectedSlotsLength: selectedSlots.length,
                unitPrice: result.unitPrice,
                totalPrice: result.totalPrice,
                priceType: result.priceType
            }
        });
        
        return result;
    }, [pricePerSlot, pricePerSession, selectedSlots, maxConsecutiveSlots]);

    // Tính toán paddingBottom động cho ScrollView để tránh bị che bởi PaymentStickyBar
    const scrollViewPaddingBottom = useMemo(() => {
        const shouldShowStickyBar = selectedSlots.length > 0 && priceCalculation && priceCalculation.unitPrice > 0;
        if (shouldShowStickyBar) {
            // Sticky bar height + safe area bottom + extra spacing
            return STICKY_BAR_HEIGHT + Math.max(insets.bottom, 8) + 20;
        }
        // Default padding khi không có sticky bar
        return 20;
    }, [selectedSlots.length, priceCalculation, insets.bottom]);

    // Use priceCalculation directly in UI (like web)

    const updateForm = (k: any, v: any) => {
        if (k === "date") {
            // v is a Date object from HorizontalDatePicker
            const selectedDate = v instanceof Date ? v : new Date(v);
            const dateString = selectedDate.toISOString().split("T")[0];
            const slotChecked = slots.map((s: any) => {
                const isBooked = s.bookings?.some((b: any) =>
                    new Date(b.bookingDate).toISOString().startsWith(dateString)
                );

                return {
                    ...s,
                    isBooked,
                };
            });
            setSlots(slotChecked);
            // Format for display: dd/MM/yyyy
            const day = String(selectedDate.getDate()).padStart(2, "0");
            const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
            const year = selectedDate.getFullYear();
            v = `${day}/${month}/${year}`;
        }
        setForm((prev) => ({...prev, [k]: v}))
    };

    const clearError = (field) => {
        setErrors((prev) => ({...prev, [field]: null}));
    };

    // SLOT select
    const toggleSlot = (id) => {
        clearError("slot");
        const updated = selectedSlots.includes(id)
            ? selectedSlots.filter((x) => x !== id)
            : [...selectedSlots, id];
        setSelectedSlots(updated);
    };

    // Handle date change from HorizontalDatePicker
    const handleDateChange = (date: Date) => {
        // Không cho đổi ngày nếu đã chọn slot
        if (selectedSlots.length > 0) {
            setErrors((prev) => ({
                ...prev,
                date: "Vui lòng bỏ chọn tất cả slot trước khi đổi ngày"
            }));
            return;
        }
        // Reset slots khi đổi ngày
        setSelectedSlots([]);
        // Update form
        updateForm("date", date);
        clearError("date");
        // Reload booked slots for the new date
        loadData();
    };

    const fetchLocation = useCallback(async (url, setter) => {
        try {
            const res = await fetch(url);
            const data = await res.json();
            setter(
                data.data.map((x) => ({
                    value: x.id,
                    label: x.name
                }))
            );
        } catch (e) {
            console.error(e);
        }
    }, []);

    useEffect(() => {
        if (visible) {
            fetchLocation(
                "https://open.oapi.vn/location/provinces?page=0&size=100",
                setProvinces
            );
        }
    }, [visible]);

    useEffect(() => {
        if (!visible) {
            setForm({
                province: "",
                district: "",
                ward: "",
                date: null,
                note: "",
                address: "",
                phone: ""
            });
            setSelectedSlots([]);
            setDistricts([]);
            setWards([]);
            setErrors({});
        }
    }, [visible]);

    const onSelectProvince = (id, lable) => {
        updateForm("province", lable);
        updateForm("district", "");
        updateForm("ward", "");
        fetchLocation(
            `https://open.oapi.vn/location/districts/${id}?page=0&size=100`,
            setDistricts
        );
        setWards([]);
        clearError("provinceErr");
    };

    const onSelectDistrict = (id, lable) => {
        updateForm("district", lable);
        updateForm("ward", "");
        fetchLocation(
            `https://open.oapi.vn/location/wards/${id}?page=0&size=100`,
            setWards
        );
        clearError("districtErr");
    };

    const validate = () => {
        const errs = {
            provinceErr: '',
            districtErr: '',
            wardErr: '',
            date: '',
            slot: '',
            address: '',
            phone: ''
        };
        let check = true;

        if (!form.province) {
            errs.provinceErr = "Vui lòng chọn tỉnh/thành phố";
            check = false;
        }
        if (!form.district) {
            errs.districtErr = "Vui lòng chọn quận/huyện";
            check = false;
        }
        if (!form.ward) {
            errs.wardErr = "Vui lòng chọn phường/xã";
            check = false;
        }

        if (!form.date) {
            errs.date = "Vui lòng chọn ngày";
            check = false;
        }

        if (selectedSlots.length === 0) {
            errs.slot = "Vui lòng chọn ít nhất 1 slot";
            check = false;
        }

        if (!form.address) {
            errs.address = "Vui lòng nhập địa chỉ chi tiết";
            check = false;
        }
        if (!form.phone) {
            errs.phone = "Vui lòng nhập số điện thoại";
            check = false;
        }
        if (form.phone && !isValidPhone(form.phone)) {
            errs.phone = "Số điện thoại sai định dạng";
            check = false;
        }

        setErrors(errs);
        return check;
    };

    const onSubmit = () => {
        if (!validate()) return;
        
        // Tính giá gốc và giảm giá
        const originalPrice = (pricePerSlot || 0) * selectedSlots.length;
        const discount = originalPrice - priceCalculation.totalPrice;
        
        // Tính thời gian slot (ví dụ: slot 1-4 = 0h-8h)
        const firstSlot = Math.min(...selectedSlots);
        const lastSlot = Math.max(...selectedSlots);
        const startHour = (firstSlot - 1) * 2;
        const endHour = lastSlot * 2;
        const timeRange = `${startHour}h - ${endHour}h`;
        
        // Địa điểm
        const location = form.address 
            ? `${form.address}${form.ward ? ', ' + form.ward : ''}${form.district ? ', ' + form.district : ''}${form.province ? ', ' + form.province : ''}`
            : '';
        
        const dataConfirm = {
            date: form.date,
            slot: selectedSlots.length,
            timeRange: timeRange,
            location: location,
            originalPrice: originalPrice,
            discount: discount > 0 ? discount : 0,
            totalPrice: priceCalculation.totalPrice,
            deposit: DEPOSIT,
            remaining: priceCalculation.totalPrice - DEPOSIT,
        };
        setData(dataConfirm);
        setIsConfirm(true);
    };

    const formatMoney = (n) =>
        n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " đ";

    const today = new Date();
    const confirmPayment = async () => {
        console.log("form", form)
        let req = {
            requesterEntityAccountId: authState.EntityAccountId,
            requesterRole: authState.role,
            performerEntityAccountId: user?.entityAccountId || id,
            performerRole: user.role,
            date: form.date?.split("/").reverse().join("-"),
            startTime: today,
            endTime: today,
            location: `${form.address}, ${form.ward}, ${form.district}, ${form.province}`,
            phone: form.phone,
            note: form.note,
            offeredPrice: priceCalculation.totalPrice,
            slots: selectedSlots
        }

        const res = await barApi.createBookingDj(req);
        if (res?.success && res?.data){
            const createPayment = await barApi.createPaymentLink(res.data.BookedScheduleId, res.data.TotalAmount);
            if (createPayment?.success && createPayment?.data?.paymentUrl){
                setIsConfirm(false);
                onClose()
                router.push({
                    pathname: "/payment",
                    params: {
                        url: createPayment?.data?.paymentUrl,
                        bookingId: createPayment?.data?.bookingId,
                    },
                });
            }else{
                Alert.alert("Lỗi", "Không thể tạo qr thanh toán!");
                return;
            }

        }else{
            Alert.alert("Lỗi", "Không thể tạo booking!");
            return;
        }

    };
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return (
        <>
            <Modal visible={visible} animationType="slide" presentationStyle="overFullScreen">
                <KeyboardAvoidingView
                    style={{flex: 1}}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                >
                    <ScrollView 
                        contentContainerStyle={[
                            styles.modalContainer,
                            { paddingBottom: scrollViewPaddingBottom }
                        ]}
                        showsVerticalScrollIndicator={true}
                    >
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Ionicons name="close" size={32}/>
                        </TouchableOpacity>

                        <Text style={styles.title}>Đặt lịch {user?.role === "DJ" ? "DJ" : "Dancer"}</Text>

                        {/* DATE */}
                        <View style={{marginBottom: 7}}>
                            <Text style={styles.label}>Chọn ngày <Text style={{color: 'red'}}>*</Text></Text>

                            <HorizontalDatePicker
                                selectedDate={form.date ? (() => {
                                    // Parse dd/MM/yyyy to Date object
                                    if (typeof form.date === 'string') {
                                        const parts = form.date.split("/");
                                        if (parts.length === 3) {
                                            return new Date(Number.parseInt(parts[2], 10), Number.parseInt(parts[1], 10) - 1, Number.parseInt(parts[0], 10));
                                        }
                                    }
                                    return null;
                                })() : null}
                                onDateChange={handleDateChange}
                                minDate={tomorrow}
                                error={errors.date}
                                disabled={selectedSlots.length > 0}
                                />
                        </View>

                        {/* SLOT */}
                        <View>
                            {form.date && (
                                <View style={{marginBottom: 7}}>
                                    <View style={{flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 8}}>
                                    <Text style={styles.label}>Chọn slot <Text style={{color: 'red'}}>*</Text></Text>
                                        {selectedSlots.length > 0 && (
                                            <Text style={{fontSize: 12, color: '#6b7280', marginLeft: 8}}>
                                                (Đã chọn: {selectedSlots.length} slot)
                                            </Text>
                                        )}
                                    </View>

                                    {/* Promotional Message */}
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: '#eff6ff',
                                        borderRadius: 8,
                                        padding: 12,
                                        marginBottom: 12,
                                        borderWidth: 1,
                                        borderColor: '#bfdbfe'
                                    }}>
                                        <Ionicons name="bulb-outline" size={16} color="#2563eb" style={{marginRight: 8}} />
                                        <Text style={{fontSize: 12, fontWeight: '500', color: '#2563eb', flex: 1}}>
                                            Đặt 4 slot liền nhau trở lên hoặc 6 slot trở lên để nhận giá theo buổi (ưu đãi)
                                        </Text>
                                    </View>

                                    <View style={[styles.slotContainer, errors.slot && styles.errorBorder]}>
                                        {slots.map((item: any) => {
                                            const isSelected = selectedSlots.includes(item.id);
                                            const isBooked = item.isBooked;

                                            return (
                                                <TouchableOpacity
                                                    key={item.id}
                                                    style={[
                                                        styles.slot,
                                                        isSelected && styles.slotSelected,
                                                        isBooked && styles.disableSelect
                                                    ]}
                                                    disabled={isBooked}
                                                    onPress={() => toggleSlot(item.id)}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.slotText,
                                                            isSelected && styles.slotTextSelected,
                                                        ]}
                                                    >
                                                        SL{item.id}
                                                    </Text>
                                                    <Text style={{
                                                        fontSize: 12,
                                                        color: isSelected ? "#3b82f6" : "#6b7280"
                                                    }}>
                                                        {item.text}
                                                    </Text>
                                                    {isSelected && (
                                                        <Ionicons 
                                                            name="checkmark-circle" 
                                                            size={16} 
                                                            color="#3b82f6" 
                                                            style={{
                                                                position: "absolute",
                                                                top: 4,
                                                                right: 4
                                                            }}
                                                        />
                                                    )}
                                                    {isBooked && (
                                                        <Text style={{
                                                            position: "absolute",
                                                            top: 4,
                                                            right: 4,
                                                            fontSize: 12,
                                                            color: "#ef4444"
                                                        }}>
                                                            ✕
                                                        </Text>
                                                    )}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>

                                    {errors.slot && <Text style={styles.error}>{errors.slot}</Text>}
                                </View>
                            )}
                        </View>

                        {/* ADDRESS */}
                        <View>
                            <Text style={styles.label}>Địa chỉ <Ionicons name="location-outline" size={14}
                                                                         color="#64748b"/></Text>

                            <View style={{marginBottom: 7}}>
                                <Text style={{marginBottom: 4}}>Tỉnh/Thành phố <Text
                                    style={{color: 'red'}}>*</Text></Text>
                                <View style={[
                                    styles.pickerContainer,
                                    errors.provinceErr && styles.errorBorder
                                ]}>
                                    <Dropdown
                                        data={provinces}
                                        placeholder="Chọn Tỉnh/Thành phố"
                                        onChange={(i) => {
                                            onSelectProvince(i.value, i.label);
                                            clearError("provinceErr");
                                        }}
                                    />
                                </View>

                                {errors.provinceErr && <Text style={styles.error}>{errors.provinceErr}</Text>}
                            </View>

                            {form.province ? (
                                <View style={{marginBottom: 7}}>
                                    <Text style={{marginBottom: 4}}>Quận/Huyện <Text
                                        style={{color: 'red'}}>*</Text></Text>
                                    <View style={[
                                        styles.pickerContainer,
                                        errors.districtErr && styles.errorBorder
                                    ]}>
                                        <Dropdown
                                            data={districts}
                                            placeholder="Chọn Quận/Huyện"
                                            onChange={(i) => {
                                                onSelectDistrict(i.value, i.label);
                                                clearError("districtErr");
                                            }}
                                        />
                                    </View>
                                    {errors.districtErr && <Text style={styles.error}>{errors.districtErr}</Text>}
                                </View>
                            ) : null}

                            {form.district ? (
                                <>
                                    <View style={{marginBottom: 7}}>
                                        <Text style={{marginBottom: 4}}>Phường/Xã <Text
                                            style={{color: 'red'}}>*</Text></Text>
                                        <View style={[
                                            styles.pickerContainer,
                                            errors.wardErr && styles.errorBorder
                                        ]}>
                                            <Dropdown
                                                data={wards}
                                                placeholder="Chọn Phường/Xã"
                                                onChange={(i) => {
                                                    updateForm("ward", i.label);
                                                    clearError("wardErr");
                                                }}
                                            />
                                        </View>
                                        {errors.wardErr && <Text style={styles.error}>{errors.wardErr}</Text>}
                                    </View>

                                    <View style={{marginBottom: 7}}>
                                        <Text style={{marginBottom: 4}}>Địa chỉ chi tiết <Text
                                            style={{color: 'red'}}>*</Text></Text>
                                        <View style={[
                                            styles.inputContainer,
                                            errors.address && styles.errorBorder
                                        ]}>
                                            <Ionicons name="home-outline" size={18} color="#64748b"
                                                      style={styles.inputIcon}/>
                                            <TextInput
                                                placeholder="Số nhà, tên đường..."
                                                placeholderTextColor="#9ca3af"
                                                style={styles.input}
                                                value={form.address}
                                                onChangeText={(t) => {
                                                    updateForm("address", t);
                                                    clearError("address");
                                                }}
                                            />
                                        </View>
                                        {errors.address && <Text style={styles.error}>{errors.address}</Text>}
                                    </View>
                                </>
                            ) : null}
                        </View>

                        {/* PHONE */}
                        <View style={{marginBottom: 7}}>
                            <Text style={{marginBottom: 4}}>Số điện thoại <Text style={{color: 'red'}}>*</Text></Text>
                            <View style={[
                                styles.inputContainer,
                                errors.phone && styles.errorBorder
                            ]}>
                                <TextInput
                                    placeholder="Nhập số điện thoại (ví dụ: 0912345678 hoặc +84912345678)"
                                    placeholderTextColor="#9ca3af"
                                    style={styles.inputPhone}
                                    value={form.phone}
                                    onChangeText={(t) => {
                                        updateForm("phone", t);
                                        clearError("phone");
                                    }}
                                />
                            </View>
                            {errors.phone && <Text style={styles.error}>{errors.phone}</Text>}
                        </View>

                        {/* NOTE */}
                        <View>
                            <Text style={styles.label}>Ghi chú (tùy chọn)</Text>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Thêm ghi chú..."
                                placeholderTextColor="#9ca3af"
                                multiline
                                value={form.note}
                                onChangeText={(t) => updateForm("note", t)}
                            />
                        </View>

                        {/* Payment Summary - Receipt Card Style */}
                        {(() => {
                            const shouldShow = selectedSlots.length > 0 && priceCalculation && priceCalculation.unitPrice > 0;
                            console.log('[BookingModal] PaymentSummary render check:', {
                                selectedSlotsLength: selectedSlots.length,
                                hasPriceCalculation: !!priceCalculation,
                                unitPrice: priceCalculation?.unitPrice,
                                totalPrice: priceCalculation?.totalPrice,
                                pricePerSlot,
                                pricePerSession,
                                shouldShow
                            });
                            return shouldShow ? (
                                <View style={{marginTop: 16}}>
                                    <PaymentSummary
                                        selectedSlots={selectedSlots}
                                        priceCalculation={priceCalculation}
                                        maxConsecutiveSlots={maxConsecutiveSlots}
                                        depositAmount={DEPOSIT}
                                    />
                                </View>
                            ) : null;
                        })()}
                    </ScrollView>

                    {/* Payment Sticky Bar */}
                    {(() => {
                        const shouldShow = selectedSlots.length > 0 && priceCalculation && priceCalculation.unitPrice > 0;
                        console.log('[BookingModal] PaymentStickyBar render check:', {
                            selectedSlotsLength: selectedSlots.length,
                            hasPriceCalculation: !!priceCalculation,
                            unitPrice: priceCalculation?.unitPrice,
                            totalPrice: priceCalculation?.totalPrice,
                            shouldShow
                        });
                        return shouldShow ? (
                            <PaymentStickyBar
                                totalPrice={priceCalculation.totalPrice || 0}
                                deposit={DEPOSIT}
                                remaining={(priceCalculation.totalPrice || 0) > DEPOSIT ? (priceCalculation.totalPrice || 0) - DEPOSIT : 0}
                                onContinue={onSubmit}
                                disabled={selectedSlots.length === 0}
                            />
                        ) : null;
                    })()}

                    {isConfirm && (
                        <ConfirmBooking
                            data={data}
                            onClose={() => setIsConfirm(false)}
                            onConfirmPayment={confirmPayment}
                        />
                    )}
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    input: {
        flex: 1,
        paddingVertical: 12,
        paddingRight: 12,
        fontSize: 15,
        color: "#1e293b",
    },
    inputPhone: {
        flex: 1,
        padding: 12,
        fontSize: 15,
        color: "#1e293b",
    },
    inputIcon: {
        padding: 12,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#767676"
    },
    pickerContainer: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#767676",
        overflow: "hidden",
    },
    modalContainer: {
        padding: 20,
        backgroundColor: "#fff",
    },
    closeBtn: {
        alignSelf: "flex-end",
        paddingVertical: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 14,
    },
    label: {
        marginBottom: 7,
        fontWeight: "500",
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1e293b",
        paddingVertical: 7
    },
    dateButton: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 14,
        borderRadius: 10,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#767676",
    },
    dateText: {
        fontSize: 16,
    },
    textArea: {
        minHeight: 90,
        borderWidth: 1,
        borderColor: "#767676",
        borderRadius: 10,
        padding: 12,
        textAlignVertical: 'top',
    },
    submitBtn: {
        marginTop: 30,
        backgroundColor: "#2563eb",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    submitText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    error: {
        color: "red",
        marginTop: 4
    },
    errorBorder: {
        borderWidth: 1.5,
        borderColor: "red",
    },

    slotContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        padding: 4,
        borderRadius: 8,
        borderWidth: 0,
    },
    slot: {
        width: "22%", // 4 columns with gap
        minWidth: 70,
        padding: 16,
        backgroundColor: "#ffffff",
        borderRadius: 8,
        borderWidth: 2,
        borderColor: "#e5e7eb",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        position: "relative",
    },
    slotSelected: {
        backgroundColor: "#eff6ff",
        borderColor: "#3b82f6",
    },
    disableSelect: {
        backgroundColor: "#f3f4f6",
        borderColor: "#d1d5db",
        opacity: 0.5,
    },
    slotText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#1f2937"
    },
    slotTextSelected: {
        color: "#3b82f6"
    },

    paymentBox: {
        marginVertical: 7,
        padding: 16,
        backgroundColor: "#f8fafc",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#767676",
    },
    paymentTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#0f172a",
    },
    paymentRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 6,
    },
    paymentLabel: {
        fontSize: 14,
        color: "#334155",
    },
    paymentValue: {
        fontSize: 14,
        color: "#0f172a",
    },
    paymentNote: {
        marginTop: 8,
        fontSize: 12,
        color: "#6b7280",
    },
});
