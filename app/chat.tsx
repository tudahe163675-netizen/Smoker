import AnimatedHeader from '@/components/ui/AnimatedHeader';
import { useAuth } from '@/hooks/useAuth';
import { MessageApiService } from '@/services/messageApi';
import publicProfileApi from '@/services/publicProfileApi';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, Image, RefreshControl, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { PublicProfileData } from '@/types/profileType';
import { useSocket } from '@/hooks/useSocket';

interface Conversation {
  _id: string;
  type: string;
  participants: string[]; // Array of user IDs
  last_message_id: string | null;
  last_message_content: string;
  last_message_time: string | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
  participantStatuses: { [key: string]: string };
  unreadCount: number;
  otherParticipants: string[];
  // Additional fields for display
  otherParticipantName?: string;
  otherParticipantAvatar?: string;
}

export default function ConversationsScreen() {
  const router = useRouter();
  const { authState } = useAuth();
  const insets = useSafeAreaInsets();
  const currentUserId = authState.currentId;
  const token = authState.token;
  const messageApi = useMemo(() => token ? new MessageApiService(token) : null, [token]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [profiles, setProfiles] = useState<Record<string, PublicProfileData>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const headerTranslateY = new Animated.Value(0);
  const { socket } = useSocket();
  const isLoadingConversations = useRef(false);

  const loadConversations = useCallback(async () => {
    if (!messageApi || isLoadingConversations.current) return;

    isLoadingConversations.current = true;
    try {
      setLoading(true);
      const data = await messageApi.getConversations(authState.EntityAccountId) as Conversation[];
      setConversations(data || []);

      // Fetch profiles for participants
      const ids = [...new Set(data.flatMap(c => c.otherParticipants))];
      const profilePromises = ids.map(id => publicProfileApi.getByEntityId(id));
      const profileResults = await Promise.all(profilePromises);
      const newProfiles: Record<string, PublicProfileData> = {};
      profileResults.forEach((result, index) => {
        if (result.success && result.data) {
          newProfiles[ids[index]] = result.data;
        }
      });
      setProfiles(newProfiles);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
      isLoadingConversations.current = false;
    }
  }, [messageApi, authState.EntityAccountId]);

  const debouncedLoadConversations = useMemo(() => {
    let timeoutId: number;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        loadConversations();
      }, 1000); // debounce 1 second
    };
  }, [loadConversations]);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        loadConversations();
      } else {
        setLoading(false);
      }
    }, [token, loadConversations])
  );

  useEffect(() => {
    if (!socket) return;

    const handleMessagesRead = () => {
      console.log('Received messages_read event');
      // debouncedLoadConversations();
    };

    const handleNewMessage = () => {
      console.log('Received new_message event');
      // debouncedLoadConversations();
    };

    socket.on('messages_read', handleMessagesRead);
    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('messages_read', handleMessagesRead);
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, debouncedLoadConversations]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }, [loadConversations]);

  const handleConversationPress = (conversationId: string) => {
    router.push({
      pathname: '/conversation',
      params: { id: conversationId }
    });
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const otherParticipantId = item.otherParticipants[0];
    const isLastMessageFromMe = item.last_message_id ? false : false; // Need to check sender, but for now assume not

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleConversationPress(item._id)}
      >
        <Image
          source={{ uri: profiles[otherParticipantId]?.avatar || `https://i.pravatar.cc/100?img=${otherParticipantId.slice(0, 2)}` }}
          style={styles.avatar}
        />
        <View style={styles.conversationContent}>
          <Text style={styles.participantName}>{profiles[otherParticipantId]?.name || `User ${otherParticipantId.slice(0, 8)}`}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.last_message_content || 'Chưa có tin nhắn'}
          </Text>
        </View>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const headerHeight = insets.top + 64;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <AnimatedHeader
        title="Chat"
        subtitle="Trò chuyện với bạn bè"
        headerTranslateY={headerTranslateY}
        style={{ paddingTop: insets.top, height: headerHeight }}
      />

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Đang tải danh sách trò chuyện...</Text>
          </View>
        ) : conversations.length === 0 ? (
          <Text style={styles.emptyText}>Chưa có cuộc trò chuyện nào</Text>
        ) : (
          <FlatList
            data={conversations}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: headerHeight }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.foreground,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.mutedForeground,
  },
  unreadBadge: {
    backgroundColor: Colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: Colors.mutedForeground,
    marginTop: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },
});