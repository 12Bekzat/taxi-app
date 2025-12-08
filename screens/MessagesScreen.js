import React from 'react';
import { Text } from 'react-native';
import Screen from '../components/Screen';

export default function MessagesScreen({ navigation }) {
  return (
    <Screen navigation={navigation} title="Сообщения">
      <Text>Чаты с поддержкой и водителями (заглушка).</Text>
    </Screen>
  );
}
