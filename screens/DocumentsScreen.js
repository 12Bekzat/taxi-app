import React from 'react';
import { View } from 'react-native';
import Screen from '../components/Screen';
import TextField from '../components/TextField';
import ImagePickerField from '../components/ImagePickerField';
import Button from '../components/Button';
import { useUser } from '../context/UserContext';

export default function DocumentsScreen({ navigation }) {
  const { user, updateUser } = useUser();
  const [licenseNumber, setLicenseNumber] = React.useState(user.licenseNumber || '');
  const [licenseExpiry, setLicenseExpiry] = React.useState(user.licenseExpiry || '');
  const [licenseImages, setLicenseImages] = React.useState(user.licenseImages || null);
  const [idCardImages, setIdCardImages] = React.useState(user.idCardImages || null);

  const save = () => { updateUser({ licenseNumber, licenseExpiry, licenseImages, idCardImages }); navigation.goBack(); };

  return (
    <Screen navigation={navigation} title="Документы">
      <View style={{ gap:12 }}>
        <TextField label="Серия и номер прав" value={licenseNumber} onChangeText={setLicenseNumber} placeholder="1234 567890"/>
        <TextField label="Срок действия прав" value={licenseExpiry} onChangeText={setLicenseExpiry} placeholder="ДД.ММ.ГГГГ"/>
        <ImagePickerField label="Фото водительских прав" title="Водительские права" value={licenseImages} onChange={setLicenseImages}/>
        <ImagePickerField label="Фото удостоверения личности" title="Удостоверение личности" value={idCardImages} onChange={setIdCardImages}/>
        <Button title="Сохранить" onPress={save}/>
      </View>
    </Screen>
  );
}
