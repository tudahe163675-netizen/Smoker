import { ComboItem } from '@/constants/barData';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');
const COMBO_WIDTH = width * 0.42;
const COMBO_HEIGHT = COMBO_WIDTH * 0.8;

interface ComboCardProps {
  item: ComboItem;
  onPress?: (combo: ComboItem) => void;
}

export default function ComboCard({ item, onPress }: ComboCardProps) {
  return (
    <TouchableOpacity 
      style={styles.comboCard} 
      activeOpacity={0.8}
      onPress={() => onPress?.(item)}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.comboImage} />
        {item.isHot && (
          <View style={styles.hotBadge}>
            <Ionicons name="flame" size={12} color="#fff" />
            <Text style={styles.hotText}>HOT</Text>
          </View>
        )}
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={12} color="#fbbf24" />
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
      </View>

      <View style={styles.comboInfo}>
        <Text style={styles.comboTitle} numberOfLines={1}>
          {item.title}
        </Text>
        
        <View style={styles.itemsList}>
          {item.items.map((itemName, index) => (
            <Text key={index} style={styles.itemText} numberOfLines={1}>
              • {itemName}
            </Text>
          ))}
        </View>

        <View style={styles.suitableContainer}>
          <Ionicons name="people-outline" size={14} color="#6b7280" />
          <Text style={styles.suitableText}>{item.suitable}</Text>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.originalPrice}>{item.originalPrice}</Text>
          <Text style={styles.salePrice}>{item.salePrice}</Text>
        </View>

        <View style={styles.reviewContainer}>
          <Text style={styles.reviewText}>({item.reviews} đánh giá)</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  comboCard: {
    width: COMBO_WIDTH,
    marginRight: 15,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  comboImage: {
    width: '100%',
    height: COMBO_HEIGHT,
  },
  hotBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hotText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  ratingContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  comboInfo: {
    padding: 12,
  },
  comboTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
  },
  itemsList: {
    marginBottom: 8,
  },
  itemText: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
  },
  suitableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  suitableText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  originalPrice: {
    fontSize: 12,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  salePrice: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: 'bold',
  },
  reviewContainer: {
    alignItems: 'flex-end',
  },
  reviewText: {
    fontSize: 10,
    color: '#9ca3af',
  },
});