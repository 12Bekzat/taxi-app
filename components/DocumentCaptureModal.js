// components/DocumentCaptureModal.js
import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

export default function DocumentCaptureModal({
  visible,
  onClose,
  onCaptured,
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!visible) return;
    if (!permission?.granted) {
      requestPermission();
    }
  }, [visible, permission, requestPermission]);

  const handleShot = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.8,
    });
    onCaptured?.(photo.uri);
    onClose?.();
  };

  if (!visible) return null;

  if (!permission) {
    // ещё грузится статус
    return (
      <Modal visible={true} animationType="slide">
        <View style={styles.center}>
          <Text style={{ color: '#fff' }}>Загрузка камеры…</Text>
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible={true} animationType="slide">
        <View style={styles.center}>
          <Text style={{ color: '#fff', textAlign: 'center', marginBottom: 16 }}>
            Нет доступа к камере. Разрешите доступ в настройках.
          </Text>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={{ color: '#111827', fontWeight: '700' }}>
              Закрыть
            </Text>
          </Pressable>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={true} animationType="slide">
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          ref={cameraRef}
          facing="back"
        >
          {/* overlay с рамкой документа */}
          <View style={styles.overlayTop} />
          <View style={styles.overlayCenterRow}>
            <View style={styles.overlaySide} />
            <View style={styles.documentFrame}>
              <Text style={styles.frameText}>
                Поместите документ в рамку
              </Text>
            </View>
            <View style={styles.overlaySide} />
          </View>
          <View style={styles.overlayBottom}>
            <Pressable style={styles.iconBtn} onPress={onClose}>
              <Ionicons name="close" size={26} color="#F9FAFB" />
            </Pressable>

            <Pressable style={styles.shutter} onPress={handleShot}>
              <View style={styles.shutterInner} />
            </Pressable>

            <View style={{ width: 40 }} />
          </View>
        </CameraView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1 },

  overlayTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  overlayCenterRow: {
    height: 220,
    flexDirection: 'row',
  },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  documentFrame: {
    width: 260,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FBBF24',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  frameText: {
    color: '#F9FAFB',
    fontSize: 11,
    textAlign: 'center',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F9FAFB',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  closeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
  },
});
