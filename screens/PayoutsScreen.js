import React from 'react';
import { View, Text } from 'react-native';
import Screen from '../components/Screen';
import { useUser } from '../context/UserContext';

export default function PayoutsScreen({ navigation }) {
  const { user } = useUser();
  return (
    <Screen navigation={navigation} title="Выплаты">
      <View style={{ gap:12 }}>
        <Text style={{ fontWeight:'800' }}>Доход сегодня: {user.todayEarnings ?? 0} ₸</Text>
        <Text style={{ fontWeight:'800' }}>Доход за неделю: {user.weekEarnings ?? 0} ₸</Text>
        <Text>Здесь будет история выплат, статусы и вывод средств.</Text>
      </View>
    </Screen>
  );
}
