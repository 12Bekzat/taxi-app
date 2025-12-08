import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = { red:'#E30613', black:'#0F0F10', border:'#E6E6E6', bg:'#F7F7F7' };

export default function Screen({ navigation, title, children, right }) {
  return (
    <ScrollView style={{ flex:1, backgroundColor: COLORS.bg }}
      contentContainerStyle={{ padding:16, paddingBottom:32 }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color={COLORS.black}/>
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        <View style={{ width:22 }}>{right}</View>
      </View>
      <View style={styles.card}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header:{ flexDirection:'row', alignItems:'center', marginBottom:12 },
  back:{ width:22, height:22, alignItems:'center', justifyContent:'center', marginRight:8 },
  title:{ fontSize:20, fontWeight:'800' },
  card:{ backgroundColor:'#FFF', borderRadius:16, borderWidth:1, borderColor: COLORS.border, padding:14 }
});
