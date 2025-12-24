import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Animated,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface PostMenuProps {
  visible: boolean;
  position: { x: number; y: number };
  scaleAnim: Animated.Value;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const PostMenu: React.FC<PostMenuProps> = ({
  visible,
  position,
  scaleAnim,
  onClose,
  onEdit,
  onDelete,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent={true} // Đảm bảo modals che cả thanh trạng thái trên Android
    >
      <StatusBar
        translucent
        backgroundColor="rgba(0, 0, 0, 0.4)"
        barStyle="dark-content"
      />
      <TouchableOpacity
        style={styles.menuOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.menuContainer,
            {
              position: 'absolute',
              top: position.y,
              right: 16,
              transform: [
                { scale: scaleAnim },
                {
                  translateY: scaleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                },
              ],
              opacity: scaleAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.menuItem}
            onPress={onEdit}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil" size={22} color="#1a1a1a" />
            <Text style={styles.menuText}>Sửa bài viết</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={onDelete}
            activeOpacity={0.7}
          >
            <Ionicons name="trash" size={22} color="#ef4444" />
            <Text style={[styles.menuText, { color: '#ef4444' }]}>Xóa bài viết</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    ...Platform.select({
      android: {
        paddingTop: StatusBar.currentHeight || 0, // Thêm paddingTop để che thanh trạng thái trên Android
      },
    }),
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 200,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 4,
  },
  menuText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
    fontWeight: '500',
  },
});