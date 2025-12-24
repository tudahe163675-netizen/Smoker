import { MessageType } from '@/services/messageApi';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface MessageInputProps {
  onSendMessage: (content: string, messageType?: MessageType) => void;
  sending?: boolean;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  sending = false,
  disabled = false
}) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !sending && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nhập tin nhắn..."
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={1000}
          editable={!disabled}
          placeholderTextColor="#9ca3af"
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!message.trim() || sending || disabled) && styles.sendButtonDisabled
          ]}
          onPress={handleSend}
          disabled={!message.trim() || sending || disabled}
        >
          {sending ? (
            <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    maxHeight: 100,
    minHeight: 20,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
});

export default MessageInput;