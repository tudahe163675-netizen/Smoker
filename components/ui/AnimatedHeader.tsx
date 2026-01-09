import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Colors } from '@/constants/colors';

interface AnimatedHeaderProps {
  title: string;
  subtitle?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  onIconPress?: () => void;
  headerTranslateY: Animated.AnimatedAddition;
  style?: ViewStyle;
  rightElement?: React.ReactNode;
}

const AnimatedHeader: React.FC<AnimatedHeaderProps> = ({
  title,
  subtitle,
  iconName,
  onIconPress,
  headerTranslateY,
  style,
  rightElement,
}) => {
  return (
    <Animated.View 
      style={[
        styles.header, 
        { transform: [{ translateY: headerTranslateY }] },
        style
      ]}
    >
      <View style={styles.headerContent}>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle && (
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          )}
        </View>
        {rightElement ? (
          rightElement
        ) : iconName ? (
          <TouchableOpacity style={styles.iconButton} onPress={onIconPress} activeOpacity={0.8}>
            <Ionicons name={iconName} size={24} color={Colors.primary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 64,
    backgroundColor: Colors.card,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.foreground,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.mutedForeground,
    marginTop: 2,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});

export default AnimatedHeader;