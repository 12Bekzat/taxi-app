// screens/RegisterScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import PhoneField from '../components/PhoneField';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const { register, isAuthLoading, authError, setAuthError } = useAuth();

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('CUSTOMER'); // CUSTOMER / DRIVER

  const handleRegister = async () => {
    setAuthError(null);

    const payload = {
      phone: phone.trim(),
      email: email.trim() || null,
      password,
      role,
      firstName,
      lastName,
      // driverProfile / customerProfile добавим позже, когда будем вязать все шаги формы
    };
    console.log('reg');
    
    const ok = await register(payload);
    if (ok) {
      navigation.navigate('Login')
    } else {
      // ошибка уже есть в authError
      console.log('не успешно');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Регистрация</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Роль</Text>
        <View style={styles.roleRow}>
          <Pressable
            style={[
              styles.roleBtn,
              role === 'CUSTOMER' && styles.roleBtnActive,
            ]}
            onPress={() => setRole('CUSTOMER')}
          >
            <Text
              style={[
                styles.roleText,
                role === 'CUSTOMER' && styles.roleTextActive,
              ]}
            >
              Клиент
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.roleBtn,
              role === 'DRIVER' && styles.roleBtnActive,
            ]}
            onPress={() => setRole('DRIVER')}
          >
            <Text
              style={[
                styles.roleText,
                role === 'DRIVER' && styles.roleTextActive,
              ]}
            >
              Водитель
            </Text>
          </Pressable>
        </View>
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
        <PhoneField label="Телефон" value={phone} onChangeText={setPhone} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Email (опционально)</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="email@example.com"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Пароль</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Придумайте пароль"
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!showPassword}
          />
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            style={styles.eyeBtn}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color="#6B7280"
            />
          </Pressable>
        </View>
      </View>

      {authError ? <Text style={styles.error}>{authError}</Text> : null}

      <Button
        title={isAuthLoading ? 'Регистрируем...' : 'Зарегистрироваться'}
        onPress={handleRegister}
        disabled={isAuthLoading || !phone || !password}
      />

      <Pressable
        style={{ marginTop: 16 }}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.linkText}>Уже есть аккаунт? Войти</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#FFFFFF' },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
    color: '#111827',
  },
  field: { marginBottom: 14 },
  label: { fontSize: 13, color: '#4B5563', marginBottom: 4 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    height: 46,
    backgroundColor: '#F9FAFB',
  },
  input: { flex: 1, fontSize: 14, color: '#111827' },
  eyeBtn: { marginLeft: 4 },
  error: { color: '#DC2626', marginBottom: 8, fontSize: 13 },
  linkText: { fontSize: 14, color: '#111827', fontWeight: '600' },

  roleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBtn: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 8,
    alignItems: 'center',
  },
  roleBtnActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  roleText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
  },
  roleTextActive: {
    color: '#FFFFFF',
  },
});
