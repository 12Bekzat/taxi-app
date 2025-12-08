import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';

const COLORS = {
  border: '#E6E6E6',
  black: '#0F0F10',
  grey: '#6A6A6A',
  red: '#E30613',
  white: '#FFFFFF',
};

export default function TextField({
  label,
  error,
  style,
  rightAccessory,      // <--- НОВОЕ: любой JSX справа в поле
  secureToggle,        // <--- НОВОЕ: если true — добавить кнопку «глаз»
  ...rest
}) {
  const [show, setShow] = useState(false);
  const isSecure = !!secureToggle && !show;

  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[styles.wrap, !!error && { borderColor: COLORS.red }, style]}>
        <TextInput
          placeholderTextColor={COLORS.grey}
          style={[styles.input, { outline: 'none' }, (rightAccessory || secureToggle) && { paddingRight: 48 }]}
          secureTextEntry={isSecure}
          {...rest}
        />

        {secureToggle ? (
          <Pressable style={styles.right} onPress={() => setShow(v => !v)}>
            <Text style={styles.rightText}>{show ? 'Скрыть' : 'Показать'}</Text>
          </Pressable>
        ) : rightAccessory ? (
          <View style={styles.right}>{rightAccessory}</View>
        ) : null}
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 8, fontWeight: '600', color: '#2B2B2B' },
  wrap: {
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    color: COLORS.black,
    outline: 'none'
  },
  right: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  rightText: { color: COLORS.grey, fontWeight: '700' },
  error: { color: '#DC2626', marginTop: 6 },
});
