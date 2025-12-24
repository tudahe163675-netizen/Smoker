import {Image, Text, View, StyleSheet} from "react-native";
import {StarRating} from "@/components/StarRating";
import React from "react";
import {formatReviewTime} from "@/utils/extension";

interface RenderReviewProps {
    item: any
}

export default function RenderReviewItem({item}: RenderReviewProps) {
    return (
        <View style={styles.reviewItem}>
            <Image
                source={{uri: item.reviewer.Avatar}}
                style={styles.avatarCmt}
            />
            <View style={{flex: 1}}>
                <View style={{flexDirection: "row", justifyContent:'space-between'}}>
                    <Text style={styles.username}>{item.reviewer.UserName}</Text>
                    <StarRating rating={item.StarValue} size={16}/>
                </View>
                <Text style={styles.time}>Đánh giá: {formatReviewTime(item.created_at)}</Text>
                <Text style={styles.comment}>{item.Content}</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    reviewItem: {
        flexDirection:'row',
        padding: 14,
        backgroundColor: '#fff',
        marginHorizontal: 8,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: {width: 0, height: 2},
        shadowRadius: 8,
        elevation: 3,
    },
    avatarCmt: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
    },
    username: {
        fontWeight: '600'
    },
    time: {
        fontSize: 12,
        color: '#888',
        marginVertical: 4,
        textAlign: 'right'
    },
    comment: {
        color: '#333',
    },
})