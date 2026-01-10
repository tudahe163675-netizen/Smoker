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
    minHeight: 64,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
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