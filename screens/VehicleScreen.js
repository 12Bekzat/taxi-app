import React from 'react';
import { View } from 'react-native';
import Screen from '../components/Screen';
import ModalSelect from '../components/ModalSelect';
import TextField from '../components/TextField';
import Button from '../components/Button';
import { useUser } from '../context/UserContext';

const VEHICLE_TYPES = [
  { label: 'Эвакуатор', value: 'tow_truck' },
  { label: 'Манипулятор', value: 'crane' },
  { label: 'Автовоз', value: 'car_carrier' },
  { label: 'Другая спецтехника', value: 'other' },
];

export default function VehicleScreen({ navigation }) {
  const { user, updateUser } = useUser();
  const [vehicleType, setVehicleType] = React.useState(user.vehicleType || '');
  const [vehiclePlate, setVehiclePlate] = React.useState(user.vehiclePlate || '');

  const save = () => { updateUser({ vehicleType, vehiclePlate }); navigation.goBack(); };

  return (
    <Screen navigation={navigation} title="Моя техника">
      <View style={{ gap:12 }}>
        <ModalSelect label="Тип техники" items={VEHICLE_TYPES} value={vehicleType} onChange={setVehicleType} placeholder="Выберите"/>
        <TextField label="Госномер" value={vehiclePlate} onChangeText={(t)=>setVehiclePlate(t.toUpperCase())}/>
        <Button title="Сохранить" onPress={save}/>
      </View>
    </Screen>
  );
}
