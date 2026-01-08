import MessageInput from '@/components/chat/MessageInput';
import AnimatedHeader from '@/components/ui/AnimatedHeader';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { useSocket } from '@/hooks/useSocket';
import { MessageApiService, MessageType } from '@/services/messageApi';
import publicProfileApi from '@/services/publicProfileApi';
import { PublicProfileData } from '@/types/profileType';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, FlatList, Image, KeyboardAvoidingView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Message {
  _id: string;
  conversation_id: string;
  sender_id: string;
  sender_entity_type: string;
  content: string;
  message_type: MessageType;
  attachments: any[];
  is_story_reply: boolean;
  story_id: string | null;
  story_url: string | null;
  is_post_share: boolean;
  post_id: string | null;
  post_summary: string | null;
  post_image: string | null;
  post_author_name: string | null;
  post_author_avatar: string | null;
  post_title: string | null;
  post_content: string | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
  senderName?: string;
  senderAvatar?: string;
}

interface Conversation {
  _id: string;
  type: string;
  participants: string[];
  last_message_id: string | null;
  last_message_content: string;
  last_message_time: string | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
  participantStatuses: { [key: string]: string };
  unreadCount: number;
  otherParticipants: string[];
}

export default function ConversationScreen() {
  const router = useRouter();
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { authState } = useAuth();
  const currentUserId = authState.EntityAccountId;
  const token = authState.token;
  const { socket, isConnected } = useSocket();

  // Create messageApi once and reuse
  const messageApi = useRef<MessageApiService | null>(null);

  if (token && !messageApi.current) {
    messageApi.current = new MessageApiService(token);
  }

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [participantProfile, setParticipantProfile] = useState<PublicProfileData | null>(null);
  const headerTranslateY = new Animated.Value(0);
  const flatListRef = useRef<FlatList>(null);
  const hasMarkedAsRead = useRef(false);
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null);
  const [otherParticipantLastReadMessageId, setOtherParticipantLastReadMessageId] = useState<string | null>(null);
  const hasFetchedLastRead = useRef(false);

  const {
    messages,
    loading,
    error,
    hasMore,
    loadMessages,
    sendMessage: sendMessageHook,
    markAsRead,
    addMessage
  } = useMessages(messageApi.current, conversationId || '', currentUserId);

  const hasLoadedConversation = useRef(false);

  const fetchReadStatuses = useCallback(async () => {
    if (!messageApi.current || !conversationId) return;
    try {
      const res = await messageApi.current.getMessages(conversationId);
      if (res.success && res.data) {
        setLastReadMessageId(res.last_read_message_id || null);
        setOtherParticipantLastReadMessageId(res.other_participant_last_read_message_id || null);
      }
    } catch (err) {
      console.warn('Error fetching read statuses:', err);
    }
  }, [conversationId]);

  const loadConversation = useCallback(async () => {
    if (!messageApi.current || hasLoadedConversation.current) {
      return;
    }

    hasLoadedConversation.current = true;

    try {
      // For now, we'll get conversation details from conversations list
      const conversations = await messageApi.current.getConversations(authState.EntityAccountId);
      const conv = conversations.find((c: Conversation) => c._id === conversationId);
      setConversation(conv || null);

      if (conv && conv.otherParticipants.length > 0) {
        const profileResponse = await publicProfileApi.getByEntityId(conv.otherParticipants[0]);
        if (profileResponse.success && profileResponse.data) {
          setParticipantProfile(profileResponse.data);
        }
      }
    } catch (error) {
      // Handle error silently
      console.error('Error loading conversation details:', error);
    }
  }, [conversationId, authState.EntityAccountId]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    // Mark messages as read when messages are loaded (only once)
    const markRead = async () => {
      if (messages.length > 0 && !hasMarkedAsRead.current) {
        hasMarkedAsRead.current = true;
        //console.log('Marking messages as read for conversation:', conversationId);
        await markAsRead();
        // Fetch updated read statuses after marking as read
        await fetchReadStatuses();
        // Emit event to update unread count in other screens
        if (socket) {
          socket.emit('messages_read', { conversationId });
        }
      }
    };
    markRead();
  }, [messages, socket, conversationId, markAsRead, fetchReadStatuses]);

  const handleNewMessage = useCallback((message: Message) => {
    // Add new message to the list
    addMessage(message);
  }, [addMessage]);
  useEffect(() => {
    if (socket && conversationId) {
      // Join conversation room
      socket.emit('join_conversation', conversationId);

      // Listen for new messages
      socket.on('new_message', handleNewMessage);

      // Listen for messages_read to update read status
      socket.on('messages_read', (data) => {
        if (data.conversationId === conversationId) {
          // If the reader is not the current user, update otherParticipantLastReadMessageId
          if (data.readerEntityAccountId !== currentUserId) {
            setOtherParticipantLastReadMessageId(data.last_read_message_id);
          }
        }
      });

      return () => {
        socket.off('new_message', handleNewMessage);
        socket.off('messages_read');
        socket.emit('leave_conversation', conversationId);
      };
    }
  }, [socket, conversationId, handleNewMessage, currentUserId]);

  useEffect(() => {
    if (conversationId && messageApi.current && !hasFetchedLastRead.current) {
      hasFetchedLastRead.current = true;
      fetchReadStatuses();
    }
  }, [conversationId, fetchReadStatuses]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading && messages.length > 0) {
      const firstMessage = messages[0]; // Oldest message in current list
      loadMessages({ before: firstMessage._id });
    }
  }, [hasMore, loading, messages, loadMessages]);

  const handleSendMessage = useCallback(async (content: string, messageType: MessageType = 'text') => {
    const success = await sendMessageHook(content, messageType);
    if (success) {
      // Reload messages to show the new message
      await loadMessages();
      // Fetch updated read statuses
      await fetchReadStatuses();
      // Emit event to update conversations list
      if (socket) {
        socket.emit('new_message', { conversationId });
      }
    } else {
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn');
    }
  }, [conversationId, sendMessageHook, loadMessages, fetchReadStatuses, socket]);

  const renderMessageItem = ({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = item.sender_id === currentUserId;
    const isLastMessage = index === messages.length - 1;

    //console.log('Message:', item._id, 'isLast:', isLastMessage, 'lastReadId:', lastReadMessageId, 'showRead:', showReadStatus, 'isMy:', isMyMessage);

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessage : styles.otherMessage
      ]}>
        {!isMyMessage && (
          <Image
            source={{ uri: participantProfile?.avatar || `https://i.pravatar.cc/100?img=${item.sender_id.slice(0, 2)}` }}
            style={styles.messageAvatar}
          />
        )}
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myBubble : styles.otherBubble
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myText : styles.otherText
          ]}>
            {item.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isMyMessage ? styles.myTime : styles.otherTime
            ]}>
              {new Date(item.createdAt).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const otherParticipantId = conversation?.otherParticipants[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AnimatedHeader
        title={participantProfile?.name ? `Chat với ${participantProfile.name}` : otherParticipantId ? `Chat với ${otherParticipantId.slice(0, 8)}` : 'Chat'}
        subtitle={isConnected ? 'Online' : 'Offline'}
        headerTranslateY={headerTranslateY}
        iconName="arrow-back"
        onIconPress={() => router.back()}
      />

      <KeyboardAvoidingView
        style={styles.content}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {loading && messages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Chưa có tin nhắn nào.{'\n'}Hãy bắt đầu cuộc trò chuyện!</Text>
          </View>
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessageItem}
              keyExtractor={(item, index) => `${item._id}_${index}`}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingTop: 60, paddingBottom: 20 }}
              onScroll={(e) => {
                const offsetY = e.nativeEvent.contentOffset.y;
                if (offsetY <= 0 && hasMore && !loading && messages.length > 0) {
                  handleLoadMore();  // fetch page tiếp theo
                }
              }}
              scrollEventThrottle={16}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            />
            
            {/* Hiển thị "Đã xem" dưới cùng của cuộc trò chuyện */}
            {(() => {
              // Kiểm tra message cuối cùng có phải của mình không
              const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
              if (!lastMessage) return null;
              
              const isLastMessageFromMe = String(lastMessage.sender_id).toLowerCase().trim() === String(currentUserId).toLowerCase().trim();
              const lastMessageId = String(lastMessage._id).trim();
              const otherReadId = otherParticipantLastReadMessageId ? String(otherParticipantLastReadMessageId).trim() : null;
              
              // Chỉ hiển thị khi: message cuối cùng là của mình + đối phương đã đọc (otherReadId >= lastMessageId)
              const showReadStatus = isLastMessageFromMe && 
                otherReadId && 
                lastMessageId && 
                otherReadId >= lastMessageId;
              
              if (!showReadStatus) return null;
              
              return (
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, marginBottom: 8, paddingHorizontal: 16 }}>
                  <Text style={{ fontSize: 11, color: '#6b7280' }}>
                    Đã xem
                  </Text>
                </View>
              );
            })()}
          </>
        )}

        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={!isConnected}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  myMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 18,
  },
  myBubble: {
    backgroundColor: '#2563eb',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myText: {
    color: '#fff',
  },
  otherText: {
    color: '#111827',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  myTime: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  otherTime: {
    color: '#6b7280',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});