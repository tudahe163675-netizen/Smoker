import { useRef, useState, useEffect } from "react";
import {
    Dimensions,
    Modal,
    Pressable,
    StyleSheet,
    TouchableWithoutFeedback,
    View,
    Text,
    PanResponder,
    ActivityIndicator,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function VideoPlayer({ uri }: { uri: string }) {
    const videoRef = useRef<Video>(null);
    const smallVideoRef = useRef<Video>(null);
    const containerRef = useRef<View>(null);

    const [status, setStatus] = useState<any>(null);
    const [fullscreen, setFullscreen] = useState(false);
    const [shouldPlay, setShouldPlay] = useState(false);
    const [isMuted, setIsMuted] = useState(true);

    const [showControls, setShowControls] = useState(true);
    const hideTimer = useRef<NodeJS.Timeout | null>(null);

    const barRef = useRef<View>(null);
    const isSeeking = useRef(false);

    const [loadingSmall, setLoadingSmall] = useState(true);
    const [loadingFull, setLoadingFull] = useState(true);

    const [videoRatio, setVideoRatio] = useState(16 / 9);

    const formatTime = (millis: number) => {
        if (!millis) return "0:00";
        const totalSeconds = Math.floor(millis / 1000);
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const resetHideTimer = () => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setShowControls(false), 3000);
    };

    const handlePress = () => {
        setShowControls(true);
        resetHideTimer();
    };

    const togglePlay = async () => {
        handlePress();
        if (!videoRef.current) return;
        if (status?.isPlaying) await videoRef.current.pauseAsync();
        else await videoRef.current.playAsync();
    };

    const back10s = async () => {
        handlePress();
        if (!videoRef.current) return;
        const newPos = Math.max((status?.positionMillis ?? 0) - 10000, 0);
        await videoRef.current.setPositionAsync(newPos);
        setLoadingFull(true);
    };

    const next10s = async () => {
        handlePress();
        if (!videoRef.current) return;
        const dur = status?.durationMillis ?? 0;
        const newPos = Math.min((status?.positionMillis ?? 0) + 10000, dur);
        await videoRef.current.setPositionAsync(newPos);
        setLoadingFull(true);
    };

    const replay = async () => {
        if (!videoRef.current) return;
        await videoRef.current.setPositionAsync(0);
        await videoRef.current.playAsync();
        setLoadingFull(true);
        setShowControls(true);
        resetHideTimer();
    };

    useEffect(() => {
        if (fullscreen) {
            setShowControls(true);
            resetHideTimer();
            setLoadingFull(true);
            return
        }

        const interval = setInterval(checkVisibility, 300);
        return () => clearInterval(interval);
    }, [fullscreen]);

    const checkVisibility = () => {
        containerRef.current?.measureInWindow((x, y, width, height) => {
            if (!height) return;

            const visibleTop = Math.max(y, 0);
            const visibleBottom = Math.min(y + height, screenHeight);
            const visibleHeight = Math.max(0, visibleBottom - visibleTop);

            const visibleRatio = visibleHeight / height;

            setShouldPlay(visibleRatio >= 0.5);
        });
    };

    const progress =
        status?.durationMillis
            ? status.positionMillis / status.durationMillis
            : 0;

    const seekToPosition = async (evt: any) => {
        if (!videoRef.current || !status?.durationMillis) return;

        barRef.current.measure((x, y, width, height, pageX) => {
            const touchX = evt.nativeEvent.pageX - pageX;
            const ratio = Math.max(0, Math.min(touchX / width, 1));
            const newPos = ratio * status.durationMillis;

            videoRef.current.setPositionAsync(newPos);
            setLoadingFull(true);
        });
    };

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
            isSeeking.current = true;
            setShowControls(true);
        },
        onPanResponderMove: (evt) => {
            isSeeking.current = true;
            seekToPosition(evt);
        },
        onPanResponderRelease: (evt) => {
            isSeeking.current = false;
            seekToPosition(evt);
            resetHideTimer();
        },
    });

    // Icons
    const Back10Icon = ({size = 40, color = "white"}) => (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path
                d="M12 5V1L5 7l7 6V9c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6H5c0 4.4 3.6 8 8 8s8-3.6 8-8-3.6-8-8-8z"
                fill={color}
            />
        </Svg>
    );

    const Forward10Icon = ({size = 40, color = "white"}) => (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path
                d="M12 5V1l7 6-7 6V9c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6h2c0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8z"
                fill={color}
            />
        </Svg>
    );

    const MAX_HEIGHT = screenHeight * 0.7;
    const videoHeight = screenWidth / videoRatio;
    const finalHeight = Math.min(videoHeight, MAX_HEIGHT);
    const isLandscape = videoRatio > 1;

    return (
        <View ref={containerRef}>
            <Pressable onPress={() => {
                setFullscreen(true)
                setShouldPlay(false)
            }}>
                <Video
                    ref={smallVideoRef}
                    source={{ uri }}
                    style={{
                        width: screenWidth - 16,
                        height: finalHeight - 16,
                        backgroundColor: "#000",
                    }}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={shouldPlay}
                    isLooping
                    isMuted={isMuted}
                    onLoadStart={() => setLoadingSmall(true)}
                    onReadyForDisplay={(e) => {
                        if (e.naturalSize && e.naturalSize.width && e.naturalSize.height) {
                        const { width, height } = e.naturalSize;
                            setVideoRatio(width / height);
                        }
                    }}
                    onPlaybackStatusUpdate={(s) => {
                        if (s.isPlaying) {
                            setLoadingSmall(false);
                        }
                        if (s.isLoaded && s.isPlaying && !shouldPlay) {
                            smallVideoRef.current?.pauseAsync();
                        }
                    }}
                />
                {loadingSmall && (
                    <View style={styles.loadingOverlaySmall}>
                        <ActivityIndicator size="large" color="#fff" />
                    </View>
                )}
                <Pressable
                    onPress={() => setIsMuted(prev => !prev)}
                    style={styles.muteButton}
                >
                    <Ionicons
                        name={isMuted ? "volume-mute" : "volume-high"}
                        size={22}
                        color="#fff"
                    />
                </Pressable>
            </Pressable>

            <Modal visible={fullscreen} transparent animationType="fade">
                <View style={styles.modalContainer}>
                    <TouchableWithoutFeedback onPress={handlePress}>
                        <View style={{ flex: 1 }}>
                            <Video
                                ref={videoRef}
                                source={{ uri }}
                                style={styles.videoFull}
                                resizeMode={ResizeMode.CONTAIN}
                                shouldPlay
                                isLooping
                                onLoadStart={() => setLoadingFull(true)}
                                onPlaybackStatusUpdate={(s) => {
                                    if (s.isPlaying) {
                                        setLoadingSmall(false);
                                    }
                                    setStatus(s);
                                    if (s.isPlaying) setLoadingFull(false);
                                }}
                            />

                            {loadingFull && (
                                <View style={styles.loadingOverlayFull}>
                                    <ActivityIndicator size="large" color="#fff" />
                                </View>
                            )}

                            <View
                                ref={barRef}
                                {...panResponder.panHandlers}
                                style={styles.progressBarBackground}
                            >
                                <View
                                    style={[
                                        styles.progressBarFill,
                                        { width: `${progress * 100}%` },
                                    ]}
                                />
                                <View
                                    style={[
                                        styles.progressThumb,
                                        { left: `${progress * 100}%` },
                                    ]}
                                />
                            </View>

                            {showControls && (
                                <>
                                    {status?.didJustFinish ? (
                                        <Pressable
                                            style={styles.replayButton}
                                            onPress={replay}
                                        >
                                            <Ionicons
                                                name="reload"
                                                size={50}
                                                color="#fff"
                                            />
                                        </Pressable>
                                    ) : (
                                        <>
                                            <View style={styles.controls}>
                                                <Pressable onPress={back10s}>
                                                    <Back10Icon/>
                                                </Pressable>

                                                <Pressable onPress={togglePlay}>
                                                    <Ionicons
                                                        name={status?.isPlaying ? "pause" : "play"}
                                                        size={40}
                                                        color="#fff"
                                                    />
                                                </Pressable>

                                                <Pressable onPress={next10s}>
                                                    <Forward10Icon/>
                                                </Pressable>
                                            </View>

                                            <View style={styles.timeContainer}>
                                                <Text style={styles.timeText}>
                                                    {formatTime(status?.positionMillis ?? 0)} /{" "}
                                                    {formatTime(status?.durationMillis ?? 0)}
                                                </Text>
                                            </View>
                                        </>
                                    )}

                                    <Pressable
                                        style={styles.closeButton}
                                        onPress={() => {
                                            setFullscreen(false)
                                            setShouldPlay(true)
                                        }}
                                    >
                                        <Ionicons name="close" size={26} color="#fff"/>
                                    </Pressable>
                                </>
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    muteButton: {
        position: "absolute",
        bottom: 12,
        right: 12,
        backgroundColor: "rgba(0,0,0,0.4)",
        borderRadius: 20,
        padding: 6,
    },
    loadingOverlaySmall: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingOverlayFull: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.3)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.95)",
    },
    videoFull: {
        width: screenWidth,
        height: screenHeight,
    },
    progressBarBackground: {
        position: "absolute",
        bottom: 50,
        width: "100%",
        height: 6,
        backgroundColor: "rgba(255,255,255,0.3)",
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: "#fff",
    },
    progressThumb: {
        position: "absolute",
        top: -4,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: "#fff",
    },
    controls: {
        position: "absolute",
        bottom: 120,
        width: "100%",
        flexDirection: "row",
        justifyContent: "center",
        gap: 40,
    },
    timeContainer: {
        position: "absolute",
        bottom: 70,
        width: "100%",
        alignItems: "center",
    },
    timeText: {
        color: "#fff",
        fontSize: 16,
    },
    closeButton: {
        position: "absolute",
        top: 50,
        right: 20,
        padding: 7
    },
    replayButton: {
        position: "absolute",
        top: "46%",
        left: "46%",
    },
});
