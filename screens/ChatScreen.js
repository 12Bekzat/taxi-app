// screens/ChatScreen.js
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { fetchChatMessages, sendChatMessage } from '../api/chat';
import { useAuth } from '../context/AuthContext';

export default function ChatScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();

  const { orderId, peerName } = route.params || {};

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const lastIdRef = useRef(null);
  const pollingRef = useRef(null);

  useEffect(() => {
    navigation.setOptions?.({
      headerShown: false,
    });
  }, [navigation]);

  // первая загрузка
  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;

    const load = async () => {
      try {
        const data = await fetchChatMessages(orderId, null);
        if (cancelled) return;
        setMessages(data);
        if (data.length > 0) {
          lastIdRef.current = data[data.length - 1].id;
        }
      } catch (e) {
        console.log('fetchChatMessages initial error', e);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  // polling новых сообщений
  useEffect(() => {
    if (!orderId) return;

    const poll = async () => {
      try {
        const lastId = lastIdRef.current;
        const data = await fetchChatMessages(orderId, lastId);
        if (data && data.length > 0) {
          setMessages((prev) => [...prev, ...data]);
          lastIdRef.current = data[data.length - 1].id;
        }
      } catch (e) {
        console.log('fetchChatMessages poll error', e);
      }
    };

    pollingRef.current = setInterval(poll, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [orderId]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !orderId) return;
    try {
      setLoading(true);
      const msg = await sendChatMessage(orderId, text);
      setInput('');
      setMessages((prev) => [...prev, msg]);
      lastIdRef.current = msg.id;
    } catch (e) {
      console.log('sendChatMessage error', e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const fromMe = item.fromMe ?? (item.senderId === user?.id);
    return (
      <View
        style={[
          styles.msgRow,
          fromMe ? styles.msgRowMe : styles.msgRowOther,
        ]}
      >
        <View
          style={[
            styles.msgBubble,
            fromMe ? styles.msgBubbleMe : styles.msgBubbleOther,
          ]}
        >
          <Text style={[styles.msgText, fromMe && { color: '#FFFFFF' }]}>
            {item.text}
          </Text>
          <Text style={styles.msgTime}>
            {new Date(item.createdAt).toLocaleTimeString().slice(0, 5)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F3F4F6', paddingTop: 40, paddingBottom: 40 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      {/* Шапка */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </Pressable>
        <View style={{ marginLeft: 8 }}>
          <Text style={styles.headerTitle}>
            Чат с {peerName || 'водителем'}
          </Text>
          <Text style={styles.headerSub}>Заказ #{orderId}</Text>
        </View>
      </View>

      {/* Сообщения */}
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12, paddingBottom: 8 }}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
      />

      {/* Ввод */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          placeholder="Напишите сообщение..."
          value={input}
          onChangeText={setInput}
          multiline
        />
        <Pressable
          style={[
            styles.sendBtn,
            (!input.trim() || loading) && { opacity: 0.4 },
          ]}
          onPress={handleSend}
          disabled={!input.trim() || loading}
        >
          <Ionicons name="send" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  headerSub: {
    fontSize: 12,
    color: '#6B7280',
  },
  msgRow: {
    marginVertical: 4,
    flexDirection: 'row',
  },
  msgRowMe: {
    justifyContent: 'flex-end',
  },
  msgRowOther: {
    justifyContent: 'flex-start',
  },
  msgBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  msgBubbleMe: {
    backgroundColor: '#111827',
    borderBottomRightRadius: 4,
  },
  msgBubbleOther: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  msgText: {
    fontSize: 14,
    color: '#111827',
  },
  msgTime: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
    textAlign: 'right',
  },
  inputRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 90,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
    backgroundColor: '#F9FAFB',
  },
  sendBtn: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E30613',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
