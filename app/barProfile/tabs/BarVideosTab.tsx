import React from "react";
import {View, Text, StyleSheet} from "react-native";
import {Ionicons} from "@expo/vector-icons";

interface BarVideosTabProps {
    barId: string;
}

const BarVideosTab: React.FC<BarVideosTabProps> = ({barId}) => {
    // TODO: Implement videos fetching logic
    
    return (
        <View style={styles.container}>
            <View style={styles.emptyContainer}>
                <Ionicons name="videocam-outline" size={64} color="#cbd5e1" />
                <Text style={styles.emptyText}>Chưa có video nào</Text>
                <Text style={styles.emptySubtext}>Các video của quán bar sẽ hiển thị ở đây</Text>
            </View>
        </View>
    );
};

export default BarVideosTab;

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

