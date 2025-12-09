// screens/ProfileScreen.js
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text>Не авторизован</Text>
      </View>
    );
  }

  const fullName =
    user.firstName || user.lastName
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
      : 'Без имени';

  const role = user.role === 'DRIVER' ? 'Водитель' : 'Клиент';
  const avatarSource = user.avatarUrl ? { uri: user.avatarUrl } : null;
  const isDriver = user.role === 'DRIVER';

  // ожидаем, что бэк выставляет этот флаг
  const needDocsAttention = useMemo(
    () => isDriver && !user.driverDocumentsCompleted,
    [isDriver, user.driverDocumentsCompleted],
  );

  const commonTopItems = [
    {
      key: 'support',
      icon: 'help-circle-outline',
      title: 'Служба поддержки',
      subtitle: 'Связаться с оператором',
      onPress: () => navigation.navigate('Support'),
    },
  ];

  const customerItemsTop = [
    {
      key: 'payments',
      icon: 'card-outline',
      title: 'Способы оплаты',
      subtitle: 'Карта, наличные',
      onPress: () => navigation.navigate('PaymentMethods'),
    },
    {
      key: 'promo',
      icon: 'gift-outline',
      title: 'Скидки и промокоды',
      subtitle: 'Ввести промокод',
      onPress: () => navigation.navigate('Promo'),
    },
  ];

  const customerItemsMiddle = [
    {
      key: 'orders',
      icon: 'receipt-outline',
      title: 'Заказы',
      subtitle: 'История заказов эвакуации',
      onPress: () => navigation.navigate('Orders'),
    },
    {
      key: 'addresses',
      icon: 'location-outline',
      title: 'Мои адреса',
      subtitle: 'Дом, работа, избранные',
      onPress: () => navigation.navigate('Addresses'),
    },
  ];

  const driverItemsTop = [
    {
      key: 'work',
      icon: 'car-outline',
      title: 'Работа в LiftMe',
      subtitle: 'Статус на линии и смены',
      onPress: () => navigation.navigate('DriverWork'),
    },
  ];

  const driverItemsMiddle = [
    {
      key: 'vehicle',
      icon: 'bus-outline',
      title: 'Моя техника',
      subtitle: 'Тип, госномер, фото',
      onPress: () => navigation.navigate('DriverVehicle'),
    },
    {
      key: 'docs',
      icon: 'document-text-outline',
      title: 'Документы',
      subtitle: needDocsAttention
        ? 'Загрузите фото прав и удостоверения'
        : 'Права, удостоверение, страховка',
      onPress: () => navigation.navigate('DriverDocuments'),
      badge: needDocsAttention ? '!' : undefined,
      badgeColor: '#DC2626',
    },
    {
      key: 'payouts',
      icon: 'wallet-outline',
      title: 'Выплаты',
      subtitle: 'Доходы и вывод средств',
      onPress: () => navigation.navigate('DriverPayouts'),
    },
    {
      key: 'rating',
      icon: 'star-outline',
      title: 'Рейтинг',
      subtitle: 'Оценки клиентов',
      onPress: () => navigation.navigate('DriverRating'),
    },
  ];

  const settingsItems = [
    {
      key: 'settings',
      icon: 'settings-outline',
      title: 'Настройки',
      subtitle: 'Уведомления, язык, безопасность',
      onPress: () => navigation.navigate('Settings'),
    },
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      {/* Шапка */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Pressable
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </Pressable>
        </View>

        <View style={styles.profileRow}>
          <View style={styles.avatarWrap}>
            {avatarSource ? (
              <Image
                source={avatarSource}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person-outline" size={32} color="#9CA3AF" />
              </View>
            )}
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Pressable
              onPress={() => navigation.navigate('EditProfile')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.name}>{fullName}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color="#9CA3AF"
                  style={{ marginLeft: 4 }}
                />
              </View>
            </Pressable>
            <Text style={styles.phone}>{user.phone}</Text>
            <Text style={styles.role}>{role}</Text>
          </View>
        </View>

        {needDocsAttention && (
          <Pressable
            style={styles.docsBanner}
            onPress={() => navigation.navigate('DriverDocuments')}
          >
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color="#B45309"
              style={{ marginRight: 6 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.docsBannerTitle}>
                Загрузите документы для выхода на линию
              </Text>
              <Text style={styles.docsBannerText}>
                Требуются фото прав и удостоверения личности с двух сторон.
              </Text>
            </View>
          </Pressable>
        )}
      </View>

      {/* Верхний блок */}
      <View style={styles.sectionCard}>
        {(isDriver ? driverItemsTop : customerItemsTop).map(
          ({ key, ...rest }) => (
            <MenuItem key={key} {...rest} />
          ),
        )}
        {commonTopItems.map(({ key, ...rest }) => (
          <MenuItem key={key} {...rest} />
        ))}
      </View>

      {/* Средний блок */}
      <View style={styles.sectionCard}>
        {(isDriver ? driverItemsMiddle : customerItemsMiddle).map(
          ({ key, ...rest }) => (
            <MenuItem key={key} {...rest} />
          ),
        )}
      </View>

      {/* Настройки */}
      <View style={styles.sectionCard}>
        {settingsItems.map(({ key, ...rest }) => (
          <MenuItem key={key} {...rest} />
        ))}
      </View>

      {/* Выход */}
      <View style={styles.sectionCard}>
        <Pressable style={styles.logoutRow} onPress={logout}>
          <View style={styles.iconCircleDanger}>
            <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          </View>
          <Text style={styles.logoutText}>Выйти из аккаунта</Text>
        </Pressable>
      </View>

      {/* Кнопка редактирования */}
      <View style={styles.bottomButton}>
        <Button
          title="Редактировать профиль"
          onPress={() => navigation.navigate('EditProfile')}
        />
      </View>
    </ScrollView>
  );
}

function MenuItem({ icon, title, subtitle, onPress, badge, badgeColor }) {
  return (
    <Pressable style={styles.menuRow} onPress={onPress}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={18} color="#111827" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle ? (
          <Text style={styles.menuSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
      {badge ? (
        <View
          style={[
            styles.badge,
            badgeColor ? { backgroundColor: badgeColor } : null,
          ]}
        >
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerCard: {
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  phone: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 2,
  },
  role: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  docsBanner: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: '#FFFBEB',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  docsBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  docsBannerText: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
  },

  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
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
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },

  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },

  iconCircleDanger: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },

  bottomButton: {
    marginTop: 4,
    marginHorizontal: 16,
  },
});
