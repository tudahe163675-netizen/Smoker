import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface CommentInputProps {
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}

export const CommentInput: React.FC<CommentInputProps> = ({
  value,
  onChange,
  onSubmit,
  submitting,
}) => {
  const { authState } = useAuth();
  const authorAvatar = authState.avatar;

  return (
    <View style={styles.commentInputContainer}>
      <Image
        source={{ uri: authorAvatar ?? 'https://i.pravatar.cc/100?img=10' }}
        style={styles.commentInputAvatar}
      />
      <TextInput
        style={styles.commentInput}
        placeholder="Viết bình luận..."
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
  );
};

export const styles = StyleSheet.create({
  // Comment Input styles
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
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