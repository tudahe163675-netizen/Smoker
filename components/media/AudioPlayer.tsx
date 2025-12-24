import {Alert, StyleSheet, TouchableOpacity, View, Text} from "react-native";
import {useEffect, useState} from "react";
import {Audio} from "expo-av";
import {Ionicons} from "@expo/vector-icons";

export default function AudioPlayer({uri, postId}: { uri: string; postId: string }) {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState<number | null>(null);
    const [position, setPosition] = useState<number>(0);

    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    const loadAudio = async () => {
        try {
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
            });

            const {sound: newSound} = await Audio.Sound.createAsync(
                {uri},
                {shouldPlay: false}
            );

            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded) {
                    setPosition(status.positionMillis);
                    setDuration(status.durationMillis || null);
                    setIsPlaying(status.isPlaying);
                    if (status.didJustFinish) {
                        setIsPlaying(false);
                        setPosition(0);
                    }
                }
            });

            setSound(newSound);
        } catch (error) {
            console.error('Error loading audio:', error);
        }
    };

    useEffect(() => {
        loadAudio();
    }, [uri]);

    const togglePlay = async () => {
        if (!sound) return;

        try {
            if (isPlaying) {
                await sound.pauseAsync();
            } else {
                await sound.playAsync();
            }
        } catch (error) {
            console.error('Error toggling playback:', error);
        }
    };

    const formatTime = (millis: number | null): string => {
        if (!millis) return '0:00';
        const totalSeconds = Math.floor(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.audioPlayerContainer}>
            <TouchableOpacity onPress={togglePlay} style={styles.audioPlayButton}>
                <Ionicons
                    name={isPlaying ? "pause-circle" : "play-circle"}
                    size={40}
                    color="#2563eb"
                />
            </TouchableOpacity>
            <View style={styles.audioInfoContainer}>
                <View style={styles.audioProgressBar}>
                    <View
                        style={[
                            styles.audioProgressFill,
                            {width: duration ? `${(position / duration) * 100}%` : '0%'}
                        ]}
                    />
                </View>
                <View style={styles.audioTimeContainer}>
                    <Text style={styles.audioTimeText}>{formatTime(position)}</Text>
                    <Text style={styles.audioTimeText}>{formatTime(duration)}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    audioPlayerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    audioPlayButton: {
        marginRight: 12,
    },
    audioInfoContainer: {
        flex: 1,
    },
    audioProgressBar: {
        height: 4,
        backgroundColor: '#d1d5db',
        borderRadius: 2,
        marginBottom: 6,
    },
    audioProgressFill: {
        height: '100%',
        backgroundColor: '#2563eb',
        borderRadius: 2,
    },
    audioTimeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    audioTimeText: {
        fontSize: 11,
        color: '#6b7280',
    },
});