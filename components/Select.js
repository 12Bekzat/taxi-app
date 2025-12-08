import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const COLORS = {
  border: '#E6E6E6', white: '#FFFFFF', black: '#0F0F10', red: '#E30613'
};

export default function Select({ label, value, onChange, items = [], error }) {
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.box, !!error && { borderColor: COLORS.red }]}>
        <Picker
          selectedValue={value}
          onValueChange={onChange}
          dropdownIconColor={COLORS.black}
          style={{ color: COLORS.black }}
        >
          {items.map(it => (
            <Picker.Item key={it.value} label={it.label} value={it.value} />
          ))}
        </Picker>
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 8, fontWeight: '600', color: '#2B2B2B' },
  box: {
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  error: { color: '#DC2626', marginTop: 6 },
});
