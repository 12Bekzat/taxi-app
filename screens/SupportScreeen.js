import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Button from '../components/Button';
import { createSupportTicket, fetchMySupportTickets } from '../api/support';

export default function SupportScreen() {
  const navigation = useNavigation();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const loadTickets = async () => {
    try {
      setLoadingTickets(true);
      const data = await fetchMySupportTickets();
      setTickets(data || []);
    } catch (e) {
      console.log('fetchMySupportTickets error', e);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      return;
    }
    try {
      setSending(true);
      await createSupportTicket(subject.trim(), message.trim());
      setSubject('');
      setMessage('');
      await loadTickets();
    } catch (e) {
      console.log('createSupportTicket error', e);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Служба поддержки</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* блок "написать в поддержку" */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Написать в поддержку</Text>
          <Text style={styles.cardSubtitle}>
            Опишите проблему, мы свяжемся с вами в ближайшее время.
          </Text>

          <Text style={styles.label}>Тема</Text>
          <TextInput
            style={styles.input}
            placeholder="Например: Не получается добавить технику"
            placeholderTextColor="#9CA3AF"
            value={subject}
            onChangeText={setSubject}
          />

          <Text style={styles.label}>Сообщение</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Опишите, что случилось..."
            placeholderTextColor="#9CA3AF"
            value={message}
            onChangeText={setMessage}
            multiline
          />

          <Button
            title={sending ? 'Отправка...' : 'Отправить'}
            onPress={handleSend}
            disabled={sending || !subject.trim() || !message.trim()}
          />
        </View>

        {/* быстрые контакты (муляж) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Быстрые контакты</Text>

          <Pressable
            style={styles.contactRow}
            onPress={() => {
              console.log('call support +7 700 000 00 00');
            }}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="call-outline" size={18} color="#111827" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactTitle}>Позвонить в поддержку</Text>
              <Text style={styles.contactSubtitle}>+7 700 000 00 00</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </Pressable>

          <Pressable
            style={styles.contactRow}
            onPress={() => {
              console.log('email support support@liftme.kz');
            }}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="mail-outline" size={18} color="#111827" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactTitle}>Написать на e-mail</Text>
              <Text style={styles.contactSubtitle}>support@liftme.kz</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </Pressable>
        </View>

        {/* история обращений */}
        <View style={styles.card}>
          <View style={styles.ticketsHeaderRow}>
            <Text style={styles.cardTitle}>Мои обращения</Text>
            {loadingTickets && (
              <ActivityIndicator size="small" color="#9CA3AF" />
            )}
          </View>

          {tickets.length === 0 && !loadingTickets && (
            <Text style={styles.emptyText}>
              У вас пока нет обращений в поддержку.
            </Text>
          )}

          {tickets.map((t) => (
            <View key={t.id} style={styles.ticketRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ticketSubject} numberOfLines={1}>
                  {t.subject}
                </Text>
                <Text style={styles.ticketMessage} numberOfLines={2}>
                  {t.message}
                </Text>
              </View>
              <View style={styles.ticketStatusWrapper}>
                <Text style={[styles.ticketStatus, statusStyle(t.status)]}>
                  {humanStatus(t.status)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function humanStatus(status) {
  switch (status) {
    case 'OPEN':
      return 'Открыто';
    case 'IN_PROGRESS':
      return 'В работе';
    case 'CLOSED':
      return 'Закрыто';
    default:
      return status;
  }
}

function statusStyle(status) {
  switch (status) {
    case 'OPEN':
      return { color: '#DC2626' };
    case 'IN_PROGRESS':
      return { color: '#F59E0B' };
    case 'CLOSED':
      return { color: '#10B981' };
    default:
      return { color: '#6B7280' };
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    padding: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },

  label: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },

  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 6,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  contactSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },

  ticketsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptyText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  ticketRow: {
    marginTop: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketSubject: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  ticketMessage: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  ticketStatusWrapper: {
    marginLeft: 8,
  },
  ticketStatus: {
    fontSize: 11,
    fontWeight: '600',
  },
});
