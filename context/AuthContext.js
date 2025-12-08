// context/AuthContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  loginUser,
  registerUser,
  fetchCurrentUser,
  apiUpdateProfile,
} from "../api/auth";
import { setAuthToken } from "../api/client";
import { uploadAvatar } from "../api/files";

const STORAGE_KEY = "authToken";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  const setToken = useCallback(async (newToken) => {
    setTokenState(newToken);
    setAuthToken(newToken);
    if (newToken) {
      await AsyncStorage.setItem(STORAGE_KEY, newToken);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // refresh / me можно вынести в отдельную функцию
  const loadCurrentUser = useCallback(async () => {
    if (!token) return;
    try {
      const me = await fetchCurrentUser();
      setUser(me);
    } catch (e) {
      console.log("fetchCurrentUser error", e);
      await setToken(null);
      setUser(null);
    }
  }, [token, setToken]);

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedToken) {
          setAuthToken(storedToken);
          setTokenState(storedToken);
        }
      } finally {
        setIsInitializing(false);
      }
    })();
  }, [setToken]);

  useEffect(() => {
    if (token) {
      loadCurrentUser();
    }
  }, [token, loadCurrentUser]);

  const login = useCallback(
    async (phone, password) => {
      setAuthError(null);
      setIsAuthLoading(true);
      try {
        const token = await loginUser(phone, password);
        if (!token) throw new Error("Token not received");
        await setToken(token);
        // loadCurrentUser вызовется через useEffect
        return true;
      } catch (e) {
        console.log("login error", e);
        setAuthError("Неверный телефон или пароль");
        return false;
      } finally {
        setIsAuthLoading(false);
      }
    },
    [setToken]
  );

  const register = useCallback(
    async (data) => {
      setAuthError(null);
      setIsAuthLoading(true);
      try {
        const token = await registerUser(data);
        if (!token) throw new Error("Token not received");
        await setToken(token);
        return true;
      } catch (e) {
        console.log("register error", e?.response?.data || e.message);
        setAuthError(
          e?.data?.message ||
            "Ошибка при регистрации. Возможно, номер уже занят."
        );
        return false;
      } finally {
        setIsAuthLoading(false);
      }
    },
    [setToken]
  );

  const logout = useCallback(async () => {
    await setToken(null);
    setUser(null);
  }, [setToken]);

  // >>> НОВОЕ: обновление профиля
  const updateProfile = useCallback(async (patch) => {
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      console.log(patch);

      const updated = await apiUpdateProfile(patch);
      setUser(updated); // контроллер возвращает свежие данные пользователя
      return true;
    } catch (e) {
      console.log("updateProfile error", e);
      setAuthError("Не удалось сохранить профиль");
      return false;
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  // >>> НОВОЕ: обновление аватара
  const updateAvatar = useCallback(async (fileUri) => {
    if (!fileUri) return false;
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      const { url } = await uploadAvatar(fileUri);
      setUser((prev) => (prev ? { ...prev, avatarUrl: url } : prev));
      return true;
    } catch (e) {
      console.log("updateAvatar error", e);
      setAuthError("Не удалось загрузить фото");
      return false;
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  const value = {
    user,
    token,
    isInitializing,
    isAuthLoading,
    authError,
    login,
    register,
    logout,
    updateProfile,
    updateAvatar,
    setAuthError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
