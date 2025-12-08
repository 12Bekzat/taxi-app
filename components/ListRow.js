import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Badge from './Badge';

const COLORS = { border:'#E6E6E6', grey:'#6A6A6A', black:'#0F0F10' };

export default function ListRow({
  icon, iconSet='Ionicons', title, subtitle, onPress,
  rightBadge, rightText, topDivider=false, bottomDivider=true
}) {
  const IconSet = iconSet === 'MaterialIcons' ? MaterialIcons : Ionicons;
  return (
    <Pressable onPress={onPress} style={[
      styles.row,
      topDivider && { borderTopWidth:1, borderTopColor:COLORS.border },
      bottomDivider && { borderBottomWidth:1, borderBottomColor:COLORS.border }
    ]}>
      <IconSet name={icon} size={22} color={COLORS.black} style={{ marginRight:12 }}/>
      <View style={{ flex:1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {rightBadge ? <Badge text={rightBadge}/> : null}
      {rightText ? <Text style={styles.rightText}>{rightText}</Text> : null}
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </Pressable>
  );
}
const styles = StyleSheet.create({
  row:{ flexDirection:'row', alignItems:'center', paddingVertical:14, paddingHorizontal:14, backgroundColor:'#FFF' },
  title:{ fontSize:16, fontWeight:'700', color:'#0F0F10' },
  subtitle:{ marginTop:2, color:'#6A6A6A' },
  rightText:{ color:'#6A6A6A', marginRight:8, fontWeight:'600' }
});
