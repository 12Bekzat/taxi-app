// screens/LoginScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button"; // твоя кнопка, если другая — поправь импорт
import PhoneField from "../components/PhoneField";

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login, isAuthLoading, authError, setAuthError } = useAuth();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setAuthError(null);
    // тут можно нормализовать телефон, если у тебя маска
    const ok = await login(phone.trim(), password);
    if (!ok) {
      // ошибка уже есть в authError
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>
        <Text style={{ color: "#E30613" }}>Lift</Text>Me
      </Text>
      <Text style={styles.title}>Вход по номеру телефона</Text>

      <View style={styles.field}>
        <PhoneField label="Телефон" value={phone} onChangeText={setPhone} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Пароль</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Введите пароль"
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            style={styles.eyeBtn}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={18}
              color="#6B7280"
            />
          </Pressable>
        </View>
      </View>

      {authError ? <Text style={styles.error}>{authError}</Text> : null}

      <Button
        title={isAuthLoading ? "Входим..." : "Войти"}
        onPress={handleLogin}
        disabled={isAuthLoading || !phone || !password}
      />

      {isAuthLoading && (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color="#E30613" />
        </View>
      )}

      <Pressable
        style={{ marginTop: 16 }}
        onPress={() => navigation.navigate("Register")}
      >
        <Text style={styles.linkText}>Нет аккаунта? Зарегистрироваться</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#FFFFFF",
  },
  brand: {
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 16,
    color: "#111827",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 24,
    color: "#111827",
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: "#4B5563",
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 10,
    height: 46,
    backgroundColor: "#F9FAFB",
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },
  eyeBtn: {
    marginLeft: 4,
  },
  error: {
    color: "#DC2626",
    marginBottom: 8,
    fontSize: 13,
  },
  loading: {
    marginTop: 8,
  },
  linkText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
});
