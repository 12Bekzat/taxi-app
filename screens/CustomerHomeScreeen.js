// screens/CustomerHomeScreeen.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

import OSMMap from '../components/OSMMap';
import FloatingCard from '../components/FloatingCard';
import Button from '../components/Button';
import AddressAutocomplete from '../components/AddressAutocomplete';
import { reverseGeocode, routeDriving } from '../utils/routing';
import { clusterPoints } from '../utils/cluster';

// 🔗 методы работы с заказами (через fetch)
import { createOrder, fetchMyActiveOrders } from '../api/orders';
import { rateOrder } from '../api/rating';
// 🔗 метод оценки водителя

const ALMATY = { latitude: 43.238949, longitude: 76.889709 };

// Локальные типы техники (для UI).
// Для бэка добавлен mapping на id типов в БД.
const VEHICLES = [
  { id: 'tow_truck', title: 'Эвакуатор', price: 8000, backendId: 1 },
  { id: 'crane', title: 'Манипулятор', price: 9500, backendId: 2 },
  { id: 'heavy', title: 'Грузовой', price: 12000, backendId: 3 },
];

const ORDER_STATE = {
  IDLE: 'idle',          // ничего не заказано
  SEARCHING: 'searching',// заказ создан, идёт поиск
  ASSIGNED: 'assigned',  // водитель принял
  IN_PROGRESS: 'in_progress', // водитель работает
  COMPLETED: 'completed',// работа завершена, клиент должен оценить и "оплатить"
};

const SEARCH_DURATION_SEC = 3 * 60; // 3 минуты как на скрине

