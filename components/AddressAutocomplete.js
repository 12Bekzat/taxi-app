// components/AddressAutocomplete.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { debounce } from '../utils/debounce';
import { geocode } from '../utils/routing';

const COLORS = {
  white: '#FFFFFF',
  border: '#E6E6E6',
  grey: '#6A6A6A',
  black: '#0F0F10',
};

export default function AddressAutocomplete({
  placeholder,
  value,
  onChangeText,
  onPick,        // (item: {label, lat, lon})
  style,
  onFocus,
  onBlur,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const search = useMemo(
    () =>
      debounce(async (q) => {
        if (!q || q.length < 3) {
          setItems([]);
          setLoading(false);
          setOpen(false);
          return;
        }
        try {
          setLoading(true);
          const res = await geocode(q, 'Алматы');
          setItems(res);
          setOpen(res.length > 0);
        } catch (e) {
          setItems([]);
          setOpen(false);
        } finally {
          setLoading(false);
        }
      }, 400),
    []
  );

  useEffect(() => {
    if (!value || value.length < 3) {
      setItems([]);
      setOpen(false);
      return;
    }
    search(value);
  }, [value]);

  const handleChange = (t) => {
    onChangeText?.(t);
    if (t.length < 3) {
      setItems([]);
      setOpen(false);
    }
  };

  const handlePick = (item) => {
    onChangeText?.(item.label);
    setItems([]);
    setOpen(false);
    onPick?.(item);
  };

  const shouldShowDropdown =
    open && (loading || items.length > 0) && value && value.length >= 3;

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.row}>
        <Ionicons
          name="search"
          size={16}
          color={COLORS.grey}
          style={{ marginRight: 6 }}
        />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={COLORS.grey}
          style={styles.input}
          value={value}
          onChangeText={handleChange}
          onFocus={(e) => {
            if (items.length > 0 && value?.length >= 3) {
              setOpen(true);
            }
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setTimeout(() => setOpen(false), 150);
            onBlur?.(e);
          }}
        />
      </View>

      {shouldShowDropdown && (
        <View style={styles.dropdown}>
          {loading && items.length === 0 ? (
            <Text style={styles.hint}>Ищем адрес…</Text>
          ) : items.length === 0 ? (
            <Text style={styles.hint}>Ничего не найдено</Text>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(x, i) => x.label + i}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.opt}
                  onPress={() => handlePick(item)}
                >
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={COLORS.grey}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.optText} numberOfLines={2}>
                    {item.label}
                  </Text>
                </Pressable>
              )}
              ItemSeparatorComponent={() => (
                <View style={styles.separator} />
              )}
              style={{ maxHeight: 200 }}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
  },
  dropdown: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  opt: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  optText: {
    flex: 1,
    fontSize: 13,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  hint: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: COLORS.grey,
  },
});
  