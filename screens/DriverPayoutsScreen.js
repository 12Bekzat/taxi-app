// screens/DriverPayoutsScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import { fetchDriverEarnings } from '../api/orders';

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// helper для period → from/to
function calcRange(periodKey) {
  const now = new Date();
  const to = now.toISOString(); // ISO для бэка

  const copy = (date) => new Date(date.getTime());

  if (periodKey === '7d') {
    const fromDate = copy(now);
    fromDate.setDate(fromDate.getDate() - 7);
    return { fromIso: fromDate.toISOString(), toIso: to };
  }
  if (periodKey === '30d') {
    const fromDate = copy(now);
    fromDate.setDate(fromDate.getDate() - 30);
    return { fromIso: fromDate.toISOString(), toIso: to };
  }
  if (periodKey === '90d') {
    const fromDate = copy(now);
    fromDate.setDate(fromDate.getDate() - 90);
    return { fromIso: fromDate.toISOString(), toIso: to };
  }

  // дефолт – 30 дней
  const fromDate = copy(now);
  fromDate.setDate(fromDate.getDate() - 30);
  return { fromIso: fromDate.toISOString(), toIso: to };
}

export default function DriverPayoutsScreen() {
  const navigation = useNavigation();

  const [period, setPeriod] = useState('7d'); // '7d' | '30d' | '90d'
  const [summary, setSummary] = useState(null); // DriverEarningsSummary
  const [loading, setLoading] = useState(false);

  const load = async (periodKey = period) => {
    try {
      setLoading(true);

      const { fromIso, toIso } = calcRange(periodKey);
      const data = await fetchDriverEarnings(fromIso, toIso);

      setSummary(data);
    } catch (e) {
      console.log('fetchDriverEarnings error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load('7d');
  }, []);

  const onChangePeriod = (key) => {
    setPeriod(key);
    load(key);
  };

  const totalEarnings = summary?.totalEarnings ?? 0;
  const totalOrders = summary?.totalOrders ?? 0;
  const orders = summary?.orders ?? [];

  const avgPerOrder =
    totalOrders > 0 ? Math.round(totalEarnings / totalOrders) : 0;

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Выплаты / заработок</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Summary card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Статистика</Text>
            {loading && <ActivityIndicator size="small" color="#9CA3AF" />}
          </View>

          <View style={styles.periodRow}>
            <PeriodChip
              label="7 дней"
              active={period === '7d'}
              onPress={() => onChangePeriod('7d')}
            />
            <PeriodChip
              label="30 дней"
              active={period === '30d'}
              onPress={() => onChangePeriod('30d')}
            />
            <PeriodChip
              label="90 дней"
              active={period === '90d'}
              onPress={() => onChangePeriod('90d')}
            />
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Начислено</Text>
              <Text style={styles.summaryValue}>{totalEarnings} ₸</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Заказов</Text>
              <Text style={styles.summaryValue}>{totalOrders}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Средний чек</Text>
              <Text style={styles.summaryValue}>{avgPerOrder} ₸</Text>
            </View>
          </View>

          <Text style={styles.summaryHint}>
            Сюда попадают только завершённые заказы ({'"'}
            COMPLETED{'"'}). Реальный вывод средств может отличаться.
          </Text>
        </View>

        {/* Детализация по заказам */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Заказы за период</Text>
          </View>

          {!loading && (!orders || orders.length === 0) && (
            <Text style={styles.emptyText}>
              За этот период нет завершённых заказов.
            </Text>
          )}

          {orders.map((o) => (
            <View key={o.id} style={styles.orderRow}>
              <View style={styles.orderIconWrap}>
                <View style={styles.orderIconCircle}>
                  <Ionicons name="car-outline" size={18} color="#111827" />
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.orderTitle}>
                  Заказ #{o.id}{' '}
                  {o.equipmentName ? `· ${o.equipmentName}` : ''}
                </Text>
                {o.originAddress && (
                  <Text style={styles.orderText} numberOfLines={1}>
                    Адрес: {o.originAddress}
                  </Text>
                )}
                {o.finishedAt && (
                  <Text style={styles.orderDate}>
                    Завершён: {formatDateTime(o.finishedAt)}
                  </Text>
                )}
              </View>

              <View style={styles.orderRight}>
                <Text style={styles.orderAmount}>
                  {o.totalPrice ?? 0} ₸
                </Text>
                {o.status && (
                  <Text style={styles.orderStatus}>{o.status}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* При желании — кнопка "Запросить вывод" (муляж) */}
        <View style={styles.bottomCard}>
          <Button
            title="Запросить вывод средств"
            onPress={() => {
              console.log('Request payout (mock)');
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function PeriodChip({ label, active, onPress }) {
  return (
    <Pressable
      style={[styles.periodChip, active && styles.periodChipActive]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.periodChipText,
          active && styles.periodChipTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
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
  bottomCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },

  periodRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  periodChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  periodChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  periodChipText: {
    fontSize: 12,
    color: '#4B5563',
  },
  periodChipTextActive: {
    color: '#F9FAFB',
  },

  summaryRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },
  summaryHint: {
    marginTop: 8,
    fontSize: 11,
    color: '#9CA3AF',
  },

  emptyText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },

  orderRow: {
    marginTop: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderIconWrap: {
    marginRight: 6,
  },
  orderIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  orderText: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 2,
  },
  orderDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  orderRight: {
    marginLeft: 8,
    alignItems: 'flex-end',
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  orderStatus: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
});
