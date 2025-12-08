// screens/DriverDocumentsScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DocumentCaptureModal from '../components/DocumentCaptureModal';
import {
  fetchDriverDocuments,
  uploadDriverDocument,
} from '../api/driverDocuments';
import { useAuth } from '../context/AuthContext';

const DOC_TYPES = {
  LICENSE: 'DRIVER_LICENSE',
  ID_CARD: 'ID_CARD',
};

export default function DriverDocumentsScreen() {
  const { user /*, refreshUser, setUser */ } = useAuth() || {};
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [currentDoc, setCurrentDoc] = useState(null); // {type, side}

  // ключ -> url (для превью)
  const [preview, setPreview] = useState({
    DRIVER_LICENSE_FRONT: null,
    DRIVER_LICENSE_BACK: null,
    ID_CARD_FRONT: null,
    ID_CARD_BACK: null,
  });

  // грузим список документов при открытии
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const docs = await fetchDriverDocuments();
        // ожидаем массив объектов: { documentType, side, url, status, ... }
        const map = {
          DRIVER_LICENSE_FRONT: null,
          DRIVER_LICENSE_BACK: null,
          ID_CARD_FRONT: null,
          ID_CARD_BACK: null,
        };

        docs.forEach((d) => {
          const key = `${d.documentType}_${d.side}`; // например DRIVER_LICENSE_FRONT
          if (d.url) {
            map[key] = d.url;
          }
        });

        setPreview((p) => ({ ...p, ...map }));
      } catch (e) {
        console.log('fetchDriverDocuments error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openCapture = (type, side) => {
    setCurrentDoc({ type, side });
    setModalVisible(true);
  };

  const handleCaptured = async (uri) => {
    if (!currentDoc) return;
    const { type, side } = currentDoc;

    const key = `${type}_${side}`;
    // сразу показываем локальное превью
    setPreview((p) => ({ ...p, [key]: uri }));

    try {
      setLoading(true);
      const saved = await uploadDriverDocument(type, side, uri);
      if (saved.url) {
        setPreview((p) => ({ ...p, [key]: saved.url }));
      }

      // тут можно обновить пользователя, если бэк проставит флаг driverDocumentsCompleted
      // if (refreshUser) await refreshUser();
      // или если есть setUser:
      // if (setUser) setUser((u) => ({ ...u, driverDocumentsCompleted: true }));
    } catch (e) {
      console.log('uploadDriverDocument error', e);
    } finally {
      setLoading(false);
    }
  };

  const renderDocField = (label, type, side, hint) => {
    const key = `${type}_${side}`;
    const uri = preview[key];

    return (
      <Pressable
        key={key}
        style={styles.docField}
        onPress={() => openCapture(type, side)}
      >
        <View style={styles.docIconWrap}>
          <Ionicons name="camera-outline" size={22} color="#9CA3AF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.docLabel}>{label}</Text>
          <Text style={styles.docHint}>{hint}</Text>
        </View>
        {uri ? (
          <Image source={{ uri }} style={styles.docThumb} />
        ) : (
          <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
        )}
      </Pressable>
    );
  };

  const isCompleted = useMemo(() => {
    return (
      !!preview.DRIVER_LICENSE_FRONT &&
      !!preview.DRIVER_LICENSE_BACK &&
      !!preview.ID_CARD_FRONT &&
      !!preview.ID_CARD_BACK
    );
  }, [preview]);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        <Text style={styles.title}>Документы водителя</Text>
        <Text style={styles.subtitle}>
          Сфотографируйте документы ровно в рамке, с двух сторон. Это
          нужно для проверки перед выходом на линию.
        </Text>

        {/* Инфо о статусе */}
        {isCompleted ? (
          <View style={styles.statusOk}>
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color="#16A34A"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.statusOkText}>
              Все документы загружены. Ожидайте проверки.
            </Text>
          </View>
        ) : (
          <View style={styles.statusWarn}>
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color="#B45309"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.statusWarnText}>
              Для выхода на линию необходимо загрузить все 4 фото:
              права и удостоверение с двух сторон.
            </Text>
          </View>
        )}

        {/* Права */}
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Водительские права</Text>
          {renderDocField(
            'Лицевая сторона',
            DOC_TYPES.LICENSE,
            'FRONT',
            'Номер, ФИО и срок действия должны быть видны полностью',
          )}
          {renderDocField(
            'Оборотная сторона',
            DOC_TYPES.LICENSE,
            'BACK',
            'Постарайтесь избежать бликов и размытости',
          )}
        </View>

        {/* Удостоверение личности */}
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Удостоверение личности</Text>
          {renderDocField(
            'Лицевая сторона',
            DOC_TYPES.ID_CARD,
            'FRONT',
            'Поместите удостоверение в рамку на экране',
          )}
          {renderDocField(
            'Оборотная сторона',
            DOC_TYPES.ID_CARD,
            'BACK',
            'Проверьте читаемость текста перед сохранением',
          )}
        </View>

        <Text style={styles.helper}>
          После успешной проверки документов в профиле будет отмечено, что
          вы можете выходить на линию и получать заказы.
        </Text>
      </ScrollView>

      <DocumentCaptureModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCaptured={handleCaptured}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Сохранение…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 12,
  },
  statusOk: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ECFDF3',
    borderRadius: 10,
    padding: 8,
    marginBottom: 12,
  },
  statusOkText: {
    fontSize: 12,
    color: '#166534',
    flex: 1,
    flexWrap: 'wrap',
  },
  statusWarn: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 8,
    marginBottom: 12,
  },
  statusWarnText: {
    fontSize: 12,
    color: '#92400E',
    flex: 1,
  },

  block: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  blockTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  docField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  docIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  docLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  docHint: {
    fontSize: 11,
    color: '#6B7280',
  },
  docThumb: {
    width: 52,
    height: 32,
    borderRadius: 6,
    marginLeft: 8,
  },
  helper: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },

  loadingOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingText: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#111827',
    color: '#F9FAFB',
    fontSize: 12,
  },
});
