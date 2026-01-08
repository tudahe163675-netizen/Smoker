import React, {useState, useEffect, useMemo} from "react";
import {
    Modal,
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView, Alert,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useRouter} from "expo-router";
import ConfirmBooking from "@/app/barDetail/modals/confirmBooking";
import {useAuth} from "@/hooks/useAuth";
import {BarApiService} from "@/services/barApi";
import DateTimePicker from "@react-native-community/datetimepicker";
import {isValidPhone} from "@/utils/extension";

interface BookingModalProps {
    dataBooking: any,
    onClose: () => void,
    visible: boolean,
    clearData: () => void
}

export default function BookingModal({visible, dataBooking, onClose, clearData}: BookingModalProps) {
    const router = useRouter();
    const [data, setData] = useState<any>()
    const [isConfirm, setIsConfirm] = useState<any>()
    const [errors, setErrors] = useState<any>({});
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [form, setForm] = useState({
        fullName: "",
        phone: "",
        note: "",
        date: ""
    });

    const {authState} = useAuth();

    const barApi = useMemo(() => new BarApiService(authState.token!), [authState.token]);
    const updateForm = (k, v) => setForm((prev) => ({...prev, [k]: v}));

    const clearError = (field) => {
        setErrors((prev) => ({...prev, [field]: null}));
    };


    useEffect(() => {
        if (!visible) {
            setForm({
                fullName: "",
                phone: "",
                note: "",
                date: ""
            });
        }
    }, [visible]);

    const validate = () => {
        const errs = {
            fullName: '',
            date: '',
            phone: ''
        };
        let check = true;

        if (!form.fullName) {
            errs.fullName = "Vui lòng nhập tên";
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
        if (!form.date) {
            errs.date = "Vui lòng chọn ngày";
            check = false;
        }
        setErrors(errs);
        return check;
    };

    const onSubmit = () => {
        if (!validate()) return;
        setData(dataBooking)
        setIsConfirm(true);
    };

    const confirmPayment = async () => {
        try {
            let req = {
                ...dataBooking,
                phone: form.phone,
                note: form.note,
                fullName: form.fullName,
                bookingDate: form.date?.split("/").reverse().join("-")
            }
            const bookingResult = (await barApi.createBooking(req)).data!;

            // Đặt bàn thành công, tạo payment link
            const paymentResult = (await barApi.createPaymentLink(bookingResult.BookedScheduleId, dataBooking.totalAmount)).data!;
            if (!bookingResult?.BookedScheduleId) {
                Alert.alert("Lỗi", "Không thể tạo booking!");
                return;
            }
            clearData()

            if (paymentResult?.paymentUrl) {
                // Chuyển đến trang thanh toán
                setIsConfirm(false);
                onClose()
                router.push({
                    pathname: "/payment",
                    params: {
                        url: paymentResult.paymentUrl,
                        bookingId: bookingResult.BookedScheduleId,
                    },
                });
            }
        } catch (error) {
            console.error("Booking error:", error);
            Alert.alert("Lỗi", "Có lỗi xảy ra. Vui lòng thử lại!");
        }
    };

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return (
        <>
            <Modal visible={visible} animationType="slide">
                <ScrollView contentContainerStyle={styles.modalContainer}>
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Ionicons name="close" size={32}/>
                    </TouchableOpacity>

                    <Text style={styles.title}>Đặt bàn</Text>
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
                                        updateForm("date", date.toLocaleDateString("vi-VN"));
                                        clearError("date");
                                    }
                                }}
                            />
                        )}
                    </View>

                    <View style={{marginBottom: 7}}>
                        <Text style={{marginBottom: 4}}>Họ và tên <Text style={{color: 'red'}}>*</Text></Text>
                        <View style={[
                            styles.inputContainer,
                            errors.fullName && styles.errorBorder
                        ]}>
                            <TextInput
                                placeholder="Họ và tên"
                                placeholderTextColor="#9ca3af"
                                style={styles.input}
                                value={form.fullName}
                                onChangeText={(t) => {
                                    updateForm("fullName", t);
                                    clearError("fullName");
                                }}
                            />
                        </View>
                        {errors.fullName && <Text style={styles.error}>{errors.fullName}</Text>}
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
                                style={styles.input}
                                value={form.phone}
                                onChangeText={(t) => {
                                    updateForm("phone", t);
                                    clearError("phone");
                                }}
                            />
                        </View>
                        {errors.phone && <Text style={styles.error}>{errors.phone}</Text>}
                    </View>

                    <View>
                        <Text style={styles.label}>Ghi chú (Tùy chọn)</Text>
                        <TextInput
                            style={styles.textArea}
                            placeholderTextColor="#9ca3af"
                            placeholder="Nhập ghi chú"
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
                {isConfirm &&  (<ConfirmBooking
                    onClose={() => setIsConfirm(false)}
                    data={data}
                    onConfirmPayment={confirmPayment}
                />)}
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    input: {
        flex: 1,
        padding: 12,
        fontSize: 15,
        color: "#1e293b",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#767676"
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
    }
});
