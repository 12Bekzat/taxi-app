import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Badge({ text }) {
  if (!text) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  badge:{ backgroundColor:'#E30613', borderRadius:10, paddingHorizontal:8, paddingVertical:2, alignSelf:'center' },
  text:{ color:'#FFF', fontWeight:'800', fontSize:12 }
});
