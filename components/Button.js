import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

const COLORS = {
  red: '#E30613',
  black: '#0F0F10',
  white: '#FFFFFF',
  grey: '#E6E6E6',
};

export default function Button({ title, onPress, variant = 'primary', style, disabled }) {
  const bg =
    variant === 'primary' ? COLORS.red :
    variant === 'secondary' ? COLORS.black :
    'transparent';

  const textColor = variant === 'ghost' ? COLORS.black : COLORS.white;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        { backgroundColor: bg, borderWidth: variant === 'ghost' ? 1 : 0, borderColor: COLORS.grey },
        style,
        disabled && { opacity: 0.6 }
      ]}
    >
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  text: { fontWeight: '700', fontSize: 16 },
});
