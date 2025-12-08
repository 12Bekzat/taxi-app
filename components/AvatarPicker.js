import React from 'react';
import { View, Image, Text, Pressable, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const COLORS = { red:'#E30613', border:'#E6E6E6', grey:'#6A6A6A', white:'#FFFFFF' };

export default function AvatarPicker({ uri, onChange }) {
  const choose = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1,1], quality: 0.8
    });
    if (!res.canceled) onChange(res.assets[0].uri);
  };

  return (
    <View style={styles.row}>
      <Pressable onPress={choose} style={styles.avatar}>
        {uri ? <Image source={{ uri }} style={styles.avatarImg}/> :
          <Text style={{ color: COLORS.grey, fontWeight:'700' }}>Фото</Text>}
      </Pressable>
      <Pressable onPress={choose} style={styles.changeBtn}>
        <Text style={{ color: COLORS.red, fontWeight:'800' }}>Изменить фото</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection:'row', alignItems:'center', gap:16 },
  avatar: {
    width:72, height:72, borderRadius:36, borderWidth:1, borderColor:'#E6E6E6',
    backgroundColor:'#FFF', alignItems:'center', justifyContent:'center', overflow:'hidden'
  },
  avatarImg: { width:'100%', height:'100%' },
  changeBtn: { paddingVertical:8, paddingHorizontal:12, borderRadius:12, backgroundColor:'#FFE7E9' }
});
