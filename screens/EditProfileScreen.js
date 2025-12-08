// screens/EditProfileScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  Pressable,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const {
    user,
    updateProfile,
    updateAvatar,
    isAuthLoading,
    authError,
    setAuthError,
  } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [localAvatarUri, setLocalAvatarUri] = useState(null);

  const handlePickAvatar = async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Нет доступа',
        'Разрешите доступ к фото, чтобы изменить аватар.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setLocalAvatarUri(uri);
    }
  };

  const handleSaveAvatar = async () => {
    if (!localAvatarUri) return;
    setAuthError(null);
    const ok = await updateAvatar(localAvatarUri);
    if (ok) {
      Alert.alert('Готово', 'Фото профиля обновлено.');
      setLocalAvatarUri(null);
    }
  };

  const handleSaveProfile = async () => {
    setAuthError(null);
    const ok = await updateProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim() || null,
    });
    if (ok) {
      Alert.alert('Готово', 'Профиль обновлён.');
      navigation.goBack();
    }
  };

  const displayAvatarUri =
    localAvatarUri || user?.avatarUrl || null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <Text style={styles.title}>Редактирование профиля</Text>

      <View style={styles.avatarSection}>
        <View style={styles.avatarWrap}>
          {displayAvatarUri ? (
            <Image
              source={{ uri: displayAvatarUri }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons
                name="person-outline"
                size={32}
                color="#9CA3AF"
              />
            </View>
          )}
          <Pressable
            style={styles.avatarEditBtn}
            onPress={handlePickAvatar}
          >
            <Ionicons name="camera" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
        <Text style={styles.avatarHint}>
          Выберите новое фото из галереи. Оно будет использовано как
          аватар.
        </Text>
        {localAvatarUri && (
          <Button
            title={isAuthLoading ? 'Сохраняем...' : 'Сохранить фото'}
            onPress={handleSaveAvatar}
            disabled={isAuthLoading}
          />
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Имя</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Имя"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Фамилия</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Фамилия"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="email@example.com"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Телефон</Text>
        <View style={[styles.inputWrapper, { backgroundColor: '#E5E7EB' }]}>
          <Text style={styles.inputReadonly}>
            {user?.phone}
          </Text>
        </View>
        <Text style={styles.helper}>
          Телефон используется для входа и пока не редактируется.
        </Text>
      </View>

      {authError ? (
        <Text style={styles.error}>{authError}</Text>
      ) : null}

      <Button
        title={isAuthLoading ? 'Сохраняем...' : 'Сохранить изменения'}
        onPress={handleSaveProfile}
        disabled={isAuthLoading}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 16 },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBtn: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarHint: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  field: { marginBottom: 14 },
  label: { fontSize: 13, color: '#4B5563', marginBottom: 4 },
  inputWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    height: 46,
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  input: { flex: 1, fontSize: 14, color: '#111827' },
  inputReadonly: { fontSize: 14, color: '#6B7280' },
  helper: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  error: { color: '#DC2626', marginBottom: 8, fontSize: 13 },
});
