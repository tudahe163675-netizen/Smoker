import React from "react";
import {View, Text, StyleSheet} from "react-native";
import {Ionicons} from "@expo/vector-icons";

interface BarReviewsTabProps {
    barId: string;
}

const BarReviewsTab: React.FC<BarReviewsTabProps> = ({barId}) => {
    // TODO: Implement reviews fetching logic
    
    return (
        <View style={styles.container}>
            <View style={styles.emptyContainer}>
                <Ionicons name="star-outline" size={64} color="#cbd5e1" />
                <Text style={styles.emptyText}>Chưa có đánh giá nào</Text>
                <Text style={styles.emptySubtext}>Các đánh giá của khách hàng sẽ hiển thị ở đây</Text>
            </View>
        </View>
    );
};

export default BarReviewsTab;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 100,
    },
    emptyText: {
        fontSize: 15,
        color: "#94a3b8",
        marginTop: 12,
        fontWeight: "500",
    },
    emptySubtext: {
        fontSize: 13,
        color: "#cbd5e1",
        marginTop: 4,
    },
});

