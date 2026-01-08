import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface CommentInputProps {
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  replyingTo?: { commentId: string; replyId?: string; authorName: string } | null;
  onCancelReply?: () => void;
}

export const CommentInput: React.FC<CommentInputProps> = ({
  value,
  onChange,
  onSubmit,
  submitting,
  replyingTo,
  onCancelReply,
}) => {
  const { authState } = useAuth();
  const authorAvatar = authState.avatar;

  return (
    <View style={styles.commentInputContainer}>
      {replyingTo && (
        <View style={styles.replyingToContainer}>
          <Text style={styles.replyingToText}>
            Đang trả lời {replyingTo.authorName}...
          </Text>
          <TouchableOpacity onPress={onCancelReply} style={styles.cancelReplyButton}>
            <Ionicons name="close-circle" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.inputRow}>
        <Image
          source={{ uri: authorAvatar ?? 'https://i.pravatar.cc/100?img=10' }}
          style={styles.commentInputAvatar}
        />
        <TextInput
          style={styles.commentInput}
          placeholder={replyingTo ? `Trả lời ${replyingTo.authorName}...` : "Viết bình luận..."}
          value={value}
          onChangeText={onChange}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!value.trim() || submitting) && styles.sendButtonDisabled
          ]}
          onPress={onSubmit}
          disabled={!value.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const styles = StyleSheet.create({
  commentInputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
  },
  replyingToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#f0f2f5',
  },
  replyingToText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  cancelReplyButton: {
    padding: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  commentInputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1877f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
});