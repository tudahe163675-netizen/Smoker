import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import Dropdown from "@/components/Dropdown";
import { useAuth } from "@/hooks/useAuth";
import { ProfileApiService } from "@/services/profileApi";
import { UpdateProfileRequestData } from "@/types/profileType";

export default function CompleteProfileScreen() {
    const router = useRouter();
    const { authState, updateAuthState } = useAuth();
    const profileApi = new ProfileApiService(authState.token!);

    const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;

    // FORM STATE
    const [form, setForm] = useState({
        displayName: "",
        avatar: null as string | null,
        background: null as string | null,
        bio: "",
        phone: "",
        gender: "",
        provinceId: "",
        districtId: "",
        wardId: "",
    });

    const [errors, setErrors] = useState({
        displayName: "",
        avatar: "",
        phone: "",
    });

    const [isLoading, setIsLoading] = useState(false);

    // LOCATION STATE
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    // ====== GENERIC SETTER ======
    const updateForm = (key: string, value: any) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    // ====== LOCATION API WRAPPER (TO REUSE) ======
    const fetchLocation = useCallback(async (url: string, setter: Function) => {
        try {
            const res = await fetch(url);
            const data = await res.json();
            setter(
                data.data.map((x: any) => ({
                    value: x.id,
                    label: `${x.name} (${x.typeText})`,
                }))
            );
        } catch (e) {
            console.error(e);
        }
    }, []);

    // ====== LOAD PROVINCES ======
    useEffect(() => {
        fetchLocation(
            "https://open.oapi.vn/location/provinces?page=0&size=100",
            setProvinces
        );
    }, []);

    // ====== ON PROVINCE CHANGE ======
    const onSelectProvince = (id: string) => {
        updateForm("provinceId", id);
        updateForm("districtId", "");
        updateForm("wardId", "");
        fetchLocation(
            `https://open.oapi.vn/location/districts/${id}?page=0&size=100`,
            setDistricts
        );
        setWards([]);
    };

    // ====== ON DISTRICT CHANGE ======
    const onSelectDistrict = (id: string) => {
        updateForm("districtId", id);
        updateForm("wardId", "");
        fetchLocation(
            `https://open.oapi.vn/location/wards/${id}?page=0&size=100`,
            setWards
        );
    };

    // ====== PICK IMAGE GENERIC ======
    const pickImage = async (type: "avatar" | "background") => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: type === "avatar" ? [1, 1] : [2, 1],
                quality: 0.8,
            });

            if (!result.canceled) {
                updateForm(type, result.assets[0].uri);
                setErrors((prev) => ({ ...prev, avatar: "" }));
            }
        } catch {
            Alert.alert("Lỗi", "Không thể chọn ảnh");
        }
    };

    // ====== VALIDATE FORM ======
    const validate = () => {
        const newErrors = {
            displayName: "",
            avatar: "",
            phone: "",
        };

        if (!form.displayName.trim()) newErrors.displayName = "Tên hiển thị là bắt buộc";
        else if (form.displayName.trim().length < 4)
            newErrors.displayName = "Tên phải có ít nhất 4 ký tự";

        if (!form.avatar) newErrors.avatar = "Vui lòng chọn ảnh đại diện";

        if (!form.phone.trim() || !phoneRegex.test(form.phone.trim()))
            newErrors.phone = "Số điện thoại không hợp lệ";

        setErrors(newErrors);

        return !Object.values(newErrors).some((e) => e);
    };

    // ====== SUBMIT ======
    const onSubmitInfo = async () => {
        if (!validate()) return;

        setIsLoading(true);

        try {
            const req: UpdateProfileRequestData = {
                userName: form.displayName,
                bio: form.bio,
                phone: form.phone,
                gender: form.gender,
            };

            if (form.avatar) {
                req.avatar = {
                    uri: form.avatar,
                    name: `avatar_${Date.now()}.jpg`,
                    type: "image/jpeg",
                };
            }

            if (form.background) {
                req.background = {
                    uri: form.background,
                    name: `background_${Date.now()}.jpg`,
                    type: "image/jpeg",
                };
            }

            const res = await profileApi.updateProfile(req);

            if (!res.success && res.success !== undefined) {
                Alert.alert("Thất bại", "Hoàn thiện hồ sơ thất bại! Vui lòng thử lại");
                return;
            }

            if (res.data && form.avatar) {
                updateAuthState({
                    avatar: res.data.avatar,
                });
            }

            Alert.alert("Thành công", "Hoàn thiện hồ sơ thành công!");
            router.push("/(tabs)");
        } catch {
            Alert.alert("Lỗi", "Không thể hoàn thiện hồ sơ");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* HEADER WITH GRADIENT */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    disabled={isLoading}
                    onPress={() => router.push("/auth/login")}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.title}>Hoàn thiện hồ sơ</Text>
                    <Text style={styles.subtitle}>
                        Tạo hồ sơ cá nhân để kết nối với cộng đồng.
                    </Text>
                </View>
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scroll}
                >
                    {/* PROFILE PICTURE SECTION */}
                    <View style={styles.profileSection}>
                        <View style={styles.avatarContainer}>
                            <TouchableOpacity
                                style={[styles.avatarWrapper, errors.avatar && styles.inputError]}
                                onPress={() => pickImage("avatar")}
                            >
                                {form.avatar ? (
                                    <Image source={{ uri: form.avatar }} style={styles.avatar} />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <Ionicons name="camera" size={30} color="#fff" />
                                        <Text style={styles.avatarText}>Thêm ảnh đại diện</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            {errors.avatar ? (
                                <Text style={styles.errorText}>{errors.avatar}</Text>
                            ) : null}
                        </View>

                        {/* BACKGROUND IMAGE */}
                        <View style={styles.backgroundContainer}>
                            <Text style={styles.label}>Ảnh nền</Text>
                            <TouchableOpacity
                                style={styles.backgroundWrapper}
                                onPress={() => pickImage("background")}
                            >
                                {form.background ? (
                                    <Image source={{ uri: form.background }} style={styles.backgroundImage} />
                                ) : (
                                    <View style={styles.backgroundPlaceholder}>
                                        <Ionicons name="image" size={24} color="#64748b" />
                                        <Text style={styles.backgroundText}>Chọn ảnh nền</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* FORM SECTION */}
                    <View style={styles.formSection}>
                        {/* DISPLAY NAME */}
                        <Text style={styles.label}>
                            Tên hiển thị <Text style={{ color: "#ef4444" }}>*</Text>
                        </Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#64748b" style={styles.inputIcon} />
                            <TextInput
                                placeholder="Nhập tên hiển thị"
                                placeholderTextColor="#9ca3af"
                                style={[styles.input, errors.displayName && styles.inputError]}
                                value={form.displayName}
                                onChangeText={(v) => updateForm("displayName", v)}
                            />
                        </View>
                        {errors.displayName ? (
                            <Text style={styles.errorText}>{errors.displayName}</Text>
                        ) : null}

                        {/* BIO */}
                        <Text style={styles.label}>Giới thiệu</Text>
                        <View style={styles.textAreaContainer}>
                            <TextInput
                                placeholder="Viết vài dòng về bạn..."
                                placeholderTextColor="#9ca3af"
                                style={styles.textArea}
                                multiline
                                value={form.bio}
                                onChangeText={(v) => updateForm("bio", v)}
                            />
                        </View>

                        {/* LOCATION SECTION */}
                        <View style={styles.locationSection}>
                            <Text style={styles.sectionTitle}>Địa chỉ</Text>

                            {/* PROVINCE */}
                            <Text style={styles.label}>Tỉnh/Thành phố</Text>
                            <View style={styles.pickerContainer}>
                                <Ionicons name="location-outline" size={20} color="#64748b" style={styles.inputIcon} />
                                <Dropdown
                                    data={provinces}
                                    placeholder="Chọn Tỉnh/Thành phố"
                                    onChange={(i) => onSelectProvince(i.value)}
                                />
                            </View>

                            {/* DISTRICT */}
                            {form.provinceId ? (
                                <>
                                    <Text style={styles.label}>Quận/Huyện</Text>
                                    <View style={styles.pickerContainer}>
                                        <Dropdown
                                            data={districts}
                                            placeholder="Chọn Quận/Huyện"
                                            onChange={(i) => onSelectDistrict(i.value)}
                                        />
                                    </View>
                                </>
                            ) : null}

                            {/* WARD */}
                            {form.districtId ? (
                                <>
                                    <Text style={styles.label}>Phường/Xã</Text>
                                    <View style={styles.pickerContainer}>
                                        <Dropdown
                                            data={wards}
                                            placeholder="Chọn Phường/Xã"
                                            onChange={(i) => updateForm("wardId", i.value)}
                                        />
                                    </View>

                                    <Text style={styles.label}>Địa chỉ chi tiết</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="home-outline" size={20} color="#64748b" style={styles.inputIcon} />
                                        <TextInput
                                            placeholder="Số nhà, tên đường..."
                                            style={styles.input}
                                        />
                                    </View>
                                </>
                            ) : null}
                        </View>

                        {/* CONTACT SECTION */}
                        <View style={styles.contactSection}>
                            <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>

                            {/* PHONE */}
                            <Text style={styles.label}>
                                Số điện thoại <Text style={{ color: "#ef4444" }}>*</Text>
                            </Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="call-outline" size={20} color="#64748b" style={styles.inputIcon} />
                                <TextInput
                                    placeholder="0123456789"
                                    placeholderTextColor="#9ca3af"
                                    keyboardType="phone-pad"
                                    style={[styles.input, errors.phone && styles.inputError]}
                                    value={form.phone}
                                    onChangeText={(v) => updateForm("phone", v)}
                                />
                            </View>
                            {errors.phone ? (
                                <Text style={styles.errorText}>{errors.phone}</Text>
                            ) : null}

                            {/* GENDER */}
                            <Text style={styles.label}>Giới tính</Text>
                            <View style={styles.pickerContainer}>
                                <Ionicons name="person-outline" size={20} color="#64748b" style={styles.inputIcon} />
                                <Dropdown
                                    data={[
                                        { label: "Nam", value: "male" },
                                        { label: "Nữ", value: "female" },
                                        { label: "Khác", value: "other" },
                                    ]}
                                    placeholder="Chọn giới tính"
                                    onChange={(i) => updateForm("gender", i.value)}
                                />
                            </View>
                        </View>

                        {/* SUBMIT BUTTON */}
                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.disabled]}
                            disabled={isLoading}
                            onPress={onSubmitInfo}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Lưu thông tin</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    header: {
        backgroundColor: "#3b82f6",
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 44,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    backButton: {
        position: "absolute",
        top: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 10 : 54,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        zIndex: 10,
    },
    headerContent: {
        alignItems: "center",
        marginTop: 10,
    },
    title: {
        fontSize: 26,
        fontWeight: "700",
        color: "#fff",
        marginBottom: 6,
    },
    subtitle: {
        textAlign: "center",
        color: "rgba(255, 255, 255, 0.8)",
        fontSize: 14,
    },
    scroll: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
    },
    profileSection: {
        alignItems: "center",
        marginBottom: 30,
    },
    avatarContainer: {
        alignItems: "center",
        marginBottom: 20,
    },
    avatarWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: "#fff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        overflow: "hidden",
        backgroundColor: "#e2e8f0",
    },
    avatar: {
        width: "100%",
        height: "100%",
    },
    avatarPlaceholder: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#94a3b8",
    },
    avatarText: {
        color: "#fff",
        fontSize: 12,
        marginTop: 5,
    },
    backgroundContainer: {
        width: "100%",
    },
    backgroundWrapper: {
        width: "100%",
        height: 120,
        borderRadius: 12,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    backgroundImage: {
        width: "100%",
        height: "100%",
    },
    backgroundPlaceholder: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f1f5f9",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderStyle: "dashed",
        borderRadius: 12,
    },
    backgroundText: {
        color: "#64748b",
        fontSize: 14,
        marginTop: 5,
    },
    formSection: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    label: {
        marginBottom: 8,
        marginTop: 12,
        fontWeight: "600",
        color: "#1e293b",
        fontSize: 14,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8fafc",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        marginBottom: 10,
    },
    inputIcon: {
        padding: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        paddingRight: 12,
        fontSize: 15,
        color: "#1e293b",
    },
    textAreaContainer: {
        backgroundColor: "#f8fafc",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        marginBottom: 10,
    },
    textArea: {
        padding: 12,
        fontSize: 15,
        minHeight: 100,
        color: "#1e293b",
        textAlignVertical: "top",
    },
    pickerContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8fafc",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        marginBottom: 10,
        overflow: "hidden",
    },
    locationSection: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
    },
    contactSection: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1e293b",
        marginBottom: 10,
    },
    button: {
        backgroundColor: "#3b82f6",
        paddingVertical: 14,
        borderRadius: 10,
        marginTop: 20,
        shadowColor: "#3b82f6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    disabled: {
        backgroundColor: "#93c5fd",
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
    },
    inputError: {
        borderColor: "#ef4444",
        backgroundColor: "#fef2f2",
    },
    errorText: {
        color: "#ef4444",
        fontSize: 12,
        marginTop: -5,
        marginBottom: 10,
    },
});