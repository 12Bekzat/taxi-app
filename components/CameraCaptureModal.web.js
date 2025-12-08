import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, Platform, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

const COLORS = {
  red: '#E30613', border: '#E6E6E6', white: '#FFFFFF', black: '#0F0F10', grey: '#6A6A6A'
};

/**
 * props:
 *  visible: boolean
 *  onClose: () => void
 *  onResult: ({frontUri, backUri}) => void
 *  title: 'Права' | 'Удостоверение личности' | string
 *  aspect?: number   // соотношение рамки, по умолчанию 1.6 (ID карта)
 */
export default function CameraCaptureModal({ visible, onClose, onResult, title='Документ', aspect=1.6 }) {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [side, setSide] = useState('front'); // 'front' | 'back'
  const [frontUri, setFrontUri] = useState(null);
  const [backUri, setBackUri] = useState(null);
  const [preview, setPreview] = useState(null); // uri предпросмотра текущего кадра
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    if (visible) {
      setSide('front');
      setFrontUri(null);
      setBackUri(null);
      setPreview(null);
    }
  }, [visible]);

  useEffect(() => {
    if (permission?.granted === false && visible) {
      requestPermission();
    }
  }, [permission, visible]);

  const capture = async () => {
    if (isWeb) return; // на web будет другой поток (file input)
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, skipProcessing: true });
    setPreview(photo.uri);
  };

  const acceptShot = () => {
    if (side === 'front') {
      setFrontUri(preview);
      setPreview(null);
      setSide('back');
    } else {
      setBackUri(preview);
      setPreview(null);
      onResult({ frontUri, backUri: preview });
      onClose();
    }
  };

  const retake = () => setPreview(null);

  // --- Fallback для Web: input type="file"
  const openFilePicker = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const uri = URL.createObjectURL(file);
        setPreview(uri);
      }
    };
    input.click();
  };

  if (!visible) return null;
  if (!permission?.granted && Platform.OS !== 'web') {
    return (
      <Modal visible transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.backdrop}/>
        <View style={styles.sheet}>
          <Text style={styles.title}>Доступ к камере</Text>
          <Text style={styles.text}>Нужно разрешение камеры, чтобы сфотографировать документ.</Text>
          <Pressable style={[styles.btn, { backgroundColor: COLORS.red }]} onPress={requestPermission}>
            <Text style={styles.btnText}>Разрешить</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.ghost]} onPress={onClose}><Text style={[styles.btnText, {color:COLORS.black}]}>Отмена</Text></Pressable>
        </View>
      </Modal>
    );
  }

  // размеры рамки (примерно ID карта 86×54 мм => ~1.59)
  const frameRatio = aspect; // ширина/высота
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.cameraWrap}>
        {preview ? (
          <Image source={{ uri: preview }} style={styles.camera}/>
        ) : Platform.OS === 'web' ? (
          <Pressable style={[styles.camera, { alignItems:'center', justifyContent:'center', backgroundColor:'#000' }]} onPress={openFilePicker}>
            <Text style={{ color:'#fff' }}>Нажмите чтобы выбрать файл</Text>
          </Pressable>
        ) : (
          <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        )}

        {/* Overlay с рамкой */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={styles.dim}/>
          <View style={[styles.frameWrap]}>
            <View style={[
              styles.frame,
              { aspectRatio: frameRatio }
            ]}>
              <View style={styles.cornerTL}/>
              <View style={styles.cornerTR}/>
              <View style={styles.cornerBL}/>
              <View style={styles.cornerBR}/>
            </View>
          </View>
          <View style={[styles.bottom]}>
            <Text style={styles.h1}>{title}: {side === 'front' ? 'Лицевая сторона' : 'Оборотная сторона'}</Text>
            <Text style={styles.h2}>Разместите документ в рамке без бликов. Текст должен быть читаем.</Text>
          </View>
        </View>

        {/* Кнопки управления */}
        <View style={styles.controls}>
          {preview ? (
            <>
              <Pressable style={[styles.controlBtn, styles.ghost]} onPress={retake}>
                <Text style={[styles.btnText, { color: COLORS.black }]}>Переснять</Text>
              </Pressable>
              <Pressable style={[styles.controlBtn, { backgroundColor: COLORS.red }]} onPress={acceptShot}>
                <Text style={styles.btnText}>{side === 'front' ? 'Далее' : 'Готово'}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable style={[styles.controlBtn, styles.ghost]} onPress={onClose}>
                <Text style={[styles.btnText, { color: COLORS.black }]}>Отмена</Text>
              </Pressable>
              <Pressable style={[styles.shutter]} onPress={Platform.OS === 'web' ? openFilePicker : capture}>
                <View style={styles.shutterInner}/>
              </Pressable>
              <View style={[styles.controlBtn, { opacity:0 }]} />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  cameraWrap:{ flex:1, backgroundColor:'#000' },
  camera:{ flex:1 },
  dim:{ flex:1, backgroundColor:'rgba(0,0,0,0.35)' },
  frameWrap:{ position:'absolute', top:'20%', left:0, right:0, alignItems:'center' },
  frame:{
    width:'80%', borderRadius:12, borderWidth:2, borderColor:'rgba(255,255,255,0.7)',
    backgroundColor:'transparent'
  },
  cornerTL:{ position:'absolute', top:-2, left:-2, width:22, height:22, borderTopWidth:4, borderLeftWidth:4, borderColor:'#fff', borderTopLeftRadius:10 },
  cornerTR:{ position:'absolute', top:-2, right:-2, width:22, height:22, borderTopWidth:4, borderRightWidth:4, borderColor:'#fff', borderTopRightRadius:10 },
  cornerBL:{ position:'absolute', bottom:-2, left:-2, width:22, height:22, borderBottomWidth:4, borderLeftWidth:4, borderColor:'#fff', borderBottomLeftRadius:10 },
  cornerBR:{ position:'absolute', bottom:-2, right:-2, width:22, height:22, borderBottomWidth:4, borderRightWidth:4, borderColor:'#fff', borderBottomRightRadius:10 },
  bottom:{ position:'absolute', bottom:140, left:20, right:20, alignItems:'center' },
  h1:{ color:'#fff', fontWeight:'800', fontSize:16, marginBottom:6, textAlign:'center' },
  h2:{ color:'#E5E5E5', textAlign:'center' },
  controls:{ position:'absolute', bottom:30, left:20, right:20, flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  controlBtn:{ height:48, flex:1, marginHorizontal:8, borderRadius:14, alignItems:'center', justifyContent:'center' },
  ghost:{ backgroundColor:'#fff' },
  btnText:{ color:'#fff', fontWeight:'800' },
  shutter:{ width:76, height:76, borderRadius:38, borderWidth:6, borderColor:'#fff', alignItems:'center', justifyContent:'center' },
  shutterInner:{ width:52, height:52, backgroundColor:'#fff', borderRadius:26 }
});
