import AnimatedHeader from '@/components/ui/AnimatedHeader';
import { Colors } from '@/constants/colors';
import {Notification} from '@/constants/notiData';
import {useNotifications} from '@/hooks/useNotifications';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import React, {useCallback, useRef, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    RefreshControl,
    FlatList as RNFlatList,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {formatTime} from "@/utils/extension";

// Bọc FlatList với Animated.createAnimatedComponent
const AnimatedFlatList = Animated.createAnimatedComponent(RNFlatList);

export default function NotificationScreen() {
    const {notifications, unreadCount, isLoading, error, markAsRead, markAllAsRead, clearNotifications, refresh} = useNotifications();
    const scrollY = useRef(new Animated.Value(0)).current;
    const [refreshing, setRefreshing] = useState(false);
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const headerTranslateY = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, -100],
        extrapolate: 'clamp',
    });

    // Refresh handler

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refresh(); // Gọi hàm refresh từ useNotifications
        setRefreshing(false);
    }, [refresh]);

    // Get icon based on notification type
    const getNotificationIcon = (type: Notification['type'], content?: string) => {
        // Check if it's a withdrawal notification by content
        const isWithdrawNotification = content?.toLowerCase().includes('rút tiền') || 
                                      content?.toLowerCase().includes('giao dịch') ||
                                      type === 'withdraw' || 
                                      type === 'wallet';
        
        if (isWithdrawNotification) {
            return <Ionicons name="wallet-outline" size={16} color="#10b981"/>;
        }

        // Check if it's a live stream notification
        const isLiveStreamNotification = content?.toLowerCase().includes('phát trực tiếp') || 
                                        content?.toLowerCase().includes('live stream') ||
                                        type === 'livestream';
        
        if (isLiveStreamNotification) {
            return <Ionicons name="videocam" size={16} color="#ef4444"/>;
        }
        
        switch (type) {
            case 'like':
                return <Ionicons name="heart" size={16} color="#ef4444"/>;
            case 'comment':
                return <Ionicons name="chatbubble" size={16} color="#3b82f6"/>;
            case 'follow':
                return <Ionicons name="person-add" size={16} color="#10b981"/>;
            case 'post':
                return <Ionicons name="document" size={16} color="#8b5cf6"/>;
            case 'mention':
                return <Ionicons name="at" size={16} color="#f59e0b"/>;
            default:
                return <Ionicons name="notifications" size={16} color="#6b7280"/>;
        }
    };

    // Handle notification press
    const handleNotificationPress = useCallback((notification: Notification) => {
        if (!(notification.status == "Read")) {
            markAsRead(notification._id);
        }

        // Check if it's a withdrawal notification
        const isWithdrawNotification = notification.content?.toLowerCase().includes('rút tiền') || 
                                      notification.content?.toLowerCase().includes('giao dịch') ||
                                      notification.type === 'withdraw' || 
                                      notification.type === 'wallet';

        if (isWithdrawNotification) {
            // Navigate to wallet page
            router.push('/wallet');
            return;
        }

        // Check if it's a live stream notification
        const isLiveStreamNotification = notification.content?.toLowerCase().includes('phát trực tiếp') || 
                                        notification.content?.toLowerCase().includes('live stream') ||
                                        notification.type === 'livestream' ||
                                        notification.link?.includes('/livestream/');

        if (isLiveStreamNotification) {
            // Extract livestream ID from link or content
            const livestreamIdMatch = notification.link?.match(/livestream\/([^\/]+)/) || 
                                     notification.content?.match(/livestream[:\s]+([^\s]+)/i);
            const livestreamId = livestreamIdMatch ? livestreamIdMatch[1] : null;

            if (livestreamId) {
                // Navigate to livestream viewer
                // TODO: Implement livestream viewer page
                Alert.alert(
                    'Live Stream',
                    'Tính năng xem live stream đang được phát triển. Vui lòng xem trên web để có trải nghiệm đầy đủ.',
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert(
                    'Live Stream',
                    'Live stream này đã kết thúc.',
                    [{ text: 'OK' }]
                );
            }
            return;
        }

        const [, type, id] = notification.link.split("/");
        let path = "";
        switch (type) {
            case 'profile':
                path = "user";
                break;
            case 'posts':
                path = "post";
                break;
            default:
                path = "";
                break;
        }
        router.push({
            pathname: `/${path}` as any,
            params: {id: id},
        });
    }, [markAsRead, router]);

    const renderListEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={60} color="#d1d5db"/>
            <Text style={styles.emptyText}>Không có thông báo nào</Text>
            <Text style={styles.emptySubText}>
                Khi có thông báo mới, chúng sẽ hiển thị ở đây
            </Text>
        </View>
    );

    const renderNotification = ({item}: { item: Notification }) => (
        <TouchableOpacity
            style={[styles.notificationItem, !(item.status == "Read") && styles.unreadNotification]}
            onPress={() => handleNotificationPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.notificationContent}>
                <View style={styles.avatarContainer}>
                    <Image source={{uri: item.sender.avatar}} style={styles.avatar}/>
                    <View style={styles.iconBadge}>
                        {getNotificationIcon(item.type, item.content)}
                    </View>
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.notificationText}>
                        {/* Don't show sender name for withdrawal notifications */}
                        {(() => {
                            const isWithdrawNotification = item.content?.toLowerCase().includes('rút tiền') || 
                                                          item.content?.toLowerCase().includes('giao dịch') ||
                                                          item.type === 'withdraw' || 
                                                          item.type === 'wallet';
                            
                            if (isWithdrawNotification) {
                                return <Text>{item.content}</Text>;
                            }
                            return (
                                <>
                                    <Text style={styles.userName}>{item.sender.name} </Text>
                                    {item.content}
                                </>
                            );
                        })()}
                    </Text>
                    <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
                </View>

                {/*{item.postImage && (*/}
                {/*  <Image source={{ uri: item.postImage }} style={styles.postThumbnail} />*/}
                {/*)}*/}

                {!(item.status == "Read") && <View style={styles.unreadDot}/>}
            </View>
        </TouchableOpacity>
    );

    const headerHeight = insets.top + 64;

    // Loading UI
    if (isLoading) {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <AnimatedHeader
                title="Thông Báo"
                headerTranslateY={headerTranslateY}
                style={{ paddingTop: insets.top, height: headerHeight }}
            />
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary}/>
                <Text style={styles.loadingText}>Đang tải thông báo...</Text>
            </View>
        </View>
    );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <AnimatedHeader
                title="Thông Báo"
                iconName={unreadCount > 0 ? 'checkmark-done-outline' : undefined}
                onIconPress={unreadCount > 0 ? markAllAsRead : undefined}
                headerTranslateY={headerTranslateY}
                style={{ paddingTop: insets.top, height: headerHeight }}
            />

            {/* Notifications List with RefreshControl */}
            <AnimatedFlatList
                data={notifications}
                renderItem={renderNotification as any}
                keyExtractor={(item) => item._id}
                style={styles.list}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.separator}/>}
                ListEmptyComponent={renderListEmpty}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#2563eb']}
                        tintColor="#2563eb"
                    />
                }
                contentContainerStyle={{
                    paddingTop: headerHeight,
                    paddingBottom: insets.bottom,
                }}
                onScroll={Animated.event([{nativeEvent: {contentOffset: {y: scrollY}}}], {
                    useNativeDriver: true,
                })}
                scrollEventThrottle={16}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6b7280',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
        fontFamily: 'System',
    },
    markAllButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#3b82f6',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    markAllText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    unreadCountContainer: {
        backgroundColor: '#eff6ff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    unreadCountText: {
        fontSize: 14,
        color: '#1d4ed8',
        fontWeight: '600',
    },
    list: {
        flex: 1,
    },
    notificationItem: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginHorizontal: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 3,
        marginBottom: 8,
    },
    unreadNotification: {
        backgroundColor: '#fefce8',
        borderLeftWidth: 4,
        borderLeftColor: '#3b82f6',
    },
    notificationContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    iconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#f3f4f6',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    textContainer: {
        flex: 1,
        marginRight: 12,
    },
    notificationText: {
        fontSize: 16,
        lineHeight: 22,
        color: '#1f2937',
        fontFamily: 'System',
    },
    userName: {
        fontWeight: '700',
        color: '#111827',
    },
    timeText: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 4,
        fontFamily: 'System',
    },
    postThumbnail: {
        width: 48,
        height: 48,
        borderRadius: 8,
        marginLeft: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    unreadDot: {
        width: 10,
        height: 10,
        backgroundColor: '#3b82f6',
        borderRadius: 5,
        marginLeft: 8,
        marginTop: 8,
    },
    separator: {
        height: 1,
        backgroundColor: '#f3f4f6',
        marginHorizontal: 12,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 120,
        paddingHorizontal: 32,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16,
        textAlign: 'center',
        fontFamily: 'System',
    },
    emptySubText: {
        fontSize: 15,
        color: '#6b7280',
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 22,
        fontFamily: 'System',
    },
});