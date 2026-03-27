import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export function RatingStars({ rating, onRatingChange, size = 24 }: { rating: number, onRatingChange?: (r: number) => void, size?: number }) {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity 
          key={star} 
          disabled={!onRatingChange} 
          onPress={() => onRatingChange && onRatingChange(star)}
        >
          <Text style={{ fontSize: size, color: star <= rating ? '#FFCA28' : '#E0E0E0', marginRight: 4 }}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' }
});
