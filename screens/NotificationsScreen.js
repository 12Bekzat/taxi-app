import React from 'react';
import { View, Text, Switch } from 'react-native';
import Screen from '../components/Screen';

export default function NotificationsScreen({ navigation }) {
  return (
    <Screen navigation={navigation} title="Уведомления">
      <View style={{ gap:16 }}>
        <Row label="Пуш-уведомления" />
        <Row label="Сообщения в чате" />
        <Row label="Статусы заказов" />
      </View>
    </Screen>
  );
}

function Row({ label }) {
  const [on, setOn] = React.useState(true);
  return (
    <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
      <Text style={{ fontWeight:'700' }}>{label}</Text>
      <Switch value={on} onValueChange={setOn}/>
    </View>
  );
}
