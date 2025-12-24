import { GetMessagesParams, MessageApiService, MessageType } from '@/services/messageApi';
import { useCallback, useEffect, useState } from 'react';

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
  // Additional fields for display
  senderName?: string;
  senderAvatar?: string;
}

interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMessages: (params?: GetMessagesParams) => Promise<void>;
  sendMessage: (content: string, messageType?: MessageType) => Promise<boolean>;
  markAsRead: () => Promise<void>;
  createConversation: (participant1Id: string, participant2Id: string) => Promise<any>;
  addMessage: (message: Message) => void;
}

export const useMessages = (messageApi: MessageApiService | null, conversationId: string, currentUserId: string | undefined): UseMessagesReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadMessages = useCallback(async (params: GetMessagesParams = {}) => {
    if (!conversationId || !messageApi) return;

    try {
      setLoading(true);
      setError(null);

      const response = await messageApi.getMessages(conversationId, {
        limit: 50,
        ...params
      });

      // API returns { success, data, message, pagination }
      const messagesData = response.data || [];
      const pagination = response.pagination || {};

      if (params.before) {
        // Load more (older messages) - add to beginning of array
        setMessages(prev => {
          const newMessages = [...messagesData, ...prev];
          // Sort by createdAt to ensure correct chronological order
          return newMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        });
      } else {
        // Initial load or refresh
        const sortedMessages = messagesData.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setMessages(sortedMessages);
      }

      setHasMore(pagination.hasMore || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [conversationId, messageApi]);

  const sendMessage = useCallback(async (content: string, messageType: MessageType = 'text'): Promise<boolean> => {
    if (!messageApi || !currentUserId) return false;

    try {
      await messageApi.sendMessage(
        conversationId,
        content,
        messageType,
        currentUserId,
        'Account', // entityType
        currentUserId, // entityId
        {}
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return false;
    }
  }, [conversationId, currentUserId, messageApi]);

  const markAsRead = useCallback(async () => {
    if (!messageApi || !currentUserId) return;

    try {
      // Find the last message not sent by current user to avoid "Cannot mark own message as read" error
      const lastMessageNotMine = [...messages].reverse().find(msg => msg.sender_id !== currentUserId);
      const lastMessageId = lastMessageNotMine ? lastMessageNotMine._id : null;
      await messageApi.markMessagesRead(conversationId, currentUserId, lastMessageId);
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  }, [conversationId, currentUserId, messages, messageApi]);

  const createConversation = useCallback(async (participant1Id: string, participant2Id: string) => {
    if (!messageApi) return null;

    try {
      const result = await messageApi.createOrGetConversation(participant1Id, participant2Id);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
      return null;
    }
  }, [messageApi]);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => {
      const newMessages = [...prev, message];
      // Sort by createdAt to ensure correct order
      return newMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });
  }, []);

  useEffect(() => {
    if (conversationId && messageApi) {
      loadMessages();
    }
  }, [conversationId, messageApi]);

  return {
    messages,
    loading,
    error,
    hasMore,
    loadMessages,
    sendMessage,
    markAsRead,
    createConversation,
    addMessage,
  };
};