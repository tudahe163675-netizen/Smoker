import React, {useState, useCallback, useEffect} from "react";
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
import DateTimePicker from "@react-native-community/datetimepicker";
import {Ionicons} from "@expo/vector-icons";
import ConfirmBooking from "@/app/user/modals/confirmBooking";
import {useRouter} from "expo-router";
import {ProfileApiService} from "@/services/profileApi";
import {useAuth} from "@/hooks/useAuth";
import {User} from "@/constants/feedData";
import {BarApiService} from "@/services/barApi";
import {isValidPhone} from "@/utils/extension";

interface IBookingModalProps {
    visible: boolean,
    onClose: () => void,
    user: User
}

export default function BookingModal({visible, onClose, user}: IBookingModalProps) {

    const router = useRouter();
    const [data, setData] = useState<any>()
    const [isConfirm, setIsConfirm] = useState<any>()
    const [showDatePicker, setShowDatePicker] = useState(false);
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
    const profileApi = new ProfileApiService(authState.token!)
    const barApi = new BarApiService(authState.token!)

    const loadData = async () => {
        if (!user?.entityAccountId) {
            console.warn("user.entityAccountId is undefined");
            return;
        }
        
        try {
        const response = await profileApi.getListBooked(user.entityAccountId);
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
        } catch (error) {
            console.error("Error loading booking data:", error);
        }
    }
    useEffect(() => {
        loadData()
    }, [visible])


    // PAYMENT
    const SLOT_PRICE = 500000;
    const DEPOSIT = 50000;
    const totalPrice = selectedSlots.length * SLOT_PRICE;
    const totalDeposit = selectedSlots.length * DEPOSIT;
    const remaining = totalPrice - totalDeposit;

    const updateForm = (k, v) => {
        if (k === "date") {
            const selectedDate = new Date(v).toISOString().split("T")[0];
            const slotChecked = slots.map(s => {
                const isBooked = s.bookings?.some(b =>
                    new Date(b.bookingDate).toISOString().startsWith(selectedDate)
                );

                return {
                    ...s,
                    isBooked,
                };
            });
            setSlots(slotChecked)
            v = v.toLocaleDateString("vi-VN");
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
        const dataConfirm = {
            date: form.date,
            slot: selectedSlots.length,
            totalPrice: formatMoney(totalPrice),
            deposit: formatMoney(totalDeposit),
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
            performerEntityAccountId: user.entityAccountId,
            performerRole: user.role,
            date: form.date?.split("/").reverse().join("-"),
            startTime: today,
            endTime: today,
            location: `${form.address}, ${form.ward}, ${form.district}, ${form.province}`,
            phone: form.phone,
            note: form.note,
            offeredPrice: totalPrice,
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
                    <ScrollView contentContainerStyle={styles.modalContainer}>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Ionicons name="close" size={32}/>
                        </TouchableOpacity>

                        <Text style={styles.title}>Đặt lịch</Text>

                        {/* DATE */}
                        <View style={{marginBottom: 7}}>
                            <Text style={styles.label}>Chọn ngày <Text style={{color: 'red'}}>*</Text></Text>

                            <TouchableOpacity
                                style={[
                                    styles.dateButton,
                                    errors.date && styles.errorBorder
                                ]}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={styles.dateText}>
                                    {form.date ? form.date : "dd/MM/yyyy"}
                                </Text>
                                <Ionicons name="calendar-outline" size={20}/>
                            </TouchableOpacity>

                            {errors.date && <Text style={styles.error}>{errors.date}</Text>}

                            {showDatePicker && (
                                <DateTimePicker
                                    value={tomorrow}
                                    mode="date"
                                    minimumDate={tomorrow}
                                    onChange={(event, selectedDate) => {
                                        setShowDatePicker(false);
                                        if (selectedDate) {
                                            const date = new Date(selectedDate);
                                            updateForm("date", date);
                                            clearError("date");
                                        }
                                    }}
                                />
                            )}
                        </View>

                        {/* SLOT */}
                        <View>
                            {form.date && (
                                <View style={{marginBottom: 7}}>
                                    <Text style={styles.label}>Chọn slot <Text style={{color: 'red'}}>*</Text></Text>

                                    <View style={[styles.slotContainer, errors.slot && styles.errorBorder]}>
                                        {slots.map((item) => {
                                            const isSelected = selectedSlots.includes(item.id);

                                            return (
                                                <TouchableOpacity
                                                    key={item.id}
                                                    style={[
                                                        styles.slot,
                                                        isSelected && styles.slotSelected,
                                                        item.isBooked && styles.disableSelect
                                                    ]}
                                                    disabled={item.isBooked}
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
                                                    <Text style={{color: isSelected ? "#fff" : "#334155"}}>
                                                        {item.text}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>

                                    {errors.slot && <Text style={styles.error}>{errors.slot}</Text>}
                                </View>
                            )}
                        </View>

                        {/* PAYMENT */}
                        <View>
                            {selectedSlots.length > 0 && (
                                <View style={styles.paymentBox}>
                                    <View style={{flexDirection: "row", alignItems: "center", marginBottom: 6}}>
                                        <Ionicons name="cash-outline" size={18} color="#0f172a"/>
                                        <Text style={styles.paymentTitle}> Thông tin thanh toán</Text>
                                    </View>

                                    <View style={styles.paymentRow}>
                                        <Text style={styles.paymentLabel}>Số slot đã chọn:</Text>
                                        <Text style={styles.paymentValue}>{selectedSlots.length} slot</Text>
                                    </View>

                                    <View style={styles.paymentRow}>
                                        <Text style={styles.paymentLabel}>Giá slot lẻ (500.000 đ/slot):</Text>
                                        <Text style={styles.paymentValue}>{formatMoney(totalPrice)}</Text>
                                    </View>

                                    <View style={styles.paymentRow}>
                                        <Text style={styles.paymentLabel}>Tiền cọc:</Text>
                                        <Text style={styles.paymentValue}>{formatMoney(totalDeposit)}</Text>
                                    </View>

                                    <View style={styles.paymentRow}>
                                        <Text style={styles.paymentLabel}>Còn lại:</Text>
                                        <Text style={[styles.paymentValue, {fontWeight: "700"}]}>
                                            {formatMoney(remaining)}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        <View style={{marginBottom: 7}}>
                            <Text style={{marginBottom: 4}}>Số điện thoại <Text style={{color: 'red'}}>*</Text></Text>
                            <View style={[
                                styles.inputContainer,
                                errors.phone && styles.errorBorder
                            ]}>
                                <TextInput
                                    placeholder="Số điện thoại"
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

                        {/* NOTE */}
                        <View>
                            <Text style={styles.label}>Ghi chú (Tùy chọn)</Text>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Nhập ghi chú"
                                placeholderTextColor="#9ca3af"
                                multiline
                                value={form.note}
                                onChangeText={(t) => updateForm("note", t)}
                            />
                        </View>

                        {/* SUBMIT */}
                        <TouchableOpacity style={styles.submitBtn} onPress={onSubmit}>
                            <Text style={styles.submitText}>Xác nhận</Text>
                        </TouchableOpacity>
                    </ScrollView>
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
        gap: 10,
        padding: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#767676",
    },
    slot: {
        width: "30%",
        padding: 12,
        backgroundColor: "#eee",
        borderRadius: 10,
        alignItems: "center",
        marginBottom: 10,
    },
    slotSelected: {
        backgroundColor: "#6B4EFF",
    },
    disableSelect: {
        backgroundColor: "#b3b2b2",
    },
    slotText: {fontWeight: "700"},
    slotTextSelected: {color: "#fff"},

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
});
