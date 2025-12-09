// screens/DriverHomeScreen.js
import React, { use, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

import OSMMap from '../components/OSMMap';
import FloatingCard from '../components/FloatingCard';
import Button from '../components/Button';
import { clusterPoints } from '../utils/cluster';
import { routeDriving } from '../utils/routing';
import {
  fetchDriverAvailableOrders,
  fetchDriverActiveOrders,
  driverAcceptOrder,
  driverStartOrder,
  driverFinishOrder,
} from '../api/orders';
import { useAuth } from '../context/AuthContext';
import { fetchDriverVehicle } from '../api/driverVehicle';

const ALMATY = { latitude: 43.238949, longitude: 76.889709 };

const DRIVER_PHASE = {
  OFFLINE: 'offline',
  IDLE: 'idle', // онлайн, но без заказа
  ACCEPTED: 'accepted', // едет к клиенту
  ARRIVED: 'arrived', // на месте, но ещё не начал
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};

export default function DriverHomeScreen() {
  const { user, navigation } = useAuth() || {}; // navigation можешь пробросить иначе

  const [region, setRegion] = useState({
    latitude: ALMATY.latitude,
    longitude: ALMATY.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const [myLocation, setMyLocation] = useState(null);
  const [permError, setPermError] = useState(false);

  const [online, setOnline] = useState(false);
  const [phase, setPhase] = useState(DRIVER_PHASE.OFFLINE);

  const [availableOrders, setAvailableOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);

  const [routeToClient, setRouteToClient] = useState(null);
  const [driverMarkers, setDriverMarkers] = useState([]);

  const [loading, setLoading] = useState(false);

  const [workedSeconds, setWorkedSeconds] = useState(0);
  const timerRef = useRef(null);

  // ===== информация о технике из профиля =====
  const driverVehicle = useMemo(async () => {
    const p = await fetchDriverVehicle();
    console.log('vehicle', p);
    console.log('user', user);
    
    
    return {
      equipmentTypeId: p.equipmentTypeId ?? p.equipment_type_id ?? null,
      equipmentName: p.equipmentName || p.typeName || 'Моя техника',
      model: p.model || '',
      plate: p.plateNumber || p.plate || '',
      color: p.color || '',
    };
  }, [user]);

  
  const hasVehicle = useMemo(() => !!driverVehicle, [user, driverVehicle]);

  useEffect(() => {
  console.log('has v', hasVehicle);
  }, [user, driverVehicle]);
  
  const hasDocs = useMemo(() => !!user?.driverDocsCompleted, [user]);
  // можно выходить на линию только когда заполнена и техника, и документы
  const canGoOnline = useMemo(async () => {
    return hasVehicle && hasDocs;
  }, [hasVehicle, hasDocs]);
;

  // ===== геолокация водителя =====
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

  // имитируем "других водителей" на карте
  useEffect(() => {
    const list = Array.from({ length: 10 }).map(() => ({
      latitude: region.latitude + (Math.random() - 0.5) * 0.06,
      longitude: region.longitude + (Math.random() - 0.5) * 0.1,
    }));
    setDriverMarkers(clusterPoints(list, 0.01));
  }, [region.latitude, region.longitude]);

  // ===== подтягиваем активный заказ водителя при заходе на экран =====
  useEffect(() => {
    (async () => {
      try {
        const active = await fetchDriverActiveOrders();
        if (active && active.length > 0) {
          const o = active[0];
          setCurrentOrder(o);
          const p = mapStatusToPhase(o.status);
          setPhase(p);
          setOnline(true);

          if (o.originLat && o.originLon && myLocation) {
            buildRouteToClient(myLocation, {
              latitude: o.originLat,
              longitude: o.originLon,
            });
          }
          if (p === DRIVER_PHASE.IN_PROGRESS) {
            // таймер можно было бы восстановить по startedAt,
            // но сейчас просто считаем заново
            startTimer();
          }
        } else {
          setPhase(DRIVER_PHASE.OFFLINE);
        }
      } catch (e) {
        console.log('init driver orders error', e);
      }
    })();
  }, [myLocation]);

  // ===== polling свободных заказов, когда на линии и без заказа =====
  useEffect(() => {
    if (!online || phase !== DRIVER_PHASE.IDLE) return;

    let stopped = false;

    const load = async () => {
      try {
        const list = await fetchDriverAvailableOrders();
        let res = list || [];

        // фильтруем по типу техники, если известен
        if (driverVehicle.equipmentTypeId) {
          res = res.filter(
            (o) => o.equipmentTypeId === driverVehicle.equipmentTypeId,
          );
        }
        if (!stopped) setAvailableOrders(res);
      } catch (e) {
        console.log('fetchDriverAvailableOrders error', e);
      }
    };

    load();
    const id = setInterval(load, 5000);

    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [online, phase, driverVehicle.equipmentTypeId]);

  // ===== helpers =====

  const mapStatusToPhase = (status) => {
    switch (status) {
      case 'NEW':
        return DRIVER_PHASE.IDLE;
      case 'ACCEPTED':
        return DRIVER_PHASE.ACCEPTED;
      case 'IN_PROGRESS':
        return DRIVER_PHASE.IN_PROGRESS;
      case 'COMPLETED':
        return DRIVER_PHASE.COMPLETED;
      default:
        return DRIVER_PHASE.IDLE;
    }
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setWorkedSeconds(0);
    timerRef.current = setInterval(() => {
      setWorkedSeconds((s) => s + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const buildRouteToClient = async (from, to) => {
    try {
      setLoading(true);
      const r = await routeDriving(from, to);
      setRouteToClient(r);
    } catch (e) {
      console.log('routeDriving driver error', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleOnline = () => {
    if (!canGoOnline) {
      if (!hasVehicle) {
        console.log('Нельзя выйти на линию без заполненной техники');
        // navigation?.navigate?.('DriverVehicle');
      } else if (!hasDocs) {
        console.log('Нельзя выйти на линию без загруженных документов');
        // navigation?.navigate?.('DriverDocuments');
      }
      return;
    }

    if (!online) {
      setOnline(true);
      setPhase(DRIVER_PHASE.IDLE);
    } else {
      setOnline(false);
      setPhase(DRIVER_PHASE.OFFLINE);
      setAvailableOrders([]);
      setCurrentOrder(null);
      stopTimer();
    }
  };

  const handleAcceptOrder = async (order) => {
    if (!myLocation) return;
    try {
      setLoading(true);
      console.log(JSON.stringify(myLocation));
      const res = await driverAcceptOrder(order.id, myLocation);
      setCurrentOrder(res);
      setPhase(DRIVER_PHASE.ACCEPTED);
      setAvailableOrders([]);

      if (res.originLat && res.originLon) {
        const dest = { latitude: res.originLat, longitude: res.originLon };
        buildRouteToClient(myLocation, dest);
      }
    } catch (e) {
      console.log('driverAcceptOrder error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleArrived = () => {
    if (!currentOrder) return;
    setPhase(DRIVER_PHASE.ARRIVED);
  };

  const handleStartWork = async () => {
    if (!currentOrder) return;
    try {
      setLoading(true);
      const res = await driverStartOrder(currentOrder.id);
      setCurrentOrder(res);
      setPhase(DRIVER_PHASE.IN_PROGRESS);
      startTimer();
    } catch (e) {
      console.log('driverStartOrder error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishWork = async () => {
    if (!currentOrder) return;
    try {
      setLoading(true);
      const res = await driverFinishOrder(currentOrder.id);
      setCurrentOrder(res);
      setPhase(DRIVER_PHASE.COMPLETED);
      stopTimer();
      console.log(
        `DRIVER EARNED: order=${res.id}, amount=${res.totalPrice} ₸`,
      );
    } catch (e) {
      console.log('driverFinishOrder error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, []);

  useEffect(() => {
    console.log('order', currentOrder);
    });

  const formatWorkedTime = (sec) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const currentAddress =
    currentOrder?.originAddress?.length > 60
      ? currentOrder.originAddress.slice(0, 57) + '…'
      : currentOrder?.originAddress || 'Адрес не задан';

  const estimatedIncome =
    currentOrder && currentOrder.pricePerMinute
      ? Math.round((workedSeconds / 60) * currentOrder.pricePerMinute)
      : 0;

  return (
    <View style={{ flex: 1 }}>
      <OSMMap
        initialRegion={region}
        fromMarker={myLocation}
        toMarker={
          currentOrder?.originLat && currentOrder?.originLon
            ? { latitude: currentOrder.originLat, longitude: currentOrder.originLon }
            : null
        }
        routePoints={routeToClient?.points}
        driverClusters={driverMarkers}
      >
        <View style={styles.topArea}>
          <Text style={styles.brand}>
            <Text style={{ color: '#E30613' }}>LIFT</Text>Me • Driver
          </Text>
          {permError && (
            <FloatingCard style={{ marginTop: 8 }}>
              <Text style={styles.permTitle}>Нет доступа к геолокации</Text>
              <Text style={styles.permText}>
                Разрешите доступ к геолокации, чтобы выйти на линию.
              </Text>
            </FloatingCard>
          )}
        </View>

        <View style={styles.panelWrap}>
          <FloatingCard style={styles.panelCardDark}>
            {/* строка статуса + переключатель "На линии" */}
            <View style={styles.statusRow}>
              <View>
                <Text style={styles.statusLabel}>
                  {online ? 'Вы на линии' : 'Вы не на линии'}
                </Text>
                <Text style={styles.statusSub}>
                  {!hasVehicle
                    ? 'Заполните данные спецтехники, чтобы выйти на линию'
                    : !hasDocs
                    ? 'Загрузите документы (права и удостоверение), чтобы выйти на линию'
                    : online
                    ? 'Заказы подбираются по вашей технике'
                    : 'Выйдите на линию, чтобы получать заказы'}
                </Text>
              </View>
              {phase === DRIVER_PHASE.IDLE && <Pressable
                style={[
                  styles.onlineToggle,
                  online && styles.onlineToggleOn,
                  !canGoOnline && styles.onlineToggleDisabled,
                ]}
                disabled={phase === DRIVER_PHASE.IDLE}
                onPress={toggleOnline}
              >
                <View
                  style={[
                    styles.onlineKnob,
                    online && styles.onlineKnobOn,
                  ]}
                />
              </Pressable>}
            </View>

            {/* напоминание заполнить технику */}
            {!hasVehicle && (
              <Pressable
                style={styles.fillVehicleBtn}
                onPress={() => {
                  console.log('navigate to DriverVehicle (заполнить технику)');
                  // navigation && navigation.navigate?.('DriverVehicle');
                }}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color="#FACC15"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.fillVehicleText}>
                  Заполните данные техники (тип, госномер, фото)
                </Text>
              </Pressable>
            )}

            {/* напоминание загрузить документы */}
            {hasVehicle && !hasDocs && (
              <Pressable
                style={styles.fillVehicleBtn}
                onPress={() => {
                  console.log('navigate to DriverDocuments (заполнить документы)');
                  // navigation && navigation.navigate?.('DriverDocuments');
                }}
              >
                <Ionicons
                  name="document-text-outline"
                  size={18}
                  color="#FACC15"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.fillVehicleText}>
                  Загрузите водительские права и удостоверение (2 стороны)
                </Text>
              </Pressable>
            )}

            {/* === содержимое панели в зависимости от фазы === */}
            {canGoOnline &&
              online &&
              !currentOrder &&
              phase === DRIVER_PHASE.IDLE && (
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.sectionTitle}>Доступные заказы</Text>
                  {availableOrders.length === 0 && (
                    <Text style={styles.sectionSub}>
                      Сейчас подходящих заказов нет. Мы уведомим, как только они
                      появятся.
                    </Text>
                  )}
                  {availableOrders.map((o) => (
                    <Pressable
                      key={o.id}
                      style={styles.orderCard}
                      onPress={() => handleAcceptOrder(o)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.orderTitle}>
                          Заказ #{o.id} · {o.equipmentName}
                        </Text>
                        <Text style={styles.orderSub} numberOfLines={2}>
                          {o.originAddress}
                        </Text>
                        <Text style={styles.orderSub}>
                          Тариф: {o.pricePerMinute} ₸/мин • ~
                          {o.estimatedMinutes || 30} мин
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#9CA3AF"
                      />
                    </Pressable>
                  ))}
                </View>
              )}

            {canGoOnline && currentOrder && (
              <View style={{ marginTop: 16 }}>
                <Text style={styles.sectionTitle}>
                  Заказ #{currentOrder.id} · {currentOrder.equipmentName}
                </Text>
                <Text style={styles.sectionSub}>{currentAddress}</Text>

                {phase === DRIVER_PHASE.ACCEPTED && (
                  <Text style={styles.infoText}>
                    Постройте маршрут и двигайтесь к адресу клиента. Как
                    приедете — нажмите «Я на месте».
                  </Text>
                )}
                {phase === DRIVER_PHASE.ARRIVED && (
                  <Text style={styles.infoText}>
                    Вы на месте. Начинайте выполнение работ, когда готовы, и
                    нажмите «Начать работу».
                  </Text>
                )}
                {phase === DRIVER_PHASE.IN_PROGRESS && (
                  <Text style={styles.infoText}>
                    Работы выполняются. После завершения нажмите «Завершить
                    работу», чтобы рассчитать стоимость.
                  </Text>
                )}
                {phase === DRIVER_PHASE.COMPLETED && (
                  <Text style={styles.infoText}>
                    Заказ завершён. Ожидайте подтверждения оплаты от клиента.
                  </Text>
                )}

                <View style={styles.tariffRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tariffLabel}>Тариф</Text>
                    <Text style={styles.tariffValue}>
                      {currentOrder.pricePerMinute} ₸/мин • ~
                      {currentOrder.estimatedMinutes || 30} мин
                    </Text>
                  </View>
                  {phase === DRIVER_PHASE.IN_PROGRESS && (
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.tariffLabel}>Время работы</Text>
                      <Text style={styles.timerText}>
                        {formatWorkedTime(workedSeconds)}
                      </Text>
                      <Text style={styles.tariffValue}>
                        ≈ {estimatedIncome} ₸
                      </Text>
                    </View>
                  )}
                  {phase === DRIVER_PHASE.COMPLETED && (
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.tariffLabel}>Заработано</Text>
                      <Text style={styles.tariffValue}>
                        {currentOrder.totalPrice} ₸
                      </Text>
                    </View>
                  )}
                </View>

                <View style={{ marginTop: 12 }}>
                  {phase === DRIVER_PHASE.ACCEPTED && (
                    <View style={styles.rowButtons}>
                      <Button
                        title="Я на месте"
                        onPress={handleArrived}
                      />
                    </View>
                  )}

                  {phase === DRIVER_PHASE.ARRIVED && (
                    <View style={styles.rowButtons}>
                      <Button
                        title="Начать работу"
                        onPress={handleStartWork}
                      />
                    </View>
                  )}

                  {phase === DRIVER_PHASE.IN_PROGRESS && (
                    <View style={styles.rowButtons}>
                      <Button
                        title="Завершить работу"
                        onPress={handleFinishWork}
                      />
                    </View>
                  )}

                  {phase === DRIVER_PHASE.COMPLETED && (
                    <View style={styles.rowButtons}>
                      <Button
                        title="Готово"
                        onPress={() => {
                          setCurrentOrder(null);
                          setPhase(DRIVER_PHASE.IDLE);
                          setRouteToClient(null);
                        }}
                      />
                    </View>
                  )}
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
  brand: { fontSize: 20, fontWeight: '900', color: '#111827' },

  permTitle: { fontWeight: '800', fontSize: 14 },
  permText: { marginTop: 4, color: '#6A6A6A', fontSize: 12 },

  panelWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
  },
  panelCardDark: {
    backgroundColor: '#111827',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },

  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '700',
  },
  statusSub: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },

  onlineToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#374151',
    padding: 3,
    justifyContent: 'center',
  },
  onlineToggleOn: {
    backgroundColor: '#22C55E',
  },
  onlineToggleDisabled: {
    opacity: 0.4,
  },
  onlineKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F9FAFB',
    alignSelf: 'flex-start',
  },
  onlineKnobOn: {
    alignSelf: 'flex-end',
  },

  fillVehicleBtn: {
    marginTop: 10,
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#1F2937',
    flexDirection: 'row',
    alignItems: 'center',
  },
  fillVehicleText: {
    color: '#FACC15',
    fontSize: 12,
    flex: 1,
    flexWrap: 'wrap',
  },

  sectionTitle: {
    color: '#F9FAFB',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  sectionSub: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 4,
  },

  orderCard: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#1F2937',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderTitle: {
    color: '#F9FAFB',
    fontSize: 13,
    fontWeight: '700',
  },
  orderSub: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },

  infoText: {
    color: '#E5E7EB',
    fontSize: 11,
    marginTop: 6,
  },

  tariffRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tariffLabel: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  tariffValue: {
    color: '#F9FAFB',
    fontSize: 12,
    fontWeight: '600',
  },
  timerText: {
    color: '#FACC15',
    fontSize: 14,
    fontWeight: '700',
  },

  rowButtons: {
    marginTop: 10,
  },

  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
