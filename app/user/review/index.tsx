import React, {useEffect, useMemo, useState} from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput, ActivityIndicator
} from "react-native";
import {StarRating} from "@/components/StarRating";
import {User} from "@/constants/feedData";
import {formatReviewTime} from "@/utils/extension";
import {ProfileApiService} from "@/services/profileApi";
import {AuthState} from "@/constants/authData";

interface ReviewProps {
    userReview: any,
    user: User,
    authState: AuthState,
    refreshComments: () => Promise<void>
}

export default function Index({userReview, user, authState, refreshComments}: ReviewProps) {
    const reviewApi = new ProfileApiService(authState.token!);
    const [dataReview, setDataReview] = useState<any | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [rating, setRating] = useState(1);
    const [comment, setComment] = useState("");

    useEffect(() => {
        const found = userReview.reviews.find(
            (item) => item.AccountId === authState.currentId
        );
        setDataReview(found || null);
    }, [userReview.reviews, authState.currentId]);

    const isNewReview = !dataReview;

    useEffect(() => {
        if (dataReview) {
            setRating(dataReview.StarValue);
            setComment(dataReview.Content || "");
            setIsEditing(false);
        } else {
            setRating(1);
            setComment("");
            setIsEditing(false);
        }
    }, [dataReview]);

    const isValidReview = rating >= 1;

    const submitReview = async () => {
        if (!isValidReview || isLoading) return;

        try {
            setIsLoading(true);

            const payload = {
                BussinessAccountId: user.targetId,
                AccountId: authState.currentId,
                Content: comment,
                StarValue: rating,
            };

            await reviewApi.createReview(payload);

            setDataReview({
                ...(dataReview || {}),
                ...payload,
                ReviewId: dataReview?.ReviewId,
                created_at: dataReview?.created_at
            });

            refreshComments()
            setIsEditing(false);
        } catch (error) {
            console.log("Submit review error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const removeReview = async () => {
        if (!dataReview || isLoading) return;

        try {
            setIsLoading(true);
            await reviewApi.deleteReview(dataReview.ReviewId);

            setDataReview(null);
            setRating(1);
            setComment("");
            refreshComments();
            setIsEditing(false);
        } catch (error) {
            console.log("Delete review error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const startEdit = () => {
        if (!dataReview) return;

        setRating(dataReview.StarValue);
        setComment(dataReview.Content || "");
        setIsEditing(true);
    };

    const cancelEdit = () => {
        if (!dataReview) return;

        setRating(dataReview.StarValue);
        setComment(dataReview.Content || "");
        setIsEditing(false);
    };

    const renderReviewForm = (submitText: string, onCancel?: () => void) => (
        <>
            <Text style={styles.label}>Chọn xếp hạng <Text style={{color: 'red'}}>*</Text></Text>
            <StarRating rating={rating} onChange={setRating}/>

            {rating < 1 && (
                <Text style={styles.errorText}>
                    Vui lòng chọn ít nhất 1 sao để đánh giá
                </Text>
            )}

            <TextInput
                style={styles.input}
                placeholder="Viết trải nghiệm của bạn (không bắt buộc)"
                value={comment}
                onChangeText={setComment}
                multiline
            />

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[
                        styles.btn,
                        styles.editBtn,
                        (!isValidReview || isLoading) && styles.disabledBtn,
                    ]}
                    disabled={!isValidReview || isLoading}
                    onPress={submitReview}
                >
                    <Text style={styles.editText}>{submitText}</Text>
                </TouchableOpacity>

                {onCancel && (
                    <TouchableOpacity
                        style={[styles.btn, styles.deleteBtn]}
                        onPress={onCancel}
                        disabled={isLoading}
                    >
                        <Text style={styles.deleteText}>Hủy</Text>
                    </TouchableOpacity>
                )}
            </View>
        </>
    );

    const renderExistingReview = () => (
        <>
            <StarRating rating={dataReview!.StarValue} size={16}/>

            <Text style={styles.time}>
                Bạn đã đánh giá vào lúc:{" "}
                {formatReviewTime(dataReview!.created_at)}
            </Text>

            <Text style={styles.comment}>{dataReview!.Content}</Text>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.btn, styles.editBtn]}
                    onPress={startEdit}
                    disabled={isLoading}
                >
                    <Text style={styles.editText}>Sửa đánh giá</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.btn, styles.deleteBtn]}
                    onPress={removeReview}
                    disabled={isLoading}
                >
                    <Text style={styles.deleteText}>Xóa đánh giá</Text>
                </TouchableOpacity>
            </View>
        </>
    );
    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                Phản hồi của khách hàng đối với {user.name}
            </Text>

            {userReview.stats.averageStar !== 0 ?
                <>
                    <Text style={styles.subtitle}>
                        {userReview.stats.averageStar} / 5 từ{" "}
                        {userReview.stats.count} đánh giá
                    </Text>

                    <View style={styles.summaryRow}>
                        <StarRating rating={userReview.stats.averageStar} size={18}/>
                        {[5, 4, 3, 2, 1].map((star) => (
                            <Text key={star} style={styles.countText}>
                                {star}★ ({userReview.stats.breakdown[star]})
                            </Text>
                        ))}
                    </View>
                </> : <>
                    <Text style={styles.subtitle}>
                        Chưa có đánh giá nào
                    </Text>
                </>
            }


            <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                    Chia sẻ trải nghiệm của bạn
                </Text>

                {isNewReview && renderReviewForm("Gửi đánh giá")}

                {!isNewReview && isEditing && renderReviewForm("Cập nhật đánh giá", cancelEdit)}

                {!isNewReview && !isEditing && renderExistingReview()}
            </View>

            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#6366f1"/>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
        paddingHorizontal: 14,
        paddingTop: 16
    },
    errorText: {
        color: "#ef4444",
        fontSize: 12,
        marginTop: 6,
        marginBottom: 8,
    },
    disabledBtn: {
        opacity: 0.5,
    },
    time: {
        fontSize: 12,
        color: '#888',
        marginVertical: 4
    },
    comment: {
        color: '#333',
    },
    loadingOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.3)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    subtitle: {
        color: '#666',
        marginVertical: 6,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    countText: {
        marginLeft: 8,
        color: '#555',
        fontSize: 12,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 10,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 7,
    },
    label: {
        marginBottom: 6,
        color: '#555',
    },
    input: {
        backgroundColor: '#F2F2F2',
        borderRadius: 8,
        padding: 12,
        height: 100,
        textAlignVertical: 'top',
        marginTop: 10,
    },
    button: {
        backgroundColor: '#F5A623',
        borderRadius: 8,
        paddingVertical: 12,
        marginTop: 7,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontWeight: '600',
    },

    actions: {
        flexDirection: "row",
        marginTop: 8,
    },

    btn: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 6,
        marginRight: 10,
    },

    editBtn: {
        backgroundColor: "#6366f1",
    },

    editText: {
        color: "#fff",
        fontSize: 14,
    },

    deleteBtn: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#fecaca",
    },

    deleteText: {
        color: "#ef4444",
        fontSize: 14,
    },
});
