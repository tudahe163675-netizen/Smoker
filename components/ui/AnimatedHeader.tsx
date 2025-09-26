import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

interface AnimatedHeaderProps {
  title: string;
  subtitle?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  onIconPress?: () => void;
  headerTranslateY: Animated.AnimatedAddition;
  gradientColors?: string[];
  style?: ViewStyle;
}

const AnimatedHeader: React.FC<AnimatedHeaderProps> = ({
  title,
  subtitle,
  iconName,
  onIconPress,
  headerTranslateY,
  gradientColors = ['#1f2937', '#374151'],
  style,
}) => {
  return (
    <Animated.View 
      style={[
        styles.header, 
        { transform: [{ translateY: headerTranslateY }] },
        style
      ]}
    >
      <LinearGradient colors={gradientColors} style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>{title}</Text>
            {subtitle && (
              <Text style={styles.headerSubtitle}>{subtitle}</Text>
            )}
          </View>
          
          {iconName && (
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={onIconPress}
              activeOpacity={0.8}
            >
              <Ionicons name={iconName} size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerGradient: {
    paddingTop: 40,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#d1d5db',
    marginTop: 2,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});

export default AnimatedHeader;