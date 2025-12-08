// components/FloatingCard.js
import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function FloatingCard({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor:'#FFF', borderRadius:16, padding:12,
    shadowColor:'#000', shadowOpacity:0.1, shadowRadius:8, shadowOffset:{ width:0, height:4 },
    elevation:4
  }
});
