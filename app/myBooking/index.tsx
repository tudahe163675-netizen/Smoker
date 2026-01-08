import {useAuth} from '@/hooks/useAuth';
import {useBar} from '@/hooks/useBar';
import {MyBooking} from '@/types/barType';
import {useRouter} from 'expo-router';
import {
    ChevronLeft
} from 'lucide-react-native';
import React, {useEffect, useState} from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import BookingDetailModal from "@/app/myBooking/modal/BookingDetailModal";
import RenderItem from "@/app/myBooking/renderItem";
import CancelBookingModal from "@/app/myBooking/modal/CancelBookingModal";
import PaymentModal from "@/app/myBooking/modal/PaymentModal";
import {BarApiService} from "@/services/barApi";

const SkeletonCard = () => (
    <View style={styles.skeletonCard}>
        <View style={styles.skeletonLineShort}/>
        <View style={styles.skeletonLine}/>
        <View style={styles.skeletonLine}/>
        <View style={[styles.skeletonLine, {width: '60%'}]}/>
    </View>
);

export default function MyBookingsScreen() {
    const router = useRouter();

    const {myBookings, loadingMyBookings, fetchMyBookings} = useBar();
    const [refreshing, setRefreshing] = useState(false);
    const {authState} = useAuth();
    const entityAccountId = authState.EntityAccountId;
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [visible, setVisible] = useState(false);
    const [data, setData] = useState<any>({});
    const barApi = new BarApiService(authState.token!);

    useEffect(() => {
        if (entityAccountId) {
            fetchMyBookings(entityAccountId);
        }
    }, [entityAccountId, fetchMyBookings]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchMyBookings(entityAccountId!);
        setRefreshing(false);
    };

    const handleBackPress = () => {
        router.back();
    };

    const PaymentProcessing = async () =>{
        await barApi.getPaymentLink(data.bookedScheduleId).then((response) => {
            let res = response.data;
            setShowPaymentModal(false);
            router.push({
                pathname: "/payment",
                params: {
                    url: res.paymentUrl,
                    bookingId: res.bookingId,
                },
            });
        })
    }

    const CalendarCancel = async () =>{
        await barApi.cancelBooking(data.bookedScheduleId).then((response) => {
            onRefresh()
        })
        setShowCancelModal(false);
    }


    return (
        <SafeAreaView style={styles.container}>
            {/* Header cố định */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                    <ChevronLeft size={28} color="#1f2937"/>
                </TouchableOpacity>
                <Text style={styles.title}>Lịch đặt bàn của tôi</Text>
                <View style={{width: 40}}/>
            </View>

            {/* Skeleton khi đang load lần đầu */}
            {loadingMyBookings && myBookings.length === 0 ? (
                <View style={styles.listContainer}>
                    {[...Array(5)].map((_, i) => (
                        <SkeletonCard key={i}/>
                    ))}
                </View>
            ) : (
                <FlatList
                    data={myBookings}
                    renderItem={({item, index}) => (
                        <RenderItem
                            item={item}
                            index={index}
                            setDataBooking={setData}
                            showDetail={() => setVisible(true)}
                            onCancel={() => {
                                setData(item)
                                setShowCancelModal(true);
                            }}
                            onPay={() => {
                                setData(item)
                                setShowPaymentModal(true);
                            }}
                        />
                    )}
                    keyExtractor={(item) => item.bookedScheduleId}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#6366f1']}
                            tintColor="#6366f1"
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyTitle}>Chưa có lịch đặt nào</Text>
                            <Text style={styles.emptySubtitle}>
                                Khi bạn đặt bàn, chúng sẽ xuất hiện ở đây
                            </Text>
                        </View>
                    }
                    contentContainerStyle={[
                        styles.listContainer,
                        myBookings.length === 0 && {flex: 1},
                    ]}
                    showsVerticalScrollIndicator={false}
                />
            )}
            <BookingDetailModal visible={visible} dataBooking={data} onClose={() => setVisible(false)}/>
            <CancelBookingModal
                visible={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={CalendarCancel}
            />

            <PaymentModal
                visible={showPaymentModal}
                amount={data?.totalAmount ?? 0}
                onClose={() => setShowPaymentModal(false)}
                onPay={PaymentProcessing}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    backButton: {
        padding: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    listContainer: {
        padding: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
    },
    skeletonCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 4,
    },
    skeletonLine: {
        height: 16,
        backgroundColor: '#e2e8f0',
        borderRadius: 8,
        marginBottom: 12,
    },
    skeletonLineShort: {
        height: 16,
        width: '60%',
        backgroundColor: '#e2e8f0',
        borderRadius: 8,
        marginBottom: 12,
    },
});