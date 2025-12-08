// components/MapSearchBar.js
import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = { border:'#E6E6E6', grey:'#6A6A6A', white:'#FFF' };

export default function MapSearchBar({ from, to, onFromChange, onToChange }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Ionicons name="ellipse" size={10} color="#22C55E" style={{ marginRight:8 }}/>
        <TextInput
          placeholder="Откуда?"
          placeholderTextColor={COLORS.grey}
          style={styles.input}
          value={from}
          onChangeText={onFromChange}
        />
      </View>
      <View style={styles.sep}/>
      <View style={styles.row}>
        <Ionicons name="location" size={16} color="#EF4444" style={{ marginRight:6 }}/>
        <TextInput
          placeholder="Куда?"
          placeholderTextColor={COLORS.grey}
          style={styles.input}
          value={to}
          onChangeText={onToChange}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.white, borderRadius:16, padding:10, borderWidth:1, borderColor: COLORS.border
  },
  row: { flexDirection:'row', alignItems:'center' },
  input: { flex:1, height:40 },
  sep: { height:1, backgroundColor: COLORS.border, marginVertical:8 }
});
