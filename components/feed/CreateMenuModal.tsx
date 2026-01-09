import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface CreateMenuOption {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

interface CreateMenuModalProps {
  visible: boolean;
  onClose: () => void;
  onPostPress: () => void;
  onStoryPress: () => void;
}

export const CreateMenuModal: React.FC<CreateMenuModalProps> = ({
  visible,
  onClose,
  onPostPress,
  onStoryPress,
}) => {
  const options: CreateMenuOption[] = [
    {
      id: 'post',
      label: 'Bài viết',
      icon: 'create-outline',
      color: Colors.primary,
      onPress: () => {
        onClose();
        onPostPress();
      },
    },
    {
      id: 'story',
      label: 'Tin',
      icon: 'bookmark-outline',
      color: Colors.secondary,
      onPress: () => {
        onClose();
        onStoryPress();
      },
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.menuContainer}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.menuItem}
                  onPress={option.onPress}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${option.color}20` }]}>
                    <Ionicons name={option.icon} size={24} color={option.color} />
                  </View>
                  <Text style={styles.menuLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 8,
    minWidth: 200,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.foreground,
  },
});

