import React from 'react';
import { Text } from 'react-native';
import Screen from '../components/Screen';

export default function FavoritesScreen({ navigation }) {
  return (
    <Screen navigation={navigation} title="Избранное">
      <Text>Список избранных адресов/заказов.</Text>
    </Screen>
  );
}