export default function CustomerHomeScreeen() {
  const [region, setRegion] = useState({
    latitude: ALMATY.latitude,
    longitude: ALMATY.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const [myLocation, setMyLocation] = useState(null);
  const [addressText, setAddressText] = useState('');
  const [addressCoord, setAddressCoord] = useState(null);

  const [activeVehicle, setActiveVehicle] = useState('tow_truck');
  const [driverClusters, setDriverClusters] = useState([]);
  const [route, setRoute] = useState(null);
  const [price, setPrice] = useState(0);

  const [loading, setLoading] = useState(false);
  const [permError, setPermError] = useState(false);

  const [panelExpanded, setPanelExpanded] = useState(false);

  // состояния заказа + данные заказа с бэка
  const [orderState, setOrderState] = useState(ORDER_STATE.IDLE);
  const [searchRemaining, setSearchRemaining] = useState(SEARCH_DURATION_SEC);
  const [currentOrder, setCurrentOrder] = useState(null);

  // статичный «назначенный» водитель (fallback, если в заказе нет driverName)
  const assignedDriverFallback = {
    name: 'Айдар',
    vehicleTitle: 'Эвакуатор MAN',
    plate: '123 ABC 02',
    color: 'Серый',
    phone: '+7 701 123 45 67',
    etaMin: 7,
  };

  // === ОЦЕНКА ВОДИТЕЛЯ ===
  const [showRating, setShowRating] = useState(false);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const vehicleObj = useMemo(
    () => VEHICLES.find((v) => v.id === activeVehicle) || VEHICLES[0],
    [activeVehicle],
  );

  // ===== helpers =====

  const mapStatusToOrderState = (status) => {
    switch (status) {
      case 'NEW':
        return ORDER_STATE.SEARCHING;
      case 'ACCEPTED':
        return ORDER_STATE.ASSIGNED;
      case 'IN_PROGRESS':
        return ORDER_STATE.IN_PROGRESS;
      case 'COMPLETED':
        return ORDER_STATE.COMPLETED;
      default:
        return ORDER_STATE.IDLE;
    }
  };

  const recalcPriceFromOrder = (order) => {
    if (!order) return;
    if (order.totalPrice != null) {
      setPrice(order.totalPrice);
      return;
    }
    const perMin =
      order.pricePerMinute ||
      Math.round((vehicleObj.price || 0) / 30); // fallback
    const minutes = order.estimatedMinutes || 30;
    setPrice(perMin * minutes);
  };

  const estimatePrice = (routeObj) => {
    if (!routeObj) return vehicleObj.price;
    const base = vehicleObj.price;
    return Math.round(base + routeObj.distanceKm * 120);
  };

  // ===== геолокация =====

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermError(true);
        return;
      }
      setPermError(false);
      const loc = await Location.getCurrentPositionAsync({});
      const c = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setMyLocation(c);
      setRegion((r) => ({ ...r, latitude: c.latitude, longitude: c.longitude }));
    })();
  }, []);

  // моковые машины вокруг
  useEffect(() => {
    const list = Array.from({ length: 20 }).map(() => ({
      latitude: region.latitude + (Math.random() - 0.5) * 0.06,
      longitude: region.longitude + (Math.random() - 0.5) * 0.1,
    }));
    setDriverClusters(clusterPoints(list, 0.01));
  }, [region.latitude, region.longitude]);

  // ===== подтянуть активный заказ при открытии экрана =====
  useEffect(() => {
    (async () => {
      try {
        const active = await fetchMyActiveOrders();
        if (active && active.length > 0) {
          const o = active[0];
          setCurrentOrder(o);
          const st = mapStatusToOrderState(o.status);
          setOrderState(st);
          recalcPriceFromOrder(o);

          if (o.originLat && o.originLon) {
            const coord = { latitude: o.originLat, longitude: o.originLon };
            setAddressCoord(coord);
            setAddressText(o.originAddress || '');
            updateRoute(coord, /*silent*/ true);
          }

          if (st === ORDER_STATE.COMPLETED) {
            // если с бэка сразу пришёл COMPLETED — сразу просим оценку
            setShowRating(true);
          }
        }
      } catch (e) {
        console.log('fetchMyActiveOrders error', e);
      }
    })();
  }, []);

  // ===== polling статуса активного заказа =====
  useEffect(() => {
    if (!currentOrder?.id) return;

    const id = setInterval(async () => {
      try {
        const active = await fetchMyActiveOrders();
        if (!active || active.length === 0) {
          // активных заказов нет: могли завершить на бэке
          // здесь можно по желанию дополнительно запрашивать последний заказ
          return;
        }
        const o = active[0];
        setCurrentOrder(o);
        const st = mapStatusToOrderState(o.status);
        setOrderState(st);
        recalcPriceFromOrder(o);

        if (st === ORDER_STATE.COMPLETED) {
          setShowRating(true);
        }
      } catch (e) {
        console.log('poll active order error', e);
      }
    }, 5000);

    return () => clearInterval(id);
  }, [currentOrder?.id]);

  // ===== таймер поиска машины (визуалка) =====
  useEffect(() => {
    if (orderState !== ORDER_STATE.SEARCHING) return;

    setSearchRemaining(SEARCH_DURATION_SEC);
    const id = setInterval(() => {
      setSearchRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          if (!currentOrder || currentOrder.status === 'NEW') {
            setOrderState(ORDER_STATE.ASSIGNED);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [orderState, currentOrder]);

  // ===== маршруты =====

  const updateRoute = async (dest, silent = false) => {
    if (!myLocation || !dest) {
      setRoute(null);
      setPrice(vehicleObj.price);
      return;
    }
    try {
      if (!silent) setLoading(true);
      const r = await routeDriving(myLocation, dest);
      setRoute(r);
      setPrice(estimatePrice(r));
    } catch (e) {
      console.log('routeDriving error', e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // выбор из подсказки
  const handlePickAddress = (item) => {
    const coord = { latitude: item.lat, longitude: item.lon };
    setAddressText(item.label);
    setAddressCoord(coord);
    setPanelExpanded(false);
    updateRoute(coord);
  };

  // долгий тап по карте
  const handleLongPress = async (c) => {
    setAddressCoord(c);
    const addr = await reverseGeocode(c.latitude, c.longitude);
    setAddressText(addr || '');
    updateRoute(c);
  };

  const useMyLocation = async () => {
    if (!myLocation) return;
    const addr = await reverseGeocode(myLocation.latitude, myLocation.longitude);
    setAddressText(addr || 'Моё местоположение');
    setAddressCoord(myLocation);
    updateRoute(myLocation);
    setPanelExpanded(false);
  };

  // ===== заказ =====

  const handleOrder = async () => {
    if (!addressCoord || orderState !== ORDER_STATE.IDLE) return;

    try {
      setLoading(true);

      const vehicle = VEHICLES.find((v) => v.id === activeVehicle) || VEHICLES[0];
      const equipmentTypeId = vehicle.backendId;

      if (!route) {
        await updateRoute(addressCoord, true);
      }

      const payload = {
        equipmentTypeId,
        originAddress: addressText,
        originLat: addressCoord.latitude,
        originLon: addressCoord.longitude,
        destinationAddress: null,
        destinationLat: null,
        destinationLon: null,
        estimatedMinutes: 30,
      };

      const order = await createOrder(payload);
      setCurrentOrder(order);
      const st = mapStatusToOrderState(order.status);
      setOrderState(st);
      recalcPriceFromOrder(order);
      setPanelExpanded(false);
    } catch (e) {
      console.log('createOrder error', e);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = () => {
    console.log('TODO: отправить cancel на бэк');
    setOrderState(ORDER_STATE.IDLE);
    setSearchRemaining(SEARCH_DURATION_SEC);
    setCurrentOrder(null);
  };

  // "оплата" — муляж
  const handlePayment = () => {
    if (!currentOrder) return;
    console.log(
      `FAKE PAYMENT: order=${currentOrder.id}, amount=${
        currentOrder.totalPrice || price
      } ₸`,
    );
    setCurrentOrder(null);
    setOrderState(ORDER_STATE.IDLE);
    setSearchRemaining(SEARCH_DURATION_SEC);
    setRoute(null);
    setAddressCoord(null);
    setAddressText('');
  };

  // === отправка оценки ===
  const submitRating = async () => {
    if (ratingScore < 1 || ratingScore > 5) {
      Alert.alert('Оценка', 'Поставьте оценку от 1 до 5 звёзд.');
      return;
    }

    try {
      setSubmittingRating(true);
      if (currentOrder?.id) {
        await rateOrder(currentOrder.id, ratingScore, ratingComment.trim());
      } else {
        console.log('Нет currentOrder.id — отправляем только локально');
      }

      setShowRating(false);
      setRatingScore(0);
      setRatingComment('');

      // после оценки — "оплата"
      handlePayment();
    } catch (e) {
      console.log('submitRating error', e);
      Alert.alert('Ошибка', 'Не удалось сохранить оценку. Попробуйте ещё раз.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const compactAddress =
    addressText?.length > 35 ? addressText.slice(0, 32) + '…' : addressText;

  const panelPositionStyle =
    panelExpanded && orderState === ORDER_STATE.IDLE
      ? { top: 60, bottom: 20 }
      : { bottom: 20 };

  const panelCardStyle =
    panelExpanded && orderState === ORDER_STATE.IDLE ? { flex: 1 } : {};

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const searchProgress =
    1 - searchRemaining / SEARCH_DURATION_SEC; // от 0 до 1

  const driverName = currentOrder?.driverName || assignedDriverFallback.name;
  const driverVehicle =
    currentOrder?.equipmentName || assignedDriverFallback.vehicleTitle;
  const driverPhone = currentOrder?.driverPhone || assignedDriverFallback.phone;

  return (
    <View style={{ flex: 1 }}>
      <OSMMap
        initialRegion={region}
        fromMarker={myLocation}
        toMarker={addressCoord}
        routePoints={route?.points}
        onLongPress={handleLongPress}
        driverClusters={driverClusters}
      >
        {/* верх: бренд */}
        <View style={styles.topArea}>
          <Text style={styles.brand}>
            <Text style={{ color: '#E30613' }}>RED</Text>Taxi
          </Text>
          {permError && (
            <FloatingCard style={{ marginTop: 8 }}>
              <Text style={styles.permTitle}>Нет доступа к геолокации</Text>
              <Text style={styles.permText}>
                Разрешите доступ к геолокации, чтобы показать ваше положение.
              </Text>
            </FloatingCard>
          )}
        </View>

        {/* нижняя панель */}
        <View style={[styles.panelWrap, panelPositionStyle]}>
          <FloatingCard style={[styles.panelCard, panelCardStyle]}>
            {/* handle */}
            <View style={styles.handleRow}>
              <View style={styles.handleBar} />
            </View>

            {/* === СОСТОЯНИЯ ПАНЕЛИ === */}
            {orderState === ORDER_STATE.IDLE && (
              <>
                {panelExpanded ? (
                  // развернутый режим: ввод адреса
                  <>
                    <View style={styles.expandedHeader}>
                      <Text style={styles.h1}>Куда подать спецтехнику?</Text>
                      <Pressable
                        style={styles.closeBtn}
                        onPress={() => setPanelExpanded(false)}
                      >
                        <Ionicons name="close" size={18} color="#4B5563" />
                      </Pressable>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 8,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <AddressAutocomplete
                          placeholder="Введите адрес"
                          value={addressText}
                          onChangeText={setAddressText}
                          onPick={handlePickAddress}
                          onFocus={() => {}}
                        />
                      </View>
                      <Pressable
                        style={styles.myLocationBtn}
                        onPress={useMyLocation}
                      >
                        <Ionicons name="locate" size={18} color="#111827" />
                      </Pressable>
                    </View>

                    <Text style={styles.helper}>
                      Начните набирать улицу, выберите «Ваше местоположение» или
                      поставьте точку долгим нажатием на карту.
                    </Text>

                    <View style={{ marginTop: 16, flex: 1 }}>
                      <Text style={styles.subTitle}>Тип спецтехники</Text>
                      <View style={styles.vehiclesRow}>
                        {VEHICLES.map((v) => (
                          <VehicleCard
                            key={v.id}
                            data={v}
                            active={activeVehicle === v.id}
                            onPress={() => {
                              setActiveVehicle(v.id);
                              setPrice(estimatePrice(route || null));
                            }}
                          />
                        ))}
                      </View>
                    </View>

                    <View style={{ height: 12 }} />
                    <Button
                      title={
                        price
                          ? `Заказать — ~${price} ₸`
                          : 'Заказать (после выбора адреса)'
                      }
                      onPress={handleOrder}
                      disabled={!addressCoord}
                    />
                  </>
                ) : (
                  // компактный режим
                  <>
                    <Pressable
                      style={styles.compactAddressRow}
                      onPress={() => setPanelExpanded(true)}
                    >
                      <View style={styles.addressIcon}>
                        <Ionicons
                          name="location-outline"
                          size={18}
                          color="#111827"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.addressLabel}>
                          Куда подать спецтехнику
                        </Text>
                        <Text
                          style={styles.addressValue}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {compactAddress || 'Укажите адрес'}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-up"
                        size={18}
                        color="#9CA3AF"
                      />
                    </Pressable>

                    <View style={{ marginTop: 12 }}>
                      <Text style={styles.subTitle}>Тип спецтехники</Text>
                      <View style={styles.vehiclesRow}>
                        {VEHICLES.map((v) => (
                          <VehicleCard
                            key={v.id}
                            data={v}
                            active={activeVehicle === v.id}
                            onPress={() => {
                              setActiveVehicle(v.id);
                              setPrice(estimatePrice(route || null));
                            }}
                          />
                        ))}
                      </View>
                    </View>

                    <View style={{ height: 16 }} />
                    <Button
                      title={
                        price
                          ? `Заказать — ~${price} ₸`
                          : 'Заказать (после выбора адреса)'
                      }
                      onPress={handleOrder}
                      disabled={!addressCoord}
                    />
                  </>
                )}
              </>
            )}

            {orderState === ORDER_STATE.SEARCHING && (
              // экран "Поиск машины"
              <View style={{ flex: 1 }}>
                <View style={styles.searchHeaderRow}>
                  <Text style={styles.h1}>Поиск спецтехники</Text>
                  <Text style={styles.timerText}>
                    {formatTime(searchRemaining)}
                  </Text>
                </View>
                <Text style={styles.caption}>
                  Ещё чуть-чуть… ищем ближайшего свободного эвакуатора.
                </Text>

                {/* жёлтая полоска прогресса */}
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.min(searchProgress * 100, 100)}%` },
                    ]}
                  />
                </View>

                <View style={styles.actionsRow}>
                  <Pressable style={styles.circleBtn} onPress={cancelOrder}>
                    <Ionicons name="close" size={24} color="#111827" />
                  </Pressable>
                  <Pressable
                    style={styles.circleBtn}
                    onPress={() => {
                      console.log('Детали заказа (демо)');
                    }}
                  >
                    <Ionicons
                      name="reorder-three"
                      size={26}
                      color="#111827"
                    />
                  </Pressable>
                </View>

                <View style={styles.actionsLabelsRow}>
                  <Text style={styles.actionsLabel}>Отменить заказ</Text>
                  <Text style={styles.actionsLabel}>Детали</Text>
                </View>
              </View>
            )}

            {orderState === ORDER_STATE.ASSIGNED && (
              // машина назначена, ещё не начала работать
              <View style={{ flex: 1 }}>
                <View style={styles.searchHeaderRow}>
                  <Text style={styles.h1}>Спецтехника назначена</Text>
                  <Text style={styles.timerText}>
                    ~{assignedDriverFallback.etaMin} мин
                  </Text>
                </View>
                <Text style={styles.caption}>
                  Водитель уже в пути. Прибудет примерно через{' '}
                  {assignedDriverFallback.etaMin} минут.
                </Text>

                <DriverInfo
                  name={driverName}
                  vehicleTitle={driverVehicle}
                  plate={assignedDriverFallback.plate}
                  color={assignedDriverFallback.color}
                  price={price}
                  address={compactAddress || 'Адрес не задан'}
                />

                <View style={styles.rowButtons}>
                  <Button
                    title="Позвонить водителю"
                    onPress={() => {
                      console.log('call', driverPhone);
                    }}
                  />
                  <View style={{ width: 8 }} />
                  <Button
                    title="Чат с водителем"
                    variant="ghost"
                    onPress={() => {
                      console.log('open chat (demo)');
                    }}
                  />
                </View>

                <View style={{ marginTop: 8 }}>
                  <Button
                    variant="ghost"
                    title="Отменить заказ"
                    onPress={cancelOrder}
                  />
                </View>
              </View>
            )}

            {orderState === ORDER_STATE.IN_PROGRESS && (
              // водитель выполняет работу на месте
              <View style={{ flex: 1 }}>
                <View style={styles.searchHeaderRow}>
                  <Text style={styles.h1}>Работа выполняется</Text>
                </View>
                <Text style={styles.caption}>
                  Спецтехника уже на месте и выполняет работу. По завершении мы
                  покажем итоговую стоимость.
                </Text>

                <DriverInfo
                  name={driverName}
                  vehicleTitle={driverVehicle}
                  plate={assignedDriverFallback.plate}
                  color={assignedDriverFallback.color}
                  price={price}
                  address={compactAddress || 'Адрес не задан'}
                />

                <View style={styles.rowButtons}>
                  <Button
                    title="Позвонить водителю"
                    onPress={() => {
                      console.log('call', driverPhone);
                    }}
                  />
                  <View style={{ width: 8 }} />
                  <Button
                    title="Чат с водителем"
                    variant="ghost"
                    onPress={() => {
                      console.log('open chat (demo)');
                    }}
                  />
                </View>
              </View>
            )}

            {orderState === ORDER_STATE.COMPLETED && (
              // работа закончена, нужно оценить и "оплатить"
              <View style={{ flex: 1 }}>
                <View style={styles.searchHeaderRow}>
                  <Text style={styles.h1}>Работа завершена</Text>
                </View>
                <Text style={styles.caption}>
                  Водитель завершил заказ. Итоговая стоимость рассчитана по
                  фактическому времени работы. Оцените поездку, чтобы перейти к
                  оплате.
                </Text>

                <DriverInfo
                  name={driverName}
                  vehicleTitle={driverVehicle}
                  plate={assignedDriverFallback.plate}
                  color={assignedDriverFallback.color}
                  price={currentOrder?.totalPrice || price}
                  address={compactAddress || 'Адрес не задан'}
                />

                <View style={{ marginTop: 16 }}>
                  <Button
                    title={`Оценить и оплатить ~${
                      currentOrder?.totalPrice || price
                    } ₸`}
                    onPress={() => setShowRating(true)}
                  />
                </View>
              </View>
            )}
          </FloatingCard>
        </View>
      </OSMMap>

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#E30613" />
        </View>
      )}

      {/* Модалка оценки — обязательная */}
      <Modal
        visible={showRating}
        transparent
        animationType="slide"
        onRequestClose={() => {
          // не даём закрыть без оценки
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Оцените работу спецтехники</Text>
            <Text style={styles.modalSubtitle}>
              Поставьте оценку от 1 до 5 звёзд. Комментарий — по желанию.
            </Text>

            <StarRatingRow
              value={ratingScore}
              onChange={setRatingScore}
            />

            <TextInput
              style={styles.commentInput}
              placeholder="Комментарий (необязательно)"
              placeholderTextColor="#9CA3AF"
              multiline
              value={ratingComment}
              onChangeText={setRatingComment}
            />

            <Button
              title={
                submittingRating
                  ? 'Отправка...'
                  : ratingScore === 0
                  ? 'Поставьте оценку'
                  : 'Отправить и оплатить'
              }
              disabled={ratingScore === 0 || submittingRating}
              onPress={submitRating}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DriverInfo({ name, vehicleTitle, plate, color, price, address }) {
  return (
    <View style={styles.driverCard}>
      <View style={styles.driverAvatar}>
        <Text style={styles.driverAvatarText}>
          {name ? name[0] : '?'}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.driverName}>
          {name} • {vehicleTitle}
        </Text>
        <Text style={styles.driverSub}>
          {color} · {plate}
        </Text>
        <Text style={styles.driverSub}>
          Оплата ~{price} ₸ • {address}
        </Text>
      </View>
    </View>
  );
}

function VehicleCard({ data, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.vehicleCard,
        active && { borderColor: '#E30613', backgroundColor: '#FFF7F7' },
      ]}
    >
      <View style={styles.vehicleIconStub}>
        <Ionicons name="car-outline" size={20} color="#111827" />
      </View>
      <Text style={styles.vehicleTitle} numberOfLines={1}>
        {data.title}
      </Text>
      <Text style={styles.vehiclePrice}>от {data.price} ₸ / 30 мин</Text>
    </Pressable>
  );
}

function StarRatingRow({ value, onChange }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={styles.starsRow}>
      {stars.map((s) => {
        const active = value >= s;
        return (
          <Pressable
            key={s}
            onPress={() => onChange(s)}
            style={styles.starBtn}
            hitSlop={8}
          >
            <Ionicons
              name={active ? 'star' : 'star-outline'}
              size={26}
              color={active ? '#F59E0B' : '#D1D5DB'}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  topArea: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
  },
  brand: { fontSize: 22, fontWeight: '900', color: '#0F0F10' },

  permTitle: { fontWeight: '800', fontSize: 14 },
  permText: { marginTop: 4, color: '#6A6A6A', fontSize: 12 },

  panelWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  panelCard: {
    paddingBottom: 12,
  },

  handleRow: {
    alignItems: 'center',
    marginBottom: 4,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },

  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },

  h1: { fontSize: 16, fontWeight: '800' },
  helper: { fontSize: 11, color: '#9CA3AF', marginTop: 6 },

  myLocationBtn: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  compactAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  addressIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  addressLabel: { fontSize: 11, color: '#9CA3AF' },
  addressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 2,
  },

  subTitle: { fontSize: 12, fontWeight: '700', color: '#111827', marginBottom: 6 },

  vehiclesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  vehicleCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 8,
  },
  vehicleIconStub: {
    width: 32,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  vehicleTitle: { fontSize: 12, fontWeight: '700', color: '#111827' },
  vehiclePrice: { fontSize: 11, color: '#4B5563', marginTop: 2 },

  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timerText: { fontWeight: '700', fontSize: 14 },

  caption: { color: '#6A6A6A', marginTop: 4 },

  progressBarBg: {
    marginTop: 10,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FBBF24',
  },

  actionsRow: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  circleBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  actionsLabelsRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  actionsLabel: { fontSize: 12, color: '#9CA3AF' },

  driverCard: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  driverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  driverAvatarText: { fontWeight: '800', fontSize: 18, color: '#111827' },
  driverName: { fontWeight: '800', fontSize: 14 },
  driverSub: { color: '#6B7280', fontSize: 12, marginTop: 2 },

  rowButtons: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  // рейтинг
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 12,
  },
  starBtn: {
    marginHorizontal: 4,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  commentInput: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 70,
    textAlignVertical: 'top',
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
});
