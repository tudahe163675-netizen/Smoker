import {useLocalSearchParams, useRouter} from "expo-router";
import {useEffect} from "react";
import {ActivityIndicator, StyleSheet, View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";

// Redirect barProfile to user route
export default function BarProfileRedirect() {
    const {id} = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    useEffect(() => {
        if (id) {
            // Redirect to /user with the same id
            router.replace({
                pathname: "/user",
                params: {id},
            });
        }
    }, [id]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
