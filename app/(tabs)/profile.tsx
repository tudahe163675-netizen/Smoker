import RenderPost from "@/components/post/PostContent";
import { ProfileHeader } from '@/components/ProfileHeader';
import { SidebarMenu } from '@/components/SidebarMenu';
import { fieldLabels } from '@/constants/profileData';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useBar } from '@/hooks/useBar';
import { FeedApiService } from "@/services/feedApi";
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import ProfileEditModal from '@/components/profile/ProfileEditModal';
import { BarProfileHeader } from '@/components/BarProfileHeader';
import BarInfoTab from '@/app/barProfile/tabs/BarInfoTab';
import BarPostsTab from '@/app/barProfile/tabs/BarPostsTab';
import BarVideosTab from '@/app/barProfile/tabs/BarVideosTab';
import BarReviewsTab from '@/app/barProfile/tabs/BarReviewsTab';
import BarTablesTab from '@/app/barProfile/tabs/BarTablesTab';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');
const PHOTO_SIZE = (screenWidth - 4) / 3;

const getAllPhotos = (posts: any[]) => {
    if (!posts || !Array.isArray(posts)) {
        return [];
    }

    const photos: any[] = [];
    posts.forEach((post) => {
        // Sử dụng medias (format mới) hoặc mediaIds (format cũ)
        const mediaItems = post.medias ?? post.mediaIds ?? [];
        if (Array.isArray(mediaItems)) {
            mediaItems.forEach((image: any) => {
                if (image && image.url) {
                    photos.push({
                        id: `${post.id ?? post._id ?? ''}-${image.id ?? image._id ?? ''}`,
                        uri: image.url,
                        postId: post.id ?? post._id,
                    });
                }
            });
        }
    });
    return photos;
};

type TabType = 'info' | 'posts' | 'photos';
type BarTabType = 'info' | 'posts' | 'videos' | 'reviews' | 'tables';

interface Account {
    id: string;
    name: string;
    email: string;
    avatar: string;
    type: 'personal' | 'dj' | 'bar';
    typeLabel: string;
}

