import React, { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import CameraCaptureModal from './CameraCaptureModal.native';

const COLORS = { red:'#E30613', border:'#E6E6E6', grey:'#6A6A6A', white:'#FFFFFF' };

/**
 * value: { frontUri?: string, backUri?: string } | null
 * onChange: (v) => void
 * title: string
 */
export default function ImagePickerField({ label, value, onChange, title='Документ' }) {
  const [open, setOpen] = useState(false);
  const front = value?.frontUri; const back = value?.backUri;

  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable style={styles.box} onPress={() => setOpen(true)}>
        {front ? (
          <View style={{ flexDirection:'row', gap:8 }}>
            <Image source={{ uri: front }} style={styles.preview}/>
            {back ? <Image source={{ uri: back }} style={styles.preview}/> : null}
          </View>
        ) : (
          <Text style={styles.placeholder}>Загрузить фото</Text>
        )}
      </Pressable>
      <Text style={styles.hint}>Сфотографируйте обе стороны. Формат: JPG/PNG, до ~5 МБ</Text>

      <CameraCaptureModal
        visible={open}
        onClose={() => setOpen(false)}
        onResult={(res) => { onChange(res); }}
        title={title}
        aspect={1.6}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 8, fontWeight: '600', color: '#2B2B2B' },
  box: {
    height: 140, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14,
    backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
  },
  preview: { width: 140, height: 100, borderRadius: 8, resizeMode:'cover' },
  placeholder: { color: COLORS.grey, fontWeight: '600' },
  hint: { marginTop: 6, color: COLORS.grey, fontSize: 12 }
});
