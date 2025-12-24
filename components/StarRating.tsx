import Icon from 'react-native-vector-icons/MaterialIcons';
import {TouchableOpacity, View} from "react-native";
import React from "react";

export const StarRating = ({ rating, onChange, size = 28 }) => {
    return (
        <View style={{ flexDirection: 'row' }}>
            {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity
                    key={star}
                    onPress={() => onChange && onChange(star)}
                    disabled={!onChange}
                >
                    <Icon
                        name={star <= rating ? 'star' : 'star-border'}
                        size={size}
                        color="#F5A623"
                    />
                </TouchableOpacity>
            ))}
        </View>
    );
};