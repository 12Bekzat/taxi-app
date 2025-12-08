// screens/DriverRatingScreen.js
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
import { fetchMyDriverRating } from '../api/rating';

function formatDate(dateStr) {
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

function Stars({ value }) {
  const v = Math.round(value * 2) / 2; // до 0.5
  const full = Math.floor(v);
  const half = v - full >= 0.5;
  const stars = [];

  for (let i = 0; i < 5; i++) {
    if (i < full) {
      stars.push(
        <Ionicons key={i} name="star" size={18} color="#F59E0B" />
      );
    } else if (i === full && half) {
      stars.push(
        <Ionicons
          key={i}
          name="star-half"
          size={18}
          color="#F59E0B"
        />
      );
    } else {
      stars.push(
        <Ionicons
          key={i}
          name="star-outline"
          size={18}
          color="#D1D5DB"
        />
      );
    }
  }
  return <View style={{ flexDirection: 'row' }}>{stars}</View>;
}

export default function DriverRatingScreen() {
  const navigation = useNavigation();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchMyDriverRating();
      setSummary(data);
    } catch (e) {
      console.log('fetchMyDriverRating error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const avg = summary?.averageScore ?? 0;
  const count = summary?.ratingsCount ?? 0;
  const ratings = summary?.ratings ?? [];

  return (
    <View style={styles.screen}>
      {/* header */}
      <View style={styles.headerRow}>
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Рейтинг</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* summary */}
        <View style={styles.card}>
          <View style={styles.summaryTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryLabel}>Средний рейтинг</Text>
              <View style={styles.summaryScoreRow}>
                <Text style={styles.summaryScoreText}>
                  {avg.toFixed(1)}
                </Text>
                <Stars value={avg} />
              </View>
              <Text style={styles.summaryCountText}>
                {count} {count === 1 ? 'оценка' : 'оценок'}
              </Text>
            </View>
            {loading && (
              <ActivityIndicator size="small" color="#9CA3AF" />
            )}
          </View>
          <Text style={styles.summaryHint}>
            Клиенты видят ваш рейтинг при выборе спецтехники и водителя.
          </Text>
        </View>

        {/* list */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Отзывы клиентов</Text>

          {!loading && (!ratings || ratings.length === 0) && (
            <Text style={styles.emptyText}>
              Пока нет ни одной оценки. Завершайте заказы и просите клиентов
              оставлять отзыв.
            </Text>
          )}

          {ratings.map((r) => (
            <View key={r.id} style={styles.ratingRow}>
              <View style={styles.ratingIcon}>
                <Ionicons
                  name="person-circle-outline"
                  size={32}
                  color="#9CA3AF"
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.ratingHeaderRow}>
                  <Text style={styles.ratingName}>
                    {r.customerName || 'Клиент'}
                  </Text>
                  <Stars value={r.score} />
                </View>
                <Text style={styles.ratingDate}>
                  {formatDate(r.createdAt)}
                </Text>
                {r.comment ? (
                  <Text style={styles.ratingComment}>{r.comment}</Text>
                ) : (
                  <Text style={styles.ratingCommentMuted}>
                    Без комментария
                  </Text>
                )}
                <Text style={styles.ratingOrder}>
                  Заказ #{r.orderId}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
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

  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  summaryScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  summaryScoreText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  summaryCountText: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  summaryHint: {
    marginTop: 8,
    fontSize: 11,
    color: '#9CA3AF',
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  ratingRow: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  ratingIcon: {
    marginRight: 8,
  },
  ratingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  ratingDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  ratingComment: {
    fontSize: 13,
    color: '#111827',
    marginTop: 4,
  },
  ratingCommentMuted: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  ratingOrder: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
});
