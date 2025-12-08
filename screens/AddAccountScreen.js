import React from 'react';
import { View, Text } from 'react-native';
import Screen from '../components/Screen';
import Button from '../components/Button';

export default function AddAccountScreen({ navigation }) {
  return (
    <Screen navigation={navigation} title="Добавить аккаунт">
      <View style={{ gap:12 }}>
        <Text>Здесь можно войти в другой аккаунт или создать новый.</Text>
        <Button title="Войти в другой аккаунт" onPress={() => navigation.navigate('Login')} />
        <Button title="Создать новый" variant="ghost" onPress={() => navigation.navigate('Register')} />
      </View>
    </Screen>
  );
}
