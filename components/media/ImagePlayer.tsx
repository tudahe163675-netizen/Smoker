import {Image, Dimensions, StyleSheet, Modal, Pressable, View, Text, ActivityIndicator} from "react-native";
import {useState} from "react";
import {SafeAreaView} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";

const {width: screenWidth, height: screenHeight} = Dimensions.get("window");

export default function ImagePlayer({uri}: { uri: string }) {
    const [height, setHeight] = useState(screenHeight * 0.5);
    const [visible, setVisible] = useState(false);

    const [loadingThumb, setLoadingThumb] = useState(true);
    const [loadingFull, setLoadingFull] = useState(true);

    const onLoad = () => {
        Image.getSize(uri, (w, h) => {
            const ratio = h / w;
            const maxHeight = screenHeight * 0.5;
            const expectedHeight = (screenWidth - 16) * ratio;
            setHeight(Math.min(expectedHeight, maxHeight));
            setLoadingThumb(false);
        });
    };

    return (
        <>
            {/* Thumbnail wrapper */}
            <Pressable onPress={() => setVisible(true)}>

                {/* Loading Thumbnail */}
                {loadingThumb && (
                    <View style={[styles.loadingBox, {height}]}>
                        <ActivityIndicator size="large" color="#fff"/>
                    </View>
                )}

                <Image
                    source={{uri}}
                    style={[styles.mediaImage, {height, opacity: loadingThumb ? 0 : 1}]}
                    resizeMode="cover"
                    onLoad={onLoad}
                />
            </Pressable>

            {/* Full screen preview */}
            <Modal visible={visible} transparent={true} animationType="fade">
                <View style={styles.modalContainer}>

                    {/* Loading Fullscreen */}
                    {loadingFull && (
                        <View style={styles.fullLoading}>
                            <ActivityIndicator size="large" color="#fff"/>
                        </View>
                    )}

                    {/* Fullscreen image */}
                    <Image
                        source={{uri}}
                        style={[styles.fullImage, {opacity: loadingFull ? 0 : 1}]}
                        resizeMode="contain"
                        onLoad={() => setLoadingFull(false)}
                    />

                    {/* Close button */}
                    <Pressable
                        style={styles.closeButton}
                        onPress={() => {
                            setVisible(false);
                            setLoadingFull(true);
                        }}
                    >
                        <Ionicons name="close" size={26} color="#fff"/>
                    </Pressable>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    mediaImage: {
        width: screenWidth - 16,
        backgroundColor: "#000",
    },

    loadingBox: {
        width: screenWidth - 16,
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        zIndex: 2,
    },

    modalContainer: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.95)",
        justifyContent: "center",
        alignItems: "center",
    },

    fullImage: {
        width: screenWidth,
        height: screenHeight,
    },

    fullLoading: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 5,
    },

    closeButton: {
        position: "absolute",
        top: 50,
        right: 20,
        backgroundColor: "rgba(0,0,0,0.6)",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 50,
    },
});
