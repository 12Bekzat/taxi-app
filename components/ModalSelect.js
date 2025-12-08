import React, { useMemo, useState } from 'react';
import {
  View, Text, Pressable, Modal, FlatList, StyleSheet
} from 'react-native';

const COLORS = {
  red: '#E30613', black: '#0F0F10', white: '#FFFFFF',
  border: '#E6E6E6', grey: '#6A6A6A', soft: '#FAFAFA'
};

export default function ModalSelect({ label, value, onChange, items = [], placeholder = 'Выберите', error }) {
  const [open, setOpen] = useState(false);
  const currentLabel = useMemo(() => items.find(i => i.value === value)?.label ?? '', [items, value]);

  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.field, !!error && { borderColor: '#DC2626' }]}
      >
        <Text style={[styles.value, !currentLabel && { color: COLORS.grey }]}>
          {currentLabel || placeholder}
        </Text>
      </Pressable>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{label || 'Выбор'}</Text>
            <Pressable onPress={() => setOpen(false)}><Text style={styles.close}>Закрыть</Text></Pressable>
          </View>
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.value)}
            renderItem={({ item }) => (
              <Pressable
                style={styles.option}
                onPress={() => { onChange(item.value); setOpen(false); }}
              >
                <Text style={styles.optionText}>{item.label}</Text>
                {item.value === value ? <Text style={styles.check}>✓</Text> : null}
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 8, fontWeight: '600', color: '#2B2B2B' },
  field: {
    height: 52, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14,
    backgroundColor: COLORS.white, justifyContent: 'center', paddingHorizontal: 14
  },
  value: { fontWeight: '600', color: COLORS.black },
  error: { color: '#DC2626', marginTop: 6 },

  backdrop: { position:'absolute', inset:0, backgroundColor:'rgba(0,0,0,0.35)' },
  sheet: {
    position:'absolute', left:16, right:16, bottom:16,
    backgroundColor: COLORS.white, borderRadius: 16, maxHeight: '60%',
    borderWidth:1, borderColor: COLORS.border, overflow:'hidden'
  },
  sheetHeader: {
    paddingHorizontal:14, paddingVertical:12, borderBottomWidth:1, borderBottomColor: COLORS.border,
    flexDirection:'row', alignItems:'center', justifyContent:'space-between'
  },
  sheetTitle: { fontWeight:'800', fontSize:16 },
  close: { color: COLORS.grey, fontWeight:'700' },
  option: { paddingHorizontal:16, paddingVertical:14, flexDirection:'row', justifyContent:'space-between' },
  optionText: { fontSize:16, color: COLORS.black },
  check: { color: '#16A34A', fontWeight:'900' },
  sep: { height:1, backgroundColor: COLORS.border }
});
