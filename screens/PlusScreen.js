import React from 'react';
import { Text } from 'react-native';
import Screen from '../components/Screen';

export default function PlusScreen({ navigation }) {
  return (
    <Screen navigation={navigation} title="Плюс">
      <Text>Здесь будет информация о подписке и управлении «Плюс».</Text>
    </Screen>
  );
}
