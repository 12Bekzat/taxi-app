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
import {
  createOrder,
  fetchMyActiveOrders,
  fetchLastCompletedUnratedOrder,
} from '../api/orders';
import { rateOrder } from '../api/rating';

const ALMATY = { latitude: 43.238949, longitude: 76.889709 };

// Локальные типы техники (для UI).
const VEHICLES = [
  { id: 'tow_truck', title: 'Эвакуатор', price: 8000, backendId: 1 },
  { id: 'crane', title: 'Манипулятор', price: 9500, backendId: 2 },
  { id: 'heavy', title: 'Грузовой', price: 12000, backendId: 3 },
];

const ORDER_STATE = {
  IDLE: 'idle',
  SEARCHING: 'searching',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
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

  // ===== РЕЙТИНГ ВОДИТЕЛЯ =====
  const [ratingVisible, setRatingVisible] = useState(false);
  const [ratingOrder, setRatingOrder] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  // статичный «назначенный» водитель (fallback)
  const assignedDriverFallback = {
    name: 'Айдар',
    vehicleTitle: 'Эвакуатор MAN',
    plate: '123 ABC 02',
    color: 'Серый',
    phone: '+7 701 123 45 67',
    etaMin: 7,
  };

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
      Math.round((vehicleObj.price || 0) / 30); // грубый fallback
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

  // ===== подтянуть активный заказ + незавершённый рейтинг при старте =====
  useEffect(() => {
    (async () => {
      try {
        // 1) активный заказ
        const active = await fetchMyActiveOrders();
        if (active && active.length > 0) {
          const o = active[0];
          setCurrentOrder(o);
          setOrderState(mapStatusToOrderState(o.status));
          recalcPriceFromOrder(o);

          if (o.originLat && o.originLon) {
            const coord = { latitude: o.originLat, longitude: o.originLon };
            setAddressCoord(coord);
            setAddressText(o.originAddress || '');
            updateRoute(coord, /*silent*/ true);
          }
        } else {
          setOrderState(ORDER_STATE.IDLE);
        }

        // 2) последний завершённый, но НЕ оценённый заказ
        const lastUnrated = await fetchLastCompletedUnratedOrder();
        if (lastUnrated && lastUnrated.id) {
          setRatingOrder(lastUnrated);
          setRatingValue(0);
          setRatingComment('');
          setRatingVisible(true);
        }
      } catch (e) {
        console.log('init customer home error', e);
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
          setCurrentOrder(null);
          setOrderState(ORDER_STATE.IDLE);
          setSearchRemaining(SEARCH_DURATION_SEC);
          return;
        }
        const o = active[0];
        setCurrentOrder(o);
        setOrderState(mapStatusToOrderState(o.status));
        recalcPriceFromOrder(o);
      } catch (e) {
        console.log('poll active order error', e);
      }
    }, 5000);

    return () => clearInterval(id);
  }, [currentOrder?.id]);

  // ===== таймер поиска машины (чисто фронтовый) =====
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

  const handlePickAddress = (item) => {
    const coord = { latitude: item.lat, longitude: item.lon };
    setAddressText(item.label);
    setAddressCoord(coord);
    setPanelExpanded(false);
    updateRoute(coord);
  };

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
      setOrderState(mapStatusToOrderState(order.status));
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

  // оплата → сразу открываем модалку рейтинга
  const handlePayment = () => {
    if (!currentOrder) return;

    console.log(
      `FAKE PAYMENT: order=${currentOrder.id}, amount=${currentOrder.totalPrice || price} ₸`,
    );

    // вместо того чтобы сразу чистить заказ — сначала даём ОЦЕНИТЬ
    setRatingOrder(currentOrder);
    setRatingValue(5);
    setRatingComment('');
    setRatingVisible(true);
  };

  useEffect(() => {
  console.log('order', currentOrder);
  });

  // отправка оценки на бэк
  const handleSubmitRating = async () => {
    if (!ratingOrder || !ratingValue) {
      Alert.alert('Оценка', 'Поставьте оценку от 1 до 5 звёзд.');
      return;
    }

    try {
      setLoading(true);
      await rateOrder(
        ratingOrder.id,
        ratingValue,
        ratingComment.trim() || null,
      );

      // после успешной оценки очищаем локальное состояние заказа
      setRatingVisible(false);
      setRatingOrder(null);
      setRatingComment('');
      setRatingValue(5);

      // сброс состояния заказа
      setCurrentOrder(null);
      setOrderState(ORDER_STATE.IDLE);
      setSearchRemaining(SEARCH_DURATION_SEC);
    } catch (e) {
      console.log('submitDriverRating error', e);
      Alert.alert('Ошибка', 'Не удалось отправить оценку. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
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

  const searchProgress = 1 - searchRemaining / SEARCH_DURATION_SEC;

  const driverName =
    currentOrder?.driverName ||
    ratingOrder?.driverName ||
    assignedDriverFallback.name;
  const driverVehicle =
    currentOrder?.equipmentName ||
    ratingOrder?.equipmentName ||
    assignedDriverFallback.vehicleTitle;
  const driverPhone =
    currentOrder?.driverPhone ||
    ratingOrder?.driverPhone ||
    assignedDriverFallback.phone;

  const ratingDriverName = ratingOrder?.driverName || driverName;
  const ratingEquipmentName =
    ratingOrder?.equipmentName || driverVehicle || 'Спецтехника';

  return (
    <View style={{ flex: 1 }}>
      <OSMMap
        initialRegion={region}
        fromMarker={currentOrder?.destinationLat && currentOrder?.destinationLon
            ? { latitude: currentOrder.destinationLat, longitude: currentOrder.destinationLon }
            : null}
        toMarker={addressCoord}
        routePoints={route?.points}
        onLongPress={handleLongPress}
        driverClusters={driverClusters}
      >
        {/* верх: бренд */}
        <View style={styles.topArea}>
          <Text style={styles.brand}>
            <Text style={{ color: '#E30613' }}>LIFT</Text>Me
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
            <View style={styles.handleRow}>
              <View style={styles.handleBar} />
            </View>

            {/* === СОСТОЯНИЯ ПАНЕЛИ === */}
            {orderState === ORDER_STATE.IDLE && (
              <>
                {panelExpanded ? (
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
              <View style={{ flex: 1 }}>
                <View style={styles.searchHeaderRow}>
                  <Text style={styles.h1}>Работа завершена</Text>
                </View>
                <Text style={styles.caption}>
                  Водитель завершил заказ. Итоговая стоимость рассчитана по
                  фактическому времени работы.
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
                    title={`Оплатить ~${currentOrder?.totalPrice || price} ₸`}
                    onPress={handlePayment}
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

      {/* ===== МОДАЛКА ОЦЕНКИ ВОДИТЕЛЯ ===== */}
      <Modal
        visible={ratingVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          // НЕ даём закрыть без оценки, поэтому просто игнорируем
        }}
      >
        <View style={styles.ratingOverlay}>
          <View style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>Оцените поездку</Text>
            <Text style={styles.ratingSubtitle}>
              {ratingDriverName
                ? `Водитель: ${ratingDriverName}`
                : 'Ваш водитель'}
            </Text>
            <Text style={styles.ratingSubtitle}>
              {ratingEquipmentName}
            </Text>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => setRatingValue(star)}
                  style={styles.starBtn}
                >
                  <Ionicons
                    name={star <= ratingValue ? 'star' : 'star-outline'}
                    size={28}
                    color="#FACC15"
                  />
                </Pressable>
              ))}
            </View>

            <TextInput
              style={styles.ratingInput}
              placeholder="Оставьте комментарий (по желанию)"
              placeholderTextColor="#9CA3AF"
              value={ratingComment}
              onChangeText={setRatingComment}
              multiline
            />

            <Button title="Отправить оценку" onPress={handleSubmitRating} />
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
        <Text style={styles.driverAvatarText}>{name ? name[0] : '?'}</Text>
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

  // ===== РЕЙТИНГ =====
  ratingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  ratingCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 24,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  ratingSubtitle: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 4,
  },
  starsRow: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 8,
  },
  starBtn: {
    marginRight: 6,
  },
  ratingInput: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 70,
    textAlignVertical: 'top',
    fontSize: 13,
    color: '#111827',
  },
});
