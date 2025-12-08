// screens/DriverVehicleScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Button from '../components/Button';
import {
  fetchDriverVehicle,
  saveDriverVehicle,
} from '../api/driverVehicle';

// пока локальный справочник типов техники
const EQUIPMENT_TYPES = [
  { id: 1, name: 'Эвакуатор' },
  { id: 2, name: 'Манипулятор' },
  { id: 3, name: 'Грузовой' },
];

export default function DriverVehicleScreen() {
  const [loading, setLoading] = useState(false);
  const [equipmentTypeId, setEquipmentTypeId] = useState(null);
  const [model, setModel] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [color, setColor] = useState('');
  const [year, setYear] = useState('');
  const [photoUri, setPhotoUri] = useState(null);

  const [typesOpen, setTypesOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const v = await fetchDriverVehicle();
        if (v) {
          setEquipmentTypeId(v.equipmentTypeId || null);
          setModel(v.model || '');
          setPlateNumber(v.plateNumber || '');
          setColor(v.color || '');
          setYear(v.year ? String(v.year) : '');
          if (v.photoUrl) setPhotoUri(v.photoUrl);
        }
      } catch (e) {
        console.log('fetchDriverVehicle error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pickPhoto = async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      console.log('no media permission');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!equipmentTypeId) {
      console.log('выберите тип техники');
      return;
    }

    const data = {
      equipmentTypeId,
      model,
      plateNumber,
      color,
      year: year ? Number(year) : null,
    };

    try {
      setLoading(true);
      await saveDriverVehicle(data, photoUri);
      console.log('vehicle saved');
    } catch (e) {
      console.log('saveDriverVehicle error', e);
    } finally {
      setLoading(false);
    }
  };

  const typeName =
    EQUIPMENT_TYPES.find((t) => t.id === equipmentTypeId)?.name ||
    'Выберите тип техники';

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        <Text style={styles.title}>Моя техника</Text>
        <Text style={styles.subtitle}>
          Заполните данные о спецтехнике. По ним мы будем подбирать вам
          подходящие заказы.
        </Text>

        {/* Тип техники */}
        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Тип спецтехники</Text>
          <Pressable
            style={styles.select}
            onPress={() => setTypesOpen((v) => !v)}
          >
            <Text
              style={[
                styles.selectText,
                !equipmentTypeId && { color: '#9CA3AF' },
              ]}
            >
              {typeName}
            </Text>
            <Ionicons
              name={typesOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#9CA3AF"
            />
          </Pressable>
          {typesOpen && (
            <View style={styles.selectDropdown}>
              {EQUIPMENT_TYPES.map((t) => (
                <Pressable
                  key={t.id}
                  style={styles.selectItem}
                  onPress={() => {
                    setEquipmentTypeId(t.id);
                    setTypesOpen(false);
                  }}
                >
                  <Text style={styles.selectItemText}>{t.name}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Модель / марка */}
        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Модель / марка</Text>
          <TextInput
            style={styles.input}
            value={model}
            onChangeText={setModel}
            placeholder="Например, MAN TGS 26.480"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Госномер */}
        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Госномер</Text>
          <TextInput
            style={styles.input}
            value={plateNumber}
            onChangeText={setPlateNumber}
            placeholder="123 ABC 02"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="characters"
          />
        </View>

        {/* Цвет */}
        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Цвет</Text>
          <TextInput
            style={styles.input}
            value={color}
            onChangeText={setColor}
            placeholder="Серый, белый и т.п."
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Год выпуска */}
        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Год выпуска</Text>
          <TextInput
            style={styles.input}
            value={year}
            onChangeText={setYear}
            placeholder="Например, 2018"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            maxLength={4}
          />
        </View>

        {/* Фото техники */}
        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Фото техники</Text>
          <Pressable style={styles.photoRow} onPress={pickPhoto}>
            <View style={styles.photoIcon}>
              <Ionicons name="camera-outline" size={22} color="#9CA3AF" />
            </View>
            <Text style={styles.photoText}>
              {photoUri
                ? 'Изменить фото техники'
                : 'Добавить фото (вид сбоку, чтобы номер был виден)'}
            </Text>
          </Pressable>
          {photoUri && (
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
          )}
        </View>

        <View style={{ marginTop: 16 }}>
          <Button
            title={loading ? 'Сохраняем…' : 'Сохранить'}
            onPress={handleSave}
            disabled={loading}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F3F4F6' },
  title: { fontSize: 18, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 4, marginBottom: 16 },

  fieldBlock: { marginBottom: 12 },
  label: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 4,
    fontWeight: '600',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    color: '#111827',
  },

  select: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: { fontSize: 14, color: '#111827' },
  selectDropdown: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  selectItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  selectItemText: { fontSize: 14, color: '#111827' },

  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
  photoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  photoText: { fontSize: 13, color: '#4B5563', flex: 1, flexWrap: 'wrap' },
  photoPreview: {
    marginTop: 8,
    width: '100%',
    height: 160,
    borderRadius: 12,
  },
});
