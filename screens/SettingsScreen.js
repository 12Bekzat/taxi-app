// screens/SettingsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LANGS = [
  { code: 'ru', label: 'Русский' },
  { code: 'kk', label: 'Қазақша' },
  { code: 'en', label: 'English' },
];

export default function SettingsScreen() {
  const [lang, setLang] = useState('ru');
  const [darkMode, setDarkMode] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Язык приложения</Text>
        {LANGS.map((l) => (
          <Pressable
            key={l.code}
            style={styles.langRow}
            onPress={() => setLang(l.code)}
          >
            <Text style={styles.langLabel}>{l.label}</Text>
            {lang === l.code && (
              <Ionicons
                name="checkmark"
                size={18}
                color="#E30613"
              />
            )}
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Тема</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Тёмная тема</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            thumbColor={darkMode ? '#111827' : '#F9FAFB'}
            trackColor={{ false: '#E5E7EB', true: '#E30613' }}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Уведомления</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Пуш-уведомления</Text>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            thumbColor={pushEnabled ? '#111827' : '#F9FAFB'}
            trackColor={{ false: '#E5E7EB', true: '#E30613' }}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Звук уведомлений</Text>
          <Switch
            value={soundEnabled}
            onValueChange={setSoundEnabled}
            thumbColor={soundEnabled ? '#111827' : '#F9FAFB'}
            trackColor={{ false: '#E5E7EB', true: '#E30613' }}
          />
        </View>
      </View>

      <View style={styles.helperCard}>
        <Text style={styles.helperText}>
          Все настройки сейчас являются демонстрационными и не связаны с
          сервером.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    justifyContent: 'space-between',
  },
  langLabel: { fontSize: 14, color: '#111827' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    justifyContent: 'space-between',
  },
  rowLabel: { fontSize: 14, color: '#111827' },

  helperCard: {
    marginTop: 4,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
  },
  helperText: { fontSize: 12, color: '#1D4ED8' },
});
