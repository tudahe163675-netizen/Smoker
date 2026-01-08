import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, formatAmount } from '@/constants/colors';
import type { Livestream } from '@/services/livestreamApi';

interface LivestreamCardProps {
  livestream: Livestream;
  onPress: () => void;
}

export const LivestreamCard: React.FC<LivestreamCardProps> = ({ livestream, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.thumbnailContainer}>
        {livestream.thumbnail ? (
          <Image source={{ uri: livestream.thumbnail }} style={styles.thumbnail} />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Ionicons name="videocam" size={48} color={Colors.mutedForeground} />
          </View>
        )}
        
        {/* LIVE Badge */}
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>

        {/* Viewer Count */}
        <View style={styles.viewerBadge}>
          <Ionicons name="eye" size={14} color={Colors.white} />
          <Text style={styles.viewerText}>{formatAmount(livestream.viewerCount)}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {livestream.title}
        </Text>
        {livestream.description && (
          <Text style={styles.description} numberOfLines={1}>
            {livestream.description}
          </Text>
        )}
        <View style={styles.hostInfo}>
          {livestream.hostAvatar ? (
            <Image source={{ uri: livestream.hostAvatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={16} color={Colors.mutedForeground} />
            </View>
          )}
          <Text style={styles.hostName} numberOfLines={1}>
            {livestream.hostName || 'Người dùng'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
    backgroundColor: Colors.muted,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },
  liveText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  viewerBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  viewerText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.mutedForeground,
    marginBottom: 8,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostName: {
    fontSize: 14,
    color: Colors.mutedForeground,
    flex: 1,
  },
});