export default function ProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { authState, logout, updateAuthState } = useAuth();
    const {
        profile,
        posts,
        followers,
        following,
        loading,
        error,
        fetchProfile,
        updateProfileField,
        updateProfileImage,
        setFullProfile,
    } = useProfile();

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingField, setEditingField] = useState<string>('');
    const [tempValue, setTempValue] = useState('');
    const [imageLoading, setImageLoading] = useState<'avatar' | 'coverImage' | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('info');
    const [menuVisible, setMenuVisible] = useState(false);
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);
    const [profileEditVisible, setProfileEditVisible] = useState(false);
    const [barActiveTab, setBarActiveTab] = useState<BarTabType>('info');

    const scrollY = useRef(new Animated.Value(0)).current;
    const menuAnimation = useRef(new Animated.Value(-320)).current;
    const [refreshing, setRefreshing] = useState(false);

    const allPhotos = getAllPhotos(posts || []);
    const accountId = authState.EntityAccountId;
    const feedApi = new FeedApiService(authState.token!)

    const {
        barDetail,
        tables,
        bookedTables,
        fetchBarDetail,
        fetchTables,
        fetchBookedTables,
    } = useBar();

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchProfile();
        setRefreshing(false);
    }, [fetchProfile]);

    const toggleMenu = () => {
        if (menuVisible) {
            Animated.timing(menuAnimation, {
                toValue: -320,
                duration: 300,
                useNativeDriver: true,
            }).start(() => setMenuVisible(false));
        } else {
            setMenuVisible(true);
            Animated.timing(menuAnimation, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    };

    const handleLogout = () => {
        toggleMenu();
        setTimeout(() => {
            setLogoutModalVisible(true);
        }, 300);
    };

    const confirmLogout = () => {
        setLogoutModalVisible(false);
        logout();
    };

    const handlePostPress = (postId: string) => {
        // router.push({ pathname: '/post', params: { id: postId } });
    };

    const handleFollowersPress = () => {
        if (!accountId) return;
        router.push({
            pathname: '/follow',
            params: { type: 'followers', userId: accountId },
        });
    };

    const handleFollowingPress = () => {
        if (!accountId) return;
        router.push({
            pathname: '/follow',
            params: { type: 'following', userId: accountId },
        });
    };

    const pickImage = useCallback(
        async (type: 'avatar' | 'coverImage') => {
            try {
                setImageLoading(type);
                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: type === 'avatar' ? [1, 1] : [2, 1],
                    quality: 0.8,
                });

                if (!result.canceled) {
                    const success = await updateProfileImage(type, result.assets[0].uri);
                    if (success) {
                        Alert.alert('Thành công', 'Đã cập nhật ảnh');
                    }
                }
            } catch (error) {
                console.error('Error picking image:', error);
                Alert.alert('Lỗi', 'Không thể chọn ảnh');
            } finally {
                setImageLoading(null);
            }
        },
        [updateProfileImage]
    );

    const openEditModal = (field: string, currentValue: string) => {
        setEditingField(field);
        setTempValue(currentValue);
        setEditModalVisible(true);
    };

    const saveEdit = async () => {
        if (!tempValue.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập giá trị');
            return;
        }
        setEditModalVisible(false);
        const success = await updateProfileField(editingField, tempValue);
        if (success) {
            Alert.alert('Thành công', 'Đã cập nhật thông tin');
        }
    };

    const getProfileType = (): 'Account' | 'BarPage' | 'BusinessAccount' => {
        const roleUpper = (profile?.role || '').toString().toUpperCase();
        const typeUpper = (profile as any)?.type ? String((profile as any).type).toUpperCase() : '';

        if (typeUpper.includes('BAR') || roleUpper.includes('BAR')) return 'BarPage';
        if (roleUpper === 'DJ' || roleUpper === 'DANCER' || typeUpper === 'DJ' || typeUpper === 'DANCER') return 'BusinessAccount';
        return 'Account';
    };

    const isBarProfile = getProfileType() === 'BarPage';

    // barPageId: dùng để fetch combos/events (BarInfoTab) và bar detail/tables
    const barPageId = isBarProfile
        ? (profile as any)?.barPageId ||
          (profile as any)?.BarPageId ||
          (profile as any)?.barPageID ||
          (profile as any)?.targetId ||
          (profile as any)?.targetID ||
          (profile as any)?.id ||
          profile?.targetId ||
          profile?.id ||
          profile?.entityAccountId ||
          accountId
        : null;

    useEffect(() => {
        if (!isBarProfile) return;
        if (!barPageId) return;
        if (!authState.token) return;

        const idStr = String(barPageId);
        // Với own profile, dữ liệu bar cơ bản đã có trong `profile`
        // Chỉ cần fetch tables (BarTablesTab) – tránh gọi /bar/:id gây 404 và spam lỗi
        fetchTables(idStr);
    }, [isBarProfile, barPageId, authState.token, fetchTables]);

    const ProfileItem = ({
        label,
        value,
        icon,
        onPress,
        editable = true,
    }: {
        label: string;
        value: string;
        icon: string;
        onPress?: () => void;
        editable?: boolean;
    }) => (
        <TouchableOpacity
            style={styles.profileItem}
            onPress={editable ? onPress : undefined}
            disabled={!editable}
        >
            <View style={styles.profileItemLeft}>
                <Ionicons name={icon as any} size={20} color="#6b7280" />
                <View style={styles.profileItemText}>
                    <Text style={styles.profileItemLabel}>{label}</Text>
                    <Text style={styles.profileItemValue}>{value || 'Chưa cập nhật'}</Text>
                </View>
            </View>
            {editable && <Ionicons name="chevron-forward" size={16} color="#6b7280" />}
        </TouchableOpacity>
    );

    const renderPhotoItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.photoItem} onPress={() => handlePostPress(item.postId)}>
            <Image source={{ uri: item.uri }} style={styles.photoImage} />
        </TouchableOpacity>
    );

    const InfoContent = () => (
        <>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
                <ProfileItem
                    label="Tên"
                    value={profile?.userName || ''}
                    icon="person-outline"
                    onPress={() => openEditModal('name', profile?.userName || '')}
                />
                <ProfileItem
                    label="Số điện thoại"
                    value={profile?.phone || ''}
                    icon="call-outline"
                    onPress={() => openEditModal('phone', profile?.phone || '')}
                />
                <ProfileItem
                    label="Tiểu sử"
                    value={profile?.bio || ''}
                    icon="document-text-outline"
                    onPress={() => openEditModal('bio', profile?.bio || '')}
                />
                <ProfileItem
                    label="Email"
                    value={profile?.email || ''}
                    icon="mail-outline"
                    editable={false}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mạng xã hội</Text>
                <ProfileItem
                    label="TikTok"
                    value="http://tiktok.com"
                    icon="logo-tiktok"
                    editable={false}
                />
                <ProfileItem
                    label="Facebook"
                    value="http://facebook.com"
                    icon="logo-facebook"
                    editable={false}
                />
                <ProfileItem
                    label="Instagram"
                    value="http://instagram.com"
                    icon="logo-instagram"
                    editable={false}
                />
            </View>
        </>
    );

    if (loading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text style={styles.loadingText}>Đang tải hồ sơ...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Floating Menu Button - positioned to avoid notch */}
            {!menuVisible && (
                <TouchableOpacity
                    style={[styles.floatingMenuButton, { top: insets.top + 10 }]}
                    onPress={toggleMenu}
                >
                    <Ionicons name="menu" size={28} color="#fff" />
                </TouchableOpacity>
            )}

            <SidebarMenu
                visible={menuVisible}
                menuAnimation={menuAnimation}
                profile={profile}
                onClose={toggleMenu}
                onLogout={handleLogout}
                onProfileRefresh={setFullProfile}
                updateAuth={updateAuthState}
            />

            {/* BAR profile branch: hiển thị tab info (Combo + Event) giống màn bên ngoài */}
            {isBarProfile && profile ? (
                <Animated.ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#2563eb']}
                            tintColor="#2563eb"
                        />
                    }
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
                        useNativeDriver: true,
                    })}
                    scrollEventThrottle={16}
                >
                    <BarProfileHeader
                        barDetail={barDetail || profile}
                        activeTab={barActiveTab}
                        postsCount={posts.length}
                        followingCount={following.length}
                        followerCount={followers.length}
                        onTabChange={setBarActiveTab}
                        onFollowersPress={handleFollowersPress}
                        onFollowingPress={handleFollowingPress}
                    />

                    <View style={{ flex: 0 }}>
                        {barActiveTab === 'info' && (
                            <BarInfoTab barDetail={barDetail || profile} barPageId={String(barPageId || '')} />
                        )}
                        {barActiveTab === 'posts' && <BarPostsTab barPageId={String(barPageId || '')} />}
                        {barActiveTab === 'videos' && <BarVideosTab barPageId={String(barPageId || '')} />}
                        {barActiveTab === 'reviews' && <BarReviewsTab barPageId={String(barPageId || '')} />}
                        {barActiveTab === 'tables' && (
                            <BarTablesTab
                                barPageId={String(barPageId || '')}
                                tables={tables}
                                bookedTables={bookedTables}
                                onRefreshTables={() => fetchTables(String(barPageId || ''))}
                            />
                        )}
                    </View>

                    {error && (
                        <View style={styles.errorContainer}>
                            <Ionicons name="warning-outline" size={20} color="#ef4444" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}
                </Animated.ScrollView>
            ) : activeTab === 'info' ? (
                <Animated.ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#2563eb']}
                            tintColor="#2563eb"
                        />
                    }
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
                        useNativeDriver: true,
                    })}
                    scrollEventThrottle={16}
                >
                    <ProfileHeader
                        profile={profile}
                        imageLoading={imageLoading}
                        activeTab={activeTab}
                        postsCount={posts.length}
                        followingCount={following.length}
                        followerCount={followers.length}
                        onPickImage={pickImage}
                        onTabChange={setActiveTab}
                        onFollowersPress={handleFollowersPress}
                        onFollowingPress={handleFollowingPress}
                        onEditPress={() => setProfileEditVisible(true)}
                    />
                    <InfoContent />

                    {error && (
                        <View style={styles.errorContainer}>
                            <Ionicons name="warning-outline" size={20} color="#ef4444" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}
                </Animated.ScrollView>
            ) : activeTab === 'posts' ? (
                <Animated.FlatList
                    key="posts-list"
                    data={posts}
                    renderItem={({ item }) =>
                        <RenderPost
                            item={item}
                            currentId={authState.currentId}
                            currentEntityAccountId={authState.EntityAccountId}
                            feedApiService={feedApi}
                        />}
                    keyExtractor={(item) => item.id ?? item._id ?? ''}
                    ItemSeparatorComponent={() => (
                        <View style={{ height: 8, backgroundColor: '#f0f2f5' }} />
                    )}
                    ListHeaderComponent={
                        <ProfileHeader
                            profile={profile}
                            imageLoading={imageLoading}
                            activeTab={activeTab}
                            postsCount={posts.length}
                            followingCount={following.length}
                            followerCount={followers.length}
                            onPickImage={pickImage}
                            onTabChange={setActiveTab}
                            onFollowersPress={handleFollowersPress}
                            onFollowingPress={handleFollowingPress}
                            onEditPress={() => setProfileEditVisible(true)}
                        />
                    }
                    contentContainerStyle={{ paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#2563eb']}
                            tintColor="#2563eb"
                        />
                    }
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
                        useNativeDriver: true,
                    })}
                    scrollEventThrottle={16}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="images-outline" size={48} color="#d1d5db" />
                            <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
                        </View>
                    }
                />
            ) : (
                <Animated.FlatList
                    key="photos-grid"
                    data={allPhotos}
                    renderItem={renderPhotoItem}
                    keyExtractor={(item) => item.id ?? ''}
                    numColumns={3}
                    ListHeaderComponent={
                        <ProfileHeader
                            profile={profile}
                            imageLoading={imageLoading}
                            activeTab={activeTab}
                            postsCount={posts.length}
                            followingCount={following.length}
                            followerCount={followers.length}
                            onPickImage={pickImage}
                            onTabChange={setActiveTab}
                            onFollowersPress={handleFollowersPress}
                            onFollowingPress={handleFollowingPress}
                            onEditPress={() => setProfileEditVisible(true)}
                        />
                    }
                    contentContainerStyle={{ paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#2563eb']}
                            tintColor="#2563eb"
                        />
                    }
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
                        useNativeDriver: true,
                    })}
                    scrollEventThrottle={16}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="images-outline" size={48} color="#d1d5db" />
                            <Text style={styles.emptyText}>Chưa có hình ảnh nào</Text>
                        </View>
                    }
                />
            )}

            {/* Edit Modal */}
            <Modal
                visible={editModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Text style={styles.modalCancel}>Hủy</Text>
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>
                                Chỉnh sửa {fieldLabels[editingField] || editingField}
                            </Text>
                            <TouchableOpacity onPress={saveEdit}>
                                <Text style={styles.modalSave}>Lưu</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                            <TextInput
                                style={[styles.modalInput, editingField === 'bio' && styles.modalTextArea]}
                                value={tempValue}
                                onChangeText={setTempValue}
                                placeholder={`Nhập ${(fieldLabels[editingField] || editingField).toLowerCase()}`}
                                multiline={editingField === 'bio'}
                                numberOfLines={editingField === 'bio' ? 4 : 1}
                                autoFocus
                            />
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Full Profile Edit Modal */}
            {!!profile && (
                <ProfileEditModal
                    visible={profileEditVisible}
                    onClose={() => setProfileEditVisible(false)}
                    onSuccess={() => {
                        fetchProfile();
                        setProfileEditVisible(false);
                    }}
                    profile={profile}
                    profileType={getProfileType()}
                    token={authState.token!}
                />
            )}


            <Modal
                visible={logoutModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setLogoutModalVisible(false)}
            >
                <View style={styles.logoutModalOverlay}>
                    <View style={styles.logoutModalContent}>
                        <View style={styles.logoutModalIcon}>
                            <Ionicons name="log-out-outline" size={48} color="#ef4444" />
                        </View>
                        <Text style={styles.logoutModalTitle}>Đăng xuất</Text>
                        <Text style={styles.logoutModalMessage}>
                            Bạn có chắc chắn muốn đăng xuất?
                        </Text>
                        <View style={styles.logoutModalButtons}>
                            <TouchableOpacity
                                style={[styles.logoutModalButton, styles.logoutModalButtonCancel]}
                                onPress={() => setLogoutModalVisible(false)}
                            >
                                <Text style={styles.logoutModalButtonCancelText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.logoutModalButton, styles.logoutModalButtonConfirm]}
                                onPress={confirmLogout}
                            >
                                <Text style={styles.logoutModalButtonConfirmText}>Đăng xuất</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6b7280',
    },

    // Floating Menu Button
    floatingMenuButton: {
        position: 'absolute',
        left: 16,
        zIndex: 1001,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },

    // Posts
    postCard: {
        backgroundColor: '#fff',
        marginHorizontal: 12,
        marginTop: 12,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 3,
    },
    postContent: {
        fontSize: 15,
        color: '#374151',
        lineHeight: 22,
        marginBottom: 12,
    },
    postImages: {
        marginBottom: 12,
    },
    postImage: {
        width: 200,
        height: 150,
        borderRadius: 8,
        marginRight: 8,
    },
    postFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    postStats: {
        flexDirection: 'row',
        gap: 16,
    },
    postStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    postStatText: {
        fontSize: 14,
        color: '#6b7280',
    },
    postTime: {
        fontSize: 12,
        color: '#9ca3af',
    },

    // Photos Grid
    photoItem: {
        width: PHOTO_SIZE,
        height: PHOTO_SIZE,
        margin: 1,
    },
    photoImage: {
        width: '100%',
        height: '100%',
    },

    // Info Section
    section: {
        backgroundColor: '#fff',
        marginTop: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    profileItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    profileItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    profileItemText: {
        marginLeft: 12,
        flex: 1,
    },
    profileItemLabel: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 2,
    },
    profileItemValue: {
        fontSize: 16,
        color: '#111827',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        marginHorizontal: 16,
        marginTop: 12,
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#ef4444',
    },
    errorText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#dc2626',
        flex: 1,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '50%',
        minHeight: 250,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalCancel: {
        fontSize: 16,
        color: '#6b7280',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    modalSave: {
        fontSize: 16,
        color: '#2563eb',
        fontWeight: '600',
    },
    modalScrollView: {
        flex: 1,
        maxHeight: 200,
    },
    modalInput: {
        padding: 12,
        fontSize: 16,
        color: '#1f2937',
        marginBottom: 16,
    },
    modalTextArea: {
        height: 120,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 48,
        paddingHorizontal: 32,
    },
    emptyText: {
        fontSize: 18,
        color: '#6b7280',
        marginTop: 16,
        fontWeight: '500',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 20,
    },
    // Logout Modal styles
    logoutModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutModalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '85%',
        maxWidth: 400,
        alignItems: 'center',
    },
    logoutModalIcon: {
        marginBottom: 16,
    },
    logoutModalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
    },
    logoutModalMessage: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    logoutModalButtons: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    logoutModalButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoutModalButtonCancel: {
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    logoutModalButtonCancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    logoutModalButtonConfirm: {
        backgroundColor: '#ef4444',
    },
    logoutModalButtonConfirmText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});